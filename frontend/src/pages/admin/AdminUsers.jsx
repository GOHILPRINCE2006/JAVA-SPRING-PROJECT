import { usersApi } from '../../api/users';
import { useAsync } from '../../hooks/useAsync';
import PageHeader from '../../components/PageHeader';
import { EmptyState, ErrorState, ListSkeleton } from '../../components/Feedback';

export default function AdminUsers() {
  const { data, error, loading, reload } = useAsync((signal) => usersApi.list(signal), []);

  return (
    <>
      <PageHeader title="Users">
        Everyone with an account. This list is read-only: deleting a user would also delete their reports and claims, and roles are
        never changed through the website.
      </PageHeader>
      {loading && <ListSkeleton />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && data.length === 0 && <EmptyState title="No users" />}
      {data && data.length > 0 && (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <caption className="sr-only">Registered users</caption>
            <thead className="border-b border-line bg-paper">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Name</th>
                <th scope="col" className="px-4 py-3 font-semibold">Email</th>
                <th scope="col" className="px-4 py-3 font-semibold">Role</th>
              </tr>
            </thead>
            <tbody>
              {data.map((user) => (
                <tr key={user.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-semibold">{user.name}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${user.role === 'ADMIN' ? 'bg-claimed-bg text-claimed-fg' : 'bg-resolved-bg text-resolved-fg'}`}>
                      {user.role === 'ADMIN' ? 'Administrator' : 'Member'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
