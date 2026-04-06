/**
 * pages/login.js — Login page
 * Admin: username "admin" / password "modih123"
 */

import { login, saveSession } from '../db/auth.js';
import { setState } from '../store.js';
import { toast } from '../components/toast.js';
import { navigate } from '../main.js';

let selectedRole = 'eater';

export function renderLogin() {
  selectedRole = 'eater';
  return `
<div class="auth-page">
  <div class="auth-left">
    <div class="auth-left-bg">
      <img src="https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=900&q=85&fit=crop"
        alt="Food" onerror="this.style.display='none'">
      <div class="auth-left-bg-overlay"></div>
    </div>
    <div class="auth-brand">
      <div class="auth-brand-logo" onclick="navigate('/')">Freeze<span>ats</span></div>
      <div class="auth-brand-tagline">Street Food. Anytime. Anywhere.</div>
    </div>
    <div class="auth-left-content">
      <div class="auth-left-title">Welcome<br><em>back,</em><br>food lover 🔥</div>
      <div class="auth-left-desc">Log in to access your orders, track deliveries, manage your cloud kitchen, or the admin panel.</div>
      <div class="auth-feature-list">
        <div class="auth-feature"><div class="auth-feature-icon">📦</div> Track your orders in real-time</div>
        <div class="auth-feature"><div class="auth-feature-icon">🔁</div> Reorder your favourites instantly</div>
        <div class="auth-feature"><div class="auth-feature-icon">🎁</div> Exclusive deals for members</div>
        <div class="auth-feature"><div class="auth-feature-icon">🍳</div> Kitchen partners: manage menus &amp; orders</div>
      </div>
    </div>
    <div class="auth-left-footer">© 2025 Freezeats · FSSAI Certified · Made in India</div>
  </div>

  <div style="display:flex;flex-direction:column;justify-content:center;align-items:center;flex:1;padding:40px;min-height:100vh;overflow-y:auto;background:var(--cream)">
    <div class="auth-right">
      <div class="auth-tabs">
        <button class="auth-tab active">Log In</button>
        <button class="auth-tab" onclick="navigate('/signup')">Sign Up</button>
      </div>
      <div class="auth-form-title">Sign in to Freezeats</div>
      <div class="auth-form-sub">Use your email or username to continue.</div>

      <div class="form-group">
        <label class="form-label">Email / Username</label>
        <input class="form-input" id="login-email" type="text"
          placeholder="you@example.com or admin" autocomplete="username">
      </div>
      <div class="form-group">
        <label class="form-label">Password</label>
        <div style="position:relative">
          <input class="form-input" id="login-password" type="password"
            placeholder="Enter your password" style="padding-right:44px" autocomplete="current-password">
          <span onclick="togglePwd('login-password',this)"
            style="position:absolute;right:14px;top:50%;transform:translateY(-50%);cursor:pointer;font-size:1.1rem;opacity:.5;user-select:none">👁</span>
        </div>
      </div>

      <!-- Role selector -->
      <div style="margin-bottom:20px">
        <div style="font-size:.8rem;font-weight:600;color:var(--brown);margin-bottom:10px">Log in as:</div>
        <div class="role-selector" id="login-role-selector">
          <div class="role-btn active" onclick="loginSelectRole(this,'eater')">
            <span class="role-icon">🍽️</span><div class="role-name">Eater</div>
          </div>
          <div class="role-btn" onclick="loginSelectRole(this,'kitchen')">
            <span class="role-icon">🍳</span><div class="role-name">Kitchen</div>
          </div>
          <div class="role-btn" onclick="loginSelectRole(this,'admin')">
            <span class="role-icon">⚙️</span><div class="role-name">Admin</div>
          </div>
        </div>
      </div>

      <!-- Admin hint (shown when admin role selected) -->
      <div id="admin-hint" style="display:none;background:var(--orange-pale);border:1px solid rgba(244,98,31,0.25);border-radius:12px;padding:12px 14px;font-size:.8rem;color:var(--brown);margin-bottom:14px">
        🔐 <strong>Admin login:</strong> use username <code style="background:rgba(0,0,0,0.06);padding:1px 5px;border-radius:4px">admin</code> as the username field.
      </div>

      <div id="login-error" class="form-error" style="display:none"></div>
      <button class="auth-submit-btn" id="login-btn" onclick="submitLogin()">Log In →</button>

      <div class="auth-divider"><span></span><p>quick demo access</p><span></span></div>
      <div class="social-logins">
        <button class="social-login-btn" onclick="demoLogin('eater')">🍽️ Demo Eater</button>
        <button class="social-login-btn" onclick="demoLogin('kitchen')">🍳 Demo Kitchen</button>
      </div>
      <div class="auth-switch">Don't have an account? <a onclick="navigate('/signup')" style="color:var(--orange);cursor:pointer;font-weight:600">Sign up free →</a></div>
    </div>
  </div>
</div>`;
}

window.loginSelectRole = (el, role) => {
  selectedRole = role;
  el.closest('.role-selector').querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  const hint = document.getElementById('admin-hint');
  if (hint) hint.style.display = role === 'admin' ? 'block' : 'none';
};

window.submitLogin = () => {
  const emailVal = document.getElementById('login-email')?.value?.trim();
  const password  = document.getElementById('login-password')?.value;
  const errEl = document.getElementById('login-error');
  const btn   = document.getElementById('login-btn');

  errEl.style.display = 'none';
  if (!emailVal || !password) { showErr(errEl, 'Please enter your username/email and password.'); return; }

  btn.textContent = 'Logging in…'; btn.disabled = true;
  setTimeout(() => {
    const result = login(emailVal, password, selectedRole);
    btn.textContent = 'Log In →'; btn.disabled = false;
    if (!result.ok) { showErr(errEl, result.error); return; }
    const session = saveSession(result.user);
    setState({ currentUser: session });
    toast(`✅ Welcome back, ${session.firstName}!`);
    navigate(`/dashboard/${session.role}`);
  }, 500);
};

window.demoLogin = (role) => {
  import('../db/auth.js').then(({ register, login: loginFn, saveSession: saveSes }) => {
    const email    = `demo.${role}@freezeats.com`;
    const password = 'demo1234';
    register({ email, password, confirm: password,
      firstName: 'Demo', lastName: role === 'kitchen' ? 'Kitchen' : 'Eater',
      role, kitchenName: role === 'kitchen' ? 'Demo Kitchen HQ' : '', city: 'Mumbai',
    });
    const result = loginFn(email, password);
    if (result.ok) {
      const session = saveSes(result.user);
      setState({ currentUser: session });
      toast(`👋 Logged in as demo ${role}!`);
      navigate(`/dashboard/${role}`);
    }
  });
};

window.togglePwd = (id, btn) => {
  const inp = document.getElementById(id);
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
  btn.style.opacity = inp.type === 'text' ? '1' : '.5';
};

function showErr(el, msg) { el.textContent = msg; el.style.display = 'block'; }
