import { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { AdminLogin } from './AdminLogin';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-orange-500" />
      </div>
    );
  }

  if (!user) {
    return <AdminLogin />;
  }

  // Role-based guard — JWT role is set by the backend
  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">🚫</span>
          </div>
          <h2 className="text-2xl font-black text-red-500 mb-2 uppercase tracking-tight">Access Denied</h2>
          <p className="text-slate-200 text-sm mb-2 font-bold tracking-tight">Your account:</p>
          <p className="inline-block px-3 py-1 bg-slate-800 rounded-lg text-orange-400 font-mono text-sm mb-6 border border-slate-700">{user.email}</p>
          <p className="text-slate-400 text-xs mb-8">This account does not have administrative permissions. Please contact your system administrator.</p>
          <button
            onClick={logout}
            className="w-full px-6 py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-black tracking-widest text-xs uppercase transition-all shadow-lg active:scale-95"
          >
            Switch Account
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
