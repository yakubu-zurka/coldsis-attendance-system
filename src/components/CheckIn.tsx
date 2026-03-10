import { useState, useEffect } from "react";
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

  useEffect(() => {
    const savedSession = localStorage.getItem("rhema_attendance_session");
    if (savedSession) {
      const { staff, checkInTimestamp, status } = JSON.parse(savedSession);
      const nineHoursInMs = 9 * 60 * 60 * 1000;
      const now = Date.now();

      if (now - checkInTimestamp > nineHoursInMs) {
        localStorage.removeItem("rhema_attendance_session");
        setIsCheckedIn(false);
        setSelectedStaff(null);
      } else {
        setSelectedStaff(staff);
        setIsCheckedIn(status === "in");
      }
    }
  }, []);

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
      const savedSession = JSON.parse(localStorage.getItem("rhema_attendance_session") || "{}");
      const effectiveDate = isCheckedIn && savedSession.date ? savedSession.date : dateTime.date;
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

      if (nextAction === "checkin") {
        localStorage.setItem("rhema_attendance_session", JSON.stringify({
          staff: selectedStaff,
          checkInTimestamp: Date.now(),
          date: effectiveDate,
          status: "in"
        }));
      } else {
        localStorage.removeItem("rhema_attendance_session");
      }

      setSubmittedData({
        staffName: selectedStaff.name,
        staffId: selectedStaff.id,
        date: effectiveDate,
        timeString: dateTime.timeString,
        action: nextAction === "checkin" ? "Checked In" : "Checked Out",
      });

      setState("success");
      setIsCheckedIn(nextAction === "checkin");
      
      setTimeout(() => {
        if (nextAction === "checkout") { setSelectedStaff(null); setSearch(""); }
        setPin(""); setState("idle"); setMessage("");
      }, 5000);

    } catch (err: any) {
      setState("error"); setMessage("System error.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-orange-600">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full border-t-8 border-blue-950">
        <div className="flex justify-center mb-4">
          <img src="/coldsis-logo_FitMaxWzM1MiwyNjRd.png" alt="COLDSIS Logo" className="h-20 object-contain" />
        </div>

        {state === "success" && submittedData ? (
          <div className="text-center space-y-4 animate-in fade-in zoom-in duration-300">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
            <div>
               <h2 className="font-black text-2xl text-gray-800 uppercase">{submittedData.staffName}</h2>
               <p className="text-blue-600 font-mono font-bold text-sm">{submittedData.staffId}</p>
            </div>
            <div className="bg-slate-50 py-4 px-4 rounded-2xl border border-slate-100">
              <p className="text-4xl font-black text-slate-900">{submittedData.timeString}</p>
            </div>
            <p className="font-black uppercase tracking-widest text-xs py-2 px-4 rounded-full bg-green-100 text-green-700 inline-block">
              {submittedData.action} SUCCESSFUL
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {!selectedStaff ? (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Identify Yourself</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search Name or Staff ID..."
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                  />
                </div>
                {search && (
                  <div className="border border-slate-200 rounded-2xl max-h-60 overflow-y-auto shadow-xl bg-white divide-y divide-slate-50">
                    {filteredStaff.map((staff) => (
                      <button
                        key={staff.id}
                        onClick={() => { setSelectedStaff(staff); setSearch(""); setState("idle"); }}
                        className="w-full text-left px-5 py-4 hover:bg-blue-50 flex justify-between items-center group"
                      >
                        <div>
                            <p className="font-bold text-slate-800 group-hover:text-blue-700">{staff.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{staff.department || "General"}</p>
                        </div>
                        <span className="text-[10px] font-mono font-bold bg-slate-100 px-2 py-1 rounded text-slate-600 uppercase">
                            {staff.id}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-blue-950 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10 flex justify-between items-start">
                    <div>
                        <p className="text-[10px] font-black opacity-70 uppercase tracking-widest mb-1">Signed In As</p>
                        <h2 className="font-black text-xl leading-tight uppercase">{selectedStaff.name}</h2>
                        <div className="flex gap-2 mt-2">
                            <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded font-bold">{selectedStaff.id}</span>
                            <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded font-bold uppercase">{selectedStaff.department}</span>
                        </div>
                    </div>
                    {!isCheckedIn && (
                        <button onClick={() => setSelectedStaff(null)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl">
                            <LogOut size={16} />
                        </button>
                    )}
                </div>
                <UserCheck className="absolute -right-4 -bottom-4 w-24 h-24 opacity-10" />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Security PIN</label>
              <div className="relative">
                <input
                  type={showPin ? "text" : "password"}
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-center text-2xl font-mono tracking-[0.5em]"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {message && (
              <div className={`flex items-center text-[11px] font-bold p-4 rounded-2xl border ${state === 'error' ? 'text-red-700 bg-red-50 border-red-100' : 'text-blue-700 bg-blue-50 border-blue-100'}`}>
                {state === 'loading' ? <Loader2 className="w-4 h-4 mr-3 animate-spin" /> : <AlertCircle className="w-4 h-4 mr-3" />}
                <span className="uppercase">{message}</span>
              </div>
            )}

            <button
              onClick={handleActionRequest}
              disabled={state === "loading"}
              className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${
                isCheckedIn ? "bg-slate-800 hover:bg-black" : "bg-blue-950 hover:bg-blue-700"
              }`}
            >
              {state === "loading" ? <Loader2 className="w-5 h-5 animate-spin" /> : isCheckedIn ? <LogOut size={20} /> : <MapPin size={20} />}
              {isCheckedIn ? "Check Out" : "Check In"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}