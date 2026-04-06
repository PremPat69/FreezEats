/**
 * components/nav.js — Top nav + mobile drawer
 * Reacts to auth state changes automatically.
 */

import { navigate } from '../main.js';
import { getState, subscribe } from '../store.js';

export function initNav() {
  const navEl = document.createElement('nav');
  navEl.id = 'main-nav';
  document.getElementById('persistent').prepend(navEl);
  renderNav();
  initDrawer();

  // Re-render nav when user changes
  subscribe('currentUser', () => renderNav());

  window.addEventListener('scroll', () => {
    navEl.classList.toggle('scrolled', window.scrollY > 40);
  });

  // Close dropdown on outside click
  document.addEventListener('click', e => {
    if (!e.target.closest('.user-dropdown-wrap'))
      document.getElementById('user-dropdown')?.classList.remove('open');
  });

  // Expose to global for inline onclick
  window._nav = { closeDrawer, openDrawer };
}

export function renderNav() {
  const nav = document.getElementById('main-nav');
  if (!nav) return;
  const user = getState().currentUser;

  nav.innerHTML = `
    <div class="nav-logo" onclick="navigate('/')">Freeze<span>ats</span></div>
    <ul class="nav-links" id="nav-links-list">
      <li><a onclick="navigate('/')">Home</a></li>
      <li><a onclick="scrollToIfLanding('#products')">Products</a></li>
      <li><a onclick="scrollToIfLanding('#subscription')">Subscribe</a></li>
      <li><a onclick="scrollToIfLanding('#testimonials')">Reviews</a></li>
    </ul>
    <div class="nav-desktop-actions">
      ${user ? loggedInNav(user) : guestNav()}
      <div class="nav-cart" onclick="window._cart.open()">🛒<span class="cart-count" id="cart-count">0</span></div>
    </div>
    <div style="display:flex;align-items:center;gap:10px">
      <div class="nav-cart" onclick="window._cart.open()">🛒<span class="cart-count" id="cart-count-mobile">0</span></div>
      <div class="hamburger" id="hamburger" onclick="openDrawer()"><span></span><span></span><span></span></div>
    </div>
  `;

  // Update cart counts
  updateCartBadge(getState().cartCount);

  // Mount drawer content
  renderDrawer(user);
}

function guestNav() {
  return `
    <button class="nav-cta outline" onclick="navigate('/login')">Log In</button>
    <button class="nav-cta" onclick="navigate('/signup')">Sign Up Free</button>
  `;
}

function loggedInNav(user) {
  const emoji = roleEmoji(user.role);
  const roleLabel = { eater:'Food Lover', kitchen:'Cloud Kitchen', admin:'Admin' }[user.role] || user.role;
  return `
    <div class="user-dropdown-wrap">
      <div class="user-nav-btn" onclick="toggleDropdown()">
        <div class="user-nav-avatar">${emoji}</div>
        <span class="user-nav-name">${user.firstName}</span>
        <span style="font-size:.7rem;color:var(--text-muted)">▾</span>
      </div>
      <div class="user-dropdown" id="user-dropdown">
        <div class="dropdown-header">
          <div class="dropdown-name">${user.firstName} ${user.lastName || ''}</div>
          <div class="dropdown-role">${roleLabel}</div>
        </div>
        <div class="dropdown-item" onclick="goDashboard()"><span class="di-icon">📊</span> My Dashboard</div>
        <div class="dropdown-item" onclick="scrollToIfLanding('#products');toggleDropdown()"><span class="di-icon">🛒</span> Browse Menu</div>
        <div class="dropdown-divider"></div>
        <div class="dropdown-item danger" onclick="doLogout()"><span class="di-icon">🚪</span> Log Out</div>
      </div>
    </div>
  `;
}

function initDrawer() {
  const drawer = document.getElementById('mobile-drawer');
  if (!drawer) return;
  drawer.innerHTML = `
    <div class="drawer-header">
      <div class="drawer-logo">Freeze<span>ats</span></div>
      <div class="drawer-close" onclick="window._nav.closeDrawer()">✕</div>
    </div>
    <div class="drawer-nav" id="drawer-nav-links"></div>
    <div class="drawer-footer" id="drawer-footer"></div>
  `;
}

function renderDrawer(user) {
  const linksEl = document.getElementById('drawer-nav-links');
  const footerEl = document.getElementById('drawer-footer');
  if (!linksEl || !footerEl) return;

  linksEl.innerHTML = `
    <div class="drawer-link" onclick="navigate('/');window._nav.closeDrawer()"><span class="dl-icon">🏠</span> Home</div>
    <div class="drawer-link" onclick="scrollToIfLanding('#products');window._nav.closeDrawer()"><span class="dl-icon">🛒</span> Products</div>
    <div class="drawer-link" onclick="scrollToIfLanding('#subscription');window._nav.closeDrawer()"><span class="dl-icon">🔁</span> Subscribe</div>
    ${user ? `<div class="drawer-link" onclick="goDashboard();window._nav.closeDrawer()"><span class="dl-icon">📊</span> My Dashboard</div>` : ''}
  `;

  footerEl.innerHTML = user
    ? `<button class="auth-submit-btn" style="margin:0" onclick="doLogout()">🚪 Log Out</button>`
    : `
      <button class="auth-submit-btn" style="margin:0;margin-bottom:8px" onclick="navigate('/signup');window._nav.closeDrawer()">Sign Up Free</button>
      <button style="width:100%;padding:12px;border-radius:14px;border:1.5px solid rgba(244,98,31,0.3);background:transparent;font-family:'DM Sans',sans-serif;font-size:.95rem;font-weight:600;color:var(--orange);cursor:pointer" onclick="navigate('/login');window._nav.closeDrawer()">Log In</button>
    `;
}

export function updateCartBadge(count) {
  document.querySelectorAll('#cart-count, #cart-count-mobile').forEach(el => {
    if (el) el.textContent = count;
  });
}

function openDrawer() {
  document.getElementById('mobile-drawer')?.classList.add('open');
  document.getElementById('drawer-overlay')?.classList.add('visible');
  document.getElementById('hamburger')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeDrawer() {
  document.getElementById('mobile-drawer')?.classList.remove('open');
  document.getElementById('drawer-overlay')?.classList.remove('visible');
  document.getElementById('hamburger')?.classList.remove('open');
  document.body.style.overflow = '';
}

// Globals needed by inline onclick
window.toggleDropdown = () => document.getElementById('user-dropdown')?.classList.toggle('open');
window.goDashboard = () => {
  const user = getState().currentUser;
  if (!user) { navigate('/login'); return; }
  document.getElementById('user-dropdown')?.classList.remove('open');
  navigate(`/dashboard/${user.role}`);
};
window.scrollToIfLanding = (sel) => {
  if (window.location.hash.replace('#','') !== '/') { navigate('/'); }
  setTimeout(() => document.querySelector(sel)?.scrollIntoView({ behavior:'smooth' }), 150);
};

function roleEmoji(role) {
  return { eater:'🍽️', kitchen:'🍳', admin:'⚙️' }[role] || '👤';
}
