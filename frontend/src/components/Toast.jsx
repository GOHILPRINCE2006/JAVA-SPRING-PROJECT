import { useCallback, useMemo, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { ToastContext } from './toastContext';

/** Lightweight success/info toasts (announced to screen readers). Errors are shown inline next to the action. */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((toast) => toast.id !== id)), []);

  const notify = useCallback(
    (message) => {
      const id = crypto.randomUUID();
      setToasts((list) => [...list, { id, message }]);
      setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex max-w-md items-center gap-3 rounded-lg bg-harbor-800 px-4 py-3 text-sm text-white shadow-lg"
          >
            <CheckCircle2 className="h-5 w-5 shrink-0 text-found-bg" aria-hidden="true" />
            <span>{toast.message}</span>
            <button type="button" onClick={() => dismiss(toast.id)} aria-label="Dismiss notification" className="ml-1 rounded p-1 hover:bg-white/10">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
