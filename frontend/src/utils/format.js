export function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function excerpt(text, max = 110) {
  if (!text) return '';
  const clean = text.trim();
  return clean.length > max ? `${clean.slice(0, max).trimEnd()}…` : clean;
}

/** Newest first, by reportedAt / claimedAt style ISO strings. */
export function sortNewest(list, field) {
  return [...list].sort((a, b) => new Date(b[field]).getTime() - new Date(a[field]).getTime());
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** Only allow in-app redirect targets (blocks open redirects such as //evil.com). */
export function safeRedirectPath(path, fallback = '/dashboard') {
  if (typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/\\')) {
    return path;
  }
  return fallback;
}
