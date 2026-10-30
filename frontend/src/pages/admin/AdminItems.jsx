import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { itemsApi } from '../../api/items';
import { useAsync } from '../../hooks/useAsync';
import PageHeader from '../../components/PageHeader';
import ConfirmDialog from '../../components/ConfirmDialog';
import { EmptyState, ErrorState, ListSkeleton } from '../../components/Feedback';
import { ItemStatusBadge } from '../../components/StatusBadge';
import { useToast } from '../../components/toastContext';
import { formatDate, sortNewest } from '../../utils/format';

export default function AdminItems() {
  const { notify } = useToast();
  const { data, error, loading, reload } = useAsync((signal) => itemsApi.list(signal), []);
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  async function confirmDelete() {
    setBusy(true);
    setDeleteError('');
    try {
      await itemsApi.remove(pending.id);
      notify(`"${pending.title}" was deleted.`);
      setPending(null);
      reload();
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const items = data ? sortNewest(data, 'reportedAt') : [];

  return (
    <>
      <PageHeader title="All items">Every reported item. Remove spam or duplicates here.</PageHeader>
      {loading && <ListSkeleton />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && items.length === 0 && <EmptyState title="No items have been reported yet" />}
      {data && items.length > 0 && (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <caption className="sr-only">All reported items</caption>
            <thead className="border-b border-line bg-paper">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Item</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                <th scope="col" className="px-4 py-3 font-semibold">Category</th>
                <th scope="col" className="px-4 py-3 font-semibold">Reported by</th>
                <th scope="col" className="px-4 py-3 font-semibold">Date</th>
                <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <Link to={`/items/${item.id}`} className="font-semibold hover:text-harbor-700">{item.title}</Link>
                    <div className="text-muted">{item.location}</div>
                  </td>
                  <td className="px-4 py-3"><ItemStatusBadge status={item.status} /></td>
                  <td className="px-4 py-3">{item.category?.name}</td>
                  <td className="px-4 py-3">{item.reportedBy?.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(item.reportedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="btn-outline-danger"
                      onClick={() => { setDeleteError(''); setPending(item); }}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pending)}
        title="Delete this item?"
        confirmLabel="Delete item"
        busy={busy}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={() => setPending(null)}
      >
        “{pending?.title}” and all claims made on it will be permanently removed. This cannot be undone.
      </ConfirmDialog>
    </>
  );
}
