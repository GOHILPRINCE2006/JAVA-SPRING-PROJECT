import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { itemsApi } from '../api/items';
import { useAsync } from '../hooks/useAsync';
import PageHeader from '../components/PageHeader';
import ConfirmDialog from '../components/ConfirmDialog';
import { Alert, EmptyState, ErrorState, ListSkeleton } from '../components/Feedback';
import { ItemStatusBadge } from '../components/StatusBadge';
import { useToast } from '../components/toastContext';
import { formatDate, sortNewest } from '../utils/format';

export default function MyItems() {
  const { notify } = useToast();
  const { data, error, loading, reload } = useAsync((signal) => itemsApi.mine(signal), []);
  const [pending, setPending] = useState(null); // item awaiting delete confirmation
  const [busy, setBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [pageError, setPageError] = useState('');

  async function confirmDelete() {
    setBusy(true);
    setDeleteError('');
    try {
      await itemsApi.remove(pending.id);
      notify(`"${pending.title}" was deleted.`);
      setPending(null);
      setPageError('');
      reload();
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const items = data ? sortNewest(data, 'reportedAt') : [];

  return (
    <div className="container-page py-10">
      <PageHeader title="My reports" actions={<Link to="/report-item" className="btn-primary">Report an item</Link>}>
        Items you have reported as lost or found.
      </PageHeader>

      {pageError && <Alert tone="error" className="mb-4">{pageError}</Alert>}
      {loading && <ListSkeleton />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && items.length === 0 && (
        <EmptyState title="You have not reported anything yet" action={<Link to="/report-item" className="btn-primary">Report an item</Link>}>
          Items you report will appear here.
        </EmptyState>
      )}
      {data && items.length > 0 && (
        <ul className="grid gap-3">
          {items.map((item) => (
            <li key={item.id} className="panel flex flex-wrap items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <ItemStatusBadge status={item.status} />
                  <span className="text-sm text-muted">{item.category?.name}</span>
                </div>
                <Link to={`/items/${item.id}`} className="mt-1 block truncate font-display text-lg font-semibold hover:text-harbor-700">
                  {item.title}
                </Link>
                <p className="text-sm text-muted">
                  {item.location} · {formatDate(item.reportedAt)}
                </p>
              </div>
              <div className="flex gap-2">
                <Link to={`/items/${item.id}`} className="btn-secondary">View</Link>
                <button
                  type="button"
                  className="btn-outline-danger"
                  onClick={() => {
                    setDeleteError('');
                    setPending(item);
                  }}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(pending)}
        title="Delete this report?"
        confirmLabel="Delete report"
        busy={busy}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={() => setPending(null)}
      >
        “{pending?.title}” and any claims made on it will be permanently removed. This cannot be undone.
      </ConfirmDialog>
    </div>
  );
}
