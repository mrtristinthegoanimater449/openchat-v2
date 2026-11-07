import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, UserPlus, LogIn, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GOOGLE_CLIENT_ID } from '../../config';

declare const google: any;

export const AuthScreen: React.FC = () => {
  const { signUp, logIn, signInWithGoogle } = useAuth();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'signup' && password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const result =
      mode === 'signup' ? await signUp(username, password) : await logIn(username, password);
    setLoading(false);

    if (!result.success) {
      setError(result.message);
    }
    // On success the AuthGate in App.tsx swaps to the main app automatically.
  };

  // Render the official Google button once the GIS script is available
  useEffect(() => {
    let cancelled = false;
    const tryRender = () => {
      if (cancelled) return;
      if (typeof google === 'undefined' || !google?.accounts?.id || !googleButtonRef.current) {
        setTimeout(tryRender, 200);
        return;
      }
      try {
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (resp: { credential: string }) => {
            const result = await signInWithGoogle(resp.credential);
            if (!result.success) setError(result.message);
          },
        });
        googleButtonRef.current.innerHTML = '';
        google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'filled_black',
          size: 'large',
          shape: 'pill',
          text: mode === 'signup' ? 'signup_with' : 'signin_with',
          width: 320,
        });
      } catch (err: any) {
        setError(`Google sign-in failed to initialize: ${err?.message ?? err}`);
      }
    };
    tryRender();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const switchMode = (m: 'login' | 'signup') => {
    setMode(m);
    setError(null);
    setPassword('');
    setConfirm('');
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#1e1f22] text-[#dbdee1] font-sans antialiased overflow-hidden relative">
      {/* Ambient background glow (animated) */}
      <motion.div
        animate={{ x: [0, 60, 0], y: [0, -40, 0], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[#5865F2]/20 blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{ x: [0, -50, 0], y: [0, 45, 0], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-[#5865F2]/10 blur-3xl pointer-events-none"
      />

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="relative w-full max-w-md mx-4 bg-[#2b2d31] rounded-2xl shadow-2xl border border-[#1f2023] p-8"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#5865F2] flex items-center justify-center shadow-lg shadow-[#5865F2]/30 mb-3">
            <MessageSquare className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            {mode === 'signup' ? 'Create your account' : 'Welcome back!'}
          </h1>
          <p className="text-sm text-[#949ba4] mt-1">
            {mode === 'signup'
              ? 'Join OpenChat V2 in seconds'
              : 'We are so excited to see you again!'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-[#1e1f22] rounded-lg p-1 mb-6">
          <button
            onClick={() => switchMode('signup')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-semibold transition-all cursor-pointer ${
              mode === 'signup' ? 'bg-[#5865F2] text-white shadow' : 'text-[#949ba4] hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Sign Up
          </button>
          <button
            onClick={() => switchMode('login')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-semibold transition-all cursor-pointer ${
              mode === 'login' ? 'bg-[#5865F2] text-white shadow' : 'text-[#949ba4] hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" />
            Log In
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-[#b5bac1] uppercase tracking-wider mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. tristin"
              autoFocus
              autoComplete="username"
              className="w-full bg-[#1e1f22] border border-[#1f2023] focus:border-[#5865F2] rounded-md px-3 py-2.5 text-sm text-white placeholder-[#4e5058] outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#b5bac1] uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                className="w-full bg-[#1e1f22] border border-[#1f2023] focus:border-[#5865F2] rounded-md px-3 py-2.5 pr-10 text-sm text-white placeholder-[#4e5058] outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#949ba4] hover:text-white transition-colors cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-[11px] font-bold text-[#b5bac1] uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                className="w-full bg-[#1e1f22] border border-[#1f2023] focus:border-[#5865F2] rounded-md px-3 py-2.5 text-sm text-white placeholder-[#4e5058] outline-none transition-colors"
              />
            </div>
          )}

          {error && (
            <div className="text-sm text-[#f23f43] bg-[#f23f43]/10 border border-[#f23f43]/30 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            disabled={loading || !username.trim() || !password}
            className="w-full flex items-center justify-center gap-2 bg-[#5865F2] hover:bg-[#4752c4] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-md py-2.5 text-sm transition-colors cursor-pointer"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'signup' ? 'Create Account' : 'Log In'}
          </motion.button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-[#3f4147]" />
          <span className="text-[11px] font-bold text-[#949ba4] uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-[#3f4147]" />
        </div>

        {/* Official Google Sign-In button (rendered by Google Identity Services) */}
        <div className="flex justify-center min-h-[44px]" ref={googleButtonRef} />

        <p className="text-[11px] text-[#4e5058] text-center mt-5">
          Accounts and sessions are stored on the OpenChat server (`accounts.json`); Google sign-in is verified server-side.
        </p>
      </motion.div>
    </div>
  );
};
