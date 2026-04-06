/**
 * pages/kitchenDash.js — Cloud Kitchen dashboard
 *
 * COOKED order flow for kitchen:
 *   After admin accepts → Kitchen sees it → Prepare → Out for Delivery → Delivered
 *
 * Kitchen is fully self-service after admin acceptance (no admin needed).
 */

import { getState } from '../store.js';
import { getAllOrders, updateStatus, STATUS_META, KITCHEN_NEXT } from '../db/orders.js';
import { getProducts, toggleAvailability, updateProductPrice } from '../db/products.js';
import { updateUser, getUserById } from '../db/auth.js';
import { toast } from '../components/toast.js';
import { navigate } from '../main.js';

let activeView = 'overview';

export function renderKitchenDash() {
  const user = getState().currentUser;
  if (!user || user.role !== 'kitchen') { navigate('/login'); return ''; }
  return `
<div class="dashboard-layout" id="kitchen-layout">
  <div class="sidebar">
    <div class="sidebar-logo"><div class="sidebar-logo-text">Freeze<span>ats</span></div></div>
    <div class="sidebar-user">
      <div class="sidebar-avatar">🍳</div>
      <div>
        <div class="sidebar-user-name">${user.kitchenName || user.firstName + ' Kitchen'}</div>
        <div class="sidebar-user-role">Cloud Kitchen${user.city ? ' · '+user.city : ''}</div>
      </div>
    </div>
    <nav class="sidebar-nav">
      <div class="sidebar-section-label">Operations</div>
      ${kl('overview','🏠','Overview')}
      ${kl('new_orders','📥','New Orders')}
      ${kl('preparing','👨‍🍳','Preparing')}
      ${kl('delivery','🛵','Delivery')}
      ${kl('orders','📦','All Orders')}
      <div class="sidebar-section-label" style="margin-top:16px">Business</div>
      ${kl('menu','📋','Menu Management')}
      ${kl('analytics','📊','Analytics')}
      ${kl('earnings','💰','Earnings')}
      ${kl('profile','⚙️','Kitchen Profile')}
    </nav>
    <div class="sidebar-footer">
      <div class="sidebar-logout" onclick="navigate('/')">🏠 Home</div>
      <div class="sidebar-logout" onclick="doLogout()" style="color:var(--red)">🚪 Log Out</div>
    </div>
  </div>

  <div class="dashboard-main">
    <div class="dash-header">
      <div class="dash-header-title" id="k-page-title">Overview</div>
      <div class="dash-header-actions">
        <div id="kitchen-open-btn" style="display:flex;align-items:center;gap:6px;padding:8px 16px;border-radius:50px;background:#DCFCE7;color:#16A34A;font-size:.82rem;font-weight:700;cursor:pointer" onclick="toggleKitchenOpen()">🟢 Open</div>
        <div class="dash-notif">🔔</div>
      </div>
    </div>
    <div class="dash-body" id="kitchen-content"></div>
  </div>
</div>

<div class="mobile-bottom-nav">
  <div class="mobile-bottom-nav-inner">
    <div class="mb-nav-item active" onclick="kitchenNav('overview',this)"><div class="mb-nav-icon">🏠</div><div class="mb-nav-label">Home</div></div>
    <div class="mb-nav-item" onclick="kitchenNav('new_orders',this)"><div class="mb-nav-icon">📥</div><div class="mb-nav-label">New</div></div>
    <div class="mb-nav-item" onclick="kitchenNav('preparing',this)"><div class="mb-nav-icon">👨‍🍳</div><div class="mb-nav-label">Preparing</div></div>
    <div class="mb-nav-item" onclick="kitchenNav('delivery',this)"><div class="mb-nav-icon">🛵</div><div class="mb-nav-label">Delivery</div></div>
    <div class="mb-nav-item" onclick="kitchenNav('orders',this)"><div class="mb-nav-icon">📦</div><div class="mb-nav-label">Orders</div></div>
  </div>
</div>`;
}

export function onKitchenMount() {
  showKitchenView('overview');
  window.addEventListener('fz:ordersUpdated', () => {
    if (['overview','new_orders','preparing','delivery','orders'].includes(activeView)) showKitchenView(activeView);
  });
}

function kl(v,i,l) { return `<div class="sidebar-link" id="kl-${v}" onclick="kitchenNav('${v}')"><span class="sl-icon">${i}</span> ${l}</div>`; }

const K_TITLES = { overview:'Overview', new_orders:'New Orders', preparing:'Preparing',
  delivery:'Delivery', orders:'All Orders', menu:'Menu Management',
  analytics:'Analytics', earnings:'Earnings', profile:'Kitchen Profile' };

