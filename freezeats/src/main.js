/**
 * main.js — App entry point
 * Hash-based router + persistent components initialization
 */

import './style.css';
import { getSession, clearSession } from './db/auth.js';
import { getState, setState } from './store.js';
import { initNav, renderNav } from './components/nav.js';
import { initCart } from './components/cart.js';
import { initModal } from './components/modal.js';
import { toast } from './components/toast.js';
import { renderLanding, onLandingMount } from './pages/landing.js';
import { renderLogin } from './pages/login.js';
import { renderSignup } from './pages/signup.js';
import { renderEaterDash, onEaterMount } from './pages/eaterDash.js';
import { renderKitchenDash, onKitchenMount } from './pages/kitchenDash.js';
import { renderAdminDash, onAdminMount } from './pages/adminDash.js';

// ── Splash ────────────────────────────────────────────────────────────────────

function hideSplash() {
  const splash = document.getElementById('splash');
  if (splash) {
    splash.classList.add('hidden');
    setTimeout(() => { splash.style.display = 'none'; }, 700);
  }
}
if (document.readyState === 'complete') setTimeout(hideSplash, 800);
else { window.addEventListener('load', () => setTimeout(hideSplash, 800)); setTimeout(hideSplash, 3000); }

// ── Router ────────────────────────────────────────────────────────────────────

const routes = {
  '/':                  { render: renderLanding,    mount: onLandingMount,   auth: false,       nav: 'landing' },
  '/login':             { render: renderLogin,       mount: null,             auth: false,       nav: 'auth' },
  '/signup':            { render: renderSignup,      mount: null,             auth: false,       nav: 'auth' },
  '/dashboard/eater':   { render: renderEaterDash,   mount: onEaterMount,     auth: 'eater',     nav: 'dash' },
  '/dashboard/kitchen': { render: renderKitchenDash, mount: onKitchenMount,   auth: 'kitchen',   nav: 'dash' },
  '/dashboard/admin':   { render: renderAdminDash,   mount: onAdminMount,     auth: 'admin',     nav: 'dash' },
};

export function navigate(path) {
  history.pushState(null, '', '#' + path);
  routeTo(path);
}

function currentPath() {
  const hash = window.location.hash.slice(1) || '/';
  return hash || '/';
}

function routeTo(path) {
  const route = routes[path] || routes['/'];
  const user = getState().currentUser;
  const app = document.getElementById('app');
  if (!app) return;

  // Auth guard
  if (route.auth) {
    if (!user) { navigate('/login'); return; }
    if (route.auth !== true && user.role !== route.auth) {
      navigate(`/dashboard/${user.role}`); return;
    }
  }

  // Redirect logged-in users away from auth pages
  if ((path === '/login' || path === '/signup') && user) {
    navigate(`/dashboard/${user.role}`); return;
  }

  // Toggle nav/persistent visibility
  const navEl = document.getElementById('main-nav');
  const announceBar = document.querySelector('.announce-bar');
  if (navEl) navEl.style.display = route.nav === 'dash' ? 'none' : '';
  if (announceBar) announceBar.style.display = route.nav === 'landing' ? '' : 'none';

  // Render page
  app.innerHTML = route.render();
  window.scrollTo(0, 0);

  // Run mount hook
  if (route.mount) route.mount();
}

// ── Init ──────────────────────────────────────────────────────────────────────

function init() {
  // Restore session
  const session = getSession();
  if (session) setState({ currentUser: session });

  // Init persistent components
  initNav();
  initCart();
  initModal();

  // Handle browser back/forward
  window.addEventListener('popstate', () => routeTo(currentPath()));

  // Route to current path
  routeTo(currentPath());

  // ESC key closes modals
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      window._modal?.close?.();
      window._cart?.close?.();
      window._nav?.closeDrawer?.();
    }
  });
}

// ── Globals needed by inline handlers ────────────────────────────────────────

window.navigate = navigate;
window.toast = toast;
window.showToast = toast; // alias

window.doLogout = () => {
  clearSession();
  setState({ currentUser: null });
  renderNav();
  toast('👋 Logged out. See you soon!');
  navigate('/');
};

// Start
init();
