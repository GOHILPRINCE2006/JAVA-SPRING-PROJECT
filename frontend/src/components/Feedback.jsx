import { AlertTriangle, CheckCircle2, Inbox, Loader2, RefreshCw } from 'lucide-react';

export function Spinner({ className = 'h-5 w-5' }) {
  return <Loader2 className={`animate-spin ${className}`} aria-hidden="true" />;
}

export function PageSpinner({ label = 'Loading…' }) {
  return (
    <div role="status" className="flex min-h-[40vh] items-center justify-center gap-3 text-muted">
      <Spinner className="h-6 w-6" />
      <span>{label}</span>
    </div>
  );
}

export function ListSkeleton({ rows = 3 }) {
  return (
    <div role="status" aria-label="Loading" className="grid gap-3">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="panel h-24 animate-pulse bg-line/40" />
      ))}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = 'We could not load this' }) {
  return (
    <div role="alert" className="panel flex flex-col items-start gap-3 border-danger/40 bg-danger-bg p-5">
      <div className="flex items-center gap-2 font-display text-lg font-semibold text-danger">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        {title}
      </div>
      <p className="text-ink">{error?.message || 'Something went wrong.'}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary">
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, children, action, icon: Icon = Inbox }) {
  return (
    <div className="panel flex flex-col items-center gap-3 px-6 py-12 text-center">
      <Icon className="h-9 w-9 text-harbor-600" aria-hidden="true" />
      <h2 className="text-xl font-semibold">{title}</h2>
      {children && <p className="max-w-md text-muted">{children}</p>}
      {action}
    </div>
  );
}

const ALERT_STYLES = {
  error: 'border-danger/40 bg-danger-bg text-danger',
  success: 'border-ok-fg/30 bg-ok-bg text-ok-fg',
  info: 'border-harbor-600/30 bg-harbor-50 text-harbor-800',
};

export function Alert({ tone = 'info', children, className = '' }) {
  const Icon = tone === 'success' ? CheckCircle2 : AlertTriangle;
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm ${ALERT_STYLES[tone]} ${className}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
