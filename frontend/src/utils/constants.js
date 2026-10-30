// Exact enum strings used by the backend. Friendly labels are for display only.
export const ITEM_STATUS = { LOST: 'LOST', FOUND: 'FOUND', CLAIMED: 'CLAIMED', RESOLVED: 'RESOLVED' };
export const CLAIM_STATUS = { PENDING: 'PENDING', APPROVED: 'APPROVED', REJECTED: 'REJECTED', RESOLVED: 'RESOLVED' };
export const ROLES = { USER: 'USER', ADMIN: 'ADMIN' };

export const ITEM_STATUS_LABELS = {
  LOST: 'Lost',
  FOUND: 'Found',
  CLAIMED: 'Claimed',
  RESOLVED: 'Returned',
};

export const CLAIM_STATUS_LABELS = {
  PENDING: 'Pending review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  RESOLVED: 'Completed',
};

/** Statuses a person may choose when reporting a new item. */
export const REPORTABLE_STATUSES = [ITEM_STATUS.LOST, ITEM_STATUS.FOUND];
