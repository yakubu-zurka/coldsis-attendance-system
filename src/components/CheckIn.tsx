import { useState, useEffect, useRef } from "react";
import { useGeolocation } from "../hooks/useGeolocation";
import { useDeviceDateTime } from "../hooks/useDeviceDateTime";
import { useFirebaseRead, firebaseUpdate } from "../hooks/useFirebaseSync"; 
import {
  MapPin,
  Loader2,
  CheckCircle,
  AlertCircle,
  Search,
  LogOut,
  Eye,
  EyeOff,
  UserCheck,
} from "lucide-react";
import { StaffMember } from "../types";

type CheckInState = "idle" | "loading" | "success" | "error";

export function CheckIn() {
  const { getLocation, error: geoError } = useGeolocation();
  const { getDateTime } = useDeviceDateTime();
  const { data: staffData } = useFirebaseRead<Record<string, StaffMember>>("staff");
  const { data: attendanceData } = useFirebaseRead<Record<string, any>>("attendance");

  // --- OFFICE CONFIGURATION ---
  const OFFICE_LAT = 5.697796;
  const OFFICE_LNG = -0.176180;
  const ALLOWED_RADIUS_METERS = 100; 

  const [search, setSearch] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [state, setState] = useState<CheckInState>("idle");
  const [message, setMessage] = useState("");
  const [submittedData, setSubmittedData] = useState<any>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [sessionDate, setSessionDate] = useState<string | null>(null);

  // We still need the particle effect here.
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: Particle[] = [];
    let animationFrameId: number;

    const resize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    class Particle {
      x: number; y: number; size: number; speedX: number; speedY: number;
      constructor() {
        this.x = Math.random() * (canvas?.width || window.innerWidth);
        this.y = Math.random() * (canvas?.height || window.innerHeight);
        this.size = Math.random() * 3 + 1; // Bigger size for visibility
        this.speedX = (Math.random() - 0.5) * 1.5;
        this.speedY = (Math.random() - 0.5) * 1.5;
      }
      update() {
        if (!canvas) return;
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x > canvas.width) this.x = 0;
        else if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        else if (this.y < 0) this.y = canvas.height;
      }
      draw() {
        if (!ctx) return;
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)"; // Higher opacity white
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Function to draw lines between nearby particles
    const connect = () => {
      for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
          let dx = particles[a].x - particles[b].x;
          let dy = particles[a].y - particles[b].y;
          let distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) { // Connection radius
            ctx.strokeStyle = `rgba(255, 255, 255, ${1 - distance / 150})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
      }
    };

    const init = () => {
      particles = [];
      const count = Math.min(window.innerWidth / 10, 80); 
      for (let i = 0; i < count; i++) particles.push(new Particle());
    };

    const animate = () => {
      if (!canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.update(); p.draw(); });
      connect();
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    resize();
    init();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Monitor the global attendance table to see if the selected staff is already checked in today
  useEffect(() => {
    if (!selectedStaff || !attendanceData) {
      setIsCheckedIn(false);
      setSessionDate(null);
      return;
    }

    const { date: currentDate } = getDateTime();
    
    // We check if there's a record for this exact staff member today
    // The key format is `${selectedStaff.id}_${date}`
    const recordId = `${selectedStaff.id}_${currentDate}`;
    const todaysRecord = attendanceData[recordId];

    if (todaysRecord) {
      // If there is a record today, check its status or if it lacks a checkout time
      if (todaysRecord.status === "active" || !todaysRecord.checkOutTime) {
        setIsCheckedIn(true);
        setSessionDate(currentDate);
        return; // The user is actively checked in
      }
    }

    // Alternatively, if they checked in over midnight (long shift), we could loop through all
    // but typically we can just rely on the most recent record being active.
    // Let's do a fallback lookup to find any active session across all dates just in case:
    const activeSession = Object.values(attendanceData).find(
      (record: any) => record.staffId === selectedStaff.id && record.status === "active" && !record.checkOutTime
    );

    if (activeSession) {
      const nineHoursInMs = 9 * 60 * 60 * 1000;
      const now = Date.now();

      // Ensure the active session wasn't from days ago automatically expired
      if (now - (activeSession.checkInTimestamp || 0) < nineHoursInMs) {
         setIsCheckedIn(true);
         setSessionDate(activeSession.date);
         return;
      }
    }

    // Default: not checked in
    setIsCheckedIn(false);
    setSessionDate(null);

  }, [selectedStaff, attendanceData, getDateTime]);

  const staffList = staffData
    ? Object.entries(staffData).map(([id, member]) => ({
        ...member,
        id, // This is your custom ID (e.g. COLD-001)
      }))
    : [];

  // Updated filter to include ID searching
  const filteredStaff = staffList.filter((staff) =>
    staff.name.toLowerCase().includes(search.toLowerCase()) ||
    staff.id.toLowerCase().includes(search.toLowerCase())
  );

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
  };

  async function hashPin(plainText: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  }

  const validatePin = async (): Promise<boolean> => {
    if (!selectedStaff || !staffData) return false;
    const liveStaffData = staffData[selectedStaff.id] as any;
    const storedHash = liveStaffData?.pinHash;
    if (!storedHash) return false;
    const enteredHash = await hashPin(pin.trim());
    return enteredHash === storedHash;
  };

  const handleActionRequest = async () => {
    if (state === "loading") return; 
    if (!selectedStaff) { setState("error"); setMessage("Select your identity."); return; }
    if (!pin) { setState("error"); setMessage("Enter your PIN."); return; }

    setState("loading");
    setMessage("Verifying location...");

    try {
      if (!(await validatePin())) {
        setState("error"); setMessage("Invalid PIN."); return;
      }

      const location = await getLocation();
      if (!location) { setState("error"); setMessage(geoError || "Location required."); return; }

      const distance = calculateDistance(location.latitude, location.longitude, OFFICE_LAT, OFFICE_LNG);
      if (distance > ALLOWED_RADIUS_METERS) {
        setState("error"); setMessage(`Too far from office (${Math.round(distance)}m).`); return;
      }

      const dateTime = getDateTime();
      const nextAction = isCheckedIn ? "checkout" : "checkin";
      const effectiveDate = isCheckedIn && sessionDate ? sessionDate : dateTime.date;
      const recordId = `${selectedStaff.id}_${effectiveDate}`;

      let payload: any = {
        distanceFromOffice: Math.round(distance),
        accuracy: location.accuracy
      };

      if (nextAction === "checkin") {
        Object.assign(payload, {
          staffId: selectedStaff.id,
          staffName: selectedStaff.name,
          department: selectedStaff.department || "N/A",
          date: effectiveDate,
          checkInTime: dateTime.timeString,
          checkInTimestamp: dateTime.timestamp,
          latitude: location.latitude,
          longitude: location.longitude,
          status: "active"
        });
      } else {
        Object.assign(payload, {
          checkOutTime: dateTime.timeString,
          checkOutTimestamp: dateTime.timestamp,
          status: "completed"
        });
      }

      await firebaseUpdate(`attendance/${recordId}`, payload);

      setSubmittedData({
        staffName: selectedStaff.name,
        staffId: selectedStaff.id,
        date: effectiveDate,
        timeString: dateTime.timeString,
        action: nextAction === "checkin" ? "Checked In" : "Checked Out",
      });

      setState("success");
      
      // Because `attendanceData` gets updated via Firebase real-time listener, 
      // the `isCheckedIn` state will automatically flip in the useEffect.
      
      setTimeout(() => {
        if (nextAction === "checkout") { setSelectedStaff(null); setSearch(""); }
        setPin(""); setState("idle"); setMessage("");
      }, 5000);

    } catch (err: any) {
      setState("error"); setMessage("System error.");
    }
  };

  return (
    <div className="relative min-h-screen bg-orange-600 flex items-center justify-center p-4 overflow-hidden">
      {/* 1. Particle Layer (High Contrast) */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 z-0 pointer-events-none block" 
        style={{ filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.3))' }}
      />

      {/* 2. Deep Glows for Contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-orange-500/50 to-orange-700/50 z-0" />

      {/* 3. Original Wave (Now more transparent to let particles pop) */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 1440 320">
          <path d="M0,160L60,176C120,192,240,224,360,213.3C480,203,600,149,720,144C840,139,960,181,1080,197.3C1200,213,1320,203,1380,197.3L1440,192L1440,320L0,320Z" fill="white" />
        </svg>
      </div>

      <div className="relative bg-white/10 backdrop-blur-xl border border-white/30 rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] p-8 sm:p-12 max-w-md w-full z-10">
        <div className="flex justify-center mb-8">
          <img src="/coldsis-logo_FitMaxWzM1MiwyNjRd.png" alt="COLDSiS Logo" className="h-20 drop-shadow-lg" />
        </div>

        {state === "success" && submittedData ? (
          <div className="text-center space-y-5 animate-in fade-in zoom-in duration-300">
            <CheckCircle className="w-24 h-24 text-green-400 mx-auto drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]" />
            <div>
               <h2 className="font-black text-3xl text-white uppercase tracking-tighter">{submittedData.staffName}</h2>
               <p className="text-orange-300 font-black text-sm tracking-widest mt-1">{submittedData.staffId}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md py-6 px-4 rounded-3xl border border-white/20 shadow-inner">
              <p className="text-5xl font-black text-white tracking-tighter drop-shadow-md">{submittedData.timeString}</p>
            </div>
            <p className="font-black uppercase tracking-[0.2em] text-[10px] py-3 px-6 rounded-full bg-green-500/20 text-green-300 border border-green-500/30 inline-block backdrop-blur-md shadow-lg">
              {submittedData.action} SUCCESSFUL
            </p>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleActionRequest(); }}>
            {!selectedStaff ? (
              <div className="space-y-2 relative">
                <label className="text-[10px] font-black text-white uppercase tracking-[0.2em] ml-2">Identify Yourself</label>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10 group-focus-within:text-orange-600 transition-colors" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search Name or Staff ID..."
                    className="w-full pl-12 pr-6 py-4 bg-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-400 transition-all font-bold text-slate-800 shadow-inner"
                  />
                </div>
                {search && (
                  <div className="absolute z-50 left-0 right-0 mt-2 border border-white/30 rounded-2xl max-h-60 overflow-y-auto shadow-2xl bg-white/95 backdrop-blur-xl divide-y divide-slate-100">
                    {filteredStaff.map((staff) => (
                      <button
                        type="button"
                        key={staff.id}
                        onClick={() => { setSelectedStaff(staff); setSearch(""); setState("idle"); }}
                        className="w-full text-left px-5 py-4 hover:bg-orange-50 flex justify-between items-center group transition-colors"
                      >
                        <div>
                            <p className="font-bold text-slate-800 group-hover:text-orange-600 transition-colors">{staff.name}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase transition-colors">{staff.department || "General"}</p>
                        </div>
                        <span className="text-[10px] font-black bg-slate-100 group-hover:bg-orange-100 group-hover:text-orange-700 px-2 py-1 rounded-lg text-slate-500 uppercase transition-colors">
                            {staff.id}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 flex justify-between items-start">
                    <div>
                        <p className="text-[10px] font-black opacity-70 uppercase tracking-[0.2em] mb-2 drop-shadow-md">Signed In As</p>
                        <h2 className="font-black text-2xl leading-tight uppercase drop-shadow-lg tracking-tight">{selectedStaff.name}</h2>
                        <div className="flex gap-2 mt-3 block">
                            <span className="text-[10px] bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg font-black border border-white/10 shadow-sm">{selectedStaff.id}</span>
                            <span className="text-[10px] bg-orange-500/80 backdrop-blur-sm px-3 py-1 rounded-lg font-black uppercase border border-orange-400/50 shadow-sm">{selectedStaff.department || "General"}</span>
                        </div>
                    </div>
                    {!isCheckedIn && (
                        <button type="button" onClick={() => setSelectedStaff(null)} className="p-3 bg-white/10 hover:bg-red-500/80 border border-white/10 hover:border-red-400/50 rounded-2xl transition-all shadow-lg active:scale-95 group/btn">
                            <LogOut size={18} className="text-white group-hover/btn:text-white" />
                        </button>
                    )}
                </div>
                <UserCheck className="absolute -right-6 -bottom-6 w-32 h-32 opacity-10 drop-shadow-2xl mix-blend-overlay" />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-white uppercase tracking-[0.2em] ml-2">Security PIN</label>
              <div className="relative group">
                <input
                  type={showPin ? "text" : "password"}
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full px-6 py-4 bg-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-400 transition-all font-bold text-center text-3xl font-mono tracking-[0.5em] text-slate-800 shadow-inner h-16"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-600 transition-colors w-10 h-10 flex items-center justify-center rounded-xl hover:bg-orange-50"
                >
                  {showPin ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
              </div>
            </div>

            {message && (
              <div className={`flex items-center text-[11px] font-black p-4 rounded-2xl border backdrop-blur-md shadow-lg ${state === 'error' ? 'text-white bg-red-600/90 border-red-400/50' : 'text-white bg-blue-600/90 border-blue-400/50'}`}>
                {state === 'loading' ? <Loader2 className="w-5 h-5 mr-3 animate-spin shrink-0" /> : <AlertCircle className="w-5 h-5 mr-3 shrink-0" />}
                <span className="uppercase tracking-[0.1em] leading-relaxed">{message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={state === "loading"}
              className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] text-white shadow-[0_10px_20px_-10px_rgba(0,0,0,0.5)] transition-all active:scale-95 flex items-center justify-center gap-3 border-b-4 active:border-b-0 ${
                isCheckedIn ? "bg-slate-900 border-slate-700 hover:bg-black disabled:opacity-50" : "bg-slate-900 border-slate-700 hover:bg-black disabled:opacity-50"
              }`}
            >
              {state === "loading" ? <Loader2 className="w-6 h-6 animate-spin" /> : isCheckedIn ? <LogOut size={22} /> : <MapPin size={22} />}
              {isCheckedIn ? "Check Out" : "Check In"}
            </button>
          </form>
        )}

        {state !== "success" && (
          <p className="text-[10px] text-white/50 text-center mt-10 font-black uppercase tracking-[0.3em]">
            Secure Infrastructure &copy; 2026
          </p>
        )}
      </div>
    </div>
  );
}