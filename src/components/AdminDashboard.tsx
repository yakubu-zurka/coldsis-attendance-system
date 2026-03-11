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
 
// ... imports stay the same

export function AdminDashboard() {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('attendance');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSessionWarning, setShowSessionWarning] = useState(false);

  // ... (useEffect for timers stays the same)

  const tabs = [
    { id: 'attendance' as TabType, label: 'Attendance Records', icon: BarChart3 },
    { id: 'map' as TabType, label: 'Live Map View', icon: MapIcon },
    { id: 'staff' as TabType, label: 'Staff Management', icon: Users },
    { id: 'analytics' as TabType, label: 'Analytics', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <SessionTimeout show={showSessionWarning} onLogout={logout} />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-gray-100 shadow-sm z-50 border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-gray-600 hover:text-gray-900"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="flex items-center gap-3">
              <img src="/coldsis-logo_FitMaxWzM1MiwyNjRd.png" alt="Logo" className="h-10 w-auto" />
              <div className="hidden md:block">
                <h1 className="text-xl font-black text-slate-800 tracking-tighter uppercase"></h1>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 bg-orange-600 hover:bg-slate-900 text-white px-4 py-2 rounded-xl transition shadow-md active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline font-bold text-xs uppercase tracking-widest">Logout</span>
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Mobile Overlay (Darkens background on mobile only) */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed top-16 bottom-0 left-0 w-64 
            transition-transform duration-300 ease-in-out z-40
            /* MOBILE COLORS: Dark Slate */
            bg-slate-900 text-white 
            /* DESKTOP COLORS: Light Gray */
            lg:bg-gray-100 lg:text-slate-800 lg:border-r lg:border-gray-200
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
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-black text-xs uppercase tracking-tight ${
                    isActive
                      ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20'
                      : 'text-slate-400 hover:text-orange-600 lg:hover:bg-white lg:hover:shadow-sm'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer Branding */}
          <div className="absolute bottom-8 left-4 right-4 text-center">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] opacity-50">
              Admin Control Panel
            </p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-hidden bg-white">
          <div className="h-full w-full p-4 md:p-8 overflow-y-auto">
            {activeTab === 'attendance' && <AttendanceRecords />}
            {activeTab === 'map' && <LiveMap />}
            {activeTab === 'staff' && <StaffManagement />}
            {activeTab === 'analytics' && <Analytics />}
          </div>
        </main>
      </div>
    </div>
  );
}