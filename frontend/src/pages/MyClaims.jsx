import { useState } from 'react';
import { Link } from 'react-router-dom';
import { claimsApi } from '../api/claims';
import { useAsync } from '../hooks/useAsync';
import PageHeader from '../components/PageHeader';
import ConfirmDialog from '../components/ConfirmDialog';
import { EmptyState, ErrorState, ListSkeleton } from '../components/Feedback';
import { ClaimStatusBadge, ItemStatusBadge } from '../components/StatusBadge';
import { useToast } from '../components/toastContext';
import { formatDateTime, sortNewest } from '../utils/format';

const HINTS = {
  PENDING: 'Waiting for an administrator to review your claim.',
  APPROVED: 'Approved. The item is marked as claimed.',
  REJECTED: 'This claim was not approved.',
  RESOLVED: 'Completed. The item has been handed over.',
};

export default function MyClaims() {
  const { notify } = useToast();
  const { data, error, loading, reload } = useAsync((signal) => claimsApi.mine(signal), []);
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');

  async function confirmWithdraw() {
    setBusy(true);
    setWithdrawError('');
    try {
      await claimsApi.remove(pending.id);
      notify('Your claim was withdrawn.');
      setPending(null);
      reload();
    } catch (err) {
      setWithdrawError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const claims = data ? sortNewest(data, 'claimedAt') : [];

  return (
    <div className="container-page py-10">
      <PageHeader title="My claims" actions={<Link to="/items" className="btn-secondary">Browse items</Link>}>
        Claims you have submitted and what happened to them.
      </PageHeader>

      {loading && <ListSkeleton />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && claims.length === 0 && (
        <EmptyState title="You have not made any claims" action={<Link to="/items" className="btn-primary">Browse items</Link>}>
          When you spot something that belongs to you, open it and submit a claim.
        </EmptyState>
      )}
      {data && claims.length > 0 && (
        <ul className="grid gap-3">
          {claims.map((claim) => (
            <li key={claim.id} className="panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <ClaimStatusBadge status={claim.status} />
                    {claim.item && <ItemStatusBadge status={claim.item.status} />}
                  </div>
                  <Link to={`/items/${claim.item?.id}`} className="mt-2 block font-display text-lg font-semibold hover:text-harbor-700">
                    {claim.item?.title}
                  </Link>
                  <p className="text-sm text-muted">Submitted {formatDateTime(claim.claimedAt)}</p>
                </div>
                {claim.status === 'PENDING' && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setWithdrawError('');
                      setPending(claim);
                    }}
                  >
                    Withdraw claim
                  </button>
                )}
              </div>
              {claim.message && <p className="mt-3 whitespace-pre-line rounded-lg bg-paper p-3 text-sm">{claim.message}</p>}
              <p className="mt-3 text-sm text-muted">{HINTS[claim.status]}</p>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(pending)}
        title="Withdraw this claim?"
        confirmLabel="Withdraw claim"
        busy={busy}
        error={withdrawError}
        onConfirm={confirmWithdraw}
        onCancel={() => setPending(null)}
      >
        Your claim on “{pending?.item?.title}” will be removed. You can submit a new one later if the item is still available.
      </ConfirmDialog>
    </div>
  );
}
