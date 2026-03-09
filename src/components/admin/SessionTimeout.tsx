import { AlertTriangle } from 'lucide-react';

interface SessionTimeoutProps {
  show: boolean;
  onLogout: () => void;
}

export function SessionTimeout({ show, onLogout }: SessionTimeoutProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="w-12 h-12 text-yellow-500" />
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Session Expiring</h2>
        <p className="text-center text-gray-600 mb-6">
          Your session will expire in 1 minute due to inactivity. Please move your mouse or press a key to continue, or you will be automatically logged out.
        </p>
        <button
          onClick={onLogout}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-lg transition"
        >
          Logout Now
        </button>
      </div>
    </div>
  );
}
