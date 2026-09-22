import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, KeyRound, AlertCircle, Loader2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { auth } from '../config/firebase';
import { updatePassword } from 'firebase/auth';

export default function SetPasswordModal() {
  const { user, setAccountPassword } = useAuth();
  const toast = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSkipped, setIsSkipped] = useState(() => {
    return sessionStorage.getItem('expensex_skip_pwd_prompt') === 'true';
  });

  // Show only if authenticated, user came from Google OAuth, has not set password, and hasn't skipped in this session
  const isGoogleUserWithoutPassword = Boolean(
    user && (user.authProvider === 'google' || user.googleId) && !user.hasPassword
  );

  if (!isGoogleUserWithoutPassword || isSkipped) {
    return null;
  }

  const handleSkip = () => {
    setIsSkipped(true);
    sessionStorage.setItem('expensex_skip_pwd_prompt', 'true');
    toast.warning(
      'Password setup skipped. You can configure your master password at any time in Settings.',
      'Action Postponed'
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-check.');
      return;
    }

    setLoading(true);
    try {
      // 1. Update Firebase Auth credential if possible
      if (auth.currentUser) {
        try {
          await updatePassword(auth.currentUser, password);
        } catch (fbErr) {
          console.warn('Firebase updatePassword notice:', fbErr.message);
        }
      }

      // 2. Persist password in ExpenseX backend & mark hasPassword: true
      await setAccountPassword(password);

      toast.success('Account password set successfully! You can now authorize actions.', 'Password Configured');
    } catch (err) {
      console.error('Failed to set password:', err);
      setError(err.response?.data?.message || err.message || 'Failed to set password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="set-password-title"
    >
      <div className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header Ribbon */}
        <div className="p-6 bg-gradient-to-r from-brand-900/60 to-indigo-950/60 border-b border-white/5 text-center relative">
          <button
            type="button"
            onClick={handleSkip}
            title="Skip for now"
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-brand-500/25 ring-4 ring-white/10">
            <KeyRound className="w-7 h-7" />
          </div>

          <h2 id="set-password-title" className="text-lg font-extrabold text-white tracking-tight">
            Set Your Master Password
          </h2>
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
            Welcome to ExpenseX! Since you signed in via Google, please establish an account password to authorize deletions and manage sensitive actions.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              NEW PASSWORD (MIN. 6 CHARACTERS) *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a strong password"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              CONFIRM PASSWORD *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/70 border border-white/5 flex items-start gap-2.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>This password will be required when permanently deleting records to keep your financial ledger secure.</span>
          </div>

          {/* Submit & Skip Actions */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSkip}
              className="w-1/3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-white/10 active:scale-95 transition-all cursor-pointer text-center"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-brand-500/25 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Securing Account...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Set Password & Continue</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
