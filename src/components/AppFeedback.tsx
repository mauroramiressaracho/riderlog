import { createContext, type ReactNode, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle, Info, Loader2, Trash2, XCircle } from 'lucide-react';

export type FeedbackType = 'success' | 'error' | 'warning' | 'info' | 'loading';

type ToastMessage = {
  id: number;
  type: FeedbackType;
  message: string;
};

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

type ConfirmState = Required<ConfirmOptions> & {
  resolve: (confirmed: boolean) => void;
};

type AppFeedbackContextValue = {
  showToast: (message: string, type?: FeedbackType, duration?: number) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const AppFeedbackContext = createContext<AppFeedbackContextValue | undefined>(undefined);

const toastStyles: Record<FeedbackType, string> = {
  success: 'border-green-400/40 bg-green-950/95 text-green-50',
  error: 'border-red-400/40 bg-red-950/95 text-red-50',
  warning: 'border-amber-400/40 bg-amber-950/95 text-amber-50',
  info: 'border-sky-400/40 bg-sky-950/95 text-sky-50',
  loading: 'border-orange-400/40 bg-asphalt/95 text-orange-50',
};

function ToastIcon({ type }: { type: FeedbackType }) {
  if (type === 'success') return <CheckCircle size={22} aria-hidden="true" />;
  if (type === 'error') return <XCircle size={22} aria-hidden="true" />;
  if (type === 'warning') return <AlertTriangle size={22} aria-hidden="true" />;
  if (type === 'loading') return <Loader2 size={22} className="animate-spin" aria-hidden="true" />;
  return <Info size={22} aria-hidden="true" />;
}

export function Spinner({ className = '' }: { className?: string }) {
  return <Loader2 size={20} className={`animate-spin ${className}`} aria-hidden="true" />;
}

export function ProgressBar() {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
      <div className="h-full w-1/2 animate-[progress-indeterminate_1.1s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-gold via-ember to-flame" />
    </div>
  );
}

export function AppFeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState>();
  const toastId = useRef(0);

  const showToast = useCallback((message: string, type: FeedbackType = 'info', duration = 2600) => {
    const id = toastId.current + 1;
    toastId.current = id;
    setToasts((current) => [...current, { id, type, message }].slice(-3));

    if (type !== 'loading') {
      window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, duration);
    }
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({
        title: options.title ?? 'Confirmar ação',
        message: options.message,
        confirmLabel: options.confirmLabel ?? 'Confirmar',
        cancelLabel: options.cancelLabel ?? 'Cancelar',
        danger: options.danger ?? false,
        resolve,
      });
    });
  }, []);

  const contextValue = useMemo(() => ({ showToast, confirm }), [confirm, showToast]);

  function closeConfirm(confirmed: boolean) {
    confirmState?.resolve(confirmed);
    setConfirmState(undefined);
  }

  return (
    <AppFeedbackContext.Provider value={contextValue}>
      {children}

      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.75rem)] z-50 mx-auto flex w-full max-w-md flex-col gap-2 px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 rounded-3xl border px-4 py-3 text-sm font-black shadow-2xl backdrop-blur ${toastStyles[toast.type]}`}
            role="status"
            aria-live="polite"
          >
            <ToastIcon type={toast.type} />
            <span className="leading-snug">{toast.message}</span>
          </div>
        ))}
      </div>

      {confirmState ? (
        <div className="fixed inset-0 z-50 mx-auto flex max-w-md items-end bg-black/55 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] backdrop-blur-sm">
          <div className="w-full rounded-[2rem] border border-white/10 bg-slate-950 p-5 text-white shadow-2xl">
            <div className="flex items-start gap-3">
              <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${confirmState.danger ? 'bg-red-500/20 text-red-200' : 'bg-orange-500/20 text-orange-200'}`}>
                {confirmState.danger ? <Trash2 size={24} aria-hidden="true" /> : <AlertTriangle size={24} aria-hidden="true" />}
              </span>
              <div>
                <h2 className="text-lg font-black">{confirmState.title}</h2>
                <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-300">{confirmState.message}</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => closeConfirm(false)}
                className="h-12 rounded-2xl border border-white/10 bg-white/10 text-sm font-black text-slate-100 active:scale-[0.99]"
              >
                {confirmState.cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => closeConfirm(true)}
                className={`h-12 rounded-2xl text-sm font-black text-white shadow-soft active:scale-[0.99] ${
                  confirmState.danger ? 'bg-red-600' : 'bg-gradient-to-br from-ember to-flame'
                }`}
              >
                {confirmState.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppFeedbackContext.Provider>
  );
}

export function useAppFeedback() {
  const context = useContext(AppFeedbackContext);

  if (!context) {
    throw new Error('useAppFeedback deve ser usado dentro de AppFeedbackProvider.');
  }

  return context;
}
