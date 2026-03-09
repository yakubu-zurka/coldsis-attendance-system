import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Loader2, AlertCircle, Mail, Eye, EyeOff } from 'lucide-react'; // Added icons

export function AdminLogin() {
  const { login, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // New state for toggle
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch {
      setLocalError(error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-orange-600 flex items-center justify-center p-4 overflow-hidden">
      {/* Animated Spider-Wave Background */}
      <div className="absolute inset-0">
        <svg
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 1440 320"
        >
          <path
            d="M0,160L60,176C120,192,240,224,360,213.3C480,203,600,149,720,144C840,139,960,181,1080,197.3C1200,213,1320,203,1380,197.3L1440,192L1440,320L0,320Z"
            fill="rgba(255,255,255,0.15)"
          >
            <animate
              attributeName="d"
              dur="12s"
              repeatCount="indefinite"
              values="
                M0,160L60,176C120,192,240,224,360,213.3C480,203,600,149,720,144C840,139,960,181,1080,197.3C1200,213,1320,203,1380,197.3L1440,192L1440,320L0,320Z;
                M0,180L80,160C160,140,240,200,360,190C480,180,600,120,720,130C840,140,960,200,1080,210C1200,220,1320,180,1380,170L1440,160L1440,320L0,320Z;
                M0,160L60,176C120,192,240,224,360,213.3C480,203,600,149,720,144C840,139,960,181,1080,197.3C1200,213,1320,203,1380,197.3L1440,192L1440,320L0,320Z
              "
            />
          </path>
        </svg>
      </div>

      {/* Login Card */}
      <div className="relative bg-orange-400 rounded-2xl shadow-2xl p-8 max-w-md w-full z-10 animate-fadeIn">
        <div className="flex justify-center mb-6">
          <img
            src="/coldsis-logo_FitMaxWzM1MiwyNjRd.png"
            alt="COLDSiS Logo"
            className="h-20 w-30"
          />
        </div>

        <p className="text-center text-xl text-white mb-8 font-semibold uppercase tracking-wider">Admin Portal</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {(localError || error) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 animate-shake">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{localError || error}</p>
            </div>
          )}

          {/* Email Input with Icon */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@coldsis.com"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition bg-white"
                required
              />
            </div>
          </div>

          {/* Password Input with Icon & Toggle */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition bg-white"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-600 transition"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-950 hover:bg-blue-900 disabled:opacity-50 text-white font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Logging in...
              </>
            ) : (
              'Admin Login'
            )}
          </button>
        </form>

        <p className="text-sm text-white/80 text-center mt-6 font-medium italic">
          Staff attendance system for COLDSiS GH
        </p>
      </div>
    </div>
  );
}