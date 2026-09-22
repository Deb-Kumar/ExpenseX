import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Trash2,
  X,
  AlertCircle,
  Loader2,
  CheckSquare,
  Square,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function DeleteAccountModal({ isOpen, onClose }) {
  const { user, deleteAccount } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [consent1, setConsent1] = useState(false);
  const [consent2, setConsent2] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  // Lock body scroll and listen for Escape key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isDeleting) {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isDeleting]);

  // Reset inputs when modal opens or closes
  const handleClose = () => {
    if (isDeleting) return;
    setConsent1(false);
    setConsent2(false);
    setConfirmText('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  const isConfirmed = consent1 && consent2 && confirmText.trim().toUpperCase() === 'DELETE';

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!isConfirmed || isDeleting) return;

    setError('');
    setIsDeleting(true);

    try {
      await deleteAccount();
      toast.success(
        'Your account and all associated financial records have been permanently deleted.',
        'Account Deleted'
      );
      handleClose();
      navigate('/login');
    } catch (err) {
      console.error('Account deletion failed:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to delete account. Please try again.';
      setError(msg);
      toast.error(msg, 'Deletion Failed');
      setIsDeleting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      style={{ margin: 0 }}
      role="dialog"
      aria-modal="true"
    >
      {/* Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg glass-panel bg-slate-900/95 border border-rose-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-rose-950/50 text-white z-10 animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Decorative Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-32 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          disabled={isDeleting}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5 mb-4">
          <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 shadow-lg shadow-rose-500/10 shrink-0">
            <Trash2 className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                Danger Zone
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-1">
              Delete ExpenseX Account
            </h2>
            <p className="text-xs text-rose-300/80 mt-0.5">
              Permanently delete <span className="font-semibold text-rose-200">{user?.email}</span>
            </p>
          </div>
        </div>

        {/* Warning Callout */}
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 space-y-2 mb-4">
          <div className="flex items-center gap-2 text-rose-300 text-xs font-bold">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span>This action is permanent and completely irreversible</span>
          </div>
          <ul className="text-xs text-rose-200/80 space-y-1 pl-6 list-disc">
            <li>All your transactions, incomes, and expenses will be purged immediately.</li>
            <li>All custom budget goals and categories will be permanently removed.</li>
            <li>Your user profile and credentials cannot be recovered once confirmed.</li>
          </ul>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form: Consents & Confirmation Text */}
        <form onSubmit={handleDelete} className="space-y-4">
          {/* Consent Checkboxes */}
          <div className="space-y-2.5">
            <label
              className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/60 border border-white/5 hover:border-rose-500/30 transition-colors cursor-pointer group"
              onClick={() => setConsent1(!consent1)}
            >
              <div className="mt-0.5 text-rose-400 shrink-0">
                {consent1 ? (
                  <CheckSquare className="w-4 h-4 text-rose-400 fill-rose-500/20" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 group-hover:text-slate-400" />
                )}
              </div>
              <span className="text-xs text-slate-300 select-none leading-relaxed">
                I understand that deleting my account is <strong className="text-rose-300">permanent</strong> and will wipe all my financial history.
              </span>
            </label>

            <label
              className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/60 border border-white/5 hover:border-rose-500/30 transition-colors cursor-pointer group"
              onClick={() => setConsent2(!consent2)}
            >
              <div className="mt-0.5 text-rose-400 shrink-0">
                {consent2 ? (
                  <CheckSquare className="w-4 h-4 text-rose-400 fill-rose-500/20" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 group-hover:text-slate-400" />
                )}
              </div>
              <span className="text-xs text-slate-300 select-none leading-relaxed">
                I acknowledge that I <strong className="text-rose-300">cannot restore or retrieve</strong> any data after this deletion.
              </span>
            </label>
          </div>

          {/* Type DELETE confirmation */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-semibold text-slate-300">
              To verify, type <span className="text-rose-400 font-mono font-bold tracking-wider">DELETE</span> below:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              disabled={isDeleting}
              autoComplete="off"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-rose-500/30 focus:border-rose-400 focus:ring-1 focus:ring-rose-400 text-xs text-white placeholder-slate-500 transition-all font-mono uppercase tracking-wider"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isDeleting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!isConfirmed || isDeleting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 via-rose-500 to-pink-600 hover:from-rose-500 hover:to-pink-500 active:scale-95 transition-all shadow-lg shadow-rose-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Deleting Account...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Permanently Delete</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
