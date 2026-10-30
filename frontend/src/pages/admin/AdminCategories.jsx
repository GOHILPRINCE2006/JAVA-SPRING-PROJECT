import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { categoriesApi } from '../../api/categories';
import { itemsApi } from '../../api/items';
import { useAsync } from '../../hooks/useAsync';
import PageHeader from '../../components/PageHeader';
import ConfirmDialog from '../../components/ConfirmDialog';
import { Alert, EmptyState, ErrorState, ListSkeleton, Spinner } from '../../components/Feedback';
import { FormField } from '../../components/FormField';
import { useToast } from '../../components/toastContext';
import { hasErrors, validateCategory } from '../../utils/validation';
import { pluralize } from '../../utils/format';

export default function AdminCategories() {
  const { notify } = useToast();
  const { data, error, loading, reload } = useAsync(async (signal) => {
    const [categories, items] = await Promise.all([categoriesApi.list(signal), itemsApi.list(signal)]);
    const counts = new Map();
    items.forEach((item) => counts.set(item.category?.id, (counts.get(item.category?.id) ?? 0) + 1));
    return categories.map((category) => ({ ...category, itemCount: counts.get(category.id) ?? 0 }));
  }, []);

  const [form, setForm] = useState({ name: '', description: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  function set(field) {
    return (event) => setForm((previous) => ({ ...previous, [field]: event.target.value }));
  }

  async function handleCreate(event) {
    event.preventDefault();
    if (creating) return;
    const found = validateCategory(form);
    setErrors(found);
    setFormError('');
    if (hasErrors(found)) return;

    setCreating(true);
    try {
      await categoriesApi.create({ name: form.name.trim(), description: form.description.trim() });
      notify(`Category "${form.name.trim()}" was added.`);
      setForm({ name: '', description: '' });
      reload();
    } catch (err) {
      if (err.status === 409) setErrors({ name: err.message });
      else setFormError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function confirmDelete() {
    setBusy(true);
    setDeleteError('');
    try {
      await categoriesApi.remove(pending.id);
      notify(`Category "${pending.name}" was deleted.`);
      setPending(null);
      reload();
    } catch (err) {
      setDeleteError(err.message); // e.g. 409: the category is still used by items
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Categories">Categories organise items. A category that still has items cannot be deleted.</PageHeader>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        <form onSubmit={handleCreate} noValidate className="panel grid h-fit gap-4 p-5">
          <h2 className="text-xl font-semibold">Add a category</h2>
          <FormField label="Name" value={form.name} onChange={set('name')} error={errors.name} maxLength={255} />
          <FormField label="Description (optional)" value={form.description} onChange={set('description')} error={errors.description} maxLength={255} />
          {formError && <Alert tone="error">{formError}</Alert>}
          <div>
            <button type="submit" className="btn-primary" disabled={creating}>
              {creating && <Spinner className="h-4 w-4" />}
              Add category
            </button>
          </div>
        </form>

        <section aria-labelledby="existing-heading">
          <h2 id="existing-heading" className="mb-3 text-xl font-semibold">Existing categories</h2>
          {loading && <ListSkeleton rows={3} />}
          {error && <ErrorState error={error} onRetry={reload} />}
          {data && data.length === 0 && <EmptyState title="No categories yet">Add the first one so people can report items.</EmptyState>}
          {data && data.length > 0 && (
            <ul className="grid gap-2">
              {data.map((category) => (
                <li key={category.id} className="panel flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{category.name}</p>
                    <p className="text-sm text-muted">
                      {category.description ? `${category.description} · ` : ''}
                      {pluralize(category.itemCount, 'item')}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-outline-danger"
                    onClick={() => { setDeleteError(''); setPending(category); }}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">Delete category </span>
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(pending)}
        title="Delete this category?"
        confirmLabel="Delete category"
        busy={busy}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={() => setPending(null)}
      >
        “{pending?.name}” will be removed. The server refuses this if any item still uses the category.
      </ConfirmDialog>
    </>
  );
}
