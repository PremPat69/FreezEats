/**
 * pages/eaterDash.js — Eater (customer) dashboard
 * Includes: orders, live tracking, menu, profile, complaints.
 */

import { getState, setState } from '../store.js';
import { getOrdersByUser, cancelOrder, STATUS_META, getFlow } from '../db/orders.js';
import { getProducts } from '../db/products.js';
import { updateUser, getUserById } from '../db/auth.js';
import { submitComplaint, getComplaintsByUser, COMPLAINT_CATEGORIES, COMPLAINT_STATUS_META } from '../db/complaints.js';
import { toast } from '../components/toast.js';
import { navigate } from '../main.js';

let activeView = 'overview';

export function renderEaterDash() {
  const user = getState().currentUser;
  if (!user) { navigate('/login'); return ''; }

  return `
<div class="dashboard-layout" id="eater-layout">
  <div class="sidebar">
    <div class="sidebar-logo"><div class="sidebar-logo-text">Freeze<span>ats</span></div></div>
    <div class="sidebar-user">
      <div class="sidebar-avatar" id="e-avatar">🍽️</div>
      <div>
        <div class="sidebar-user-name" id="e-sname">${user.firstName} ${user.lastName || ''}</div>
        <div class="sidebar-user-role" id="e-srole">Food Lover${user.city ? ' · ' + user.city : ''}</div>
      </div>
    </div>
    <nav class="sidebar-nav">
      <div class="sidebar-section-label">Main</div>
      ${sl('overview','🏠','Overview')}
      ${sl('orders','📦','My Orders')}
      ${sl('menu','🛒','Browse Menu')}
      ${sl('subscription','🔁','Subscription')}
      <div class="sidebar-section-label" style="margin-top:16px">Account</div>
      ${sl('profile','👤','My Profile')}
      ${sl('complaints','📢','Complaints')}
    </nav>
    <div class="sidebar-footer">
      <div class="sidebar-logout" onclick="navigate('/')">🏠 Back to Home</div>
      <div class="sidebar-logout" onclick="doLogout()" style="color:var(--red)">🚪 Log Out</div>
    </div>
  </div>

  <div class="dashboard-main">
    <div class="dash-header">
      <div class="dash-header-title" id="e-page-title">Overview</div>
      <div class="dash-header-actions">
        <div class="dash-notif" onclick="eaterNav('complaints')" title="Complaints" style="cursor:pointer">📢</div>
      </div>
    </div>
    <div class="dash-body" id="eater-content"></div>
  </div>
</div>

<div class="mobile-bottom-nav">
  <div class="mobile-bottom-nav-inner">
    <div class="mb-nav-item active" onclick="eaterNav('overview',this)"><div class="mb-nav-icon">🏠</div><div class="mb-nav-label">Home</div></div>
    <div class="mb-nav-item" onclick="eaterNav('menu',this)"><div class="mb-nav-icon">🛒</div><div class="mb-nav-label">Menu</div></div>
    <div class="mb-nav-item" onclick="eaterNav('orders',this)"><div class="mb-nav-icon">📦</div><div class="mb-nav-label">Orders</div></div>
    <div class="mb-nav-item" onclick="eaterNav('complaints',this)"><div class="mb-nav-icon">📢</div><div class="mb-nav-label">Support</div></div>
    <div class="mb-nav-item" onclick="eaterNav('profile',this)"><div class="mb-nav-icon">👤</div><div class="mb-nav-label">Profile</div></div>
  </div>
</div>`;
}

function sl(view, icon, label) {
  return `<div class="sidebar-link" id="sl-${view}" onclick="eaterNav('${view}')"><span class="sl-icon">${icon}</span> ${label}</div>`;
}

export function onEaterMount() {
  showEaterView('overview');
  window.addEventListener('fz:ordersUpdated', () => {
    if (['orders','overview'].includes(activeView)) showEaterView(activeView);
  });
  window.addEventListener('fz:complaintsUpdated', () => {
    if (activeView === 'complaints') showEaterView('complaints');
  });
}

const VIEW_TITLES = { overview:'Overview', orders:'My Orders', menu:'Browse Menu',
  subscription:'Subscription', profile:'My Profile', complaints:'My Complaints & Support' };

window.eaterNav = (view, mobileBtn) => {
  activeView = view;
  document.querySelectorAll('#eater-layout .sidebar-link').forEach(l => l.classList.remove('active'));
  document.getElementById(`sl-${view}`)?.classList.add('active');
  document.getElementById('e-page-title').textContent = VIEW_TITLES[view] || view;
  if (mobileBtn) {
    document.querySelectorAll('.mobile-bottom-nav .mb-nav-item').forEach(b => b.classList.remove('active'));
    mobileBtn.classList.add('active');
  }
  showEaterView(view);
};

