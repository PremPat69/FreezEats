/**
 * components/cart.js — Shopping cart with order-type selector
 * orderType: 'frozen' (direct from admin) | 'cooked' (via cloud kitchen)
 */

import { getState, setState, recomputeCart, subscribe } from '../store.js';
import { getProducts } from '../db/products.js';
import { createOrder } from '../db/orders.js';
import { toast } from './toast.js';
import { navigate } from '../main.js';

const CART_KEY = 'fz_cart';
let selectedOrderType = 'frozen'; // default

// ── Init ──────────────────────────────────────────────────────────────────────
export function initCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY) || '{}');
    setState({ cart: saved });
    recomputeCart(getProducts());
  } catch { setState({ cart: {} }); }

  renderCartDrawer();

  subscribe('cart', () => {
    recomputeCart(getProducts());
    _syncCartStorage();
    updateFloatingCart();
    updateCartBadge();
    renderCartItems();
  });
  subscribe('cartCount', updateCartBadge);
  subscribe('cartTotal', updateFloatingCart);

  updateCartBadge();
  updateFloatingCart();

  window._cart = { open: openCart, close: closeCart, add: addToCart, remove: removeItem, update: updateQty };
}

// ── Cart Operations ────────────────────────────────────────────────────────────
export function addToCart(productId, qty = 1) {
  const cart = { ...getState().cart };
  cart[productId] = (cart[productId] || 0) + qty;
  setState({ cart });
  const p = getProducts().find(p => p.id === productId);
  if (p) toast(`🛒 ${p.emoji} ${p.name} added!`);
}

export function removeItem(productId) {
  const cart = { ...getState().cart };
  delete cart[productId];
  setState({ cart });
}

export function updateQty(productId, delta) {
  const cart = { ...getState().cart };
  const newQty = (cart[productId] || 0) + delta;
  if (newQty <= 0) delete cart[productId];
  else cart[productId] = newQty;
  setState({ cart });
}

export function clearCart() {
  setState({ cart: {} });
  localStorage.removeItem(CART_KEY);
}

function _syncCartStorage() {
  localStorage.setItem(CART_KEY, JSON.stringify(getState().cart));
}

// ── Drawer Rendering ───────────────────────────────────────────────────────────
export function renderCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  if (!drawer) return;
  drawer.innerHTML = `
    <div class="cart-drawer-header">
      <div class="cart-drawer-title">🛒 Your Cart <span id="cart-header-count" style="color:var(--text-muted);font-weight:400;font-size:.85rem"></span></div>
      <div class="cart-drawer-close" onclick="window._cart.close()">✕</div>
    </div>
    <div class="cart-items" id="cart-items-list"></div>
    <div class="cart-footer" id="cart-footer" style="display:none">

      <!-- Order type selector -->
      <div style="margin-bottom:16px">
        <div style="font-size:.78rem;font-weight:700;color:var(--brown);margin-bottom:10px;text-transform:uppercase;letter-spacing:.5px">Choose Delivery Type</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px" id="order-type-selector">
          <div class="order-type-btn active" id="otype-frozen" onclick="selectOrderType('frozen')">
            <div style="font-size:1.4rem;margin-bottom:4px">🧊</div>
            <div style="font-weight:700;font-size:.82rem;color:var(--brown)">Frozen Pack</div>
            <div style="font-size:.7rem;color:var(--text-muted);margin-top:2px">Direct from us</div>
          </div>
          <div class="order-type-btn" id="otype-cooked" onclick="selectOrderType('cooked')">
            <div style="font-size:1.4rem;margin-bottom:4px">🍳</div>
            <div style="font-weight:700;font-size:.82rem;color:var(--brown)">Cooked &amp; Hot</div>
            <div style="font-size:.7rem;color:var(--text-muted);margin-top:2px">Via cloud kitchen</div>
          </div>
        </div>
        <div id="order-type-note" style="font-size:.74rem;color:var(--text-muted);margin-top:8px;padding:8px 10px;background:var(--cream);border-radius:8px">
          🧊 <strong>Frozen:</strong> We pack &amp; dispatch directly to you.
        </div>
      </div>

      <div class="cart-summary">
        <div class="cart-summary-row"><span>Subtotal</span><span id="cart-subtotal">₹0</span></div>
        <div class="cart-summary-row"><span>Delivery</span><span style="color:var(--green);font-weight:600">FREE 🎉</span></div>
        <div class="cart-summary-row total"><span>Total</span><span id="cart-total-final">₹0</span></div>
      </div>
      <button class="cart-checkout-btn" onclick="handleCheckout()">Proceed to Checkout →</button>
    </div>
  `;
  renderCartItems();
}

