/**
 * db/products.js — Product catalog with full CRUD
 * Products are stored in localStorage. Defaults are seeded on first load.
 * Admin can add, edit, delete products and manage images.
 */

const PRODUCTS_KEY = 'fz_products';
const PRODUCTS_INIT = 'fz_products_initialized';

// ── Curated CDN image map (Unsplash & Pexels — both allow hotlinking) ────────
export const IMG = {
  curry:    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=640&q=85&fit=crop',
  momos:    'https://images.pexels.com/photos/8992923/pexels-photo-8992923.jpeg?auto=compress&cs=tinysrgb&w=640',
  pavBhaji: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=640&q=85&fit=crop',
  paneer:   'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=640&q=85&fit=crop',
  snack:    'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=640&q=85&fit=crop',
  wrap:     'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=640&q=85&fit=crop',
  fried:    'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=640&q=85&fit=crop',
  samosa:   'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=640&q=85&fit=crop',
  // Extra images for landing sections
  frozen:   'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=640&q=85&fit=crop',
  kitchen:  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=640&q=85&fit=crop',
  delivery: 'https://images.unsplash.com/photo-1581631863258-7b17b8e2afc1?w=640&q=85&fit=crop',
  eating:   'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=640&q=85&fit=crop',
  spices:   'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=640&q=85&fit=crop',
  packaged: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=640&q=85&fit=crop',
  streetCrowd: 'https://images.pexels.com/photos/2474658/pexels-photo-2474658.jpeg?auto=compress&cs=tinysrgb&w=1280',
};

const _defaultProducts = [
  {
    id: 1, name: 'Amritsari Chole', emoji: '🫘', badge: 'Bestseller',
    desc: 'Rich, tangy chickpeas in authentic Amritsari masala. Restaurant-grade, frozen fresh.',
    price: 189, rating: 4.8, reviews: 1240, category: 'Chole', img: IMG.curry,
    nutrition: [{val:'380',label:'Calories'},{val:'14g',label:'Protein'},{val:'52g',label:'Carbs'},{val:'12g',label:'Fat'}],
    available: true,
  },
  {
    id: 2, name: 'Steamed Veg Momos (12pc)', emoji: '🥟', badge: 'Trending',
    desc: 'Delicate wheat-flour dumplings stuffed with spiced vegetables. Served with chutney.',
    price: 229, rating: 4.7, reviews: 980, category: 'Momos', img: IMG.momos,
    nutrition: [{val:'280',label:'Calories'},{val:'10g',label:'Protein'},{val:'42g',label:'Carbs'},{val:'7g',label:'Fat'}],
    available: true,
  },
  {
    id: 3, name: 'Classic Pav Bhaji', emoji: '🍛', badge: 'Fan Fave',
    desc: "Mumbai's most iconic street food — buttery, spicy mashed vegetable curry.",
    price: 169, rating: 4.9, reviews: 2340, category: 'Pav Bhaji', img: IMG.pavBhaji,
    nutrition: [{val:'420',label:'Calories'},{val:'11g',label:'Protein'},{val:'64g',label:'Carbs'},{val:'14g',label:'Fat'}],
    available: true,
  },
  {
    id: 4, name: 'Spicy Paneer Tikka', emoji: '🍢', badge: 'Hot Pick',
    desc: 'Marinated cottage cheese chunks, smoky and tender. Perfect party snack.',
    price: 259, rating: 4.6, reviews: 720, category: 'Tikka', img: IMG.paneer,
    nutrition: [{val:'310',label:'Calories'},{val:'22g',label:'Protein'},{val:'18g',label:'Carbs'},{val:'16g',label:'Fat'}],
    available: true,
  },
  {
    id: 5, name: 'Mumbai Vada Pav', emoji: '🍞', badge: 'Iconic',
    desc: 'The king of street food — crispy potato fritter in a soft bun with green chutney.',
    price: 149, rating: 4.8, reviews: 2100, category: 'Snacks', img: IMG.snack,
    nutrition: [{val:'350',label:'Calories'},{val:'8g',label:'Protein'},{val:'58g',label:'Carbs'},{val:'10g',label:'Fat'}],
    available: true,
  },
  {
    id: 6, name: 'Veg Frankies (4pc)', emoji: '🌯', badge: 'Combo',
    desc: 'Spiced veggie rolls, crispy on the outside, soft and flavourful inside.',
    price: 199, rating: 4.5, reviews: 378, category: 'Wraps & Rolls', img: IMG.wrap,
    nutrition: [{val:'290',label:'Calories'},{val:'9g',label:'Protein'},{val:'44g',label:'Carbs'},{val:'9g',label:'Fat'}],
    available: true,
  },
  {
    id: 7, name: 'Corn Cheese Balls (8pc)', emoji: '🧆', badge: 'Crispy',
    desc: 'Golden fried bites with a gooey cheesy corn centre. Irresistibly crunchy.',
    price: 179, rating: 4.7, reviews: 567, category: 'Snacks', img: IMG.fried,
    nutrition: [{val:'320',label:'Calories'},{val:'10g',label:'Protein'},{val:'36g',label:'Carbs'},{val:'15g',label:'Fat'}],
    available: true,
  },
  {
    id: 8, name: 'Chicken Keema Samosas (6pc)', emoji: '🥐', badge: 'Meaty',
    desc: 'Flaky golden pastry shells stuffed with spiced minced chicken. Crowd pleaser.',
    price: 209, rating: 4.6, reviews: 445, category: 'Snacks', img: IMG.samosa,
    nutrition: [{val:'380',label:'Calories'},{val:'18g',label:'Protein'},{val:'32g',label:'Carbs'},{val:'18g',label:'Fat'}],
    available: true,
  },
];