function showEaterView(view) {
  const el = document.getElementById('eater-content');
  if (!el) return;
  const views = { overview:viewOverview, orders:viewOrders, menu:viewMenu,
    subscription:viewSubscription, profile:viewProfile, complaints:viewComplaints };
  el.innerHTML = (views[view] || viewOverview)();
}

// ── Views ─────────────────────────────────────────────────────────────────────

function viewOverview() {
  const user   = getState().currentUser;
  const orders = getOrdersByUser(user.userId);
  const recent = orders[0];
  const delivered = orders.filter(o => o.status === 'delivered').length;

  return `
<div class="stats-row">
  <div class="stat-card orange"><div class="sc-icon">📦</div><div class="sc-value">${orders.length}</div><div class="sc-label">Total Orders</div></div>
  <div class="stat-card green"><div class="sc-icon">🎉</div><div class="sc-value">${delivered}</div><div class="sc-label">Delivered</div></div>
  <div class="stat-card blue"><div class="sc-icon">💰</div><div class="sc-value">₹${orders.reduce((s,o)=>s+o.total,0).toLocaleString()}</div><div class="sc-label">Total Spent</div></div>
  <div class="stat-card purple"><div class="sc-icon">🧊</div><div class="sc-value">${orders.filter(o=>o.orderType==='frozen').length}</div><div class="sc-label">Frozen Orders</div></div>
</div>

${recent ? `
<div class="tracking-bar">
  <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:6px">
    <div style="font-weight:700;color:var(--brown)">
      Latest — #${recent.id}
      <span style="font-size:.72rem;background:${recent.orderType==='cooked'?'#FEF3C7':'#E0F2FE'};color:${recent.orderType==='cooked'?'#92400E':'#0369A1'};border-radius:50px;padding:2px 8px;margin-left:8px;font-weight:600">
        ${recent.orderType === 'cooked' ? '🍳 Cooked' : '🧊 Frozen'}
      </span>
    </div>
    <span class="status-badge" style="background:${STATUS_META[recent.status]?.bg};color:${STATUS_META[recent.status]?.color}">
      ${STATUS_META[recent.status]?.icon} ${STATUS_META[recent.status]?.label}
    </span>
  </div>
  <div style="font-size:.82rem;color:var(--text-muted);margin-bottom:16px">
    ${recent.items.map(i=>`${i.emoji} ${i.name} ×${i.qty}`).join(' · ')} — ₹${recent.total}
  </div>
  ${trackingBar(recent)}
</div>` : `
<div class="dash-card" style="text-align:center;padding:48px">
  <div style="font-size:3rem;margin-bottom:12px">🛒</div>
  <div style="font-size:1.1rem;font-weight:700;color:var(--brown);margin-bottom:8px">No orders yet!</div>
  <div style="color:var(--text-muted);margin-bottom:20px">Start exploring our delicious frozen street food.</div>
  <button class="btn-primary" onclick="eaterNav('menu')">Browse Menu →</button>
</div>`}

<div class="dash-section-title">Quick Actions</div>
<div class="quick-actions">
  <div class="qa-card" onclick="eaterNav('menu')"><div class="qa-icon">🛒</div><div class="qa-label">Order Food</div></div>
  <div class="qa-card" onclick="eaterNav('orders')"><div class="qa-icon">📦</div><div class="qa-label">Track Orders</div></div>
  <div class="qa-card" onclick="eaterNav('complaints')"><div class="qa-icon">📢</div><div class="qa-label">Lodge Complaint</div></div>
  <div class="qa-card" onclick="eaterNav('profile')"><div class="qa-icon">👤</div><div class="qa-label">My Profile</div></div>
</div>`;
}

function trackingBar(order) {
  const flow = getFlow(order);
  const idx  = flow.indexOf(order.status);
  return `
<div class="tracking-steps">
  ${flow.map((s, i) => {
    const done   = i < idx || order.status === 'delivered';
    const active = s === order.status && s !== 'delivered';
    return `
      <div class="tracking-step">
        <div class="tracking-dot ${done?'done':active?'active':''}">${STATUS_META[s]?.icon||'○'}</div>
        <div class="tracking-label ${active?'active':''}" style="font-size:.62rem">${STATUS_META[s]?.label}</div>
      </div>
      ${i < flow.length-1 ? `<div class="tracking-line ${i<idx?'done':''}"></div>` : ''}`;
  }).join('')}
</div>`;
}

