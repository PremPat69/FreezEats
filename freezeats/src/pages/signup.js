/**
 * pages/signup.js — Sign-up page
 * Admin role is NOT available here — admin is hardcoded only.
 */

import { register, saveSession } from '../db/auth.js';
import { setState } from '../store.js';
import { toast } from '../components/toast.js';
import { navigate } from '../main.js';

let selectedRole = 'eater';

export function renderSignup() {
  selectedRole = 'eater';
  return `
<div class="auth-page">
  <div class="auth-left">
    <div class="auth-left-bg">
      <img src="https://images.pexels.com/photos/8992923/pexels-photo-8992923.jpeg?auto=compress&cs=tinysrgb&w=900"
        alt="Momos" onerror="this.style.display='none'">
      <div class="auth-left-bg-overlay"></div>
    </div>
    <div class="auth-brand">
      <div class="auth-brand-logo" onclick="navigate('/')">Freeze<span>ats</span></div>
      <div class="auth-brand-tagline">Street Food. Anytime. Anywhere.</div>
    </div>
    <div class="auth-left-content">
      <div class="auth-left-title">Join the<br><em>Freezeats</em><br>family 🥟</div>
      <div class="auth-left-desc">Create an account as a food lover or a cloud kitchen partner. Start ordering or selling today.</div>
      <div class="auth-feature-list">
        <div class="auth-feature"><div class="auth-feature-icon">🛒</div> Order frozen or freshly cooked street food</div>
        <div class="auth-feature"><div class="auth-feature-icon">🏪</div> Kitchen partners: list &amp; sell your products</div>
        <div class="auth-feature"><div class="auth-feature-icon">📊</div> Track orders &amp; earnings in real-time</div>
        <div class="auth-feature"><div class="auth-feature-icon">🔒</div> Secure, encrypted account</div>
      </div>
    </div>
    <div class="auth-left-footer">© 2025 Freezeats · FSSAI Certified · Made in India</div>
  </div>

  <div style="display:flex;flex-direction:column;justify-content:center;align-items:center;flex:1;padding:40px;min-height:100vh;overflow-y:auto;background:var(--cream)">
    <div class="auth-right">
      <div class="auth-tabs">
        <button class="auth-tab" onclick="navigate('/login')">Log In</button>
        <button class="auth-tab active">Sign Up</button>
      </div>
      <div class="auth-form-title">Create your account</div>
      <div class="auth-form-sub">Choose your role to get started.</div>

      <!-- Role selector — NO admin option -->
      <div style="margin-bottom:20px">
        <div style="font-size:.8rem;font-weight:600;color:var(--brown);margin-bottom:10px">I am a:</div>
        <div class="role-selector" id="signup-role-selector">
          <div class="role-btn active" onclick="signupSelectRole(this,'eater')">
            <span class="role-icon">🍽️</span><div class="role-name">Eater</div>
          </div>
          <div class="role-btn" onclick="signupSelectRole(this,'kitchen')">
            <span class="role-icon">🍳</span><div class="role-name">Cloud Kitchen</div>
          </div>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group"><label class="form-label">First Name *</label><input class="form-input" id="su-fname" type="text" placeholder="Rahul"></div>
        <div class="form-group"><label class="form-label">Last Name</label><input class="form-input" id="su-lname" type="text" placeholder="Sharma"></div>
      </div>
      <div class="form-group"><label class="form-label">Email Address *</label><input class="form-input" id="su-email" type="email" placeholder="you@example.com"></div>
      <div class="form-group"><label class="form-label">Phone Number</label><input class="form-input" id="su-phone" type="tel" placeholder="+91 98765 43210"></div>
      <div class="form-group"><label class="form-label">City</label><input class="form-input" id="su-city" type="text" placeholder="Mumbai"></div>

      <!-- Kitchen-only fields -->
      <div id="kitchen-fields" style="display:none">
        <div style="background:var(--orange-pale);border-radius:12px;padding:12px 14px;margin-bottom:14px;font-size:.8rem;color:var(--orange);font-weight:600;border:1px solid rgba(244,98,31,0.2)">
          🍳 Kitchen accounts are reviewed by our admin team before going live. You can still log in immediately.
        </div>
        <div class="form-group"><label class="form-label">Kitchen / Brand Name *</label><input class="form-input" id="su-kitchen" type="text" placeholder="Spice Street Kitchen"></div>
        <div class="form-group"><label class="form-label">FSSAI License No.</label><input class="form-input" id="su-fssai" type="text" placeholder="12345678901234"></div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Password *</label>
          <input class="form-input" id="su-password" type="password" placeholder="Min. 6 characters">
        </div>
        <div class="form-group">
          <label class="form-label">Confirm Password *</label>
          <input class="form-input" id="su-confirm" type="password" placeholder="Repeat password">
        </div>
      </div>

      <div class="form-check" style="margin-bottom:18px">
        <input type="checkbox" id="terms-check">
        <label for="terms-check">I agree to the <a href="#" style="color:var(--orange)">Terms of Service</a> and <a href="#" style="color:var(--orange)">Privacy Policy</a>.</label>
      </div>

      <div id="signup-error" class="form-error" style="display:none"></div>
      <button class="auth-submit-btn" id="signup-btn" onclick="submitSignup()">Create Account →</button>
      <div class="auth-switch" style="margin-top:20px">Already have an account? <a onclick="navigate('/login')" style="color:var(--orange);cursor:pointer;font-weight:600">Log in →</a></div>
    </div>
  </div>
</div>`;
}

window.signupSelectRole = (el, role) => {
  selectedRole = role;
  el.closest('.role-selector').querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('kitchen-fields').style.display = role === 'kitchen' ? 'block' : 'none';
};

window.submitSignup = () => {
  const errEl = document.getElementById('signup-error');
  const btn   = document.getElementById('signup-btn');
  errEl.style.display = 'none';

  if (!document.getElementById('terms-check')?.checked) {
    showErr(errEl, 'Please accept the Terms of Service to continue.'); return;
  }
  const data = {
    firstName:   document.getElementById('su-fname')?.value?.trim(),
    lastName:    document.getElementById('su-lname')?.value?.trim(),
    email:       document.getElementById('su-email')?.value?.trim(),
    phone:       document.getElementById('su-phone')?.value?.trim(),
    city:        document.getElementById('su-city')?.value?.trim(),
    password:    document.getElementById('su-password')?.value,
    confirm:     document.getElementById('su-confirm')?.value,
    kitchenName: document.getElementById('su-kitchen')?.value?.trim(),
    fssai:       document.getElementById('su-fssai')?.value?.trim(),
    role: selectedRole,
  };

  btn.textContent = 'Creating account…'; btn.disabled = true;
  setTimeout(() => {
    const result = register(data);
    btn.textContent = 'Create Account →'; btn.disabled = false;
    if (!result.ok) { showErr(errEl, result.error); return; }
    const session = saveSession(result.user);
    setState({ currentUser: session });
    toast(`🎉 Welcome to Freezeats, ${data.firstName}!`);
    navigate(`/dashboard/${session.role}`);
  }, 600);
};

function showErr(el, msg) { el.textContent = msg; el.style.display = 'block'; }
