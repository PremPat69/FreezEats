/**
 * components/toast.js — Notification toast
 */

let timer = null;

export function toast(msg, type = 'info') {
  const el = document.getElementById('global-toast');
  if (!el) return;
  el.textContent = msg;
  el.className = `toast show ${type}`;
  clearTimeout(timer);
  timer = setTimeout(() => el.classList.remove('show'), 3200);
}
