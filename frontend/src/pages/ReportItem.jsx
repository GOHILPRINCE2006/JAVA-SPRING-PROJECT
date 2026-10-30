import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { categoriesApi } from '../api/categories';
import { itemsApi } from '../api/items';
import { useAsync } from '../hooks/useAsync';
import PageHeader from '../components/PageHeader';
import { Alert, ErrorState, PageSpinner, Spinner } from '../components/Feedback';
import { FormField } from '../components/FormField';
import { useToast } from '../components/toastContext';
import { REPORTABLE_STATUSES, ITEM_STATUS_LABELS } from '../utils/constants';
import { hasErrors, validateItem } from '../utils/validation';

export default function ReportItem() {
  const navigate = useNavigate();
  const { notify } = useToast();
  const categories = useAsync((signal) => categoriesApi.list(signal), []);
  const [form, setForm] = useState({ title: '', description: '', location: '', status: 'LOST', categoryId: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function set(field) {
    return (event) => setForm((previous) => ({ ...previous, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    const found = validateItem(form);
    setErrors(found);
    setServerError('');
    if (hasErrors(found)) return;

    setSubmitting(true);
    try {
      const item = await itemsApi.report(
        {
          title: form.title.trim(),
          description: form.description.trim(),
          location: form.location.trim(),
          status: form.status,
        },
        form.categoryId,
      );
      notify('Your item was reported.');
      navigate(`/items/${item.id}`, { replace: true });
    } catch (error) {
      setServerError(error.message);
      setSubmitting(false);
    }
  }

  const noCategories = categories.data && categories.data.length === 0;

  return (
    <div className="container-page max-w-3xl py-10">
      <PageHeader title="Report an item">
        Give enough detail for the owner to recognise it, without revealing something only they would know.
      </PageHeader>

      {categories.loading && <PageSpinner label="Loading categories…" />}
      {categories.error && <ErrorState error={categories.error} onRetry={categories.reload} title="Could not load categories" />}
      {noCategories && (
        <Alert tone="error">
          There are no categories yet, so items cannot be reported. Ask an administrator to add at least one category.
        </Alert>
      )}

      {categories.data && !noCategories && (
        <form onSubmit={handleSubmit} noValidate className="panel grid gap-5 p-6 sm:p-8">
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">What happened?</legend>
            <div className="grid grid-cols-2 gap-3">
              {REPORTABLE_STATUSES.map((value) => (
                <label
                  key={value}
                  className={`flex min-h-12 cursor-pointer items-center justify-center rounded-lg border-2 px-4 py-2 font-semibold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-harbor-600 ${
                    form.status === value ? 'border-harbor-600 bg-harbor-50 text-harbor-800' : 'border-line bg-surface'
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={value}
                    checked={form.status === value}
                    onChange={set('status')}
                    className="sr-only"
                  />
                  {value === 'LOST' ? 'I lost something' : 'I found something'}
                </label>
              ))}
            </div>
            {errors.status && <p className="mt-1 text-sm font-medium text-danger">{errors.status}</p>}
            <p className="mt-2 text-sm text-muted">It will be listed as {ITEM_STATUS_LABELS[form.status]}.</p>
          </fieldset>

          <FormField label="Title" value={form.title} onChange={set('title')} error={errors.title} maxLength={255} placeholder="e.g. Black umbrella with wooden handle" />
          <FormField as="select" label="Category" value={form.categoryId} onChange={set('categoryId')} error={errors.categoryId}>
            <option value="">Choose a category</option>
            {categories.data.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </FormField>
          <FormField label="Location" value={form.location} onChange={set('location')} error={errors.location} maxLength={255} placeholder="Where was it lost or found?" />
          <FormField
            as="textarea"
            label="Description (optional)"
            rows={5}
            maxLength={1000}
            value={form.description}
            onChange={set('description')}
            error={errors.description}
            hint={`${form.description.length}/1000`}
          />

          {serverError && <Alert tone="error">{serverError}</Alert>}
          <div>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting && <Spinner className="h-4 w-4" />}
              Report item
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
