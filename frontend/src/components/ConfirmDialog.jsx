import { useEffect, useRef } from 'react';
import { Spinner } from './Feedback';

/**
 * Modal confirmation built on the native <dialog> element (focus trap, Esc to close, backdrop).
 * Render it only while a confirmation is pending: <ConfirmDialog open={...} />.
 */
export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = 'Confirm',
  tone = 'danger',
  busy = false,
  error,
  onConfirm,
  onCancel,
}) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
      onClick={(event) => {
        if (event.target === ref.current && !busy) onCancel();
      }}
      aria-labelledby="confirm-title"
      className="m-auto w-[min(92vw,28rem)] rounded-xl border border-line bg-surface p-0 text-ink shadow-xl"
    >
      {open && (
        <div className="p-6">
          <h2 id="confirm-title" className="text-xl font-semibold">
            {title}
          </h2>
          <div className="mt-2 text-muted">{children}</div>
          {error && (
            <p role="alert" className="mt-3 rounded-lg bg-danger-bg px-3 py-2 text-sm font-medium text-danger">
              {error}
            </p>
          )}
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={onCancel} disabled={busy}>
              Cancel
            </button>
            <button
              type="button"
              className={tone === 'danger' ? 'btn-danger' : 'btn-primary'}
              onClick={onConfirm}
              disabled={busy}
            >
              {busy && <Spinner className="h-4 w-4" />}
              {confirmLabel}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
