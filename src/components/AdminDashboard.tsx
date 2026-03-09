import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
// Added Map icon to the imports
import { LogOut, Menu, X, Users, BarChart3, FileText, Map as MapIcon } from 'lucide-react';
import { StaffManagement } from './admin/StaffManagement';
import { AttendanceRecords } from './admin/AttendanceRecords';
import { Analytics } from './admin/Analytics';
import { SessionTimeout } from './admin/SessionTimeout';
// Import your new LiveMap component
import { LiveMap } from './admin/LiveMap'; 

// Updated TabType to include 'map'
type TabType = 'staff' | 'attendance' | 'analytics' | 'map' | 'settings';

export function AdminDashboard() {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('attendance');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showSessionWarning, setShowSessionWarning] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let warningTimeout: NodeJS.Timeout;

    const resetTimers = () => {
      clearTimeout(timeout);
      clearTimeout(warningTimeout);

      warningTimeout = setTimeout(() => {
        setShowSessionWarning(true);
      }, 4 * 60 * 1000);

      timeout = setTimeout(() => {
        logout();
      }, 5 * 60 * 1000);
    };

    window.addEventListener('mousemove', resetTimers);
    window.addEventListener('keypress', resetTimers);

    resetTimers();

    return () => {
      clearTimeout(timeout);
      clearTimeout(warningTimeout);
      window.removeEventListener('mousemove', resetTimers);
      window.removeEventListener('keypress', resetTimers);
    };
  }, [logout]);

  const handleLogout = async () => {
    await logout();
  };

  // Added the Map tab to the navigation array
  const tabs = [
    { id: 'attendance' as TabType, label: 'Attendance Records', icon: BarChart3 },
    { id: 'map' as TabType, label: 'Live Map View', icon: MapIcon }, // New Tab
    { id: 'staff' as TabType, label: 'Staff Management', icon: Users },
    { id: 'analytics' as TabType, label: 'Analytics', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <SessionTimeout show={showSessionWarning} onLogout={handleLogout} />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-50 border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-gray-600 hover:text-gray-900"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="flex items-center gap-3">
              <img
                src="/coldsis-logo_FitMaxWzM1MiwyNjRd.png"
                alt="COLDSiS Logo"
                className="h-10 w-13"
              />
              <div className="hidden md:block">
                <h1 className="text-2xl font-bold text-gray-800">COLDSiS GH</h1>
                <p className="text-xs text-gray-600 font-medium uppercase tracking-tighter">Attendance Management System</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-orange-600 hover:bg-blue-900 text-white px-4 py-2 rounded-lg transition shadow-md active:scale-95"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline font-semibold">Logout</span>
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed top-16 w-64 h-[calc(100vh-4rem)] bg-gray text-white shadow-lg transition-transform duration-200 z-40 border-r border-slate-800`}
        >
          <nav className="p-6 space-y-2 mt-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    // On mobile, close sidebar after clicking a tab
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-bold">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-hidden">
          <div className="h-full w-full p-6 overflow-y-auto">
            {activeTab === 'attendance' && <AttendanceRecords />}
            {activeTab === 'map' && <LiveMap />} {/* Render the Map Component */}
            {activeTab === 'staff' && <StaffManagement />}
            {activeTab === 'analytics' && <Analytics />}
          </div>
        </main>
      </div>
    </div>
  );
}