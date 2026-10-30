import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { itemsApi } from '../api/items';
import { categoriesApi } from '../api/categories';
import { useAsync } from '../hooks/useAsync';
import { useAuth } from '../auth/useAuth';
import ItemCard from '../components/ItemCard';
import PageHeader from '../components/PageHeader';
import { EmptyState, ErrorState, ListSkeleton } from '../components/Feedback';
import { FormField } from '../components/FormField';
import { ITEM_STATUS_LABELS } from '../utils/constants';
import { pluralize, sortNewest } from '../utils/format';

const STATUS_FILTERS = ['ALL', 'LOST', 'FOUND', 'CLAIMED', 'RESOLVED'];

export default function Items() {
  const { isAuthenticated } = useAuth();
  const [params, setParams] = useSearchParams();
  const status = STATUS_FILTERS.includes(params.get('status')) ? params.get('status') : 'ALL';
  const categoryId = params.get('category') ?? '';
  const query = params.get('q') ?? '';

  const items = useAsync((signal) => itemsApi.list(signal), []);
  const categories = useAsync((signal) => categoriesApi.list(signal), []);

  function update(key, value) {
    const next = new URLSearchParams(params);
    if (value && value !== 'ALL') next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  const filtered = useMemo(() => {
    if (!items.data) return [];
    const needle = query.trim().toLowerCase();
    return sortNewest(items.data, 'reportedAt').filter((item) => {
      if (status !== 'ALL' && item.status !== status) return false;
      if (categoryId && String(item.category?.id) !== categoryId) return false;
      if (!needle) return true;
      return [item.title, item.description, item.location].some((field) => field?.toLowerCase().includes(needle));
    });
  }, [items.data, status, categoryId, query]);

  const hasFilters = status !== 'ALL' || categoryId || query;

  return (
    <div className="container-page py-10">
      <PageHeader
        title="Browse items"
        actions={
          <Link to={isAuthenticated ? '/report-item' : '/register'} className="btn-primary">
            Report an item
          </Link>
        }
      >
        Everything that has been reported lost or found. Filters apply to the items loaded below.
      </PageHeader>

      <form role="search" onSubmit={(event) => event.preventDefault()} className="panel mb-6 grid gap-4 p-4 md:grid-cols-[1fr_14rem]">
        <div>
          <label htmlFor="search" className="mb-1.5 block text-sm font-semibold">
            Search title, description or location
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              id="search"
              type="search"
              value={query}
              onChange={(event) => update('q', event.target.value)}
              placeholder="e.g. blue backpack, library"
              className="field pl-10"
            />
          </div>
        </div>
        <FormField as="select" label="Category" value={categoryId} onChange={(event) => update('category', event.target.value)}>
          <option value="">All categories</option>
          {(categories.data ?? []).map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </FormField>
        <fieldset className="md:col-span-2">
          <legend className="mb-1.5 text-sm font-semibold">Status</legend>
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={status === value}
                onClick={() => update('status', value)}
                className={`min-h-10 rounded-lg border px-3.5 text-sm font-semibold ${
                  status === value
                    ? 'border-harbor-600 bg-harbor-600 text-white'
                    : 'border-line bg-surface hover:border-harbor-600'
                }`}
              >
                {value === 'ALL' ? 'All' : ITEM_STATUS_LABELS[value]}
              </button>
            ))}
          </div>
        </fieldset>
      </form>

      {categories.error && (
        <p role="alert" className="mb-4 text-sm text-danger">
          Categories could not be loaded, so the category filter is unavailable.
        </p>
      )}

      {items.loading && <ListSkeleton rows={4} />}
      {items.error && <ErrorState error={items.error} onRetry={items.reload} title="Could not load items" />}

      {items.data && (
        <>
          <p className="mb-4 text-sm text-muted" aria-live="polite">
            Showing {filtered.length} of {pluralize(items.data.length, 'item')}
          </p>
          {filtered.length === 0 ? (
            <EmptyState
              title={hasFilters ? 'No items match your filters' : 'No items have been reported yet'}
              action={
                hasFilters ? (
                  <button type="button" className="btn-secondary" onClick={() => setParams({}, { replace: true })}>
                    Clear filters
                  </button>
                ) : (
                  <Link to={isAuthenticated ? '/report-item' : '/register'} className="btn-primary">
                    Report an item
                  </Link>
                )
              }
            >
              {hasFilters ? 'Try a different search, category or status.' : 'When someone reports a lost or found item, it will show up here.'}
            </EmptyState>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
