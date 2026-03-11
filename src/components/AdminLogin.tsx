import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Loader2, AlertCircle, Mail, Eye, EyeOff } from 'lucide-react';

export function AdminLogin() {
  const { login, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: Particle[] = [];
    let animationFrameId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    class Particle {
      x: number; y: number; size: number; speedX: number; speedY: number;
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1; // Bigger size for visibility
        this.speedX = (Math.random() - 0.5) * 1.5;
        this.speedY = (Math.random() - 0.5) * 1.5;
      }
      update() {
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

      {/* Login Card */}
      <div className="relative bg-white/10 backdrop-blur-xl border border-white/30 rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] p-8 sm:p-12 max-w-md w-full z-10">
        <div className="flex justify-center mb-8">
          <img src="/coldsis-logo_FitMaxWzM1MiwyNjRd.png" alt="COLDSiS Logo" className="h-20 drop-shadow-lg" />
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Admin Login</h1>
          <div className="h-1 w-12 bg-white mx-auto mt-2 rounded-full" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {(localError || error) && (
            <div className="bg-red-600 text-white rounded-2xl p-4 flex items-center gap-3 animate-bounce border-b-4 border-red-800">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <p className="text-xs font-black uppercase tracking-tight">{localError || error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-white uppercase tracking-[0.2em] ml-2">Username / Email</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-600 w-5 h-5 z-10" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@coldsis.com"
                className="w-full pl-12 pr-6 py-4 bg-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-400 transition-all font-bold text-slate-800 shadow-inner"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-white uppercase tracking-[0.2em] ml-2">Access Key</label>
            <div className="relative group">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-6 py-4 bg-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-400 transition-all font-bold text-slate-800 shadow-inner"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-600 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-black disabled:opacity-50 text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95 uppercase text-sm tracking-[0.2em] border-b-4 border-slate-700 active:border-b-0"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Authorize Access'}
          </button>
        </form>

        <p className="text-[10px] text-white/50 text-center mt-10 font-black uppercase tracking-[0.3em]">
          Secure Infrastructure &copy; 2026
        </p>
      </div>
    </div>
  );
}