/**
 * pages/adminDash.js — Admin dashboard (full platform control)
 *
 * FROZEN orders:  Admin accepts → Admin delivers
 * COOKED orders:  Admin accepts → Cloud kitchen prepares & delivers
 * Admin can ALWAYS directly mark any order as delivered.
 */

import { getState } from '../store.js';
import { getAllUsers, getUsersByRole, setKitchenApproval, updateUser } from '../db/auth.js';
import { getAllOrders, updateStatus, adminToggleDelivered, STATUS_META, getAdminNext, FROZEN_FLOW, COOKED_FLOW } from '../db/orders.js';
import { getProducts, toggleAvailability, updateProductPrice, addProduct, updateProduct, deleteProduct, updateProductImage, removeProductImage, getCategories } from '../db/products.js';
import { getAllComplaints, updateComplaintStatus, COMPLAINT_STATUS_META, COMPLAINT_CATEGORIES } from '../db/complaints.js';
import { toast } from '../components/toast.js';
import { navigate } from '../main.js';

let activeView = 'overview';

export function renderAdminDash() {
  const user = getState().currentUser;
  if (!user || user.role !== 'admin') { navigate('/login'); return ''; }
  return `
<div class="dashboard-layout" id="admin-layout">
  <div class="sidebar">
    <div class="sidebar-logo"><div class="sidebar-logo-text">Freeze<span>ats</span></div></div>
    <div class="sidebar-user">
      <div class="sidebar-avatar">⚙️</div>
      <div>
        <div class="sidebar-user-name">Super Admin</div>
        <div class="sidebar-user-role">Platform Administrator</div>
      </div>
    </div>
    <nav class="sidebar-nav">
      <div class="sidebar-section-label">Platform</div>
      ${al('overview','🏠','Overview')}
      ${al('orders','📦','All Orders')}
      ${al('frozen_orders','🧊','Frozen Orders')}
      ${al('cooked_orders','🍳','Cooked Orders')}
      ${al('users','👥','Users')}
      ${al('kitchens','🍳','Cloud Kitchens')}
      <div class="sidebar-section-label" style="margin-top:16px">Support</div>
      ${al('complaints','📢','Complaints')}
      <div class="sidebar-section-label" style="margin-top:16px">Finance</div>
      ${al('revenue','💰','Revenue')}
      ${al('products','🛍️','Products')}
      ${al('settings','⚙️','Settings')}
    </nav>
    <div class="sidebar-footer">
      <div class="sidebar-logout" onclick="navigate('/')">🏠 Home</div>
      <div class="sidebar-logout" onclick="doLogout()" style="color:var(--red)">🚪 Log Out</div>
    </div>
  </div>

  <div class="dashboard-main">
    <div class="dash-header">
      <div class="dash-header-title" id="a-page-title">Overview</div>
      <div class="dash-header-actions">
        <div class="dash-notif" onclick="adminNav('complaints')" title="Complaints" style="cursor:pointer">📢</div>
      </div>
    </div>
    <div class="dash-body" id="admin-content"></div>
  </div>
</div>

<div class="mobile-bottom-nav">
  <div class="mobile-bottom-nav-inner">
    <div class="mb-nav-item active" onclick="adminNav('overview',this)"><div class="mb-nav-icon">🏠</div><div class="mb-nav-label">Home</div></div>
    <div class="mb-nav-item" onclick="adminNav('orders',this)"><div class="mb-nav-icon">📦</div><div class="mb-nav-label">Orders</div></div>
    <div class="mb-nav-item" onclick="adminNav('users',this)"><div class="mb-nav-icon">👥</div><div class="mb-nav-label">Users</div></div>
    <div class="mb-nav-item" onclick="adminNav('complaints',this)"><div class="mb-nav-icon">📢</div><div class="mb-nav-label">Support</div></div>
    <div class="mb-nav-item" onclick="adminNav('revenue',this)"><div class="mb-nav-icon">💰</div><div class="mb-nav-label">Revenue</div></div>
  </div>
</div>`;
}

function al(v,i,l) { return `<div class="sidebar-link" id="al-${v}" onclick="adminNav('${v}')"><span class="sl-icon">${i}</span> ${l}</div>`; }

export function onAdminMount() {
  showAdminView('overview');
  window.addEventListener('fz:ordersUpdated',    () => { if(['overview','orders','frozen_orders','cooked_orders','revenue'].includes(activeView)) showAdminView(activeView); });
  window.addEventListener('fz:complaintsUpdated',() => { if(activeView==='complaints') showAdminView('complaints'); });
}

const A_TITLES = { overview:'Overview', orders:'All Orders', frozen_orders:'Frozen Orders',
  cooked_orders:'Cooked Orders', users:'Users', kitchens:'Cloud Kitchens', complaints:'Complaints & Support',
  revenue:'Revenue', products:'Products', settings:'Settings' };

window.adminNav = (view, mobileBtn) => {
  activeView = view;
  document.querySelectorAll('#admin-layout .sidebar-link').forEach(l => l.classList.remove('active'));
  document.getElementById(`al-${view}`)?.classList.add('active');
  document.getElementById('a-page-title').textContent = A_TITLES[view] || view;
  if (mobileBtn) {
    document.querySelectorAll('.mobile-bottom-nav .mb-nav-item').forEach(b => b.classList.remove('active'));
    mobileBtn.classList.add('active');
  }
  showAdminView(view);
};

function showAdminView(view) {
  const el = document.getElementById('admin-content');
  if (!el) return;
  const views = {
    overview:aOverview, orders:aOrders, frozen_orders:aFrozenOrders, cooked_orders:aCookedOrders,
    users:aUsers, kitchens:aKitchens, complaints:aComplaints,
    revenue:aRevenue, products:aProducts, settings:aSettings,
  };
  el.innerHTML = (views[view]||aOverview)();
}

