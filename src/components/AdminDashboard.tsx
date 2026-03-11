import { useState, lazy, Suspense, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LogOut, Menu, X, Users, BarChart3, FileText, Map as MapIcon, Loader2, Sun, Moon } from 'lucide-react';
import { useFirebaseRead, firebaseUpdate } from '../hooks/useFirebaseSync';
import { SessionTimeout } from './admin/SessionTimeout';

// Lazy load internal admin tabs
const StaffManagement = lazy(() => import('./admin/StaffManagement').then(m => ({ default: m.StaffManagement })));
const AttendanceRecords = lazy(() => import('./admin/AttendanceRecords').then(m => ({ default: m.AttendanceRecords })));
const Analytics = lazy(() => import('./admin/Analytics').then(m => ({ default: m.Analytics })));
const LiveMap = lazy(() => import('./admin/LiveMap').then(m => ({ default: m.LiveMap })));

type TabType = 'staff' | 'attendance' | 'analytics' | 'map';

export function AdminDashboard() {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('attendance');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSessionWarning] = useState(false);

  // --- DATABASE JANITOR ---
  const { data: attendanceData } = useFirebaseRead<Record<string, any>>("attendance");
  useEffect(() => {
    if (!attendanceData) return;
    const cleanup = async () => {
      const now = Date.now();
      const LIMIT = 14 * 60 * 60 * 1000;
      const activeSessions = Object.entries(attendanceData).filter(
        ([_, r]) => r.status === "active" && !r.checkOutTime
      );
      for (const [id, record] of activeSessions) {
        if (now - (record.checkInTimestamp || 0) > LIMIT) {
          try {
            await firebaseUpdate(`attendance/${id}`, {
              checkOutTime: "Auto-Closed",
              checkOutTimestamp: now,
              status: "completed",
              systemFlags: "auto-resolved"
            });
          } catch (e) { console.error("Cleanup failed for", id, e); }
        }
      }
    };
    cleanup();
  }, [attendanceData]);

  const tabs = [
    { id: 'attendance' as TabType, label: 'Attendance Records', icon: BarChart3 },
    { id: 'map' as TabType, label: 'Live Map View', icon: MapIcon },
    { id: 'staff' as TabType, label: 'Staff Management', icon: Users },
    { id: 'analytics' as TabType, label: 'Analytics', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      <SessionTimeout show={showSessionWarning} onLogout={logout} />

      {/* ── Header ── */}
      <header className="fixed top-0 left-0 right-0 bg-gray-100 dark:bg-slate-600 shadow-sm dark:shadow-slate-700/30 z-50 border-b border-gray-200 dark:border-slate-700 transition-colors duration-300">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="flex items-center gap-3">
              <img src="/coldsis-logo_FitMaxWzM1MiwyNjRd.png" alt="Logo" className="h-10 w-auto" />
              <div className="hidden md:block">
                <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tighter uppercase"></h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-slate-600 dark:text-yellow-300 hover:scale-105 active:scale-95 transition-all shadow-sm"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              onClick={logout}
              className="flex items-center gap-2 bg-orange-600 hover:bg-slate-900 dark:hover:bg-slate-700 text-white px-4 py-2 rounded-xl transition shadow-md active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline font-bold text-xs uppercase tracking-widest">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Sidebar ── */}
        <aside
          className={`
            fixed top-16 bottom-0 left-0 w-64 
            transition-all duration-300 ease-in-out z-40
            bg-slate-900 dark:bg-slate-950 text-white 
            lg:bg-gray-100 lg:dark:bg-slate-800
            lg:text-slate-800 lg:dark:text-slate-200
            lg:border-r border-gray-200 dark:border-slate-700
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
            lg:translate-x-0
          `}
        >
          <nav className="p-4 space-y-2 mt-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-black text-xs uppercase tracking-tight ${isActive
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20'
                    : 'text-slate-400 hover:text-orange-600 lg:hover:bg-white lg:dark:hover:bg-slate-700 lg:hover:shadow-sm'
                    }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="absolute bottom-8 left-4 right-4 text-center">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] opacity-50">
              Admin Control Panel
            </p>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-hidden bg-white dark:bg-slate-900 transition-colors duration-300">
          <div className="h-full w-full p-4 md:p-8 overflow-y-auto">
            <Suspense fallback={
              <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50 animate-pulse">
                <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Preparing Module...</p>
              </div>
            }>
              {activeTab === 'attendance' && <AttendanceRecords />}
              {activeTab === 'map' && <LiveMap />}
              {activeTab === 'staff' && <StaffManagement />}
              {activeTab === 'analytics' && <Analytics />}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}