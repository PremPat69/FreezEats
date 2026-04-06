/**
 * store.js — Lightweight reactive state manager
 * Holds runtime app state (not persisted — use db/ modules for persistence)
 */

const _state = {
  currentUser: null,   // { id, email, firstName, lastName, role, ... }
  cart: {},            // { productId: qty }
  cartTotal: 0,
  cartCount: 0,
};

const _listeners = {};

export function getState() {
  return { ..._state };
}

export function setState(updates) {
  Object.assign(_state, updates);
  Object.keys(updates).forEach(key => {
    (_listeners[key] || []).forEach(fn => fn(_state[key]));
  });
}

/** Subscribe to a specific key. Returns unsubscribe fn. */
export function subscribe(key, fn) {
  if (!_listeners[key]) _listeners[key] = [];
  _listeners[key].push(fn);
  return () => { _listeners[key] = _listeners[key].filter(l => l !== fn); };
}

/** Compute cart stats from cart object and products list */
export function recomputeCart(products) {
  const cart = _state.cart;
  let count = 0, total = 0;
  Object.entries(cart).forEach(([id, qty]) => {
    const p = products.find(p => p.id === Number(id));
    if (p) { count += qty; total += p.price * qty; }
  });
  setState({ cartCount: count, cartTotal: total });
  return { count, total };
}