// ── Views ─────────────────────────────────────────────────────────────────────

function aOverview() {
  const allUsers   = getAllUsers();
  const eaters     = allUsers.filter(u => u.role==='eater');
  const kitchens   = allUsers.filter(u => u.role==='kitchen');
  const orders     = getAllOrders();
  const pending    = orders.filter(o => o.status==='pending');
  const accepted   = orders.filter(o => o.status==='accepted');
  const complaints = getAllComplaints();
  const openCmp    = complaints.filter(c => c.status==='open');
  const gmv        = orders.filter(o=>o.status!=='cancelled').reduce((s,o)=>s+o.total,0);

  return `
<div class="admin-stats-grid">
  <div class="stat-card orange"><div class="sc-icon">📦</div><div class="sc-value">${orders.length}</div><div class="sc-label">Total Orders</div></div>
  <div class="stat-card green"><div class="sc-icon">💰</div><div class="sc-value">₹${gmv.toLocaleString()}</div><div class="sc-label">Platform GMV</div></div>
  <div class="stat-card blue"><div class="sc-icon">👥</div><div class="sc-value">${eaters.length}</div><div class="sc-label">Eaters</div></div>
  <div class="stat-card purple"><div class="sc-icon">📢</div><div class="sc-value">${openCmp.length}</div><div class="sc-label">Open Complaints</div></div>
</div>

<!-- Pending Orders — need acceptance -->
${pending.length ? `
<div class="dash-section-title">⏳ Pending Orders (${pending.length}) — Accept These</div>
<div class="dash-card">
  ${pending.map(o => orderActionCard(o)).join('')}
</div>` : ''}

<!-- Accepted Frozen Orders — need delivery -->
${accepted.filter(o=>o.orderType==='frozen').length ? `
<div class="dash-section-title">🧊 Accepted Frozen Orders — Ready to Deliver (${accepted.filter(o=>o.orderType==='frozen').length})</div>
<div class="dash-card">
  ${accepted.filter(o=>o.orderType==='frozen').map(o => orderActionCard(o)).join('')}
</div>` : ''}

<!-- Pending kitchen approvals -->
${kitchens.filter(k=>!k.approved).length ? `
<div class="dash-section-title">⚠️ Kitchen Approvals (${kitchens.filter(k=>!k.approved).length})</div>
<div class="dash-card">
  ${kitchens.filter(k=>!k.approved).map(k=>`
    <div class="approval-card">
      <div class="approval-avatar">${(k.kitchenName||'K')[0]}</div>
      <div class="approval-info">
        <div class="approval-name">🍳 ${k.kitchenName||k.firstName+' Kitchen'}</div>
        <div class="approval-meta">📍 ${k.city||'—'} · ${k.email}</div>
      </div>
      <div class="approval-actions">
        <button class="approve-btn yes" onclick="approveKitchen('${k.id}',true)">Approve</button>
        <button class="approve-btn no"  onclick="approveKitchen('${k.id}',false)">Reject</button>
      </div>
    </div>`).join('')}
</div>` : ''}

<!-- Open complaints -->
${openCmp.length ? `
<div class="dash-section-title">📢 Open Complaints (${openCmp.length})</div>
<div class="dash-card">
  ${openCmp.slice(0,3).map(c => complaintCard(c, true)).join('')}
  ${openCmp.length>3 ? `<button class="action-btn outline" style="margin-top:8px" onclick="adminNav('complaints')">View all ${openCmp.length} complaints →</button>` : ''}
</div>` : ''}

<!-- Product Management on Overview -->
<div style="display:flex;justify-content:space-between;align-items:center;margin-top:28px;margin-bottom:14px;flex-wrap:wrap;gap:10px">
  <div class="dash-section-title" style="margin:0">🛍️ Product Catalog (${getProducts().length} items)</div>
  <button class="action-btn primary" style="padding:8px 18px;font-size:.85rem" onclick="showAddProductForm()">
    ➕ Add New Product
  </button>
</div>

<!-- Add Product Form (hidden by default) -->
<div id="add-product-form" style="display:none;margin-bottom:20px">
  <div class="dash-card" style="border:2px solid var(--orange);padding:24px">
    <div style="font-weight:700;color:var(--brown);margin-bottom:16px;font-size:1rem">➕ Add New Product</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      <div class="form-group" style="margin:0"><label class="form-label">Product Name *</label><input class="form-input" id="ap-name" placeholder="e.g. Paneer Tikka"></div>
      <div class="form-group" style="margin:0"><label class="form-label">Price (₹) *</label><input class="form-input" id="ap-price" type="number" min="1" placeholder="199"></div>
      <div class="form-group" style="margin:0"><label class="form-label">Category</label><input class="form-input" id="ap-category" placeholder="e.g. Snacks, Tikka"></div>
      <div class="form-group" style="margin:0"><label class="form-label">Emoji</label><input class="form-input" id="ap-emoji" placeholder="🍢" maxlength="4"></div>
      <div class="form-group" style="margin:0"><label class="form-label">Badge</label><input class="form-input" id="ap-badge" placeholder="e.g. Bestseller, New"></div>
      <div class="form-group" style="margin:0">
        <label class="form-label">Image URL</label>
        <input class="form-input" id="ap-img" placeholder="https://... or leave empty">
      </div>
    </div>
    <div class="form-group" style="margin-top:14px"><label class="form-label">Description</label><textarea class="form-input" id="ap-desc" rows="2" placeholder="Short description of the product" style="resize:vertical"></textarea></div>
    <div class="form-group" style="margin-top:10px">
      <label class="form-label">Or Upload Image</label>
      <input type="file" id="ap-img-file" accept="image/*" style="font-size:.82rem" onchange="previewAddImage(this)">
      <div id="ap-img-preview" style="margin-top:8px"></div>
    </div>
    <div style="display:flex;gap:10px;margin-top:16px">
      <button class="action-btn primary" onclick="submitAddProduct()">✅ Add Product</button>
      <button class="action-btn ghost" onclick="hideAddProductForm()">Cancel</button>
    </div>
  </div>
</div>

<!-- Product List -->
<div id="product-list">
  ${getProducts().map(p => productCard(p)).join('')}
</div>

<!-- Edit Product Modal (hidden) -->
<div id="edit-product-modal" style="display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.5);padding:20px;overflow-y:auto">
  <div style="max-width:560px;margin:40px auto;background:var(--cream);border-radius:20px;padding:28px 32px;box-shadow:0 20px 60px rgba(0,0,0,0.3)">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:1.1rem;color:var(--brown)">✏️ Edit Product</div>
      <button onclick="closeEditModal()" style="background:none;border:none;font-size:1.3rem;cursor:pointer;padding:4px">✕</button>
    </div>
    <div id="edit-product-fields"></div>
  </div>
</div>`;
}

