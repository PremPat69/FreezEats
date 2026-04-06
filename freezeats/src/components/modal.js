/**
 * components/modal.js — Product quick-view modal
 */

import { getProductById } from '../db/products.js';
import { addToCart } from './cart.js';

let currentProduct = null;
let modalQty = 1;

export function initModal() {
  window._modal = { open: openProductModal, close: closeProductModal, closeOnBg };
}

export function openProductModal(id) {
  const p = getProductById(id);
  if (!p) return;
  currentProduct = p;
  modalQty = 1;

  const modal = document.getElementById('product-modal');
  if (!modal) return;

  modal.innerHTML = `
    <div class="modal-img" style="position:relative">
      <img id="modal-img" src="${p.img}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover"
        onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
      <div style="display:none;align-items:center;justify-content:center;font-size:5rem;background:var(--orange-pale);height:100%">${p.emoji}</div>
      <div class="modal-img-overlay"></div>
      <span class="modal-badge-modal">${p.badge}</span>
      <button class="modal-close" onclick="window._modal.close()">✕</button>
    </div>
    <div class="modal-body">
      <div>
        <div class="modal-title">${p.name}</div>
        <div class="modal-rating" style="margin-top:6px">
          <span style="color:#F4B942;font-size:1rem">${'★'.repeat(Math.floor(p.rating))}</span>
          <span style="font-size:.85rem;color:var(--text-muted);margin-left:6px">${p.rating} · ${p.reviews.toLocaleString()} reviews</span>
        </div>
      </div>
      <div class="modal-desc">${p.desc}</div>
      <div class="modal-tags">
        <span class="modal-tag">🌿 No Preservatives</span>
        <span class="modal-tag">⚡ Ready in 5 min</span>
        <span class="modal-tag">❄️ Frozen Fresh</span>
      </div>
      <div class="modal-price" id="modal-price">₹${p.price}</div>
      <div class="modal-nutrition">
        <div class="modal-nutrition-title">Nutrition per serving</div>
        <div class="modal-nutrition-grid">
          ${(p.nutrition || []).map(n => `<div class="nutrition-item"><div class="nutrition-val">${n.val}</div><div class="nutrition-label">${n.label}</div></div>`).join('')}
        </div>
      </div>
      <div class="modal-qty-row">
        <div class="modal-qty-ctrl">
          <button onclick="changeModalQty(-1)">−</button>
          <span id="modal-qty">1</span>
          <button onclick="changeModalQty(1)">+</button>
        </div>
        <button class="modal-add-btn" id="modal-add-btn" onclick="addFromModal()">Add to Cart — ₹${p.price}</button>
      </div>
    </div>
  `;

  document.getElementById('product-modal-overlay')?.classList.add('visible');
  document.body.style.overflow = 'hidden';
}

function closeProductModal() {
  document.getElementById('product-modal-overlay')?.classList.remove('visible');
  document.body.style.overflow = '';
  currentProduct = null;
}

function closeOnBg(e) {
  if (e.target === document.getElementById('product-modal-overlay')) closeProductModal();
}

window.changeModalQty = (delta) => {
  modalQty = Math.max(1, modalQty + delta);
  const qtyEl = document.getElementById('modal-qty');
  const btnEl = document.getElementById('modal-add-btn');
  if (qtyEl) qtyEl.textContent = modalQty;
  if (btnEl && currentProduct)
    btnEl.textContent = `Add ${modalQty > 1 ? modalQty + '× ' : ''}to Cart — ₹${currentProduct.price * modalQty}`;
};

window.addFromModal = () => {
  if (!currentProduct) return;
  addToCart(currentProduct.id, modalQty);
  closeProductModal();
  setTimeout(() => window._cart.open(), 300);
};

window.openProductModal = openProductModal;
