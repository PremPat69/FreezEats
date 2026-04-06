/**
 * db/complaints.js — User complaint management via localStorage
 *
 * Schema:
 * {
 *   id: string,
 *   userId: string,
 *   userName: string,
 *   userEmail: string,
 *   orderId: string | null,
 *   category: 'order' | 'product' | 'delivery' | 'payment' | 'other',
 *   subject: string,
 *   message: string,
 *   status: 'open' | 'in_review' | 'resolved',
 *   adminResponse: string | null,
 *   createdAt: string,
 *   updatedAt: string,
 * }
 */

const COMPLAINTS_KEY = 'fz_complaints';

function uid() {
  return 'CMP' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2,5).toUpperCase();
}

function getAll() {
  try { return JSON.parse(localStorage.getItem(COMPLAINTS_KEY) || '[]'); }
  catch { return []; }
}

function save(list) {
  localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent('fz:complaintsUpdated'));
}

// ── Public API ────────────────────────────────────────────────────────────────

export function submitComplaint({ userId, userName, userEmail, orderId, category, subject, message }) {
  if (!subject?.trim()) return { ok: false, error: 'Subject is required.' };
  if (!message?.trim()) return { ok: false, error: 'Please describe your issue.' };

  const complaint = {
    id: uid(),
    userId, userName, userEmail,
    orderId: orderId || null,
    category: category || 'other',
    subject: subject.trim(),
    message: message.trim(),
    status: 'open',
    adminResponse: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const list = getAll();
  list.unshift(complaint);
  save(list);
  return { ok: true, complaint };
}

export function getComplaintsByUser(userId) {
  return getAll().filter(c => c.userId === userId);
}

export function getAllComplaints() {
  return getAll();
}

export function updateComplaintStatus(id, status, adminResponse = null) {
  const list = getAll();
  const c = list.find(c => c.id === id);
  if (!c) return null;
  c.status = status;
  c.updatedAt = new Date().toISOString();
  if (adminResponse !== null) c.adminResponse = adminResponse.trim();
  save(list);
  return c;
}

export const COMPLAINT_CATEGORIES = [
  { value: 'order',    label: '📦 Order Issue' },
  { value: 'product',  label: '🍱 Product Quality' },
  { value: 'delivery', label: '🚚 Delivery Issue' },
  { value: 'payment',  label: '💳 Payment Issue' },
  { value: 'other',    label: '💬 Other' },
];

export const COMPLAINT_STATUS_META = {
  open:      { label: 'Open',      color: '#EF4444', bg: '#FEE2E2', icon: '🔴' },
  in_review: { label: 'In Review', color: '#F59E0B', bg: '#FEF3C7', icon: '🟡' },
  resolved:  { label: 'Resolved',  color: '#22C55E', bg: '#DCFCE7', icon: '🟢' },
};