function orderActionCard(o) {
  const m    = STATUS_META[o.status]||{};
  const next = getAdminNext(o);

  // Determine button labels
  let nextLabel = '';
  if (next === 'accepted') nextLabel = '✅ Accept Order';
  else if (next === 'delivered') nextLabel = '🎉 Mark Delivered';

  return `
  <div style="display:flex;align-items:center;flex-wrap:wrap;gap:12px;padding:14px 0;border-bottom:1px solid var(--cream-dark)">
    <div style="flex:1;min-width:0">
      <div style="font-weight:700;color:var(--brown)">#${o.id}
        <span style="font-size:.7rem;background:${o.orderType==='cooked'?'#FEF3C7':'#E0F2FE'};color:${o.orderType==='cooked'?'#92400E':'#0369A1'};border-radius:50px;padding:2px 8px;margin-left:6px;font-weight:600">${o.orderType==='cooked'?'🍳 Cooked':'🧊 Frozen'}</span>
      </div>
      <div style="font-size:.78rem;color:var(--text-muted);margin-top:2px">${o.userName} · ${o.items.map(i=>`${i.emoji}×${i.qty}`).join(' ')} · ₹${o.total}</div>
    </div>
    <span class="status-badge" style="background:${m.bg};color:${m.color}">${m.icon} ${m.label}</span>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      ${next ? `<button class="action-btn primary" style="padding:6px 14px;font-size:.78rem" onclick="adminAdvance('${o.id}','${next}')">${nextLabel}</button>` : ''}
      ${o.status !== 'delivered' && o.status !== 'cancelled' ? `
        <button class="action-btn primary" style="padding:6px 14px;font-size:.78rem;background:var(--green);border-color:var(--green)" onclick="adminToggleDel('${o.id}')">
          🎉 Mark Delivered
        </button>` : ''}
      ${o.status === 'delivered' ? `
        <button class="action-btn outline" style="padding:6px 14px;font-size:.78rem" onclick="adminToggleDel('${o.id}')">
          ↩ Undo Delivered
        </button>` : ''}
    </div>
  </div>`;
}

function aOrders() {
  return `
<div style="margin-bottom:16px;display:flex;gap:10px;flex-wrap:wrap;align-items:center">
  <select class="form-input" id="a-order-filter" style="max-width:180px;padding:8px 12px" onchange="filterAdminOrders()">
    <option value="all">All Statuses</option>
    <option value="pending">Pending</option>
    <option value="accepted">Accepted</option>
    <option value="preparing">Preparing</option>
    <option value="out_for_delivery">Out for Delivery</option>
    <option value="delivered">Delivered</option>
    <option value="cancelled">Cancelled</option>
  </select>
  <select class="form-input" id="a-type-filter" style="max-width:160px;padding:8px 12px" onchange="filterAdminOrders()">
    <option value="all">All Types</option>
    <option value="frozen">🧊 Frozen</option>
    <option value="cooked">🍳 Cooked</option>
  </select>
</div>
<div id="admin-orders-wrap">
  ${renderAdminOrderTable(getAllOrders())}
</div>`;
}

function aFrozenOrders() {
  const orders = getAllOrders().filter(o => o.orderType === 'frozen');
  return `
<div style="background:#E0F2FE;border-radius:14px;padding:14px 18px;margin-bottom:16px;font-size:.84rem;color:#0369A1;font-weight:600;border:1px solid #BAE6FD">
  🧊 Frozen orders: You accept the order, then mark it as delivered.
</div>
<div id="frozen-orders-wrap">${renderAdminOrderTable(orders)}</div>`;
}

function aCookedOrders() {
  const orders = getAllOrders().filter(o => o.orderType === 'cooked');
  return `
<div style="background:#FEF3C7;border-radius:14px;padding:14px 18px;margin-bottom:16px;font-size:.84rem;color:#92400E;font-weight:600;border:1px solid #FDE68A">
  🍳 Cooked orders: You accept → Cloud kitchen prepares & delivers. You can also directly mark delivered.
</div>
<div id="cooked-orders-wrap">${renderAdminOrderTable(orders)}</div>`;
}

