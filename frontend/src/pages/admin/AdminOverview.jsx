import { Link } from 'react-router-dom';
import { claimsApi } from '../../api/claims';
import { itemsApi } from '../../api/items';
import { categoriesApi } from '../../api/categories';
import { usersApi } from '../../api/users';
import { useAsync } from '../../hooks/useAsync';
import PageHeader from '../../components/PageHeader';
import { ErrorState, ListSkeleton } from '../../components/Feedback';

function Card({ label, value, to, hint }) {
  return (
    <Link to={to} className="panel block p-5 hover:border-harbor-600">
      <p className="font-display text-4xl font-bold text-harbor-700">{value}</p>
      <p className="mt-1 font-semibold">{label}</p>
      {hint && <p className="text-sm text-muted">{hint}</p>}
    </Link>
  );
}

export default function AdminOverview() {
  const { data, error, loading, reload } = useAsync(
    async (signal) => {
      const [items, claims, users, categories] = await Promise.all([
        itemsApi.list(signal),
        claimsApi.listAll(signal),
        usersApi.list(signal),
        categoriesApi.list(signal),
      ]);
      return { items, claims, users, categories };
    },
    [],
  );

  return (
    <>
      <PageHeader title="Administration">A live summary of everything in the system.</PageHeader>
      {loading && <ListSkeleton rows={2} />}
      {error && <ErrorState error={error} onRetry={reload} title="Could not load the summary" />}
      {data && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card
            label="Claims awaiting review"
            value={data.claims.filter((claim) => claim.status === 'PENDING').length}
            hint={`${data.claims.length} claims in total`}
            to="/admin/claims"
          />
          <Card
            label="Open items"
            value={data.items.filter((item) => item.status === 'LOST' || item.status === 'FOUND').length}
            hint={`${data.items.length} items in total`}
            to="/admin/items"
          />
          <Card label="Categories" value={data.categories.length} to="/admin/categories" />
          <Card label="Registered users" value={data.users.length} to="/admin/users" />
        </div>
      )}
    </>
  );
}