window.kitchenNav = (view, mobileBtn) => {
  activeView = view;
  document.querySelectorAll('#kitchen-layout .sidebar-link').forEach(l => l.classList.remove('active'));
  document.getElementById(`kl-${view}`)?.classList.add('active');
  document.getElementById('k-page-title').textContent = K_TITLES[view] || view;
  if (mobileBtn) {
    document.querySelectorAll('.mobile-bottom-nav .mb-nav-item').forEach(b => b.classList.remove('active'));
    mobileBtn.classList.add('active');
  }
  showKitchenView(view);
};

function showKitchenView(view) {
  const el = document.getElementById('kitchen-content');
  if (!el) return;
  const views = { overview:kOverview, new_orders:kNewOrders, preparing:kPreparing, delivery:kDelivery,
    orders:kAllOrders, menu:kMenu, analytics:kAnalytics, earnings:kEarnings, profile:kProfile };
  el.innerHTML = (views[view]||kOverview)();
}

// ── Helper: get all cooked orders visible to kitchen ──────────────────────────
// Kitchen sees cooked orders that are accepted or beyond (not pending, not cancelled)
function getKitchenOrders() {
  return getAllOrders().filter(o =>
    o.orderType === 'cooked' && !['pending', 'cancelled'].includes(o.status)
  );
}

// ── Views ─────────────────────────────────────────────────────────────────────

function kOverview() {
  const allOrders = getKitchenOrders();
  const newOrders = allOrders.filter(o => o.status === 'accepted' || o.status === 'sent_to_kitchen' || o.status === 'kitchen_accepted' || o.status === 'frozen_ordered');
  const prep      = allOrders.filter(o => o.status === 'preparing' || o.status === 'cooking');
  const delivering = allOrders.filter(o => o.status === 'out_for_delivery' || o.status === 'ready');
  const today     = allOrders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString());

  return `
<div class="stats-row">
  <div class="stat-card orange"><div class="sc-icon">📥</div><div class="sc-value">${newOrders.length}</div><div class="sc-label">New Orders</div></div>
  <div class="stat-card blue"><div class="sc-icon">👨‍🍳</div><div class="sc-value">${prep.length}</div><div class="sc-label">Preparing</div></div>
  <div class="stat-card purple"><div class="sc-icon">🛵</div><div class="sc-value">${delivering.length}</div><div class="sc-label">Out for Delivery</div></div>
  <div class="stat-card green"><div class="sc-icon">📦</div><div class="sc-value">${today.length}</div><div class="sc-label">Today's Orders</div></div>
</div>

${newOrders.length ? `
<div style="background:var(--orange-pale);border:1px solid rgba(244,98,31,0.3);border-radius:16px;padding:16px 20px;margin-bottom:20px;display:flex;align-items:center;gap:14px">
  <span style="font-size:2rem">📥</span>
  <div>
    <div style="font-weight:700;color:var(--brown)">${newOrders.length} new order${newOrders.length>1?'s':''} — ready for you to prepare!</div>
    <div style="font-size:.82rem;color:var(--text-muted);margin-top:2px">Admin has accepted these. Click "New Orders" to start preparing.</div>
  </div>
  <button class="action-btn primary" style="margin-left:auto" onclick="kitchenNav('new_orders')">View Orders →</button>
</div>` : ''}

<div class="dash-section-title">Active Orders</div>
${renderKitchenOrderTable(allOrders.filter(o => !['delivered','cancelled'].includes(o.status)).slice(0,8))}`;
}