function renderAdminOrderTable(orders) {
  if (!orders.length) return `<div class="dash-card" style="text-align:center;padding:32px;color:var(--text-muted)">No orders found.</div>`;
  return `<div class="dash-card"><div style="overflow-x:auto">
    <table class="dash-table">
      <thead><tr><th>Order</th><th>Type</th><th>Customer</th><th>Items</th><th>Amount</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>
        ${orders.map(o => {
          const m    = STATUS_META[o.status]||{};
          const next = getAdminNext(o);
          let nextLabel = '';
          if (next === 'accepted') nextLabel = '✅ Accept';
          else if (next === 'delivered') nextLabel = '🎉 Deliver';

          return `<tr>
            <td><strong>#${o.id}</strong></td>
            <td><span style="font-size:.72rem;background:${o.orderType==='cooked'?'#FEF3C7':'#E0F2FE'};color:${o.orderType==='cooked'?'#92400E':'#0369A1'};border-radius:50px;padding:2px 8px;font-weight:700">${o.orderType==='cooked'?'🍳':'🧊'}</span></td>
            <td>${o.userName}</td>
            <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${o.items.map(i=>`${i.emoji}×${i.qty}`).join(' ')}</td>
            <td>₹${o.total}</td>
            <td style="white-space:nowrap">${new Date(o.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</td>
            <td><span class="status-badge" style="background:${m.bg};color:${m.color}">${m.icon} ${m.label}</span></td>
            <td>
              <div style="display:flex;gap:6px;flex-wrap:wrap">
                ${next && o.status!=='cancelled' ? `<button class="action-btn outline" style="padding:4px 10px;font-size:.72rem" onclick="adminAdvance('${o.id}','${next}')">${nextLabel}</button>` : ''}
                ${o.status!=='cancelled' && o.status!=='delivered' ? `
                  <button class="action-btn primary" style="padding:4px 10px;font-size:.72rem;background:var(--green);border-color:var(--green)" onclick="adminToggleDel('${o.id}')">
                    🎉 Deliver
                  </button>` : ''}
                ${o.status==='delivered' ? `
                  <button class="action-btn ghost" style="padding:4px 10px;font-size:.72rem" onclick="adminToggleDel('${o.id}')">
                    ↩ Undo
                  </button>` : ''}
                ${['pending','accepted'].includes(o.status) ? `<button class="action-btn ghost" style="padding:4px 10px;font-size:.72rem;color:var(--red);border-color:var(--red)" onclick="adminCancelOrder('${o.id}')">Cancel</button>` : ''}
              </div>
            </td>
          </tr>`;}).join('')}
      </tbody>
    </table>
  </div></div>`;
}

function aUsers() {
  const users = getAllUsers();
  return `
<div style="margin-bottom:16px">
  <select class="form-input" id="user-role-filter" style="max-width:180px;padding:8px 12px" onchange="filterUsers()">
    <option value="all">All Roles</option>
    <option value="eater">Eaters</option>
    <option value="kitchen">Kitchens</option>
  </select>
</div>
<div class="dash-card" id="users-table">${renderUsersTable(users)}</div>`;
}

function renderUsersTable(users) {
  if (!users.length) return '<div style="text-align:center;padding:30px;color:var(--text-muted)">No users found.</div>';
  return `<div style="overflow-x:auto"><table class="dash-table">
    <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>City</th><th>Joined</th><th>Status</th></tr></thead>
    <tbody>
      ${users.filter(u=>u.role!=='admin').map(u=>`
      <tr>
        <td><strong>${u.firstName} ${u.lastName||''}</strong></td>
        <td>${u.email}</td>
        <td><span class="status-badge ${u.role==='kitchen'?'pending':'delivered'}">${{eater:'🍽️ Eater',kitchen:'🍳 Kitchen'}[u.role]||u.role}</span></td>
        <td>${u.city||'—'}</td>
        <td>${new Date(u.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'2-digit'})}</td>
        <td>${u.role==='kitchen'?`<span class="status-badge ${u.approved?'delivered':'cancelled'}">${u.approved?'Approved':'Pending'}</span>`:'<span class="status-badge delivered">Active</span>'}</td>
      </tr>`).join('')}
    </tbody>
  </table></div>`;
}

function aKitchens() {
  const kitchens = getUsersByRole('kitchen');
  if (!kitchens.length) return `<div class="dash-card" style="text-align:center;padding:40px;color:var(--text-muted)">No kitchen partners yet.</div>`;
  return `<div style="display:flex;flex-direction:column;gap:14px">
    ${kitchens.map(k => `
    <div class="approval-card">
      <div class="approval-avatar" style="font-size:1rem;font-weight:800">${(k.kitchenName||'K')[0]}</div>
      <div class="approval-info">
        <div class="approval-name">🍳 ${k.kitchenName||k.firstName+' Kitchen'}</div>
        <div class="approval-meta">📍 ${k.city||'—'} · 📧 ${k.email} · FSSAI: ${k.fssai||'N/A'}</div>
        <div class="approval-meta">Joined: ${new Date(k.createdAt).toLocaleDateString('en-IN')}</div>
      </div>
      <div class="approval-actions" style="flex-direction:column;gap:6px">
        <span class="status-badge ${k.approved?'delivered':'cancelled'}" style="margin-bottom:4px">${k.approved?'✅ Approved':'❌ Pending'}</span>
        <button class="approve-btn ${k.approved?'no':'yes'}" onclick="approveKitchen('${k.id}',${!k.approved})">
          ${k.approved?'Revoke':'Approve'}
        </button>
      </div>
    </div>`).join('')}
  </div>`;
}

function aComplaints() {
  const complaints = getAllComplaints();
  return `
<div class="admin-stats-grid" style="margin-bottom:20px">
  <div class="stat-card orange"><div class="sc-icon">🔴</div><div class="sc-value">${complaints.filter(c=>c.status==='open').length}</div><div class="sc-label">Open</div></div>
  <div class="stat-card blue"><div class="sc-icon">🟡</div><div class="sc-value">${complaints.filter(c=>c.status==='in_review').length}</div><div class="sc-label">In Review</div></div>
  <div class="stat-card green"><div class="sc-icon">🟢</div><div class="sc-value">${complaints.filter(c=>c.status==='resolved').length}</div><div class="sc-label">Resolved</div></div>
  <div class="stat-card purple"><div class="sc-icon">📢</div><div class="sc-value">${complaints.length}</div><div class="sc-label">Total</div></div>
</div>

${complaints.length ? `
<div style="margin-bottom:16px">
  <select class="form-input" id="cmp-filter" style="max-width:180px;padding:8px 12px" onchange="filterComplaints()">
    <option value="all">All Complaints</option>
    <option value="open">Open</option>
    <option value="in_review">In Review</option>
    <option value="resolved">Resolved</option>
  </select>
</div>
<div id="complaints-list" style="display:flex;flex-direction:column;gap:14px">
  ${complaints.map(c => complaintCard(c, false)).join('')}
</div>` : `<div class="dash-card" style="text-align:center;padding:48px;color:var(--text-muted)">
  <div style="font-size:3rem;margin-bottom:12px">📢</div>
  <div style="font-weight:700">No complaints yet — great job!</div>
</div>`}`;
}

function complaintCard(c, compact) {
  const sm = COMPLAINT_STATUS_META[c.status]||{};
  const catLabel = COMPLAINT_CATEGORIES.find(x=>x.value===c.category)?.label||c.category;
  return `
<div class="dash-card" style="padding:${compact?'14px 18px':'20px 24px'};border-left:3px solid ${sm.color}">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;margin-bottom:8px">
    <div>
      <span style="font-weight:700;color:var(--brown)">${c.subject}</span>
      <span style="font-size:.72rem;background:var(--cream);border-radius:50px;padding:2px 8px;margin-left:8px;color:var(--text-muted)">${catLabel}</span>
    </div>
    <span class="status-badge" style="background:${sm.bg};color:${sm.color}">${sm.icon} ${sm.label}</span>
  </div>
  <div style="font-size:.78rem;color:var(--text-muted);margin-bottom:8px">
    👤 ${c.userName} (${c.userEmail}) ${c.orderId?`· Order #${c.orderId}`:''} · ${new Date(c.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
  </div>
  <div style="font-size:.84rem;background:var(--cream);border-radius:10px;padding:10px 12px;margin-bottom:${compact?'0':'12px'}">${c.message}</div>
  ${!compact ? `
  ${c.adminResponse ? `<div style="font-size:.82rem;background:#DCFCE7;border-radius:10px;padding:10px 12px;border-left:3px solid var(--green);margin-bottom:12px"><strong>Your Response:</strong> ${c.adminResponse}</div>` : ''}
  <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
    <input class="form-input" id="reply-${c.id}" style="flex:1;min-width:180px;padding:8px 12px;font-size:.82rem" placeholder="Write a response to the user…" value="${c.adminResponse||''}">
    ${c.status!=='resolved'?`<button class="action-btn primary" style="padding:7px 14px;font-size:.78rem" onclick="adminReply('${c.id}','in_review')">📝 Save Reply</button>`:''}
    ${c.status!=='resolved'?`<button class="action-btn primary" style="padding:7px 14px;font-size:.78rem;background:var(--green);border-color:var(--green)" onclick="adminReply('${c.id}','resolved')">✅ Resolve</button>`:''}
    ${c.status==='resolved'?`<button class="action-btn ghost" style="padding:7px 14px;font-size:.78rem" onclick="adminReply('${c.id}','open')">↩ Re-open</button>`:''}
  </div>` : ''}
</div>`;
}

function aRevenue() {
  const orders = getAllOrders().filter(o=>o.status!=='cancelled');
  const gmv = orders.reduce((s,o)=>s+o.total,0);
  const frozen = orders.filter(o=>o.orderType==='frozen');
  const cooked = orders.filter(o=>o.orderType==='cooked');
  return `
<div class="revenue-grid">
  <div class="revenue-card"><div class="rc-label">Total GMV</div><div class="rc-value">₹${gmv.toLocaleString()}</div></div>
  <div class="revenue-card"><div class="rc-label">Platform Revenue (12%)</div><div class="rc-value">₹${Math.round(gmv*0.12).toLocaleString()}</div></div>
</div>
<div class="admin-stats-grid">
  <div class="stat-card blue"><div class="sc-icon">🧊</div><div class="sc-value">${frozen.length}</div><div class="sc-label">Frozen Orders</div><div class="sc-change">₹${frozen.reduce((s,o)=>s+o.total,0).toLocaleString()}</div></div>
  <div class="stat-card orange"><div class="sc-icon">🍳</div><div class="sc-value">${cooked.length}</div><div class="sc-label">Cooked Orders</div><div class="sc-change">₹${cooked.reduce((s,o)=>s+o.total,0).toLocaleString()}</div></div>
  <div class="stat-card green"><div class="sc-icon">👥</div><div class="sc-value">${getAllUsers().filter(u=>u.role==='eater').length}</div><div class="sc-label">Active Users</div></div>
  <div class="stat-card purple"><div class="sc-icon">✅</div><div class="sc-value">${orders.filter(o=>o.status==='delivered').length}</div><div class="sc-label">Delivered</div></div>
</div>`;
}

function aProducts() {
  const products = getProducts();
  return `
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:10px">
  <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:1.1rem;color:var(--brown)">🛍️ Product Catalog (${products.length} items)</div>
  <button class="action-btn primary" style="padding:8px 18px;font-size:.85rem" onclick="showAddProductForm()">
    ➕ Add New Product
  </button>
</div>

<!-- Add Product Form (hidden by default) -->
<div id="add-product-form" style="display:none;margin-bottom:20px">
  <div class="dash-card" style="border:2px solid var(--orange);padding:24px">
    <div style="font-weight:700;color:var(--brown);margin-bottom:16px;font-size:1rem">➕ Add New Product</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      <div class="form-group" style="margin:0"><label class="form-label">Product Name *</label><input class="form-input" id="ap-name" placeholder="e.g. Paneer Tikka"></div>
      <div class="form-group" style="margin:0"><label class="form-label">Price (₹) *</label><input class="form-input" id="ap-price" type="number" min="1" placeholder="199"></div>
      <div class="form-group" style="margin:0"><label class="form-label">Category</label><input class="form-input" id="ap-category" placeholder="e.g. Snacks, Tikka"></div>
      <div class="form-group" style="margin:0"><label class="form-label">Emoji</label><input class="form-input" id="ap-emoji" placeholder="🍢" maxlength="4"></div>
      <div class="form-group" style="margin:0"><label class="form-label">Badge</label><input class="form-input" id="ap-badge" placeholder="e.g. Bestseller, New"></div>
      <div class="form-group" style="margin:0">
        <label class="form-label">Image URL</label>
        <input class="form-input" id="ap-img" placeholder="https://... or leave empty">
      </div>
    </div>
    <div class="form-group" style="margin-top:14px"><label class="form-label">Description</label><textarea class="form-input" id="ap-desc" rows="2" placeholder="Short description of the product" style="resize:vertical"></textarea></div>
    <div class="form-group" style="margin-top:10px">
      <label class="form-label">Or Upload Image</label>
      <input type="file" id="ap-img-file" accept="image/*" style="font-size:.82rem" onchange="previewAddImage(this)">
      <div id="ap-img-preview" style="margin-top:8px"></div>
    </div>
    <div style="display:flex;gap:10px;margin-top:16px">
      <button class="action-btn primary" onclick="submitAddProduct()">✅ Add Product</button>
      <button class="action-btn ghost" onclick="hideAddProductForm()">Cancel</button>
    </div>
  </div>
</div>

<!-- Product List -->
<div id="product-list">
  ${products.map(p => productCard(p)).join('')}
</div>

<!-- Edit Product Modal (hidden) -->
<div id="edit-product-modal" style="display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.5);padding:20px;overflow-y:auto">
  <div style="max-width:560px;margin:40px auto;background:var(--cream);border-radius:20px;padding:28px 32px;box-shadow:0 20px 60px rgba(0,0,0,0.3)">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:1.1rem;color:var(--brown)">✏️ Edit Product</div>
      <button onclick="closeEditModal()" style="background:none;border:none;font-size:1.3rem;cursor:pointer;padding:4px">✕</button>
    </div>
    <div id="edit-product-fields"></div>
  </div>
</div>`;
}

function aSettings() {
  return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
  <div class="dash-card">
    <div class="dash-card-title">Platform Config</div>
    <div class="toggle-wrap"><div class="toggle-info"><div class="t-label">New Registrations</div><div class="t-desc">Allow new user accounts</div></div><div class="toggle on" onclick="this.classList.toggle('on')"></div></div>
    <div class="toggle-wrap"><div class="toggle-info"><div class="t-label">Kitchen Onboarding</div><div class="t-desc">Accept kitchen applications</div></div><div class="toggle on" onclick="this.classList.toggle('on')"></div></div>
    <div class="toggle-wrap"><div class="toggle-info"><div class="t-label">Cooked Orders</div><div class="t-desc">Enable cooked delivery option</div></div><div class="toggle on" onclick="this.classList.toggle('on')"></div></div>
    <div class="toggle-wrap"><div class="toggle-info"><div class="t-label">Maintenance Mode</div><div class="t-desc">Take platform offline</div></div><div class="toggle" onclick="this.classList.toggle('on')"></div></div>
  </div>
  <div class="dash-card">
    <div class="dash-card-title">Financial Settings</div>
    <div class="form-group"><label class="form-label">Platform Commission (%)</label><input class="form-input" value="12" type="number" min="0" max="100"></div>
    <div class="form-group"><label class="form-label">Min. Payout Threshold (₹)</label><input class="form-input" value="1000" type="number"></div>
    <div class="form-group"><label class="form-label">Free Delivery Threshold (₹)</label><input class="form-input" value="0" type="number"></div>
    <button class="action-btn primary" onclick="toast('✅ Settings saved!')">Save Settings</button>
  </div>
</div>`;
}

// ── Actions ────────────────────────────────────────────────────────────────────
window.adminAdvance = (orderId, status) => {
  updateStatus(orderId, status, 'admin');
  toast(`✅ #${orderId} → ${STATUS_META[status]?.label}`);
  showAdminView(activeView);
};

window.adminToggleDel = (orderId) => {
  const order = adminToggleDelivered(orderId);
  if (!order) return;
  toast(order.status === 'delivered'
    ? `🎉 #${orderId} marked as Delivered!`
    : `↩ #${orderId} delivery undone.`);
  showAdminView(activeView);
};

window.adminCancelOrder = (orderId) => {
  updateStatus(orderId, 'cancelled', 'admin');
  toast(`❌ Order #${orderId} cancelled.`);
  showAdminView(activeView);
};

window.approveKitchen = (userId, approve) => {
  setKitchenApproval(userId, approve);
  toast(approve ? '✅ Kitchen approved!' : '❌ Kitchen rejected.');
  showAdminView(activeView);
};

window.filterUsers = () => {
  const role = document.getElementById('user-role-filter')?.value||'all';
  const all  = getAllUsers().filter(u=>u.role!=='admin');
  const filt = role==='all' ? all : all.filter(u=>u.role===role);
  const el   = document.getElementById('users-table');
  if (el) el.innerHTML = renderUsersTable(filt);
};

window.filterAdminOrders = () => {
  const status = document.getElementById('a-order-filter')?.value||'all';
  const type   = document.getElementById('a-type-filter')?.value||'all';
  let orders   = getAllOrders();
  if (status!=='all') orders = orders.filter(o=>o.status===status);
  if (type!=='all')   orders = orders.filter(o=>o.orderType===type);
  const el = document.getElementById('admin-orders-wrap');
  if (el) el.innerHTML = renderAdminOrderTable(orders);
};

window.filterComplaints = () => {
  const status = document.getElementById('cmp-filter')?.value||'all';
  const all  = getAllComplaints();
  const filt = status==='all' ? all : all.filter(c=>c.status===status);
  const el   = document.getElementById('complaints-list');
  if (el) el.innerHTML = filt.map(c=>complaintCard(c,false)).join('');
};

window.adminReply = (cmpId, newStatus) => {
  const replyEl = document.getElementById(`reply-${cmpId}`);
  const reply   = replyEl?.value?.trim()||null;
  updateComplaintStatus(cmpId, newStatus, reply);
  toast(newStatus==='resolved' ? '✅ Complaint resolved!' : newStatus==='open' ? '↩ Complaint re-opened.' : '📝 Reply saved.');
  showAdminView('complaints');
};

window.adminToggleItem = (id, el) => {
  const p = toggleAvailability(id);
  el.classList.toggle('on', p?.available!==false);
  el.nextElementSibling.textContent = p?.available!==false?'Live':'Off';
  toast(`${p?.name} is now ${p?.available!==false?'live':'offline'}`);
};

window.adminUpdatePrice = (id, price) => {
  if (!price||isNaN(price)||Number(price)<1) return;
  updateProductPrice(id, price);
  toast(`💰 Price updated to ₹${price}`);
};

// ── Product card renderer ─────────────────────────────────────────────────────
function productCard(p) {
  return `
  <div class="dash-card" style="padding:16px 20px;margin-bottom:12px;display:flex;align-items:center;gap:16px;flex-wrap:wrap">
    <div style="width:72px;height:72px;border-radius:14px;overflow:hidden;flex-shrink:0;background:var(--orange-pale);display:flex;align-items:center;justify-content:center">
      ${p.img ? `<img src="${p.img}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span style="display:none;font-size:2rem">${p.emoji||'🍽️'}</span>` : `<span style="font-size:2rem">${p.emoji||'🍽️'}</span>`}
    </div>
    <div style="flex:1;min-width:160px">
      <div style="font-weight:700;color:var(--brown);font-size:.92rem">${p.emoji} ${p.name}</div>
      <div style="font-size:.76rem;color:var(--text-muted);margin-top:2px;max-width:340px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.desc||'—'}</div>
      <div style="display:flex;gap:8px;margin-top:4px;align-items:center;flex-wrap:wrap">
        <span style="font-size:.72rem;background:var(--orange-pale);color:var(--orange);border-radius:50px;padding:1px 8px;font-weight:600">${p.category||'—'}</span>
        ${p.badge ? `<span style="font-size:.68rem;background:#EEF2FF;color:#4338CA;border-radius:50px;padding:1px 7px;font-weight:600">${p.badge}</span>` : ''}
        <span style="font-size:.72rem;color:var(--text-muted)">⭐ ${p.rating||0} (${p.reviews||0})</span>
      </div>
    </div>
    <div style="font-family:'Syne',sans-serif;font-weight:800;color:var(--orange);font-size:1.05rem;min-width:60px">₹${p.price}</div>
    <div style="display:flex;align-items:center;gap:6px">
      <div class="toggle ${p.available!==false?'on':''}" onclick="adminToggleItem(${p.id},this)"></div>
      <span style="font-size:.72rem;color:var(--text-muted);min-width:22px">${p.available!==false?'Live':'Off'}</span>
    </div>
    <div style="display:flex;gap:6px">
      <button class="action-btn outline" style="padding:5px 12px;font-size:.76rem" onclick="openEditModal(${p.id})">✏️ Edit</button>
      <button class="action-btn ghost" style="padding:5px 12px;font-size:.76rem;color:var(--red);border-color:var(--red)" onclick="confirmDeleteProduct(${p.id})">🗑️</button>
    </div>
  </div>`;
}

// ── Add Product ───────────────────────────────────────────────────────────────
let _addProductImgData = '';

window.showAddProductForm = () => {
  const form = document.getElementById('add-product-form');
  if (form) form.style.display = 'block';
  _addProductImgData = '';
};

window.hideAddProductForm = () => {
  const form = document.getElementById('add-product-form');
  if (form) form.style.display = 'none';
  _addProductImgData = '';
};

window.previewAddImage = (input) => {
  const preview = document.getElementById('ap-img-preview');
  if (!preview || !input.files?.[0]) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    _addProductImgData = e.target.result;
    preview.innerHTML = `<img src="${_addProductImgData}" style="max-width:120px;max-height:80px;border-radius:10px;border:2px solid var(--orange)">`;
  };
  reader.readAsDataURL(input.files[0]);
};

window.submitAddProduct = () => {
  const name  = document.getElementById('ap-name')?.value?.trim();
  const price = document.getElementById('ap-price')?.value;
  if (!name) { toast('❌ Product name is required.'); return; }
  if (!price || Number(price) < 1) { toast('❌ Valid price is required.'); return; }

  const imgUrl = _addProductImgData || document.getElementById('ap-img')?.value?.trim() || '';

  addProduct({
    name,
    price: Number(price),
    category: document.getElementById('ap-category')?.value?.trim() || 'Uncategorized',
    emoji: document.getElementById('ap-emoji')?.value?.trim() || '🍽️',
    badge: document.getElementById('ap-badge')?.value?.trim() || '',
    desc: document.getElementById('ap-desc')?.value?.trim() || '',
    img: imgUrl,
  });

  toast(`✅ "${name}" added to catalog!`);
  _addProductImgData = '';
  showAdminView('products');
};

// ── Edit Product Modal ────────────────────────────────────────────────────────
let _editImgData = '';

window.openEditModal = (id) => {
  const p = getProducts().find(x => x.id === id);
  if (!p) return;
  _editImgData = '';

  const modal = document.getElementById('edit-product-modal');
  const fields = document.getElementById('edit-product-fields');
  if (!modal || !fields) return;

  fields.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      <div class="form-group" style="margin:0"><label class="form-label">Product Name</label><input class="form-input" id="ep-name" value="${p.name}"></div>
      <div class="form-group" style="margin:0"><label class="form-label">Price (₹)</label><input class="form-input" id="ep-price" type="number" min="1" value="${p.price}"></div>
      <div class="form-group" style="margin:0"><label class="form-label">Category</label><input class="form-input" id="ep-category" value="${p.category||''}"></div>
      <div class="form-group" style="margin:0"><label class="form-label">Emoji</label><input class="form-input" id="ep-emoji" value="${p.emoji||''}" maxlength="4"></div>
      <div class="form-group" style="margin:0"><label class="form-label">Badge</label><input class="form-input" id="ep-badge" value="${p.badge||''}"></div>
      <div class="form-group" style="margin:0"><label class="form-label">Rating</label><input class="form-input" id="ep-rating" type="number" step="0.1" min="0" max="5" value="${p.rating||0}"></div>
    </div>
    <div class="form-group" style="margin-top:14px"><label class="form-label">Description</label><textarea class="form-input" id="ep-desc" rows="2" style="resize:vertical">${p.desc||''}</textarea></div>

    <!-- Image Management -->
    <div style="margin-top:18px;padding:16px;background:var(--cream-dark,#f5efe6);border-radius:14px">
      <div style="font-weight:700;color:var(--brown);margin-bottom:10px;font-size:.88rem">🖼️ Product Image</div>
      <div style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap">
        <div id="ep-img-preview" style="width:100px;height:100px;border-radius:12px;overflow:hidden;border:2px dashed rgba(244,98,31,0.3);display:flex;align-items:center;justify-content:center;background:#fff;flex-shrink:0">
          ${p.img ? `<img src="${p.img}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML='<span style=\'font-size:2.5rem\'>${p.emoji||'🍽️'}</span>'">` : `<span style="font-size:2.5rem">${p.emoji||'🍽️'}</span>`}
        </div>
        <div style="flex:1;min-width:200px">
          <div class="form-group" style="margin:0 0 8px 0"><label class="form-label" style="font-size:.76rem">Image URL</label><input class="form-input" id="ep-img-url" value="${p.img||''}" placeholder="https://... paste image URL" style="font-size:.82rem"></div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <label style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:var(--orange);color:#fff;border-radius:8px;font-size:.78rem;font-weight:600;cursor:pointer">
              📁 Upload File
              <input type="file" id="ep-img-file" accept="image/*" style="display:none" onchange="previewEditImage(this)">
            </label>
            <button class="action-btn ghost" style="padding:5px 10px;font-size:.74rem;color:var(--red);border-color:var(--red)" onclick="clearEditImage()">🗑️ Remove Image</button>
          </div>
        </div>
      </div>
    </div>

    <div style="display:flex;gap:10px;margin-top:20px">
      <button class="action-btn primary" onclick="submitEditProduct(${p.id})">💾 Save Changes</button>
      <button class="action-btn ghost" onclick="closeEditModal()">Cancel</button>
    </div>
  `;
  modal.style.display = 'block';
};

window.closeEditModal = () => {
  const modal = document.getElementById('edit-product-modal');
  if (modal) modal.style.display = 'none';
  _editImgData = '';
};

window.previewEditImage = (input) => {
  const preview = document.getElementById('ep-img-preview');
  if (!preview || !input.files?.[0]) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    _editImgData = e.target.result;
    preview.innerHTML = `<img src="${_editImgData}" style="width:100%;height:100%;object-fit:cover">`;
    const urlInput = document.getElementById('ep-img-url');
    if (urlInput) urlInput.value = '';
  };
  reader.readAsDataURL(input.files[0]);
};

