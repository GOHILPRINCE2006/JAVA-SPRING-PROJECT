import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, MapPin, Tag, User } from 'lucide-react';
import { itemsApi } from '../api/items';
import { claimsApi } from '../api/claims';
import { useAsync } from '../hooks/useAsync';
import { useAuth } from '../auth/useAuth';
import { Alert, ErrorState, PageSpinner, Spinner } from '../components/Feedback';
import { ClaimStatusBadge, ItemStatusBadge } from '../components/StatusBadge';
import { FormField } from '../components/FormField';
import { useToast } from '../components/toastContext';
import { validateClaimMessage } from '../utils/validation';
import { formatDate } from '../utils/format';

function ClaimSection({ item, onSubmitted }) {
  const { status: authStatus, user } = useAuth();
  const location = useLocation();
  const { notify } = useToast();
  const [message, setMessage] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const signedIn = authStatus === 'authenticated';
  const myClaims = useAsync(
    (signal) => (signedIn ? claimsApi.mine(signal) : Promise.resolve([])),
    [signedIn, item.id],
  );

  const isReporter = signedIn && item.reportedBy?.id === user.id;
  const closed = item.status === 'CLAIMED' || item.status === 'RESOLVED';
  const existing = (myClaims.data ?? []).find(
    (claim) => claim.item?.id === item.id && (claim.status === 'PENDING' || claim.status === 'APPROVED'),
  );

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    const problem = validateClaimMessage(message);
    setFieldError(problem);
    setSubmitError('');
    if (problem) return;

    setSubmitting(true);
    try {
      await claimsApi.submit(item.id, message.trim());
      setMessage('');
      notify('Your claim was submitted. An administrator will review it.');
      myClaims.reload();
      onSubmitted?.();
    } catch (error) {
      setSubmitError(error.message);
      if (error.status === 409) myClaims.reload();
    } finally {
      setSubmitting(false);
    }
  }

  let body;
  if (closed) {
    body = <Alert tone="info">This item has already been {item.status === 'CLAIMED' ? 'claimed' : 'returned'}, so new claims are closed.</Alert>;
  } else if (!signedIn) {
    body = (
      <>
        <p className="text-muted">Sign in to tell us why this item is yours. An administrator reviews every claim.</p>
        <Link to="/login" state={{ from: `${location.pathname}${location.search}` }} className="btn-primary mt-4">
          Sign in to claim
        </Link>
      </>
    );
  } else if (isReporter) {
    body = <Alert tone="info">You reported this item, so you cannot claim it. You can manage it from My reports.</Alert>;
  } else if (myClaims.loading) {
    body = <PageSpinner label="Checking your claims…" />;
  } else if (existing) {
    body = (
      <Alert tone="success">
        You already have a claim on this item: <ClaimStatusBadge status={existing.status} />. Follow it in{' '}
        <Link to="/my-claims" className="font-semibold underline">
          My claims
        </Link>
        .
      </Alert>
    );
  } else {
    body = (
      <form onSubmit={handleSubmit} noValidate className="grid gap-4">
        {myClaims.error && <Alert tone="error">Could not check your existing claims: {myClaims.error.message}</Alert>}
        <FormField
          as="textarea"
          label="How can you prove this is yours?"
          hint="Mention details only the owner would know: marks, contents, where and when you lost it."
          rows={4}
          maxLength={1000}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          error={fieldError}
        />
        {submitError && <Alert tone="error">{submitError}</Alert>}
        <div>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting && <Spinner className="h-4 w-4" />}
            Submit claim
          </button>
        </div>
      </form>
    );
  }

  return (
    <section aria-labelledby="claim-heading" className="panel p-6">
      <h2 id="claim-heading" className="mb-3 text-xl font-semibold">
        {item.status === 'LOST' ? 'Did you find this?' : 'Is this yours?'}
      </h2>
      {body}
    </section>
  );
}

export default function ItemDetails() {
  const { id } = useParams();
  const { data: item, error, loading, reload } = useAsync((signal) => itemsApi.get(id, signal), [id]);

  return (
    <div className="container-page py-10">
      <Link to="/items" className="btn-ghost -ml-3 mb-4">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        All items
      </Link>

      {loading && <PageSpinner label="Loading item…" />}
      {error && error.status === 404 && (
        <Alert tone="error">This item does not exist or has been removed.</Alert>
      )}
      {error && error.status !== 404 && <ErrorState error={error} onRetry={reload} title="Could not load this item" />}

      {item && (
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <article className="panel p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <ItemStatusBadge status={item.status} />
              {item.category?.name && (
                <span className="inline-flex items-center gap-1.5 text-sm text-muted">
                  <Tag className="h-4 w-4" aria-hidden="true" />
                  {item.category.name}
                </span>
              )}
            </div>
            <h1 className="mt-4 text-3xl font-bold sm:text-4xl">{item.title}</h1>
            <p className="mt-5 max-w-prose whitespace-pre-line text-lg">{item.description || 'No description was provided.'}</p>
            <dl className="mt-8 grid gap-4 border-t border-line pt-6 sm:grid-cols-3">
              <div>
                <dt className="flex items-center gap-1.5 text-sm text-muted">
                  <MapPin className="h-4 w-4" aria-hidden="true" /> Location
                </dt>
                <dd className="mt-1 font-semibold">{item.location}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-sm text-muted">
                  <CalendarDays className="h-4 w-4" aria-hidden="true" /> Reported
                </dt>
                <dd className="mt-1 font-semibold">{formatDate(item.reportedAt)}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-sm text-muted">
                  <User className="h-4 w-4" aria-hidden="true" /> Reported by
                </dt>
                <dd className="mt-1 font-semibold">{item.reportedBy?.name}</dd>
              </div>
            </dl>
          </article>
          <ClaimSection item={item} />
        </div>
      )}
    </div>
  );
}