// ── New Orders: Admin-accepted cooked orders ready for kitchen to prepare ────
function kNewOrders() {
  // Kitchen sees cooked orders at 'accepted' status (admin accepted)
  // Also handles legacy statuses
  const orders = getKitchenOrders().filter(o =>
    ['accepted','sent_to_kitchen','kitchen_accepted','frozen_ordered','kitchen_received'].includes(o.status)
  );

  if (!orders.length) return `
    <div style="text-align:center;padding:48px;color:var(--text-muted)">
      <div style="font-size:3rem;margin-bottom:12px">📥</div>
      <div style="font-weight:700;margin-bottom:6px">No new orders right now.</div>
      <div style="font-size:.85rem">When admin accepts a cooked order, it will appear here for you to prepare.</div>
    </div>`;

  return `
<div style="background:#EEF2FF;border-radius:14px;padding:14px 18px;margin-bottom:20px;font-size:.84rem;color:#4338CA;font-weight:600;border:1px solid #C7D2FE">
  📥 These cooked orders have been accepted by admin. Click "Start Preparing" to begin.
</div>
<div style="display:flex;flex-direction:column;gap:14px">
  ${orders.map(o => {
    const m = STATUS_META[o.status] || {};
    return `
    <div class="dash-card" style="padding:18px 22px;border-left:4px solid #6366F1">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;margin-bottom:10px">
        <div>
          <div style="font-weight:800;font-family:'Syne',sans-serif;color:var(--brown)">#${o.id}</div>
          <div style="font-size:.78rem;color:var(--text-muted);margin-top:2px">From: ${o.userName} · ${new Date(o.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</div>
        </div>
        <span class="status-badge" style="background:${m.bg};color:${m.color}">${m.icon} ${m.label}</span>
      </div>
      <div style="font-size:.86rem;margin-bottom:14px">${o.items.map(i=>`${i.emoji} <strong>${i.name}</strong> ×${i.qty}`).join(' &nbsp;·&nbsp; ')}</div>
      <div style="font-size:.8rem;color:var(--text-muted);margin-bottom:6px">📍 Deliver to: ${o.address}</div>
      <div style="font-size:.85rem;font-weight:700;color:var(--orange);margin-bottom:14px">₹${o.total}</div>
      <button class="action-btn primary" style="background:#8B5CF6;border-color:#8B5CF6" onclick="kAdvance('${o.id}','preparing','kitchen')">
        👨‍🍳 Start Preparing
      </button>
    </div>`;}).join('')}
</div>`;
}

// ── Preparing: Orders being cooked ──────────────────────────────────────────
function kPreparing() {
  const orders = getKitchenOrders().filter(o =>
    ['preparing','cooking'].includes(o.status)
  );

  if (!orders.length) return `
    <div style="text-align:center;padding:48px;color:var(--text-muted)">
      <div style="font-size:3rem;margin-bottom:12px">👨‍🍳</div>
      <div style="font-weight:700">No orders being prepared right now.</div>
      <div style="font-size:.85rem;margin-top:4px">Start preparing orders from the "New Orders" tab.</div>
    </div>`;

  return `
<div style="background:#FEF3C7;border-radius:14px;padding:14px 18px;margin-bottom:20px;font-size:.84rem;color:#92400E;font-weight:600;border:1px solid #FDE68A">
  👨‍🍳 These orders are being prepared. Click "Out for Delivery" when food is ready.
</div>
<div style="display:flex;flex-direction:column;gap:14px">
  ${orders.map(o => {
    const m = STATUS_META[o.status] || {};
    return `
    <div class="dash-card" style="padding:18px 22px;border-left:4px solid ${m.color}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;margin-bottom:10px">
        <div>
          <div style="font-weight:800;font-family:'Syne',sans-serif;color:var(--brown)">#${o.id}</div>
          <div style="font-size:.78rem;color:var(--text-muted);margin-top:2px">${o.userName} · ₹${o.total}</div>
        </div>
        <span class="status-badge" style="background:${m.bg};color:${m.color}">${m.icon} ${m.label}</span>
      </div>
      <div style="font-size:.86rem;margin-bottom:14px">${o.items.map(i=>`${i.emoji} ${i.name} ×${i.qty}`).join(' · ')}</div>
      <div style="font-size:.8rem;color:var(--text-muted);margin-bottom:14px">📍 ${o.address}</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="action-btn primary" style="background:#F97316;border-color:#F97316" onclick="kAdvance('${o.id}','out_for_delivery','kitchen')">
          🛵 Out for Delivery
        </button>
        <button class="action-btn primary" style="background:var(--green);border-color:var(--green)" onclick="kAdvance('${o.id}','delivered','kitchen')">
          🎉 Mark Delivered
        </button>
      </div>
    </div>`;}).join('')}
</div>`;
}

// ── Delivery: Out for delivery orders ────────────────────────────────────────
function kDelivery() {
  const orders = getKitchenOrders().filter(o =>
    ['out_for_delivery','ready'].includes(o.status)
  );

  if (!orders.length) return `
    <div style="text-align:center;padding:48px;color:var(--text-muted)">
      <div style="font-size:3rem;margin-bottom:12px">🛵</div>
      <div style="font-weight:700">No orders out for delivery.</div>
    </div>`;

  return `<div style="display:flex;flex-direction:column;gap:14px">
    ${orders.map(o => {
      const m = STATUS_META[o.status] || {};
      return `
      <div class="dash-card" style="padding:18px 22px;border-left:4px solid ${m.color}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;margin-bottom:10px">
          <div>
            <div style="font-weight:800;font-family:'Syne',sans-serif;color:var(--brown)">#${o.id}</div>
            <div style="font-size:.78rem;color:var(--text-muted);margin-top:2px">${o.userName}</div>
          </div>
          <span class="status-badge" style="background:${m.bg};color:${m.color}">${m.icon} ${m.label}</span>
        </div>
        <div style="font-size:.86rem;margin-bottom:14px">${o.items.map(i=>`${i.emoji} ${i.name} ×${i.qty}`).join(' · ')}</div>
        <div style="font-size:.8rem;color:var(--text-muted);margin-bottom:14px">📍 ${o.address}</div>
        <button class="action-btn primary" style="background:var(--green);border-color:var(--green)" onclick="kAdvance('${o.id}','delivered','kitchen')">
          🎉 Mark Delivered
        </button>
      </div>`;}).join('')}
  </div>`;
}

function kAllOrders() {
  const orders = getKitchenOrders();
  return `<div class="dash-card">${renderKitchenOrderTable(orders)}</div>`;
}

function renderKitchenOrderTable(orders) {
  if (!orders.length) return `<div style="text-align:center;padding:32px;color:var(--text-muted)">No cooked orders yet.</div>`;
  return `<div style="overflow-x:auto">
    <table class="dash-table">
      <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
      <tbody>
        ${orders.map(o => {
          const m    = STATUS_META[o.status] || {};
          const next = KITCHEN_NEXT[o.status];

          // Custom action label based on status
          let actionLabel = '';
          if (o.status === 'accepted' || o.status === 'sent_to_kitchen' || o.status === 'kitchen_accepted' || o.status === 'frozen_ordered' || o.status === 'kitchen_received')
            actionLabel = '👨‍🍳 Prepare';
          else if (o.status === 'preparing' || o.status === 'cooking')
            actionLabel = '🛵 Out for Delivery';
          else if (o.status === 'out_for_delivery' || o.status === 'ready')
            actionLabel = '🎉 Delivered';

          return `<tr>
            <td><strong>#${o.id}</strong></td>
            <td>${o.userName}</td>
            <td>${o.items.map(i=>`${i.emoji}×${i.qty}`).join(' ')}</td>
            <td>₹${o.total}</td>
            <td><span class="status-badge" style="background:${m.bg};color:${m.color}">${m.icon} ${m.label}</span></td>
            <td>${next ? `<button class="action-btn outline" style="padding:4px 10px;font-size:.75rem" onclick="kAdvance('${o.id}','${next}','kitchen')">${actionLabel}</button>` : ''}</td>
          </tr>`;}).join('')}
      </tbody>
    </table>
  </div>`;
}

function kMenu() {
  const products = getProducts();
  return `
<div class="action-row" style="margin-bottom:16px">
  <button class="action-btn primary" onclick="toast('➕ Add item form — coming soon!')">+ Add Item</button>
  <button class="action-btn ghost" onclick="toast('📥 Exporting menu PDF...')">📥 Export</button>
</div>
<div class="dash-card">
  ${products.map(p => `
    <div class="menu-item-row">
      <div class="menu-item-img-wrap"><img src="${p.img}" loading="lazy" onerror="this.parentElement.textContent='${p.emoji}'"></div>
      <div class="menu-item-info">
        <div class="menu-item-name">${p.emoji} ${p.name}</div>
        <div class="menu-item-meta">${p.desc}</div>
      </div>
      <div style="display:flex;align-items:center;gap:5px">
        <span style="font-size:.75rem;color:var(--text-muted)">₹</span>
        <input type="number" value="${p.price}" style="width:68px;padding:6px 8px;border:1.5px solid rgba(244,98,31,0.2);border-radius:8px;font-family:'DM Sans',sans-serif;font-size:.85rem" onchange="kUpdatePrice(${p.id},this.value)">
      </div>
      <div class="menu-item-actions">
        <div class="toggle ${p.available!==false?'on':''}" onclick="kToggleItem(${p.id},this)"></div>
      </div>
    </div>`).join('')}
</div>`;
}

function kAnalytics() {
  const orders = getKitchenOrders().filter(o => o.status!=='cancelled');
  const byItem = {};
  orders.forEach(o => o.items.forEach(i => { byItem[i.name]=(byItem[i.name]||0)+i.qty; }));
  const sorted = Object.entries(byItem).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const max = sorted[0]?.[1]||1;
  return `
<div class="revenue-grid">
  <div class="revenue-card"><div class="rc-label">Cooked Orders Revenue</div><div class="rc-value">₹${orders.reduce((s,o)=>s+o.total,0).toLocaleString()}</div></div>
  <div class="revenue-card"><div class="rc-label">Total Cooked Orders</div><div class="rc-value">${orders.length}</div></div>
</div>
<div class="dash-card">
  <div class="dash-card-title">Top Cooked Items</div>
  ${sorted.length ? sorted.map(([name,qty])=>`<div class="progress-item"><div class="progress-label"><span>${name}</span><span>${qty} cooked</span></div><div class="progress-bar"><div class="progress-fill" style="width:${Math.round(qty/max*100)}%"></div></div></div>`).join('') : '<div style="text-align:center;padding:20px;color:var(--text-muted)">No data yet.</div>'}
</div>`;
}

function kEarnings() {
  const orders = getKitchenOrders().filter(o => o.status!=='cancelled');
  const total  = orders.reduce((s,o)=>s+o.total,0);
  const commission = Math.round(total*0.12);
  return `
<div class="revenue-grid">
  <div class="revenue-card"><div class="rc-label">Gross Revenue</div><div class="rc-value">₹${total.toLocaleString()}</div></div>
  <div class="revenue-card"><div class="rc-label">Platform Commission (12%)</div><div class="rc-value">₹${commission.toLocaleString()}</div></div>
</div>
<div class="dash-card">
  <div class="dash-card-title">Your Payout</div>
  <div style="font-size:2rem;font-weight:800;color:var(--green);font-family:'Syne',sans-serif;margin:16px 0">₹${(total-commission).toLocaleString()}</div>
  <button class="action-btn primary" onclick="toast('💸 Payout requested!')">Request Payout</button>
</div>`;
}

function kProfile() {
  const user = getState().currentUser;
  const full = getUserById(user.userId)||{};
  return `<div class="dash-card">
  <div class="dash-card-title">Kitchen Profile</div>
  <div class="form-group"><label class="form-label">Kitchen Name</label><input class="form-input" id="kp-name" value="${full.kitchenName||''}"></div>
  <div class="form-group"><label class="form-label">City</label><input class="form-input" id="kp-city" value="${full.city||''}"></div>
  <div class="form-group"><label class="form-label">Email</label><input class="form-input" value="${full.email||''}" disabled style="opacity:.6"></div>
  <div class="form-group"><label class="form-label">Phone</label><input class="form-input" id="kp-phone" value="${full.phone||''}"></div>
  <div class="form-group"><label class="form-label">FSSAI License</label><input class="form-input" id="kp-fssai" value="${full.fssai||''}"></div>
  <button class="action-btn primary" onclick="saveKitchenProfile()">💾 Save Profile</button>
</div>`;
}

// ── Actions ────────────────────────────────────────────────────────────────────
window.kAdvance = (orderId, status, by) => {
  updateStatus(orderId, status, by);
  toast(`✅ Order #${orderId} → ${STATUS_META[status]?.label}`);
  showKitchenView(activeView);
};
window.kToggleItem = (id, el) => {
  const p = toggleAvailability(id);
  el.classList.toggle('on', p?.available !== false);
  toast(`${p?.available!==false?'✅':'⚠️'} ${p?.name} ${p?.available!==false?'available':'unavailable'}`);
};
window.kUpdatePrice = (id, price) => {
  if (!price || isNaN(price) || Number(price)<1) return;
  updateProductPrice(id, price);
  toast(`💰 Price updated to ₹${price}`);
};
window.toggleKitchenOpen = () => {
  const btn = document.getElementById('kitchen-open-btn');
  if (!btn) return;
  const isOpen = btn.textContent.includes('Open');
  btn.innerHTML = isOpen ? '🔴 Closed' : '🟢 Open';
  btn.style.background = isOpen ? '#FEE2E2' : '#DCFCE7';
  btn.style.color = isOpen ? '#DC2626' : '#16A34A';
  toast(isOpen ? '🔴 Kitchen is now closed.' : '🟢 Kitchen is now open!');
};
window.saveKitchenProfile = () => {
  const user = getState().currentUser;
  updateUser(user.userId, {
    kitchenName: document.getElementById('kp-name')?.value?.trim(),
    city:        document.getElementById('kp-city')?.value?.trim(),
    phone:       document.getElementById('kp-phone')?.value?.trim(),
    fssai:       document.getElementById('kp-fssai')?.value?.trim(),
  });
  toast('✅ Kitchen profile updated!');
};