window.clearEditImage = () => {
  _editImgData = '';
  const urlInput = document.getElementById('ep-img-url');
  if (urlInput) urlInput.value = '';
  const preview = document.getElementById('ep-img-preview');
  if (preview) preview.innerHTML = '<span style="font-size:2.5rem;color:var(--text-muted)">🚫</span>';
};

window.submitEditProduct = (id) => {
  const name  = document.getElementById('ep-name')?.value?.trim();
  const price = document.getElementById('ep-price')?.value;
  if (!name) { toast('❌ Product name is required.'); return; }
  if (!price || Number(price) < 1) { toast('❌ Valid price is required.'); return; }

  // Determine image: uploaded file takes priority, then URL field, then empty = removed
  const urlVal = document.getElementById('ep-img-url')?.value?.trim() || '';
  const imgFinal = _editImgData || urlVal;

  updateProduct(id, {
    name,
    price: Number(price),
    category: document.getElementById('ep-category')?.value?.trim() || '',
    emoji: document.getElementById('ep-emoji')?.value?.trim() || '🍽️',
    badge: document.getElementById('ep-badge')?.value?.trim() || '',
    desc: document.getElementById('ep-desc')?.value?.trim() || '',
    rating: Number(document.getElementById('ep-rating')?.value) || 0,
    img: imgFinal,
  });

  toast(`✅ "${name}" updated!`);
  closeEditModal();
  showAdminView('products');
};

// ── Delete Product ────────────────────────────────────────────────────────────
window.confirmDeleteProduct = (id) => {
  const p = getProducts().find(x => x.id === id);
  if (!p) return;
  if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
  deleteProduct(id);
  toast(`🗑️ "${p.name}" deleted from catalog.`);
  showAdminView('products');
};
