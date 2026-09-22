import React, { useState } from 'react';
import {
  Lock,
  Trash2,
  X,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { deleteTransactionApi, verifyPasswordApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getCurrencySymbol } from '../utils/currency';

export default function DeleteAuthModal({
  isOpen,
  onClose,
  onSuccess,
  transaction,
}) {
  const { user } = useAuth();
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !transaction) return null;

  const currency = getCurrencySymbol(user?.currency);
  const isGoogleUser = auth.currentUser?.providerData?.some(
    (p) => p.providerId === 'google.com'
  );

  const handleClose = () => {
    setPassword('');
    setError('');
    setShowPassword(false);
    onClose();
  };

  const handleDeleteWithPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!password.trim()) {
      setError('Please enter your password to authorize deletion.');
      return;
    }

    const email = auth.currentUser?.email || user?.email;
    if (!email) {
      setError('User email not found. Please re-login.');
      return;
    }

    setLoading(true);
    try {
      // 1. Verify password via backend bcrypt verification first
      let verified = false;
      try {
        await verifyPasswordApi(password);
        verified = true;
      } catch (backendErr) {
        // If backend verification failed, check if user can verify via Firebase Auth
        if (auth.currentUser?.email) {
          try {
            await signInWithEmailAndPassword(auth, email, password);
            verified = true;
          } catch (fbErr) {
            const errToThrow = new Error(
              backendErr.response?.data?.message || 'Incorrect password. Authorization failed.'
            );
            errToThrow.code = fbErr.code;
            throw errToThrow;
          }
        } else {
          throw new Error(
            backendErr.response?.data?.message || 'Incorrect password. Authorization failed.'
          );
        }
      }

      if (!verified) {
        throw new Error('Incorrect password. Authorization failed.');
      }

      // 2. Password is verified! Proceed with deletion
      await deleteTransactionApi(transaction._id);
      toast.success('Transaction permanently deleted', 'Transaction Deleted');

      handleClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Password verification error during delete:', err);
      let errMsg = 'Authorization failed. Transaction was not deleted.';
      if (
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/invalid-login-credentials'
      ) {
        errMsg = 'Incorrect password. Authorization failed. You cannot delete this transaction.';
      } else if (err.code === 'auth/too-many-requests') {
        errMsg = 'Too many failed attempts. Please try again later.';
      } else {
        errMsg = err.message || 'Authorization failed. Transaction was not deleted.';
      }
      setError(errMsg);
      toast.error(errMsg, 'Authorization Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleReauth = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      await deleteTransactionApi(transaction._id);
      toast.success('Transaction deleted via Google authorization', 'Transaction Deleted');
      handleClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Google authorization failed:', err);
      const errMsg = 'Google authorization was cancelled or failed.';
      setError(errMsg);
      toast.error(errMsg, 'Authorization Cancelled');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Authorization Required
              </h3>
              <p className="text-xs text-slate-400">
                Confirm your password to delete transaction
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transaction to Delete Summary */}
        <div className="p-5 space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-white/5 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    transaction.type === 'income'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {transaction.type}
                </span>
                <span className="text-xs font-semibold text-white">
                  {transaction.category}
                </span>
              </div>
              {transaction.description && (
                <p className="text-xs text-slate-400 truncate max-w-[200px]">
                  {transaction.description}
                </p>
              )}
            </div>

            <div className="text-right">
              <div
                className={`text-sm font-bold ${
                  transaction.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {transaction.type === 'income' ? '+' : '-'}
                {currency} {Number(transaction.amount).toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500">
                {new Date(transaction.date).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Security Warning */}
          <p className="text-xs text-slate-400 leading-relaxed">
            This action <span className="text-rose-400 font-semibold">permanently deletes</span> this record from your history. To proceed, verify your identity.
          </p>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-rose-300 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Password Form */}
          <form onSubmit={handleDeleteWithPassword} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Account Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Enter your login password"
                  autoFocus
                  required
                  className="w-full bg-slate-900/90 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/60 focus:ring-1 focus:ring-rose-500/30 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-white/5 active:scale-95 transition-all disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading || !password.trim()}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/25 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Authorize & Delete</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Optional Google SSO authorization fallback */}
          {isGoogleUser && (
            <div className="pt-2 border-t border-white/5 text-center">
              <p className="text-[11px] text-slate-500 mb-2">Signed in with Google?</p>
              <button
                type="button"
                onClick={handleGoogleReauth}
                disabled={loading}
                className="w-full py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-white/10 text-slate-200 text-xs font-medium flex items-center justify-center gap-2 transition-all"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Authorize with Google</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
