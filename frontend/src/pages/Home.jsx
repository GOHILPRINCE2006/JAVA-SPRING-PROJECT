import { Link } from 'react-router-dom';
import { ArrowRight, MapPin } from 'lucide-react';
import { itemsApi } from '../api/items';
import { useAsync } from '../hooks/useAsync';
import { useAuth } from '../auth/useAuth';
import ItemCard from '../components/ItemCard';
import { ItemStatusBadge } from '../components/StatusBadge';
import { EmptyState, ErrorState, ListSkeleton } from '../components/Feedback';
import { sortNewest } from '../utils/format';

const STEPS = [
  { title: 'Report', text: 'Describe what you lost or found, and where. It takes a minute.' },
  { title: 'Match', text: 'Browse the list. Anyone signed in can claim an item that looks like theirs.' },
  { title: 'Return', text: 'An administrator reviews each claim and approves the right one.' },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { data, error, loading, reload } = useAsync((signal) => itemsApi.list(signal), []);

  const items = data ? sortNewest(data, 'reportedAt') : [];
  const latest = items.slice(0, 6);
  const open = items.filter((item) => item.status === 'LOST' || item.status === 'FOUND').length;
  const reunited = items.filter((item) => item.status === 'CLAIMED' || item.status === 'RESOLVED').length;

  return (
    <>
      <section className="border-b border-line bg-harbor-50">
        <div className="container-page grid gap-10 py-12 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:py-16">
          <div>
            <h1 className="text-4xl font-bold sm:text-5xl lg:text-6xl">Lost something? Found something? Start here.</h1>
            <p className="mt-5 max-w-xl text-lg text-muted">
              Report what you have lost or found, browse what others have handed in, and claim what belongs to you.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/items" className="btn-primary">
                Browse items
              </Link>
              <Link to={isAuthenticated ? '/report-item' : '/register'} className="btn-secondary">
                Report an item
              </Link>
            </div>
            {data && (
              <p className="mt-6 text-sm text-muted">
                {open} {open === 1 ? 'item is' : 'items are'} waiting to be matched, and {reunited}{' '}
                {reunited === 1 ? 'has' : 'have'} found an owner.
              </p>
            )}
          </div>

          <div aria-labelledby="latest-heading">
            <h2 id="latest-heading" className="mb-3 text-lg font-semibold">
              Latest reports
            </h2>
            {loading && <ListSkeleton rows={3} />}
            {error && <ErrorState error={error} onRetry={reload} title="Could not load the latest reports" />}
            {data && latest.length === 0 && (
              <p className="panel p-5 text-muted">Nothing has been reported yet. Be the first to add an item.</p>
            )}
            {data && latest.length > 0 && (
              <ul className="grid gap-2">
                {latest.slice(0, 4).map((item) => (
                  <li key={item.id}>
                    <Link
                      to={`/items/${item.id}`}
                      className="panel flex items-center justify-between gap-3 px-4 py-3 hover:border-harbor-600"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{item.title}</span>
                        <span className="flex items-center gap-1 text-sm text-muted">
                          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                          {item.location}
                        </span>
                      </span>
                      <ItemStatusBadge status={item.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <h2 className="text-2xl font-bold sm:text-3xl">How it works</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="panel p-5">
              <span className="font-display text-3xl font-bold text-harbor-600">{index + 1}</span>
              <h3 className="mt-2 text-xl font-semibold">{step.title}</h3>
              <p className="mt-1 text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="container-page pb-16">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold sm:text-3xl">Recently reported</h2>
          <Link to="/items" className="btn-ghost">
            See all items
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        {loading && <ListSkeleton rows={3} />}
        {error && <ErrorState error={error} onRetry={reload} />}
        {data && latest.length === 0 && (
          <EmptyState title="No items yet" action={<Link to={isAuthenticated ? '/report-item' : '/register'} className="btn-primary">Report the first item</Link>}>
            When someone reports a lost or found item, it will appear here.
          </EmptyState>
        )}
        {data && latest.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {latest.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
