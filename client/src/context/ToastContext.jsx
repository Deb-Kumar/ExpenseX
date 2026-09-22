import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type = 'info', title = '', message = '', duration = 3500 }) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const newToast = { id, type, title, message, duration };
      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const success = useCallback(
    (message, title = 'Success', duration = 3500) => {
      return showToast({ type: 'success', title, message, duration });
    },
    [showToast]
  );

  const error = useCallback(
    (message, title = 'Error', duration = 4000) => {
      return showToast({ type: 'error', title, message, duration });
    },
    [showToast]
  );

  const warning = useCallback(
    (message, title = 'Warning', duration = 3500) => {
      return showToast({ type: 'warning', title, message, duration });
    },
    [showToast]
  );

  const info = useCallback(
    (message, title = 'Note', duration = 3500) => {
      return showToast({ type: 'info', title, message, duration });
    },
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{
        showToast,
        success,
        error,
        warning,
        info,
        removeToast,
      }}
    >
      {children}

      {/* Floating Global Toast Stack */}
      <div
        aria-live="polite"
        className="fixed top-5 right-5 sm:top-6 sm:right-6 z-[250] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((toast) => {
          const typeConfig = {
            success: {
              icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
              border: 'border-emerald-500/30',
              bg: 'bg-[#0b1b1f]/95 shadow-emerald-950/40',
              bar: 'bg-emerald-500',
              badge: 'bg-emerald-500/20 text-emerald-300',
            },
            error: {
              icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
              border: 'border-rose-500/30',
              bg: 'bg-[#1e101a]/95 shadow-rose-950/40',
              bar: 'bg-rose-500',
              badge: 'bg-rose-500/20 text-rose-300',
            },
            warning: {
              icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
              border: 'border-amber-500/30',
              bg: 'bg-[#1e170c]/95 shadow-amber-950/40',
              bar: 'bg-amber-500',
              badge: 'bg-amber-500/20 text-amber-300',
            },
            info: {
              icon: <Info className="w-5 h-5 text-brand-400 shrink-0" />,
              border: 'border-brand-500/30',
              bg: 'bg-[#0f172a]/95 shadow-brand-950/40',
              bar: 'bg-brand-500',
              badge: 'bg-brand-500/20 text-brand-300',
            },
          };

          const config = typeConfig[toast.type] || typeConfig.info;

          return (
            <div
              key={toast.id}
              role="alert"
              className={`pointer-events-auto rounded-2xl border ${config.border} ${config.bg} backdrop-blur-xl p-3.5 shadow-2xl flex items-start gap-3 relative overflow-hidden transition-all duration-300 animate-in slide-in-from-top-3 sm:slide-in-from-right-5 fade-in duration-200`}
            >
              {/* Status Icon */}
              <div className="pt-0.5">{config.icon}</div>

              {/* Toast Text Content */}
              <div className="flex-1 min-w-0 pr-2">
                {toast.title && (
                  <h4 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5 mb-0.5">
                    <span>{toast.title}</span>
                  </h4>
                )}
                <p className="text-xs text-slate-300 leading-relaxed break-words font-medium">
                  {toast.message}
                </p>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                aria-label="Dismiss notification"
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Progress timer bar */}
              {toast.duration > 0 && (
                <div
                  className={`absolute bottom-0 left-0 h-0.5 ${config.bar} opacity-60 w-full animate-progress`}
                  style={{ animationDuration: `${toast.duration}ms` }}
                />
              )}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
