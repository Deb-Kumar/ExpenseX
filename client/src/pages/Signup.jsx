import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Sparkles, 
  TrendingUp, 
  PieChart, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight
} from 'lucide-react';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Signup() {
  const { loginWithFirebase } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      
      // 2. Update display name in Firebase profile
      await updateProfile(userCredential.user, {
        displayName: name.trim(),
      });

      // 3. Register user with ExpenseX backend & obtain JWT session
      await loginWithFirebase(
        {
          uid: userCredential.user.uid,
          displayName: name.trim(),
          email: userCredential.user.email,
          photoURL: userCredential.user.photoURL,
        },
        { password }
      );

      toast.success(`Welcome to ExpenseX, ${name.trim()}! Your account is ready.`, 'Account Created');
      navigate('/dashboard');
    } catch (err) {
      console.error('Signup error:', err);
      let errMsg = 'Failed to create account';
      if (err.code === 'auth/email-already-in-use') {
        errMsg = 'This email address is already registered. Please sign in instead.';
      } else if (err.code === 'auth/invalid-email') {
        errMsg = 'Please enter a valid email address.';
      } else if (err.code === 'auth/weak-password') {
        errMsg = 'Password is too weak. Choose a stronger password (minimum 6 characters).';
      } else {
        errMsg = err.message || 'Failed to create account';
      }
      setError(errMsg);
      toast.error(errMsg, 'Signup Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await loginWithFirebase(result.user);
      toast.success(`Welcome to ExpenseX, ${result.user.displayName || 'there'}!`, 'Account Created');
      navigate('/dashboard');
    } catch (err) {
      console.error('Google sign-in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled. Please try again.');
      } else {
        const msg = err.message || 'Google authentication failed';
        setError(msg);
        toast.error(msg, 'Google Sign-In Error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1d] flex items-center justify-center p-4 selection:bg-brand-500 selection:text-white">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 bg-[#0f172a] rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Left: Value Props */}
        <div className="p-8 sm:p-12 bg-gradient-to-br from-brand-950/80 via-slate-900 to-[#0a0f1d] border-b md:border-b-0 md:border-r border-white/5 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl"></div>

          <div>
            <div className="flex items-center gap-3.5 mb-8">
              <img
                src="/logo-badge.png"
                alt="ExpenseX Logo"
                className="w-12 h-12 rounded-2xl object-contain shadow-xl shadow-black/40 ring-1 ring-white/15"
              />
              <span className="text-2xl font-black tracking-tight text-white">
                Expense<span className="text-emerald-400">X</span>
              </span>
            </div>

            <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight mb-4">
              Start Your Financial Journey Today.
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              Create your free account to track income, control expenses, manage category budgets, and reach your savings goals.
            </p>

            <div className="space-y-3.5">
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span>Clean, personal dashboard with zero bloat</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <div className="p-1 rounded-md bg-brand-500/10 text-brand-400">
                  <PieChart className="w-4 h-4" />
                </div>
                <span>Visual spending breakdowns and monthly analytics</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <div className="p-1 rounded-md bg-indigo-500/10 text-indigo-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span>Personalized budget alerts and savings tracking</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Encrypted authentication via Google Firebase</span>
          </div>
        </div>

        {/* Right: Registration Form */}
        <div className="p-8 sm:p-12 flex flex-col justify-center space-y-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Get Started
            </span>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Create your account
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              Sign up with Google or your email to get started.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Continue with Google */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/10 font-semibold text-xs shadow-sm active:scale-[0.98] transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5.1 3.7-8.9z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 12s.7 2.3 1.9 4.7l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Balanced Divider */}
          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-white/10"></div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap">
              or with email
            </span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailSignup} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                FULL NAME
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                EMAIL ADDRESS
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  PASSWORD
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 transition-colors"
                    title={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex="-1"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  CONFIRM PASSWORD
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 transition-colors"
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    tabIndex="-1"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-600/25 active:scale-[0.98] transition-all mt-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              <span>Create Account</span>
            </button>
          </form>

          <p className="text-xs text-center text-slate-400">
            Already have an account?{' '}
            <NavLink to="/login" className="text-brand-400 hover:text-brand-300 font-semibold underline underline-offset-4">
              Sign in
            </NavLink>
          </p>
        </div>
      </div>
    </div>
  );
}
