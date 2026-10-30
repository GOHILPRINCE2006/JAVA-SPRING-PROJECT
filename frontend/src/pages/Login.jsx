import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { Alert, Spinner } from '../components/Feedback';
import { FormField, PasswordField } from '../components/FormField';
import { hasErrors, validateLogin } from '../utils/validation';
import { safeRedirectPath } from '../utils/format';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const notice = location.state?.registered ? 'Your account is ready. Sign in to continue.' : '';

  function set(field) {
    return (event) => setForm((previous) => ({ ...previous, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    const found = validateLogin(form);
    setErrors(found);
    setServerError('');
    if (hasErrors(found)) return;

    setSubmitting(true);
    try {
      await login({ email: form.email.trim(), password: form.password });
      navigate(safeRedirectPath(location.state?.from), { replace: true });
    } catch (error) {
      setServerError(error.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="container-page flex justify-center py-12">
      <div className="panel w-full max-w-md p-6 sm:p-8">
        <h1 className="text-3xl font-bold">Sign in</h1>
        <p className="mt-1 text-muted">Welcome back. Use the email and password you registered with.</p>

        {notice && <Alert tone="success" className="mt-5">{notice}</Alert>}
        {location.state?.from && !notice && (
          <Alert tone="info" className="mt-5">Please sign in to continue.</Alert>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-6 grid gap-4">
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
            autoComplete="current-password"
            value={form.password}
            onChange={set('password')}
            error={errors.password}
          />
          {serverError && <Alert tone="error">{serverError}</Alert>}
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting && <Spinner className="h-4 w-4" />}
            Sign in
          </button>
        </form>

        <p className="mt-6 text-sm text-muted">
          New here?{' '}
          <Link to="/register" className="font-semibold text-harbor-700 underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
