import { useState } from 'react';
import { usersApi } from '../api/users';
import { useAuth } from '../auth/useAuth';
import PageHeader from '../components/PageHeader';
import { Alert, Spinner } from '../components/Feedback';
import { FormField, PasswordField } from '../components/FormField';
import { useToast } from '../components/toastContext';
import { hasErrors, validateProfile } from '../utils/validation';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { notify } = useToast();
  const [form, setForm] = useState({ name: user.name, currentPassword: '', newPassword: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function set(field) {
    return (event) => setForm((previous) => ({ ...previous, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    const found = validateProfile(form);
    setErrors(found);
    setServerError('');
    if (hasErrors(found)) return;

    setSubmitting(true);
    try {
      const updated = await usersApi.update(user.id, {
        name: form.name.trim(),
        ...(form.newPassword ? { currentPassword: form.currentPassword, newPassword: form.newPassword } : {}),
      });
      updateUser(updated);
      setForm({ name: updated.name, currentPassword: '', newPassword: '' });
      notify('Your profile was updated.');
    } catch (error) {
      if (error.status === 400 && /password/i.test(error.message)) {
        setErrors({ currentPassword: error.message });
      } else {
        setServerError(error.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container-page max-w-2xl py-10">
      <PageHeader title="Your profile">Update your name or change your password.</PageHeader>

      <dl className="panel mb-6 grid gap-4 p-6 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-muted">Email</dt>
          <dd className="font-semibold">{user.email}</dd>
          <dd className="mt-1 text-sm text-muted">Your email is your sign-in name and cannot be changed.</dd>
        </div>
        <div>
          <dt className="text-sm text-muted">Account type</dt>
          <dd className="font-semibold">{user.role === 'ADMIN' ? 'Administrator' : 'Member'}</dd>
        </div>
      </dl>

      <form onSubmit={handleSubmit} noValidate className="panel grid gap-5 p-6">
        <FormField label="Name" autoComplete="name" value={form.name} onChange={set('name')} error={errors.name} />
        <fieldset className="grid gap-4 border-t border-line pt-5">
          <legend className="text-sm font-semibold">Change password (optional)</legend>
          <PasswordField
            label="Current password"
            autoComplete="current-password"
            value={form.currentPassword}
            onChange={set('currentPassword')}
            error={errors.currentPassword}
          />
          <PasswordField
            label="New password"
            autoComplete="new-password"
            hint="At least 8 characters."
            value={form.newPassword}
            onChange={set('newPassword')}
            error={errors.newPassword}
          />
        </fieldset>
        {serverError && <Alert tone="error">{serverError}</Alert>}
        <div>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting && <Spinner className="h-4 w-4" />}
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}
