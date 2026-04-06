/**
 * db/auth.js — Authentication & user management via localStorage
 *
 * HARDCODED ADMIN:  username = "admin"  |  password = "modih123"
 * Admin cannot self-register — only this hardcoded account exists.
 */

const USERS_KEY   = 'fz_users';
const SESSION_KEY = 'fz_session';

// ── Hardcoded admin ───────────────────────────────────────────────────────────
const ADMIN_ACCOUNT = {
  id: 'admin_root',
  email: 'admin',              // login with literal "admin" as username
  firstName: 'Super',
  lastName: 'Admin',
  role: 'admin',
  approved: true,
  city: 'Mumbai',
  kitchenName: '',
  phone: '',
};
const ADMIN_PASSWORD = 'modih123';

// ── Helpers ───────────────────────────────────────────────────────────────────
function hash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++)
    h = Math.imul(h * 33, 1) ^ str.charCodeAt(i);
  return (h >>> 0).toString(36);
}
function uid() {
  return 'fz_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
}
function pick(obj, keys) {
  return Object.fromEntries(keys.filter(k => k in obj).map(k => [k, obj[k]]));
}

// ── CRUD ──────────────────────────────────────────────────────────────────────
export function getAllUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }
  catch { return []; }
}
function saveUsers(users) { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }

export function getUserById(id) {
  if (id === 'admin_root') return ADMIN_ACCOUNT;
  return getAllUsers().find(u => u.id === id) || null;
}

export function updateUser(id, updates) {
  if (id === 'admin_root') return { ok: true, user: ADMIN_ACCOUNT }; // admin is immutable
  const users = getAllUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return { ok: false, error: 'User not found.' };
  users[idx] = { ...users[idx], ...updates, updatedAt: new Date().toISOString() };
  saveUsers(users);
  // Refresh session if it's the current user
  const session = getSession();
  if (session?.userId === id) {
    const newSes = { ...session, ...pick(updates, ['firstName','lastName','phone','city','kitchenName']) };
    localStorage.setItem(SESSION_KEY, JSON.stringify(newSes));
  }
  return { ok: true, user: users[idx] };
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export function register({ email, password, confirm, firstName, lastName,
                            phone, role = 'eater', kitchenName, city, fssai }) {
  // Block admin registration entirely
  if (role === 'admin') return { ok: false, error: 'Admin accounts cannot be registered.' };

  if (!firstName?.trim()) return { ok: false, error: 'First name is required.' };
  if (!email?.trim())     return { ok: false, error: 'Email address is required.' };
  if (!password)          return { ok: false, error: 'Password is required.' };
  if (password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };
  if (password !== confirm) return { ok: false, error: 'Passwords do not match.' };

  const users = getAllUsers();
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase().trim()))
    return { ok: false, error: 'An account with this email already exists.' };

  if (role === 'kitchen' && !kitchenName?.trim())
    return { ok: false, error: 'Kitchen name is required for kitchen accounts.' };

  const user = {
    id: uid(),
    email: email.toLowerCase().trim(),
    passwordHash: hash(password),
    firstName: firstName.trim(),
    lastName: (lastName || '').trim(),
    phone: (phone || '').trim(),
    role,
    kitchenName: (kitchenName || '').trim(),
    city: (city || '').trim(),
    fssai: (fssai || '').trim(),
    approved: role === 'eater',  // kitchens need admin approval
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  users.push(user);
  saveUsers(users);
  return { ok: true, user };
}

export function login(emailOrUsername, password, role) {
  if (!emailOrUsername || !password)
    return { ok: false, error: 'Please enter your username and password.' };

  // ── Hardcoded admin check ──
  if (emailOrUsername.toLowerCase() === 'admin') {
    if (password !== ADMIN_PASSWORD)
      return { ok: false, error: 'Incorrect admin password.' };
    if (role && role !== 'admin')
      return { ok: false, error: 'Please select the Admin role to log in.' };
    return { ok: true, user: ADMIN_ACCOUNT };
  }

  // ── Regular user check ──
  const users = getAllUsers();
  const user = users.find(u => u.email === emailOrUsername.toLowerCase().trim());
  if (!user) return { ok: false, error: 'No account found with this email address.' };
  if (user.passwordHash !== hash(password))
    return { ok: false, error: 'Incorrect password. Please try again.' };
  if (role && user.role !== role)
    return { ok: false, error: `This account is registered as a "${user.role}", not "${role}".` };

  return { ok: true, user };
}

// ── Session ───────────────────────────────────────────────────────────────────
export function saveSession(user) {
  const session = {
    userId: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone || '',
    role: user.role,
    kitchenName: user.kitchenName || '',
    city: user.city || '',
    approved: user.approved,
    loginAt: new Date().toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}
export function getSession()   {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
  catch { return null; }
}
export function clearSession() { localStorage.removeItem(SESSION_KEY); }

// ── Admin helpers ─────────────────────────────────────────────────────────────
export function setKitchenApproval(userId, approved) { return updateUser(userId, { approved }); }
export function getUsersByRole(role) {
  if (role === 'admin') return [ADMIN_ACCOUNT];
  return getAllUsers().filter(u => u.role === role);
}
