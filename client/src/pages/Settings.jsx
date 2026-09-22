import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Coins,
  ShieldCheck,
  CheckCircle2,
  LogOut,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  AlertTriangle,
  Mail,
  Edit3,
  Check,
  AlertCircle,
  ShieldAlert,
  Calendar,
  Globe,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';
import EditProfileModal from '../components/EditProfileModal';
import UserAvatar from '../components/UserAvatar';
import { CURRENCIES, getCurrencySymbol } from '../utils/currency';

export default function Settings() {
  const { user, updateCurrency, updateProfile, setAccountPassword, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Currency state
  const [selectedCurrency, setSelectedCurrency] = useState(getCurrencySymbol(user?.currency));

  // Modals state
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Security / Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (user?.currency) {
      setSelectedCurrency(getCurrencySymbol(user.currency));
    }
  }, [user?.currency]);

  // Currency update handler
  const handleCurrencyChange = async (symbol) => {
    setSelectedCurrency(symbol);
    await updateCurrency(symbol);
    const curr = CURRENCIES.find((c) => c.symbol === symbol);
    toast.success(`Currency set to ${symbol} ${curr?.code || ''}`, 'Currency Updated');
  };

  // Password update handler
  const handleSavePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      toast.error('Password must be at least 6 characters.', 'Security Error');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match. Please verify.');
      toast.error('Passwords do not match.', 'Security Error');
      return;
    }

    setSavingPassword(true);
    try {
      await setAccountPassword(newPassword);
      toast.success(
        user?.hasPassword
          ? 'Account password updated successfully!'
          : 'Master password configured! Account is now password protected.',
        'Security Updated'
      );
      setNewPassword('');
      setConfirmPassword('');
      setIsChangingPassword(false);
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password');
      toast.error(err.message || 'Failed to update password', 'Error');
    } finally {
      setSavingPassword(false);
    }
  };

  // Logout handler
  const handleLogout = () => {
    logout();
    toast.info('You have signed out successfully.', 'Signed Out');
    navigate('/login');
  };

  const isGoogleUser = user?.authProvider === 'google' || Boolean(user?.googleId);
  const hasPassword = Boolean(user?.hasPassword);

  const formattedPasswordDate = user?.passwordUpdatedAt
    ? new Date(user.passwordUpdatedAt).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : user?.updatedAt
    ? new Date(user.updatedAt).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

  return (
    <div className="max-w-7xl mx-auto space-y-2.5 sm:space-y-3 pb-6 -mt-1 sm:-mt-1.5">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-brand-500/10 border border-brand-500/20 text-brand-400 font-semibold text-[10px] sm:text-xs tracking-wider uppercase">
              Control Panel
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-0.5">
            Profile & Settings
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your personal identity, account credentials, and display preferences.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowLogoutModal(true)}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 active:scale-95 transition-all shadow-sm shadow-rose-950/20 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Critical Alert Banner if Master Password Not Set */}
      {!hasPassword && (
        <div className="p-3 sm:p-3.5 rounded-2xl bg-rose-500/10 border-2 border-rose-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-200 animate-in fade-in shadow-xl shadow-rose-950/20">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 shrink-0 mt-0.5 sm:mt-0">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white">
                  Critical Security Action
                </span>
                <h3 className="text-sm font-bold text-white">
                  Set Your Master Password
                </h3>
              </div>
              <p className="text-xs text-rose-300/90 mt-0.5 leading-relaxed">
                You have not set your account password yet. Please set your master password below to authorize transaction deletions and protect your account.
              </p>
            </div>
          </div>
          <a
            href="#master-password-section"
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white text-xs font-bold shrink-0 self-start sm:self-auto shadow-lg shadow-rose-500/25 active:scale-95 transition-all text-center flex items-center gap-2 cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            <span>Set Password Below</span>
          </a>
        </div>
      )}

      {/* TOP ROW: 2 Balanced Containers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
        {/* =========================================================================
            CONTAINER 1 (LEFT): Profile Card & Avatar Center (lg:col-span-6)
            ========================================================================= */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="glass-panel px-4 sm:px-5 pt-3.5 sm:pt-4 pb-4 sm:pb-5 rounded-2xl sm:rounded-3xl border border-white/10 shadow-xl flex-1 flex flex-col space-y-3.5 relative overflow-hidden">
            {/* Glow backdrop */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Container Header with Edit Button on the Right */}
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-white leading-tight">Profile Details</h2>
                  <p className="text-[11px] text-slate-400">Your public appearance and email</p>
                </div>
              </div>

              {/* Edit Button on the Right */}
              <button
                type="button"
                onClick={() => setShowEditProfileModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-500/15 hover:bg-brand-500/25 border border-brand-500/30 hover:border-brand-500/50 text-brand-300 hover:text-brand-200 text-xs font-bold transition-all active:scale-95 shadow-sm cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            </div>

            {/* Profile Avatar */}
            <div className="flex flex-col sm:flex-row items-center gap-4 py-1">
              <div className="flex-shrink-0">
                {/* Avatar Ring */}
                <div className="w-20 h-20 rounded-2xl p-1 bg-gradient-to-tr from-brand-500 via-teal-400 to-indigo-500 shadow-lg shadow-brand-500/20 flex items-center justify-center">
                  <UserAvatar
                    src={user?.profilePicture}
                    name={user?.name}
                    size="xl"
                    rounded="rounded-[18px]"
                    className="w-full h-full"
                  />
                </div>
              </div>

              {/* Identity Details */}
              <div className="flex-1 text-center sm:text-left space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-lg font-extrabold text-white tracking-tight truncate">
                    {user?.name || 'ExpenseX User'}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                      isGoogleUser
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {isGoogleUser ? 'Google Account' : 'Standard Account'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-slate-400">
                  <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="font-mono text-[11px] text-slate-300 truncate">{user?.email}</span>
                  {user?.isEmailVerified ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      Email Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
                      <AlertCircle className="w-3 h-3" />
                      Unverified
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-[11px] text-emerald-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>Authenticated & Isolated Session Active</span>
                </div>
              </div>
            </div>

            {/* Quick Profile & Account Overview Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-white/5">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Globe className="w-3 h-3 text-brand-400" />
                  Auth Provider
                </span>
                <span className="text-xs font-bold text-white truncate">
                  {isGoogleUser ? 'Google OAuth 2.0' : 'Email & Password'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Coins className="w-3 h-3 text-amber-400" />
                  Active Currency
                </span>
                <span className="text-xs font-bold text-white truncate">
                  {selectedCurrency} &bull; {CURRENCIES.find((c) => c.symbol === selectedCurrency)?.code || 'USD'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 flex flex-col gap-1 col-span-2 sm:col-span-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Session Security
                </span>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  Protected & Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            CONTAINER 2 (RIGHT): Account Security & Dynamic Red-to-Green Password Card (lg:col-span-6)
            ========================================================================= */}
        <div className="lg:col-span-6 flex flex-col" id="master-password-section">
          <div
            className={`glass-panel px-4 sm:px-5 pt-3.5 sm:pt-4 pb-4 sm:pb-5 rounded-2xl sm:rounded-3xl border shadow-xl flex-1 flex flex-col space-y-3.5 relative overflow-hidden transition-all duration-300 ${
              hasPassword
                ? 'border-emerald-500/40 bg-gradient-to-b from-emerald-950/20 via-slate-900/90 to-slate-900/95 shadow-emerald-950/20'
                : 'border-rose-500/40 bg-gradient-to-b from-rose-950/20 via-slate-900/90 to-slate-900/95 shadow-rose-950/20'
            }`}
          >
            {/* Ambient Background Glow */}
            <div
              className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
                hasPassword ? 'bg-emerald-500/10' : 'bg-rose-500/10'
              }`}
            />

            {/* Header with Dynamic Red / Green Badge */}
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded-xl border ${
                    hasPassword
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-white leading-tight">Master Password</h2>
                  <p className="text-[11px] text-slate-400">Password authorization & transaction security</p>
                </div>
              </div>

              {/* Dynamic Status Pill */}
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border transition-colors ${
                  hasPassword
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse'
                }`}
              >
                {hasPassword ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Password Active
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                    Password Not Set
                  </>
                )}
              </span>
            </div>

            {/* Dynamic Status Section */}
            {hasPassword ? (
              <div className="space-y-3">
                {/* Masked Password Display Card */}
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                        Active Master Password
                      </span>
                      <p className="font-mono text-base sm:text-lg font-black text-emerald-300 tracking-[0.25em]">
                        ********************
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPassword((prev) => !prev);
                      setPasswordError('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all active:scale-95 cursor-pointer self-start sm:self-auto"
                  >
                    {isChangingPassword ? 'Cancel Edit' : 'Change Password'}
                  </button>
                </div>

                {/* Date and Time of Password Set / Changed */}
                <div className="flex items-start sm:items-center gap-2.5 p-2.5 rounded-xl bg-slate-900/70 border border-emerald-500/20 text-xs text-slate-300">
                  <Calendar className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="text-slate-400">Password configured / changed:</span>
                    <strong className="text-emerald-300 font-mono font-bold">
                      {formattedPasswordDate}
                    </strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3 text-xs text-rose-300">
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-0.5">
                    Critical Security Notice
                  </h4>
                  <p className="leading-relaxed">
                    No master password is configured for this account. Set a password below to enable transaction deletion and secure authorizations.
                  </p>
                </div>
              </div>
            )}

            {/* Password Form (Visible when !hasPassword OR when changing password) */}
            {(!hasPassword || isChangingPassword) && (
              <form onSubmit={handleSavePassword} className="space-y-4 pt-1 animate-in fade-in">
                {passwordError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label
                    className={`block text-xs font-semibold ${
                      hasPassword ? 'text-slate-300' : 'text-rose-300 font-bold'
                    }`}
                  >
                    {hasPassword ? 'New Password *' : 'Set Master Password (Min. 6 characters) *'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={hasPassword ? 'Enter new password' : 'Choose a strong master password'}
                      required
                      minLength={6}
                      className={`w-full rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white placeholder-slate-500 transition-all ${
                        hasPassword
                          ? 'bg-slate-900/90 border border-emerald-500/30 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400'
                          : 'bg-rose-950/20 border-2 border-rose-500/50 focus:border-rose-400 focus:ring-1 focus:ring-rose-400 placeholder-rose-300/40 text-rose-100'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    className={`block text-xs font-semibold ${
                      hasPassword ? 'text-slate-300' : 'text-rose-300 font-bold'
                    }`}
                  >
                    Confirm Password *
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password to confirm"
                    required
                    minLength={6}
                    className={`w-full rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 transition-all ${
                      hasPassword
                        ? 'bg-slate-900/90 border border-emerald-500/30 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400'
                        : 'bg-rose-950/20 border-2 border-rose-500/50 focus:border-rose-400 focus:ring-1 focus:ring-rose-400 placeholder-rose-300/40 text-rose-100'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingPassword || !newPassword || !confirmPassword}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                    hasPassword
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20'
                      : 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white shadow-rose-500/25'
                  }`}
                >
                  {savingPassword ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <KeyRound className="w-4 h-4" />
                  )}
                  <span>{hasPassword ? 'Update Account Password' : 'Save & Protect Account'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          BOTTOM ROW: Default Currency Container (Positioned Below the 2 Containers)
          ========================================================================= */}
      <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-white/10 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">Default Currency</h2>
              <p className="text-xs text-slate-400">
                Display currency across your balances, analytics charts, and transaction records
              </p>
            </div>
          </div>

          <span className="self-start sm:self-auto px-3 py-1 rounded-xl text-xs font-black bg-slate-800 border border-white/10 text-brand-300">
            Active: {selectedCurrency}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {CURRENCIES.map((c) => {
            const isSelected = selectedCurrency === c.symbol;
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => handleCurrencyChange(c.symbol)}
                className={`p-2.5 sm:p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-brand-500/15 border-brand-500/60 text-white font-bold ring-2 ring-brand-500/30 shadow-lg shadow-brand-500/10'
                    : 'bg-slate-900/80 border-white/5 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <div className="text-xl font-black mb-0.5 text-brand-400">{c.symbol}</div>
                <div className="text-xs font-bold text-slate-200">{c.code}</div>
                <div className="text-[10px] text-slate-500 truncate">{c.name}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Brand & Version Footer */}
      <div className="flex items-center justify-center gap-2 pt-1 text-slate-500 text-xs">
        <img src="/logo-badge.png" alt="ExpenseX" className="w-4 h-4 object-contain rounded-md opacity-80" />
        <span>ExpenseX v1.0.0 &bull; Smart Personal Finance Tracker</span>
      </div>

      {/* MODAL: Edit Profile Modal (Includes Avatar Basket & Custom Photo Upload) */}
      <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
      />

      {/* MODAL 3: Sign Out Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title="Sign Out of ExpenseX?"
        message="Are you sure you want to end your current session? You can easily sign back in anytime with Google or your email."
        confirmText="Yes, Sign Out"
        cancelText="Stay Logged In"
        type="logout"
      />
    </div>
  );
}
