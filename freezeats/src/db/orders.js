/**
 * db/orders.js — Order management via localStorage
 *
 * orderType: 'frozen' | 'cooked'
 *
 * FROZEN flow (Admin handles everything):
 *   pending → accepted → delivered
 *   Admin accepts, then delivers. Or admin can directly mark delivered.
 *
 * COOKED flow (Admin accepts, Cloud Kitchen prepares & delivers):
 *   pending → accepted (by admin) → preparing (by kitchen) → out_for_delivery (by kitchen) → delivered
 *   After admin accepts, cloud kitchen sees it, prepares, and delivers.
 *   Admin can also directly mark delivered at any point.
 */

const ORDERS_KEY = 'fz_orders';

function uid() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return 'FZ' + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function getAll() {
  try { return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]'); }
  catch { return []; }
}

function save(orders) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  window.dispatchEvent(new CustomEvent('fz:ordersUpdated'));
}

// ── Public API ────────────────────────────────────────────────────────────────

export function createOrder({ userId, userName, userEmail, items, address, note = '', orderType = 'frozen' }) {
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const order = {
    id: uid(),
    userId, userName, userEmail,
    items, subtotal,
    deliveryFee: 0,
    total: subtotal,
    address: address || 'Home — Mumbai',
    note,
    orderType,
    status: 'pending',
    statusHistory: [{ status: 'pending', ts: new Date().toISOString(), by: 'system' }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const orders = getAll();
  orders.unshift(order);
  save(orders);
  return order;
}

export function getOrdersByUser(userId)  { return getAll().filter(o => o.userId === userId); }
export function getAllOrders()           { return getAll(); }
export function getOrderById(id)        { return getAll().find(o => o.id === id) || null; }

export function updateStatus(orderId, status, by = 'system') {
  const orders = getAll();
  const order = orders.find(o => o.id === orderId);
  if (!order) return null;
  order.status = status;
  order.updatedAt = new Date().toISOString();
  if (!order.statusHistory) order.statusHistory = [];
  order.statusHistory.push({ status, ts: new Date().toISOString(), by });
  save(orders);
  return order;
}

/** Admin hard-sets delivered or reverts to previous active status */
export function adminToggleDelivered(orderId) {
  const orders = getAll();
  const order = orders.find(o => o.id === orderId);
  if (!order) return null;

  if (order.status === 'delivered') {
    // Revert to accepted
    const revert = 'accepted';
    order.status = revert;
    order.updatedAt = new Date().toISOString();
    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({ status: revert, ts: new Date().toISOString(), by: 'admin' });
  } else {
    order.status = 'delivered';
    order.updatedAt = new Date().toISOString();
    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({ status: 'delivered', ts: new Date().toISOString(), by: 'admin' });
  }
  save(orders);
  return order;
}

export function cancelOrder(orderId, userId) {
  const orders = getAll();
  const order = orders.find(o => o.id === orderId);
  if (!order) return { ok: false, error: 'Order not found.' };
  if (order.userId !== userId) return { ok: false, error: 'Not your order.' };
  if (!['pending', 'accepted'].includes(order.status))
    return { ok: false, error: 'Order cannot be cancelled at this stage.' };
  order.status = 'cancelled';
  order.updatedAt = new Date().toISOString();
  save(orders);
  return { ok: true, order };
}

// ── Status metadata ───────────────────────────────────────────────────────────

export const STATUS_META = {
  pending:           { label: 'Order Received',    color: '#F59E0B', bg: '#FEF3C7', icon: '🕐' },
  accepted:          { label: 'Accepted',          color: '#3B82F6', bg: '#EFF6FF', icon: '✅' },
  preparing:         { label: 'Preparing',         color: '#8B5CF6', bg: '#EDE9FE', icon: '👨‍🍳' },
  out_for_delivery:  { label: 'Out for Delivery',  color: '#F97316', bg: '#FFF7ED', icon: '🛵' },
  delivered:         { label: 'Delivered',         color: '#22C55E', bg: '#DCFCE7', icon: '🎉' },
  cancelled:         { label: 'Cancelled',         color: '#EF4444', bg: '#FEE2E2', icon: '✕'  },
  // Legacy statuses (for old orders still in localStorage)
  packing:           { label: 'Packing',           color: '#8B5CF6', bg: '#EDE9FE', icon: '📦' },
  dispatched:        { label: 'Dispatched',        color: '#F97316', bg: '#FFF7ED', icon: '🚚' },
  sent_to_kitchen:   { label: 'Sent to Kitchen',   color: '#0EA5E9', bg: '#E0F2FE', icon: '🧊' },
  kitchen_accepted:  { label: 'Kitchen Accepted',  color: '#6366F1', bg: '#EEF2FF', icon: '👨‍🍳' },
  frozen_ordered:    { label: 'Frozen Ordered',    color: '#A855F7', bg: '#F3E8FF', icon: '🧊' },
  kitchen_received:  { label: 'Received',          color: '#A78BFA', bg: '#EDE9FE', icon: '📬' },
  cooking:           { label: 'Cooking',           color: '#EF4444', bg: '#FEE2E2', icon: '🍳' },
  ready:             { label: 'Ready',             color: '#10B981', bg: '#D1FAE5', icon: '✅' },
};

// ── Next-step maps ────────────────────────────────────────────────────────────

// ADMIN next steps:
//   Frozen:  pending → accepted → delivered
//   Cooked:  pending → accepted (then kitchen takes over, but admin can also deliver)
export function getAdminNext(order) {
  const map = {
    'pending': 'accepted',
    'accepted': order.orderType === 'frozen' ? 'delivered' : null,
    // Legacy statuses → advance to delivered
    'packing': 'delivered',
    'dispatched': 'delivered',
    'sent_to_kitchen': 'delivered',
    'kitchen_accepted': 'delivered',
    'frozen_ordered': 'delivered',
    'kitchen_received': 'delivered',
    'cooking': 'delivered',
    'preparing': 'delivered',
    'ready': 'delivered',
    'out_for_delivery': 'delivered',
  };
  return map[order.status] !== undefined ? map[order.status] : null;
}

// KITCHEN next steps (only for cooked orders after admin accepts):
//   accepted → preparing → out_for_delivery → delivered
export const KITCHEN_NEXT = {
  accepted:          'preparing',
  preparing:         'out_for_delivery',
  out_for_delivery:  'delivered',
  // Legacy statuses
  sent_to_kitchen:   'preparing',
  kitchen_accepted:  'preparing',
  frozen_ordered:    'preparing',
  kitchen_received:  'preparing',
  cooking:           'out_for_delivery',
  ready:             'out_for_delivery',
};

// Legacy exports (kept for any code that imports them)
export const ADMIN_NEXT = {
  pending: 'accepted',
  accepted: { frozen: 'delivered', cooked: null },
};

export const FROZEN_FLOW  = ['pending', 'accepted', 'delivered'];
export const COOKED_FLOW  = ['pending', 'accepted', 'preparing', 'out_for_delivery', 'delivered'];

/** Returns the flow array for a given order */
export function getFlow(order) {
  return order.orderType === 'cooked' ? COOKED_FLOW : FROZEN_FLOW;
}
