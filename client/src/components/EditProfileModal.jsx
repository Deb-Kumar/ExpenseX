import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User,
  Mail,
  AlertCircle,
  CheckCircle2,
  Loader2,
  KeyRound,
  RotateCcw,
  Save,
  Camera,
  Sparkles,
  Send,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import UserAvatar from './UserAvatar';
import AvatarBasketModal from './AvatarBasketModal';

export default function EditProfileModal({ isOpen, onClose }) {
  const { user, updateProfile, sendEmailOtp, verifyEmailOtp } = useAuth();
  const toast = useToast();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture || '');
  const [showAvatarBasket, setShowAvatarBasket] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  // 6-digit OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const inputRefs = useRef([]);

  // Re-sync when modal opens or user changes
  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setProfilePicture(user.profilePicture || '');
      setShowAvatarBasket(false);
      setIsEmailVerified(false);
      setOtpSent(false);
      setOtpDigits(['', '', '', '', '', '']);
      setErrorMsg('');
      setCountdown(0);
    }
  }, [isOpen, user]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  if (!isOpen) return null;

  const isGoogleUser = user?.authProvider === 'google' || Boolean(user?.googleId);
  const isEmailChanged = !isGoogleUser && email.trim().toLowerCase() !== (user?.email || '').toLowerCase();
  const canSave = (isGoogleUser || !isEmailChanged || isEmailVerified) && name.trim().length > 0;
  const fullOtp = otpDigits.join('');

  // Send OTP
  const handleSendOtp = async () => {
    setErrorMsg('');
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      toast.error('Please enter a valid email address.', 'Invalid Email');
      return;
    }

    setSendingOtp(true);
    try {
      await sendEmailOtp(cleanEmail);
      setOtpSent(true);
      setOtpDigits(['', '', '', '', '', '']);
      setCountdown(60);
      toast.success(`Verification OTP sent to ${cleanEmail}`, 'Code Sent');

      // Auto-focus first digit box
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to send OTP';
      setErrorMsg(msg);
      toast.error(msg, 'Email Service');
    } finally {
      setSendingOtp(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (candidateCode) => {
    setErrorMsg('');
    const code = typeof candidateCode === 'string' ? candidateCode : fullOtp;

    if (!code || code.length !== 6) {
      setErrorMsg('Please enter the full 6-digit verification code.');
      return;
    }

    setVerifyingOtp(true);
    try {
      await verifyEmailOtp({ newEmail: email.trim().toLowerCase(), otp: code });
      setIsEmailVerified(true);
      toast.success('Email verified successfully! You can now save your profile.', 'Email Verified');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Verification failed';
      setErrorMsg(msg);
      toast.error(msg, 'Verification Error');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // 6-box input change handler
  const handleOtpChange = (index, value) => {
    const cleaned = value.replace(/\D/g, '');
    const newDigits = [...otpDigits];

    if (!cleaned) {
      newDigits[index] = '';
      setOtpDigits(newDigits);
      return;
    }

    if (cleaned.length === 1) {
      newDigits[index] = cleaned;
      setOtpDigits(newDigits);

      // Auto focus next box
      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      } else {
        // If 6th box filled, check if all 6 are present
        const finalCandidate = newDigits.join('');
        if (finalCandidate.length === 6) {
          handleVerifyOtp(finalCandidate);
        }
      }
    } else {
      // Multiple characters typed / autofilled
      const chars = cleaned.slice(0, 6).split('');
      chars.forEach((c, idx) => {
        if (index + idx < 6) {
          newDigits[index + idx] = c;
        }
      });
      setOtpDigits(newDigits);

      const nextFocus = Math.min(index + chars.length, 5);
      inputRefs.current[nextFocus]?.focus();

      if (newDigits.join('').length === 6) {
        handleVerifyOtp(newDigits.join(''));
      }
    }
  };

  // Key down navigation (Backspace & Arrow keys)
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        const newDigits = [...otpDigits];
        newDigits[index - 1] = '';
        setOtpDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newDigits = [...otpDigits];
        newDigits[index] = '';
        setOtpDigits(newDigits);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Paste support across all 6 boxes
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = ['', '', '', '', '', ''];
    pasted.split('').forEach((char, idx) => {
      if (idx < 6) newDigits[idx] = char;
    });
    setOtpDigits(newDigits);

    if (pasted.length === 6) {
      inputRefs.current[5]?.focus();
      handleVerifyOtp(pasted);
    } else {
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  // Email input change
  const handleEmailChange = (val) => {
    setEmail(val);
    if (isEmailVerified) setIsEmailVerified(false);
    if (otpSent) {
      setOtpSent(false);
      setOtpDigits(['', '', '', '', '', '']);
    }
    setErrorMsg('');
  };

  // Submit Profile Changes
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Name cannot be empty.');
      return;
    }

    if (isEmailChanged && !isEmailVerified) {
      setErrorMsg('You must verify your new email before saving changes.');
      toast.error('Please verify your new email with OTP before saving.', 'Action Blocked');
      return;
    }

    setSavingProfile(true);
    try {
      const payload = {
        name: name.trim(),
        profilePicture,
        ...(!isGoogleUser && isEmailChanged && isEmailVerified ? { email: email.trim().toLowerCase() } : {}),
      };

      await updateProfile(payload);
      toast.success('Profile details updated successfully!', 'Profile Saved');
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update profile';
      setErrorMsg(msg);
      toast.error(msg, 'Save Error');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-brand-900/40 via-indigo-950/40 to-slate-900 border-b border-white/5 flex items-center justify-between shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-1/4 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 shadow-md shadow-brand-500/10">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white tracking-tight">Edit Profile</h2>
              <p className="text-xs text-slate-400">Update your avatar, public name, and verified email</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all cursor-pointer relative z-10"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar">
          {errorMsg && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-300 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Profile Photo Customizer */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/5 flex items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative group flex-shrink-0">
                <div className="w-14 h-14 rounded-2xl p-0.5 bg-gradient-to-tr from-brand-500 via-teal-400 to-indigo-500 shadow-md">
                  <UserAvatar
                    src={profilePicture}
                    name={name || user?.name}
                    size="xl"
                    rounded="rounded-[14px]"
                    className="w-full h-full"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowAvatarBasket(true)}
                  className="absolute inset-0 m-auto w-7 h-7 rounded-xl bg-slate-950/80 hover:bg-brand-500 text-white hover:text-slate-950 flex items-center justify-center backdrop-blur-xs border border-white/20 transition-all cursor-pointer shadow-lg"
                  title="Change Profile Photo"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white tracking-wide">Profile Photo</p>
                <p className="text-[11px] text-slate-400 truncate">Pick avatar preset or upload from computer</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAvatarBasket(true)}
              className="px-3.5 py-1.5 rounded-xl bg-brand-500/15 hover:bg-brand-500/25 border border-brand-500/30 text-brand-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Change Photo</span>
            </button>
          </div>

          {/* Name Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              Full Name <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition-all shadow-inner"
              />
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Email Field with Verify action */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-300">
                Email Address <span className="text-rose-400">*</span>
              </label>

              {isGoogleUser ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Linked to Google
                </span>
              ) : isEmailChanged ? (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                    isEmailVerified
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {isEmailVerified ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" /> Verified
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3" /> Verification Required
                    </>
                  )}
                </span>
              ) : user?.isEmailVerified ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Verified
                </span>
              ) : null}
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="email"
                  required
                  readOnly={isGoogleUser}
                  disabled={isGoogleUser}
                  value={isGoogleUser ? (user?.email || '') : email}
                  onChange={(e) => !isGoogleUser && handleEmailChange(e.target.value)}
                  placeholder="Enter email address"
                  className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-xs placeholder:text-slate-500 shadow-inner transition-all ${
                    isGoogleUser
                      ? 'bg-slate-950/70 border-white/5 text-slate-400 cursor-not-allowed select-none'
                      : isEmailChanged && !isEmailVerified
                      ? 'bg-slate-900/90 text-white border-amber-500/50 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400'
                      : 'bg-slate-900/90 text-white border-white/10 focus:outline-none focus:border-brand-400 focus:ring-brand-400'
                  }`}
                />
                <Mail
                  className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${
                    isGoogleUser ? 'text-slate-600' : 'text-slate-500'
                  }`}
                />
              </div>

              {!isGoogleUser && isEmailChanged && !isEmailVerified && (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sendingOtp || countdown > 0}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 active:scale-95 transition-all shrink-0 cursor-pointer"
                >
                  {sendingOtp ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>{otpSent ? 'Resend' : 'Send Code'}</span>
                </button>
              )}

              {!isGoogleUser && isEmailChanged && isEmailVerified && (
                <div className="px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-1 text-xs font-bold shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verified</span>
                </div>
              )}
            </div>

            {isGoogleUser && (
              <p className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-0.5">
                <Lock className="w-3 h-3 text-amber-400/80 shrink-0" />
                <span>Google-authenticated email addresses cannot be modified.</span>
              </p>
            )}
          </div>

          {/* 6 Individual Digit OTP Box Panel */}
          {!isGoogleUser && isEmailChanged && otpSent && !isEmailVerified && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-amber-500/10 via-slate-900/95 to-slate-900 border border-amber-500/30 space-y-3.5 shadow-xl shadow-amber-950/20 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-300 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  Enter 6-Digit Email OTP
                </span>
                {countdown > 0 ? (
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-950/60 px-2 py-0.5 rounded-md border border-white/5">
                    Resend in {countdown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Resend Code
                  </button>
                )}
              </div>

              {/* 6 Discrete Digit Boxes */}
              <div className="flex items-center justify-center gap-2 sm:gap-2.5 py-1">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={handleOtpPaste}
                    className={`w-10 h-12 sm:w-11 sm:h-13 text-center font-mono font-black text-xl text-white rounded-xl border transition-all shadow-inner focus:outline-none ${
                      digit
                        ? 'bg-amber-500/15 border-amber-400 text-amber-300 shadow-amber-500/20'
                        : 'bg-slate-950/80 border-white/10 hover:border-white/20'
                    } focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 focus:bg-slate-950`}
                  />
                ))}
              </div>

              {/* Verification Controls & Guidance */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <p className="text-[11px] text-slate-400 leading-snug flex-1">
                  Sent to <strong className="text-white font-medium">{email}</strong>. Check inbox, spam, or console.
                </p>

                <button
                  type="button"
                  onClick={() => handleVerifyOtp()}
                  disabled={verifyingOtp || fullOtp.length !== 6}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs shadow-md shadow-amber-500/25 flex items-center gap-1.5 active:scale-95 transition-all shrink-0 cursor-pointer"
                >
                  {verifyingOtp ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verify OTP</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Email Verified Banner */}
          {isEmailChanged && isEmailVerified && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Email verified successfully! Click <strong>Save Profile</strong> below to apply.
              </span>
            </div>
          )}

          {/* Modal Actions Footer */}
          <div className="pt-3 border-t border-white/5 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={savingProfile || !canSave}
              className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-extrabold shadow-lg shadow-brand-500/20 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              {savingProfile ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Nested Avatar Basket & Computer File Upload Modal */}
      <AvatarBasketModal
        isOpen={showAvatarBasket}
        onClose={() => setShowAvatarBasket(false)}
        currentAvatar={profilePicture}
        onSelectAvatar={(newAvatar) => {
          setProfilePicture(newAvatar);
          setShowAvatarBasket(false);
          toast.success('Profile photo selected! Click Save Profile to apply.', 'Photo Selected');
        }}
      />
    </div>
  );
}