// ── Internal helpers ──────────────────────────────────────────────────────────

function _ensureInit() {
  if (localStorage.getItem(PRODUCTS_INIT)) return;
  // First time: seed full product data into localStorage
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(_defaultProducts));
  localStorage.setItem(PRODUCTS_INIT, '1');
}

function _getAll() {
  _ensureInit();
  try { return JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]'); }
  catch { return [..._defaultProducts]; }
}

function _save(products) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  window.dispatchEvent(new CustomEvent('fz:productsUpdated'));
}

function _nextId(products) {
  return products.length ? Math.max(...products.map(p => p.id)) + 1 : 1;
}

// ── Public read API ───────────────────────────────────────────────────────────

export function getProducts()       { return _getAll(); }
export function getProductById(id)  { return _getAll().find(p => p.id === Number(id)) || null; }
export function getCategories()     { return [...new Set(_getAll().map(p => p.category))]; }
export function getProductsByCategory(cat) { return _getAll().filter(p => p.category === cat); }

// ── CRUD operations ───────────────────────────────────────────────────────────

/** Add a new product. Returns the created product. */
export function addProduct({ name, emoji, badge, desc, price, category, img, available = true }) {
  const products = _getAll();
  const product = {
    id: _nextId(products),
    name: name || 'New Product',
    emoji: emoji || '🍽️',
    badge: badge || '',
    desc: desc || '',
    price: Number(price) || 0,
    rating: 0,
    reviews: 0,
    category: category || 'Uncategorized',
    img: img || '',
    nutrition: [],
    available: available !== false,
  };
  products.push(product);
  _save(products);
  return product;
}

/** Update an existing product by id. Returns updated product or null. */
export function updateProduct(id, updates) {
  const products = _getAll();
  const idx = products.findIndex(p => p.id === Number(id));
  if (idx === -1) return null;
  // Merge updates (don't overwrite id)
  const allowed = ['name','emoji','badge','desc','price','category','img','available','nutrition','rating','reviews'];
  allowed.forEach(key => {
    if (updates[key] !== undefined) {
      products[idx][key] = key === 'price' ? Number(updates[key]) : updates[key];
    }
  });
  _save(products);
  return products[idx];
}

/** Delete a product by id. Returns true if deleted. */
export function deleteProduct(id) {
  const products = _getAll();
  const idx = products.findIndex(p => p.id === Number(id));
  if (idx === -1) return false;
  products.splice(idx, 1);
  _save(products);
  return true;
}

/** Update product image. Accepts a URL string or data:URI. */
export function updateProductImage(id, imgUrl) {
  return updateProduct(id, { img: imgUrl || '' });
}

/** Remove product image (set to empty). */
export function removeProductImage(id) {
  return updateProduct(id, { img: '' });
}

// ── Legacy convenience functions ──────────────────────────────────────────────

export function toggleAvailability(id) {
  const p = getProductById(id);
  if (p) return updateProduct(id, { available: !p.available });
  return null;
}

export function updateProductPrice(id, price) {
  return updateProduct(id, { price: Number(price) });
}

export function resetProducts() {
  localStorage.removeItem(PRODUCTS_KEY);
  localStorage.removeItem(PRODUCTS_INIT);
}
