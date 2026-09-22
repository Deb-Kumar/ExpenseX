import React from 'react';
import { X, LogOut, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'Please confirm your action.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger', // 'danger' | 'warning' | 'primary' | 'logout'
  icon = null,
}) {
  if (!isOpen) return null;

  const getIconAndStyle = () => {
    if (icon) return { icon, style: 'bg-brand-500/10 text-brand-400 border-brand-500/20' };
    switch (type) {
      case 'warning':
        return {
          icon: <AlertTriangle className="w-7 h-7" />,
          style: 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/10',
          btnStyle: 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/25',
        };
      case 'primary':
        return {
          icon: <CheckCircle2 className="w-7 h-7" />,
          style: 'bg-brand-500/10 text-brand-400 border-brand-500/20 shadow-brand-500/10',
          btnStyle: 'bg-brand-600 hover:bg-brand-500 shadow-brand-600/25',
        };
      case 'logout':
        return {
          icon: <LogOut className="w-7 h-7 translate-x-0.5" />,
          style: 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-rose-500/10',
          btnStyle: 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/25',
        };
      case 'danger':
      default:
        return {
          icon: <AlertTriangle className="w-7 h-7" />,
          style: 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-rose-500/10',
          btnStyle: 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/25',
        };
    }
  };

  const { icon: renderedIcon, style: iconContainerStyle, btnStyle } = getIconAndStyle();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 text-center">
          <div
            className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center border shadow-lg ${iconContainerStyle}`}
          >
            {renderedIcon}
          </div>

          <h3 className="text-lg font-bold text-white tracking-tight mb-2">
            {title}
          </h3>

          <p className="text-xs text-slate-400 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-900/60 border-t border-white/5 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-white/5 active:scale-95 transition-all"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-white text-xs font-bold shadow-lg active:scale-95 transition-all ${btnStyle}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
