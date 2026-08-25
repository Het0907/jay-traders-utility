import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, LogIn, ShieldCheck, AlertCircle } from 'lucide-react';

const VALID_USERNAME = process.env.REACT_APP_LOGIN_USERNAME;
const VALID_PASSWORD = process.env.REACT_APP_LOGIN_PASSWORD;

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 600);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate brief network delay for UX
    await new Promise((res) => setTimeout(res, 600));

    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      if (rememberMe) {
        localStorage.setItem('jt_auth', 'true');
      } else {
        sessionStorage.setItem('jt_auth', 'true');
      }
      onLogin();
    } else {
      setIsLoading(false);
      setError('Invalid username or password. Please try again.');
      triggerShake();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950 flex items-center justify-center p-4 relative overflow-hidden">

      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-5%] w-[500px] h-[500px] bg-red-800/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-red-900/5 rounded-full blur-3xl pointer-events-none" />

      {/* Login Card */}
      <div
        className={`relative w-full max-w-md transition-all duration-700 ease-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        } ${isShaking ? 'animate-shake' : ''}`}
      >
        {/* Card glass morphism */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl">

          {/* Logo & Branding */}
          <div className="flex flex-col items-center mb-8">
            <div className="p-4 bg-gradient-to-tr from-red-600 to-rose-500 rounded-2xl shadow-lg shadow-red-600/30 mb-4">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Jay Traders
            </h1>
            <p className="text-sm text-gray-400 mt-1 font-medium">
              Product Management Utility
            </p>
            <div className="mt-3 h-px w-16 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
          </div>

          {/* Welcome Text */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white">Welcome back</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Sign in to access your dashboard
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-5">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Username Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-username"
                className="block text-xs font-bold text-gray-300 uppercase tracking-wider"
              >
                Username
              </label>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                placeholder="Enter your username"
                required
                autoComplete="username"
                className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-500/60 focus:bg-white/8 transition-all duration-200 focus:ring-1 focus:ring-red-500/30"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-password"
                className="block text-xs font-bold text-gray-300 uppercase tracking-wider"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-xl px-4 py-3 pr-12 text-sm outline-none focus:border-red-500/60 focus:bg-white/8 transition-all duration-200 focus:ring-1 focus:ring-red-500/30"
                />
                <button
                  type="button"
                  id="toggle-password-visibility"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2.5 pt-1">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-red-500 cursor-pointer accent-red-500"
              />
              <label
                htmlFor="remember-me"
                className="text-sm text-gray-400 cursor-pointer select-none"
              >
                Remember me
              </label>
            </div>

            {/* Submit Button */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-red-600/30 hover:shadow-red-500/40 hover:-translate-y-0.5 active:translate-y-0"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <p className="text-center text-xs text-gray-600 mt-8">
            © {new Date().getFullYear()} Jay Traders · Internal Access Only
          </p>
        </div>
      </div>

      {/* Shake keyframe injected via style tag */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15%       { transform: translateX(-8px); }
          30%       { transform: translateX(8px); }
          45%       { transform: translateX(-6px); }
          60%       { transform: translateX(6px); }
          75%       { transform: translateX(-3px); }
          90%       { transform: translateX(3px); }
        }
        .animate-shake { animation: shake 0.6s ease-in-out; }
        .focus\\:bg-white\\/8:focus { background-color: rgba(255,255,255,0.08); }
      `}</style>
    </div>
  );
}
