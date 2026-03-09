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
  const ALLOWED_RADIUS_METERS = 100; // 100 meters from office

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
        id,
      }))
    : [];

  const filteredStaff = staffList.filter((staff) =>
    staff.name.toLowerCase().includes(search.toLowerCase())
  );

  // Helper: Haversine distance formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth's radius in meters
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
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
    
    if (!selectedStaff) {
      setState("error");
      setMessage("Please select your name.");
      return;
    }
    if (!pin) {
      setState("error");
      setMessage("Please enter your PIN.");
      return;
    }

    setState("loading");
    setMessage("Verifying location at Coldsis GH...");

    try {
      // 1. PIN Validation
      const isValid = await validatePin();
      if (!isValid) {
        setState("error");
        setMessage("Invalid PIN. Access denied.");
        return;
      }

      // 2. Await Geolocation
      const location = await getLocation();

      if (!location) {
        setState("error");
        setMessage(geoError || "Location access is required.");
        return;
      }

      // 3. GEOFENCE CHECK
      const distance = calculateDistance(
        location.latitude, 
        location.longitude, 
        OFFICE_LAT, 
        OFFICE_LNG
      );

      if (distance > ALLOWED_RADIUS_METERS) {
        setState("error");
        setMessage(`Access Denied. You are ${Math.round(distance)}m away from the Coldsis GH office.`);
        return;
      }

      // 4. Prepare Data
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
          checkOutLat: location.latitude,
          checkOutLng: location.longitude,
          status: "completed"
        });
      }

      // 5. Firebase Sync
      await firebaseUpdate(`attendance/${recordId}`, payload);

      // 6. Local Session Management
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
        date: effectiveDate,
        timeString: dateTime.timeString,
        action: nextAction === "checkin" ? "Checked In" : "Checked Out",
      });

      setState("success");
      setIsCheckedIn(nextAction === "checkin");
      
      setTimeout(() => {
        if (nextAction === "checkout") {
          setSelectedStaff(null);
          setSearch("");
        }
        setPin("");
        setState("idle");
        setMessage("");
      }, 5000);

    } catch (err: any) {
      console.error("Attendance Error:", err);
      setState("error");
      setMessage(err.message || "An unexpected error occurred.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-blue-950">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="flex justify-center mb-6">
          <img src="/coldsis-logo_FitMaxWzM1MiwyNjRd.png" alt="RHEMA Logo" className="h-30 w-30" />
        </div>

        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Staff Attendance</h1>

        {state === "success" && submittedData ? (
          <div className="text-center space-y-4 animate-in zoom-in-95 duration-300">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="font-bold text-2xl text-gray-800">{submittedData.staffName}</h2>
            <div className="bg-blue-50 py-3 px-4 rounded-xl border border-blue-100">
              <p className="text-sm text-blue-600 font-medium">{submittedData.date}</p>
              <p className="text-3xl font-black text-blue-900">{submittedData.timeString}</p>
            </div>
            <p className={`font-bold uppercase tracking-widest text-sm ${isCheckedIn ? 'text-green-600' : 'text-orange-600'}`}>
              {submittedData.action} Successful
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {!selectedStaff ? (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600">Select Your Name</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name..."
                    className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                {search && (
                  <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto shadow-sm bg-white">
                    {filteredStaff.map((staff) => (
                      <button
                        key={staff.id}
                        onClick={() => { setSelectedStaff(staff); setSearch(staff.name); setState("idle"); setMessage(""); }}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b last:border-0 font-medium text-gray-700"
                      >
                        {staff.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-xs text-blue-600 font-bold uppercase">Staff Member</p>
                  <p className="font-bold text-lg text-blue-900">{selectedStaff.name}</p>
                </div>
                {!isCheckedIn && (
                  <button onClick={() => { setSelectedStaff(null); setPin(""); }} className="text-xs bg-white text-blue-600 border border-blue-200 px-3 py-1 rounded-full font-bold">
                    Change
                  </button>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-600">Security PIN</label>
              <div className="relative">
                <input
                  type={showPin ? "text" : "password"}
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => { setPin(e.target.value); if (state === "error") setState("idle"); }}
                  className="w-full pr-12 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center text-xl font-mono tracking-widest"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {message && (
              <div className={`flex items-center text-xs p-3 rounded-lg border ${state === 'error' ? 'text-red-700 bg-red-50 border-red-100' : 'text-blue-700 bg-blue-50 border-blue-100'}`}>
                {state === 'loading' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <AlertCircle className="w-4 h-4 mr-2" />}
                <span>{message}</span>
              </div>
            )}

            <button
              onClick={handleActionRequest}
              disabled={state === "loading"}
              className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                isCheckedIn ? "bg-red-600 hover:bg-red-700" : "bg-blue-900 hover:bg-blue-800"
              }`}
            >
              {state === "loading" ? <Loader2 className="w-6 h-6 animate-spin" /> : isCheckedIn ? <LogOut size={22} /> : <MapPin size={22} />}
              {isCheckedIn ? "Check Out Now" : "Check In Now"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}