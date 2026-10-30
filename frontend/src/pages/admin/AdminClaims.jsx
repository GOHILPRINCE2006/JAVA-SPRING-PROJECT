import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, CircleCheckBig, X } from 'lucide-react';
import { claimsApi } from '../../api/claims';
import { useAsync } from '../../hooks/useAsync';
import PageHeader from '../../components/PageHeader';
import ConfirmDialog from '../../components/ConfirmDialog';
import { EmptyState, ErrorState, ListSkeleton } from '../../components/Feedback';
import { ClaimStatusBadge, ItemStatusBadge } from '../../components/StatusBadge';
import { useToast } from '../../components/toastContext';
import { CLAIM_STATUS_LABELS } from '../../utils/constants';
import { formatDateTime, sortNewest } from '../../utils/format';

const FILTERS = ['PENDING', 'APPROVED', 'REJECTED', 'RESOLVED', 'ALL'];

const ACTIONS = {
  APPROVED: {
    title: 'Approve this claim?',
    label: 'Approve claim',
    tone: 'primary',
    text: 'The item will be marked as claimed and every other pending claim on it will be rejected.',
    done: 'Claim approved.',
  },
  REJECTED: {
    title: 'Reject this claim?',
    label: 'Reject claim',
    tone: 'danger',
    text: 'The claimant will see that their claim was not approved.',
    done: 'Claim rejected.',
  },
  RESOLVED: {
    title: 'Mark as handed over?',
    label: 'Mark as completed',
    tone: 'primary',
    text: 'Use this once the item has been returned. The item will be marked as returned.',
    done: 'Claim completed.',
  },
};

export default function AdminClaims() {
  const { notify } = useToast();
  const { data, error, loading, reload } = useAsync((signal) => claimsApi.listAll(signal), []);
  const [filter, setFilter] = useState('PENDING');
  const [pending, setPending] = useState(null); // { claim, status }
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const claims = useMemo(() => {
    const sorted = data ? sortNewest(data, 'claimedAt') : [];
    return filter === 'ALL' ? sorted : sorted.filter((claim) => claim.status === filter);
  }, [data, filter]);

  async function confirm() {
    setBusy(true);
    setActionError('');
    try {
      await claimsApi.setStatus(pending.claim.id, pending.status);
      notify(ACTIONS[pending.status].done);
      setPending(null);
      reload();
    } catch (err) {
      setActionError(err.message);
      if (err.status === 409) reload(); // someone else already changed it
    } finally {
      setBusy(false);
    }
  }

  const action = pending ? ACTIONS[pending.status] : null;

  return (
    <>
      <PageHeader title="Review claims">Approve the claim that proves ownership, reject the rest.</PageHeader>

      <div role="group" aria-label="Filter by status" className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((value) => {
          const count = data ? (value === 'ALL' ? data.length : data.filter((claim) => claim.status === value).length) : null;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
              className={`min-h-10 rounded-lg border px-3.5 text-sm font-semibold ${
                filter === value ? 'border-harbor-600 bg-harbor-600 text-white' : 'border-line bg-surface hover:border-harbor-600'
              }`}
            >
              {value === 'ALL' ? 'All' : CLAIM_STATUS_LABELS[value]}
              {count !== null && ` (${count})`}
            </button>
          );
        })}
      </div>

      {loading && <ListSkeleton />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && claims.length === 0 && (
        <EmptyState title={filter === 'PENDING' ? 'No claims are waiting for review' : 'No claims in this view'}>
          {filter === 'PENDING' ? 'New claims will appear here as people submit them.' : 'Try another status filter.'}
        </EmptyState>
      )}
      {data && claims.length > 0 && (
        <ul className="grid gap-3">
          {claims.map((claim) => (
            <li key={claim.id} className="panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <ClaimStatusBadge status={claim.status} />
                    {claim.item && <ItemStatusBadge status={claim.item.status} />}
                  </div>
                  <Link to={`/items/${claim.item?.id}`} className="mt-2 block font-display text-lg font-semibold hover:text-harbor-700">
                    {claim.item?.title}
                  </Link>
                  <p className="text-sm text-muted">
                    Claimed by {claim.claimedBy?.name}
                    {claim.claimantEmail && <> ({claim.claimantEmail})</>} · {formatDateTime(claim.claimedAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {claim.status === 'PENDING' && (
                    <>
                      <button type="button" className="btn-primary" onClick={() => { setActionError(''); setPending({ claim, status: 'APPROVED' }); }}>
                        <Check className="h-4 w-4" aria-hidden="true" /> Approve
                      </button>
                      <button type="button" className="btn-outline-danger" onClick={() => { setActionError(''); setPending({ claim, status: 'REJECTED' }); }}>
                        <X className="h-4 w-4" aria-hidden="true" /> Reject
                      </button>
                    </>
                  )}
                  {claim.status === 'APPROVED' && (
                    <button type="button" className="btn-secondary" onClick={() => { setActionError(''); setPending({ claim, status: 'RESOLVED' }); }}>
                      <CircleCheckBig className="h-4 w-4" aria-hidden="true" /> Mark as handed over
                    </button>
                  )}
                </div>
              </div>
              {claim.message && <p className="mt-3 whitespace-pre-line rounded-lg bg-paper p-3 text-sm">{claim.message}</p>}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(pending)}
        title={action?.title ?? ''}
        confirmLabel={action?.label}
        tone={action?.tone}
        busy={busy}
        error={actionError}
        onConfirm={confirm}
        onCancel={() => setPending(null)}
      >
        <strong className="text-ink">{pending?.claim.item?.title}</strong> — claim by {pending?.claim.claimedBy?.name}. {action?.text}
      </ConfirmDialog>
    </>
  );
}
