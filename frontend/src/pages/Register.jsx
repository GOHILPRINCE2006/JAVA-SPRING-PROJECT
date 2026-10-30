import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import { Alert, Spinner } from '../components/Feedback';
import { FormField, PasswordField } from '../components/FormField';
import { hasErrors, validateRegister } from '../utils/validation';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function set(field) {
    return (event) => setForm((previous) => ({ ...previous, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    const found = validateRegister(form);
    setErrors(found);
    setServerError('');
    if (hasErrors(found)) return;

    setSubmitting(true);
    try {
      // Only name, email and password are sent. The server always creates a regular USER account.
      await authApi.register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      navigate('/login', { replace: true, state: { registered: true } });
    } catch (error) {
      if (error.status === 409) setErrors({ email: error.message });
      else setServerError(error.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="container-page flex justify-center py-12">
      <div className="panel w-full max-w-md p-6 sm:p-8">
        <h1 className="text-3xl font-bold">Create your account</h1>
        <p className="mt-1 text-muted">You need an account to report items and submit claims.</p>

        <form onSubmit={handleSubmit} noValidate className="mt-6 grid gap-4">
          <FormField label="Full name" autoComplete="name" value={form.name} onChange={set('name')} error={errors.name} />
          <FormField
            label="Email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={form.email}
            onChange={set('email')}
            error={errors.email}
          />
          <PasswordField
            label="Password"
            autoComplete="new-password"
            hint="At least 8 characters."
            value={form.password}
            onChange={set('password')}
            error={errors.password}
          />
          <PasswordField
            label="Confirm password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={set('confirmPassword')}
            error={errors.confirmPassword}
          />
          {serverError && <Alert tone="error">{serverError}</Alert>}
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting && <Spinner className="h-4 w-4" />}
            Create account
          </button>
        </form>

        <p className="mt-6 text-sm text-muted">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-harbor-700 underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
