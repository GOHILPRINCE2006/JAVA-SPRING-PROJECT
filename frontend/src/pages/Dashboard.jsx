import { Link } from 'react-router-dom';
import { ArrowRight, ClipboardList, PackagePlus, ShieldCheck } from 'lucide-react';
import { itemsApi } from '../api/items';
import { claimsApi } from '../api/claims';
import { useAsync } from '../hooks/useAsync';
import { useAuth } from '../auth/useAuth';
import PageHeader from '../components/PageHeader';
import { ClaimStatusBadge, ItemStatusBadge } from '../components/StatusBadge';
import { EmptyState, ErrorState, ListSkeleton } from '../components/Feedback';
import { formatDate, sortNewest } from '../utils/format';

function Stat({ label, value }) {
  return (
    <div className="panel p-4">
      <dd className="font-display text-3xl font-bold text-harbor-700">{value}</dd>
      <dt className="text-sm text-muted">{label}</dt>
    </div>
  );
}

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const items = useAsync((signal) => itemsApi.mine(signal), []);
  const claims = useAsync((signal) => claimsApi.mine(signal), []);

  const myItems = items.data ? sortNewest(items.data, 'reportedAt') : [];
  const myClaims = claims.data ? sortNewest(claims.data, 'claimedAt') : [];
  const count = (list, status, field = 'status') => list.filter((entry) => entry[field] === status).length;

  return (
    <div className="container-page py-10">
      <PageHeader
        title={`Hello, ${user.name}`}
        actions={
          <>
            <Link to="/report-item" className="btn-primary">
              <PackagePlus className="h-4 w-4" aria-hidden="true" />
              Report an item
            </Link>
            {isAdmin && (
              <Link to="/admin" className="btn-secondary">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Admin area
              </Link>
            )}
          </>
        }
      >
        Here is what is happening with your reports and claims.
      </PageHeader>

      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="reports-heading">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="reports-heading" className="text-xl font-semibold">My reports</h2>
            <Link to="/my-items" className="btn-ghost">
              View all <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          {items.loading && <ListSkeleton rows={2} />}
          {items.error && <ErrorState error={items.error} onRetry={items.reload} />}
          {items.data && (
            <>
              <dl className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Total" value={myItems.length} />
                <Stat label="Lost" value={count(myItems, 'LOST')} />
                <Stat label="Found" value={count(myItems, 'FOUND')} />
                <Stat label="Claimed or returned" value={count(myItems, 'CLAIMED') + count(myItems, 'RESOLVED')} />
              </dl>
              {myItems.length === 0 ? (
                <EmptyState icon={ClipboardList} title="You have not reported anything yet" action={<Link to="/report-item" className="btn-primary">Report an item</Link>}>
                  Lost or found something? Add it so the right person can find it.
                </EmptyState>
              ) : (
                <ul className="grid gap-2">
                  {myItems.slice(0, 4).map((item) => (
                    <li key={item.id}>
                      <Link to={`/items/${item.id}`} className="panel flex items-center justify-between gap-3 px-4 py-3 hover:border-harbor-600">
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">{item.title}</span>
                          <span className="text-sm text-muted">{formatDate(item.reportedAt)}</span>
                        </span>
                        <ItemStatusBadge status={item.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>

        <section aria-labelledby="claims-heading">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="claims-heading" className="text-xl font-semibold">My claims</h2>
            <Link to="/my-claims" className="btn-ghost">
              View all <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          {claims.loading && <ListSkeleton rows={2} />}
          {claims.error && <ErrorState error={claims.error} onRetry={claims.reload} />}
          {claims.data && (
            <>
              <dl className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Total" value={myClaims.length} />
                <Stat label="Pending" value={count(myClaims, 'PENDING')} />
                <Stat label="Approved" value={count(myClaims, 'APPROVED') + count(myClaims, 'RESOLVED')} />
                <Stat label="Rejected" value={count(myClaims, 'REJECTED')} />
              </dl>
              {myClaims.length === 0 ? (
                <EmptyState icon={ClipboardList} title="You have not made any claims" action={<Link to="/items" className="btn-secondary">Browse items</Link>}>
                  If you spot something that belongs to you, open it and submit a claim.
                </EmptyState>
              ) : (
                <ul className="grid gap-2">
                  {myClaims.slice(0, 4).map((claim) => (
                    <li key={claim.id}>
                      <Link to={`/items/${claim.item?.id}`} className="panel flex items-center justify-between gap-3 px-4 py-3 hover:border-harbor-600">
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">{claim.item?.title}</span>
                          <span className="text-sm text-muted">{formatDate(claim.claimedAt)}</span>
                        </span>
                        <ClaimStatusBadge status={claim.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
