import { CLAIM_STATUS_LABELS, ITEM_STATUS_LABELS } from '../utils/constants';

const ITEM_STYLES = {
  LOST: 'bg-lost-bg text-lost-fg',
  FOUND: 'bg-found-bg text-found-fg',
  CLAIMED: 'bg-claimed-bg text-claimed-fg',
  RESOLVED: 'bg-resolved-bg text-resolved-fg',
};

const CLAIM_STYLES = {
  PENDING: 'bg-lost-bg text-lost-fg',
  APPROVED: 'bg-found-bg text-found-fg',
  REJECTED: 'bg-danger-bg text-danger',
  RESOLVED: 'bg-resolved-bg text-resolved-fg',
};

const BASE = 'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold';

export function ItemStatusBadge({ status }) {
  return <span className={`${BASE} ${ITEM_STYLES[status] ?? ITEM_STYLES.RESOLVED}`}>{ITEM_STATUS_LABELS[status] ?? status}</span>;
}

export function ClaimStatusBadge({ status }) {
  return <span className={`${BASE} ${CLAIM_STYLES[status] ?? CLAIM_STYLES.RESOLVED}`}>{CLAIM_STATUS_LABELS[status] ?? status}</span>;
}