function viewOrders() {
  const user   = getState().currentUser;
  const orders = getOrdersByUser(user.userId);
  if (!orders.length) return `
    <div class="dash-card" style="text-align:center;padding:48px">
      <div style="font-size:3rem;margin-bottom:12px">📦</div>
      <div style="font-size:1.1rem;font-weight:700;color:var(--brown);margin-bottom:8px">No orders yet</div>
      <button class="btn-primary" onclick="eaterNav('menu')">Start Ordering →</button>
    </div>`;

  return `<div style="display:flex;flex-direction:column;gap:14px">
    ${orders.map(o => {
      const m = STATUS_META[o.status] || {};
      return `
      <div class="dash-card" style="padding:20px 24px">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-family:'Syne',sans-serif;font-weight:800;color:var(--brown)">#${o.id}</span>
            <span style="font-size:.7rem;background:${o.orderType==='cooked'?'#FEF3C7':'#E0F2FE'};color:${o.orderType==='cooked'?'#92400E':'#0369A1'};border-radius:50px;padding:2px 8px;font-weight:700">
              ${o.orderType==='cooked'?'🍳 Cooked':'🧊 Frozen'}
            </span>
            <span style="font-size:.76rem;color:var(--text-muted)">${new Date(o.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span>
          </div>
          <span class="status-badge" style="background:${m.bg};color:${m.color};border:1px solid ${m.color}30">${m.icon} ${m.label}</span>
        </div>
        <div style="font-size:.86rem;color:var(--text-muted);margin-bottom:14px">${o.items.map(i=>`${i.emoji} ${i.name} ×${i.qty}`).join(' · ')}</div>
        <div style="margin-bottom:14px">${trackingBar(o)}</div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div style="font-family:'Syne',sans-serif;font-weight:800;color:var(--orange);font-size:1.05rem">₹${o.total}</div>
          <div style="display:flex;gap:8px">
            ${o.status==='delivered' ? `<button class="action-btn outline" onclick="reorder('${o.id}')">🔁 Reorder</button>` : ''}
            ${['pending','accepted'].includes(o.status) ? `<button class="action-btn ghost" style="color:var(--red);border-color:var(--red)" onclick="cancelMyOrder('${o.id}')">Cancel</button>` : ''}
            <button class="action-btn ghost" onclick="raiseComplaint('${o.id}')">📢 Complaint</button>
          </div>
        </div>
      </div>`;}).join('')}
  </div>`;
}

function viewMenu() {
  return `
<div style="margin-bottom:20px;padding:16px;background:var(--orange-pale);border-radius:16px;border:1px solid rgba(244,98,31,0.2)">
  <div style="font-weight:700;color:var(--brown);margin-bottom:4px">🛒 Add items to cart — then choose Frozen or Cooked at checkout!</div>
  <div style="font-size:.82rem;color:var(--text-muted)">🧊 <strong>Frozen:</strong> Delivered as-is direct from us. 🍳 <strong>Cooked:</strong> Sent to a cloud kitchen, cooked fresh, delivered hot.</div>
</div>
<div class="products-grid" style="margin-top:0">
  ${getProducts().map(p => `
    <div class="product-card" onclick="openProductModal(${p.id})" style="cursor:pointer">
      <div class="product-img-wrap">
        <img src="${p.img}" alt="${p.name}" class="product-photo" loading="lazy"
          onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <div style="display:none;font-size:4rem;align-items:center;justify-content:center;width:100%;height:100%;background:var(--orange-pale)">${p.emoji}</div>
        <span class="product-badge">${p.badge}</span>
      </div>
      <div class="product-body">
        <div class="product-name">${p.emoji} ${p.name}</div>
        <div class="product-desc">${p.desc}</div>
        <div class="product-rating"><span class="stars">${'★'.repeat(Math.floor(p.rating))}</span> ${p.rating}</div>
        <div class="product-footer">
          <div class="product-price">₹${p.price}</div>
          <button class="add-btn" onclick="event.stopPropagation();window._cart.add(${p.id})">+ Add</button>
        </div>
      </div>
    </div>`).join('')}
</div>`;
}

function viewSubscription() {
  return `<div class="dash-card">
  <div class="dash-card-title">Subscription Plans</div>
  <div class="sub-plans">
    ${[
      {name:'Weekly Snack Box',desc:'15 items · Free delivery · Cancel anytime',price:'₹499/wk',active:true},
      {name:'Monthly Family Pack',desc:'60 items · Priority delivery · Exclusive flavours',price:'₹1,799/mo'},
      {name:'Bulk — Hostel & Café',desc:'200+ items · Custom branding · Account manager',price:'Custom'},
    ].map(p=>`<div class="sub-plan ${p.active?'active':''}" onclick="this.closest('.sub-plans').querySelectorAll('.sub-plan').forEach(x=>x.classList.remove('active'));this.classList.add('active')">
      <div class="plan-check"></div>
      <div><div class="plan-name">${p.name}</div><div class="plan-desc">${p.desc}</div></div>
      <div class="plan-price">${p.price}</div>
    </div>`).join('')}
  </div>
  <button class="action-btn primary" style="margin-top:20px" onclick="toast('✅ Subscription updated!')">Update Plan</button>
</div>`;
}

function viewProfile() {
  const user = getState().currentUser;
  const full = getUserById(user.userId) || {};
  return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;flex-wrap:wrap">
  <div class="dash-card">
    <div class="dash-card-title">Personal Details</div>
    <div class="form-group"><label class="form-label">First Name</label><input class="form-input" id="pf-fname" value="${full.firstName||''}"></div>
    <div class="form-group"><label class="form-label">Last Name</label><input class="form-input" id="pf-lname" value="${full.lastName||''}"></div>
    <div class="form-group"><label class="form-label">Email</label><input class="form-input" value="${full.email||''}" disabled style="opacity:.6"></div>
    <div class="form-group"><label class="form-label">Phone</label><input class="form-input" id="pf-phone" value="${full.phone||''}" placeholder="+91 98765 43210"></div>
    <div class="form-group"><label class="form-label">City</label><input class="form-input" id="pf-city" value="${full.city||''}" placeholder="Mumbai"></div>
    <button class="action-btn primary" onclick="saveProfile()">💾 Save Changes</button>
  </div>
  <div class="dash-card">
    <div class="dash-card-title">Change Password</div>
    <div class="form-group"><label class="form-label">Current Password</label><input class="form-input" id="pf-oldpwd" type="password"></div>
    <div class="form-group"><label class="form-label">New Password</label><input class="form-input" id="pf-newpwd" type="password" placeholder="Min. 6 characters"></div>
    <div class="form-group"><label class="form-label">Confirm New Password</label><input class="form-input" id="pf-confirmpwd" type="password"></div>
    <button class="action-btn primary" onclick="changePassword()">🔒 Change Password</button>
  </div>
</div>`;
}

function viewComplaints() {
  const user       = getState().currentUser;
  const complaints = getComplaintsByUser(user.userId);
  const orders     = getOrdersByUser(user.userId);

  return `
<div class="dash-card" style="margin-bottom:20px">
  <div class="dash-card-title">📢 Lodge a Complaint</div>
  <div class="form-group">
    <label class="form-label">Category</label>
    <select class="form-input" id="cmp-category" style="appearance:auto">
      ${COMPLAINT_CATEGORIES.map(c=>`<option value="${c.value}">${c.label}</option>`).join('')}
    </select>
  </div>
  <div class="form-group">
    <label class="form-label">Related Order (optional)</label>
    <select class="form-input" id="cmp-order" style="appearance:auto">
      <option value="">— None —</option>
      ${orders.map(o=>`<option value="${o.id}">#${o.id} · ₹${o.total} · ${new Date(o.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</option>`).join('')}
    </select>
  </div>
  <div class="form-group">
    <label class="form-label">Subject *</label>
    <input class="form-input" id="cmp-subject" placeholder="Brief description of your issue">
  </div>
  <div class="form-group">
    <label class="form-label">Message *</label>
    <textarea class="form-input" id="cmp-message" rows="4" placeholder="Describe your issue in detail..." style="resize:vertical;min-height:90px"></textarea>
  </div>
  <div id="cmp-error" class="form-error" style="display:none"></div>
  <button class="action-btn primary" onclick="submitCmp()">📤 Submit Complaint</button>
</div>

${complaints.length ? `
<div class="dash-section-title">Your Complaints (${complaints.length})</div>
<div style="display:flex;flex-direction:column;gap:12px">
  ${complaints.map(c => {
    const sm = COMPLAINT_STATUS_META[c.status];
    return `
    <div class="dash-card" style="padding:18px 22px;border-left:3px solid ${sm.color}">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px">
        <span style="font-weight:700;color:var(--brown);font-size:.9rem">${c.subject}</span>
        <span class="status-badge" style="background:${sm.bg};color:${sm.color}">${sm.icon} ${sm.label}</span>
      </div>
      <div style="font-size:.78rem;color:var(--text-muted);margin-bottom:8px">
        ${COMPLAINT_CATEGORIES.find(x=>x.value===c.category)?.label || c.category}
        ${c.orderId ? ` · Order #${c.orderId}` : ''} · ${new Date(c.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
      </div>
      <div style="font-size:.84rem;color:var(--text);background:var(--cream);border-radius:10px;padding:10px 12px;margin-bottom:${c.adminResponse?'10px':'0'}">${c.message}</div>
      ${c.adminResponse ? `<div style="font-size:.82rem;background:#DCFCE7;border-radius:10px;padding:10px 12px;border-left:3px solid var(--green)"><strong>Admin Reply:</strong> ${c.adminResponse}</div>` : ''}
    </div>`;}).join('')}
</div>` : ''}`;
}

// ── Actions ───────────────────────────────────────────────────────────────────

window.cancelMyOrder = (orderId) => {
  const user = getState().currentUser;
  const result = cancelOrder(orderId, user.userId);
  if (result.ok) { toast('✅ Order cancelled.'); showEaterView('orders'); }
  else toast('❌ ' + result.error);
};

window.reorder = (orderId) => {
  import('../db/orders.js').then(({ getOrderById }) => {
    const order = getOrderById(orderId);
    if (!order) return;
    order.items.forEach(item => window._cart.add(item.id, item.qty));
    toast('🔁 Items added to cart!');
    window._cart.open();
  });
};

window.raiseComplaint = (orderId) => {
  eaterNav('complaints');
  setTimeout(() => {
    const sel = document.getElementById('cmp-order');
    if (sel) sel.value = orderId;
  }, 100);
};

window.submitCmp = () => {
  const user    = getState().currentUser;
  const errEl   = document.getElementById('cmp-error');
  const subject = document.getElementById('cmp-subject')?.value?.trim();
  const message = document.getElementById('cmp-message')?.value?.trim();
  errEl.style.display = 'none';
  if (!subject || !message) { errEl.textContent = 'Subject and message are required.'; errEl.style.display='block'; return; }

  const result = submitComplaint({
    userId:    user.userId,
    userName:  `${user.firstName} ${user.lastName||''}`.trim(),
    userEmail: user.email,
    orderId:   document.getElementById('cmp-order')?.value || null,
    category:  document.getElementById('cmp-category')?.value,
    subject, message,
  });

  if (result.ok) {
    toast('📢 Complaint submitted! Admin will respond soon.');
    document.getElementById('cmp-subject').value = '';
    document.getElementById('cmp-message').value = '';
    showEaterView('complaints');
  } else { errEl.textContent = result.error; errEl.style.display='block'; }
};

window.saveProfile = () => {
  const user = getState().currentUser;
  const updates = {
    firstName: document.getElementById('pf-fname')?.value?.trim(),
    lastName:  document.getElementById('pf-lname')?.value?.trim(),
    phone:     document.getElementById('pf-phone')?.value?.trim(),
    city:      document.getElementById('pf-city')?.value?.trim(),
  };
  if (!updates.firstName) { toast('❌ First name cannot be empty.'); return; }
  updateUser(user.userId, updates);
  setState({ currentUser: { ...getState().currentUser, ...updates } });
  import('../components/nav.js').then(({ renderNav }) => renderNav());
  toast('✅ Profile updated!');
  document.getElementById('e-sname').textContent = `${updates.firstName} ${updates.lastName}`;
};

window.changePassword = () => {
  const user = getState().currentUser;
  const old  = document.getElementById('pf-oldpwd')?.value;
  const newp = document.getElementById('pf-newpwd')?.value;
  const conf = document.getElementById('pf-confirmpwd')?.value;
  if (!old || !newp) { toast('❌ Fill all password fields.'); return; }
  if (newp !== conf)  { toast('❌ New passwords do not match.'); return; }
  if (newp.length < 6){ toast('❌ Password must be ≥ 6 characters.'); return; }
  import('../db/auth.js').then(({ login: chk, updateUser: upd }) => {
    if (!chk(user.email, old).ok) { toast('❌ Current password is incorrect.'); return; }
    const h = (s) => { let h=5381; for(let i=0;i<s.length;i++) h=Math.imul(h*33,1)^s.charCodeAt(i); return (h>>>0).toString(36); };
    upd(user.userId, { passwordHash: h(newp) });
    toast('🔒 Password changed!');
    ['pf-oldpwd','pf-newpwd','pf-confirmpwd'].forEach(id => { const e=document.getElementById(id); if(e)e.value=''; });
  });
};