export function renderCartItems() {
  const list = document.getElementById('cart-items-list');
  if (!list) return;
  const cart     = getState().cart;
  const products = getProducts();
  const ids      = Object.keys(cart).filter(id => cart[id] > 0);

  if (ids.length === 0) {
    list.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🛒</div>
        <p>Your cart is empty.<br>Add some delicious street food!</p>
        <button class="action-btn outline" onclick="window._cart.close();scrollToIfLanding?.('#products')" style="margin-top:8px">Browse Menu →</button>
      </div>`;
    document.getElementById('cart-footer')?.setAttribute('style', 'display:none');
    const hc = document.getElementById('cart-header-count');
    if (hc) hc.textContent = '';
    return;
  }

  const { count, total } = recomputeCart(products);
  document.getElementById('cart-footer')?.setAttribute('style', '');
  const hc = document.getElementById('cart-header-count');
  if (hc) hc.textContent = `(${count} item${count !== 1 ? 's' : ''})`;
  const sub = document.getElementById('cart-subtotal');
  if (sub) sub.textContent = `₹${total}`;
  const fin = document.getElementById('cart-total-final');
  if (fin) fin.textContent = `₹${total}`;

  list.innerHTML = ids.map(id => {
    const p   = products.find(pr => pr.id === Number(id));
    if (!p) return '';
    const qty = cart[id];
    return `
      <div class="cart-item">
        <div class="cart-item-img">
          <img src="${p.img}" alt="${p.name}"
            onerror="this.parentElement.style.fontSize='1.8rem';this.parentElement.textContent='${p.emoji}';this.remove()">
        </div>
        <div class="cart-item-info">
          <div class="cart-item-name">${p.name}</div>
          <div class="cart-item-price">₹${p.price} × ${qty} = <strong>₹${p.price * qty}</strong></div>
          <div class="cart-qty">
            <button class="cart-qty-btn" onclick="window._cart.update(${id},-1)">−</button>
            <span class="cart-qty-num">${qty}</span>
            <button class="cart-qty-btn" onclick="window._cart.update(${id},1)">+</button>
          </div>
        </div>
        <span class="cart-item-remove" onclick="window._cart.remove(${id})">✕</span>
      </div>`;
  }).join('');
}

// ── Order type selection ───────────────────────────────────────────────────────
window.selectOrderType = (type) => {
  selectedOrderType = type;
  document.querySelectorAll('.order-type-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`otype-${type}`)?.classList.add('active');
  const note = document.getElementById('order-type-note');
  if (note) {
    note.innerHTML = type === 'frozen'
      ? '🧊 <strong>Frozen Pack:</strong> We pack &amp; dispatch the frozen product directly to your address.'
      : '🍳 <strong>Cooked &amp; Hot:</strong> Frozen product is sent to a cloud kitchen, cooked fresh, then delivered hot to you.';
  }
};

// ── Drawer open/close ─────────────────────────────────────────────────────────
export function openCart() {
  renderCartItems();
  document.getElementById('cart-drawer')?.classList.add('open');
  document.getElementById('cart-overlay')?.classList.add('visible');
  document.body.style.overflow = 'hidden';
}

export function closeCart() {
  document.getElementById('cart-drawer')?.classList.remove('open');
  document.getElementById('cart-overlay')?.classList.remove('visible');
  document.body.style.overflow = '';
}

// ── Floating cart & badge ─────────────────────────────────────────────────────
function updateFloatingCart() {
  const { cartCount, cartTotal } = getState();
  const fc     = document.getElementById('floating-cart');
  const fcText = document.getElementById('fc-text');
  const fcTot  = document.getElementById('fc-total');
  if (fc)     fc.classList.toggle('visible', cartCount > 0);
  if (fcText) fcText.textContent = `${cartCount} item${cartCount !== 1 ? 's' : ''}`;
  if (fcTot)  fcTot.textContent  = `₹${cartTotal}`;
}

function updateCartBadge() {
  const count = getState().cartCount;
  document.querySelectorAll('#cart-count, #cart-count-mobile').forEach(el => {
    if (el) el.textContent = count;
  });
}

// ── Checkout ──────────────────────────────────────────────────────────────────
window.handleCheckout = function () {
  const user = getState().currentUser;
  if (!user) {
    closeCart();
    toast('🔐 Please log in to checkout!');
    setTimeout(() => navigate('/login'), 600);
    return;
  }

  const cart     = getState().cart;
  const products = getProducts();
  const items    = Object.entries(cart).map(([id, qty]) => {
    const p = products.find(p => p.id === Number(id));
    return p ? { id: p.id, name: p.name, emoji: p.emoji, price: p.price, qty } : null;
  }).filter(Boolean);

  if (!items.length) return;

  const order = createOrder({
    userId:    user.userId,
    userName:  `${user.firstName} ${user.lastName}`.trim(),
    userEmail: user.email,
    items,
    address:   user.city ? `Home — ${user.city}` : 'Home — Mumbai',
    orderType: selectedOrderType,
  });

  clearCart();
  closeCart();
  const typeLabel = selectedOrderType === 'cooked' ? '🍳 Cooked delivery' : '🧊 Frozen delivery';
  toast(`✅ Order #${order.id} placed! ${typeLabel} selected.`);
  setTimeout(() => navigate('/dashboard/eater'), 800);
};
