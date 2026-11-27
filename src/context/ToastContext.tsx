'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  X,
  Compass,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'nav';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  timestamp: string;
}

interface ToastContextType {
  toast: {
    success: (message: string, title?: string, duration?: number) => void;
    error: (message: string, title?: string, duration?: number) => void;
    warning: (message: string, title?: string, duration?: number) => void;
    info: (message: string, title?: string, duration?: number) => void;
    nav: (message: string, title?: string, duration?: number) => void;
  };
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, title?: string, duration = 3500) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date();
      const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const newToast: ToastItem = { id, type, message, title, duration, timestamp };

      // Keep maximum 4 toasts on screen to prevent clutter
      setToasts((prev) => {
        const next = [...prev.slice(-3), newToast];
        return next;
      });

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const toastMethods = {
    success: (message: string, title?: string, duration?: number) =>
      addToast('success', message, title, duration || 4000),
    error: (message: string, title?: string, duration?: number) =>
      addToast('error', message, title, duration || 5000),
    warning: (message: string, title?: string, duration?: number) =>
      addToast('warning', message, title, duration || 4500),
    info: (message: string, title?: string, duration?: number) =>
      addToast('info', message, title, duration || 3500),
    nav: (message: string, title?: string, duration?: number) =>
      addToast('nav', message, title, duration || 2600),
  };

  return (
    <ToastContext.Provider value={{ toast: toastMethods, removeToast }}>
      {children}

      {/* TOP-RIGHT PREMIUM TOAST NOTIFICATION CONTAINER */}
      <div
        aria-live="assertive"
        className="fixed top-4 right-4 sm:top-5 sm:right-6 z-[999999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none"
      >
        {toasts.map((t) => {
          const typeConfig: Record<
            ToastType,
            {
              icon: React.ReactNode;
              border: string;
              bg: string;
              accent: string;
              glow: string;
              tag: string;
              tagColor: string;
            }
          > = {
            success: {
              icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 animate-bounce" />,
              border: 'border-emerald-500/40 dark:border-emerald-500/50',
              bg: 'bg-white/95 dark:bg-slate-900/95',
              accent: 'bg-emerald-500',
              glow: 'shadow-[0_12px_36px_rgba(16,185,129,0.22)]',
              tag: 'SUCCESS • सफलता',
              tagColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
            },
            error: {
              icon: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 animate-pulse" />,
              border: 'border-rose-500/40 dark:border-rose-500/50',
              bg: 'bg-white/95 dark:bg-slate-900/95',
              accent: 'bg-rose-500',
              glow: 'shadow-[0_12px_36px_rgba(244,63,94,0.25)]',
              tag: 'ALERT • चेतावनी',
              tagColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
            },
            warning: {
              icon: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
              border: 'border-amber-500/40 dark:border-amber-500/50',
              bg: 'bg-white/95 dark:bg-slate-900/95',
              accent: 'bg-amber-500',
              glow: 'shadow-[0_12px_36px_rgba(245,158,11,0.22)]',
              tag: 'WARNING • ध्यान दें',
              tagColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
            },
            info: {
              icon: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
              border: 'border-blue-500/40 dark:border-blue-500/50',
              bg: 'bg-white/95 dark:bg-slate-900/95',
              accent: 'bg-blue-500',
              glow: 'shadow-[0_12px_36px_rgba(59,130,246,0.22)]',
              tag: 'SYSTEM • सिस्टम',
              tagColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
            },
            nav: {
              icon: <Compass className="w-5 h-5 text-indigo-500 shrink-0 animate-spin" style={{ animationDuration: '6s' }} />,
              border: 'border-indigo-500/40 dark:border-indigo-500/50',
              bg: 'bg-white/95 dark:bg-slate-900/95',
              accent: 'bg-indigo-500',
              glow: 'shadow-[0_12px_36px_rgba(99,102,241,0.25)]',
              tag: 'TAB OPENED • टैब सक्रिय',
              tagColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
            },
          };

          const config = typeConfig[t.type];

          return (
            <div
              key={t.id}
              role="alert"
              className={`pointer-events-auto relative overflow-hidden rounded-2xl border ${config.border} ${config.bg} ${config.glow} backdrop-blur-xl p-3.5 transition-all duration-300 transform translate-y-0 opacity-100 shadow-2xl flex flex-col gap-2`}
              style={{
                animation: 'slideInTopRight 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              }}
            >
              {/* Left Accent Color Indicator Bar */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${config.accent}`} />

              <div className="flex items-start gap-3 pl-1.5">
                <div className="mt-0.5">{config.icon}</div>

                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${config.tagColor}`}
                    >
                      {config.tag}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                      {t.timestamp}
                    </span>
                  </div>

                  {t.title && (
                    <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight mb-0.5">
                      {t.title}
                    </h4>
                  )}

                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-snug">
                    {t.message}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => removeToast(t.id)}
                  aria-label="Dismiss alert"
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Countdown Progress Bar */}
              {t.duration && t.duration > 0 && (
                <div className="w-full bg-slate-100 dark:bg-slate-800/80 h-1 rounded-full overflow-hidden mt-1">
                  <div
                    className={`h-full ${config.accent} origin-left`}
                    style={{
                      animation: `shrinkWidth ${t.duration}ms linear forwards`,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style jsx global>{`
        @keyframes slideInTopRight {
          from {
            opacity: 0;
            transform: translateX(30px) translateY(-10px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateX(0) translateY(0) scale(1);
          }
        }
        @keyframes shrinkWidth {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
}

export default ToastProvider;
