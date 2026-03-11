import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AdminDashboard } from "./components/AdminDashboard";
import { CheckIn } from "./components/CheckIn";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Loader2 } from "lucide-react";
import { Toaster } from "react-hot-toast"; // ✅ Toast provider
import { useFirebaseRead, firebaseUpdate } from "./hooks/useFirebaseSync";

/* -------------------- APP CONTENT -------------------- */
function AppRoutes() {
  const { loading } = useAuth();
  const { data: attendanceData } = useFirebaseRead<Record<string, any>>("attendance");

  // --- SILENT AUTO-CHECKOUT CLEANER ---
  // Runs in the background whenever the app is loaded by any user
  useEffect(() => {
    if (!attendanceData) return;

    const cleanupAbandonedSessions = async () => {
      const activeSessions = Object.entries(attendanceData).filter(
        ([_, record]) => record.status === "active" && !record.checkOutTime
      );

      const now = Date.now();
      const FOURTEEN_HOURS_MS = 14 * 60 * 60 * 1000;

      for (const [recordId, record] of activeSessions) {
        // If the session has been active for more than 14 hours without a checkout
        if (now - (record.checkInTimestamp || 0) > FOURTEEN_HOURS_MS) {
          try {
            await firebaseUpdate(`attendance/${recordId}`, {
              checkOutTime: "Auto-Closed",
              checkOutTimestamp: now,
              status: "completed",
              systemFlags: "auto-resolved"
            });
            console.log(`Auto-closed abandoned session for ${record.staffName}`);
          } catch (err) {
            console.error("Failed to auto-close session", err);
          }
        }
      }
    };

    cleanupAbandonedSessions();
  }, [attendanceData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public check-in page */}
      <Route path="/" element={<CheckIn />} />

      {/* Protected admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/* -------------------- APP ROOT -------------------- */
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        {/* ✅ Toast container */}
        <Toaster position="top-right" reverseOrder={false} />
      </BrowserRouter>
    </AuthProvider>
  );
}
