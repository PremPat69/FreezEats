/**
 * pages/landing.js — Landing / Home page
 * All images use Unsplash/Pexels CDN (hotlink-safe).
 */

import { getProducts } from '../db/products.js';
import { IMG } from '../db/products.js';
import { navigate } from '../main.js';

export function renderLanding() {
  const products = getProducts();
  return `
<div class="announce-bar" id="announce-bar">
  <span>🎉 First order? Use code <strong>FREEZEFIRST</strong> for 20% off!</span>
  <a onclick="navigate('/signup')" style="cursor:pointer;margin-left:8px;color:#fff;font-weight:700">Claim Now →</a>
  <span class="announce-close" onclick="this.closest('.announce-bar').style.display='none'">✕</span>
</div>

<!-- ═══ HERO ═══ -->
<section id="hero">
  <div class="hero-orb orb1"></div>
  <div class="hero-orb orb2"></div>
  <div class="hero-orb orb3"></div>

  <div class="hero-content">
    <div class="hero-badge">New Launch — Now Delivering Pan India</div>
    <h1 class="hero-heading">Street Food.<br><span>Anytime.</span><br>Anywhere.</h1>
    <p class="hero-sub">Hygienic frozen street food, crafted from authentic recipes. Ready in minutes — straight from your freezer to your soul.</p>
    <div class="hero-btns">
      <button class="btn-primary" onclick="document.getElementById('products').scrollIntoView({behavior:'smooth'})">🛒 Order Now</button>
      <button class="btn-secondary" onclick="navigate('/signup')">Join Free →</button>
    </div>
    <div class="hero-stats">
      <div class="stat-item"><span class="stat-num">50K+</span><span class="stat-label">Happy Customers</span></div>
      <div class="stat-item"><span class="stat-num">4.8★</span><span class="stat-label">Avg. Rating</span></div>
      <div class="stat-item"><span class="stat-num">30+</span><span class="stat-label">Menu Items</span></div>
    </div>
  </div>

  <div class="hero-visual">
    <div class="hero-photo-collage">
      <!-- Main large image -->
      <div class="hero-photo-main">
        <img src="${IMG.curry}"
          alt="Amritsari Chole — Bestseller"
          loading="eager"
          onerror="this.style.display='none';this.parentElement.style.background='linear-gradient(135deg,#FF8B4E,#F4621F)'">
        <div class="hero-photo-label">🫘 Amritsari Chole — Bestseller</div>
      </div>

      <!-- 2×2 thumbnail grid -->
      <div class="hero-photo-grid">
        <div class="hero-photo-sm">
          <img src="${IMG.momos}"
            alt="Steamed Momos" loading="eager"
            onerror="this.parentElement.innerHTML='<span style=&quot;font-size:2rem;display:flex;align-items:center;justify-content:center;height:100%&quot;>🥟</span>'">
        </div>
        <div class="hero-photo-sm">
          <img src="${IMG.paneer}"
            alt="Paneer Tikka" loading="eager"
            onerror="this.parentElement.innerHTML='<span style=&quot;font-size:2rem;display:flex;align-items:center;justify-content:center;height:100%&quot;>🍢</span>'">
        </div>
        <div class="hero-photo-sm">
          <img src="${IMG.snack}"
            alt="Vada Pav" loading="eager"
            onerror="this.parentElement.innerHTML='<span style=&quot;font-size:2rem;display:flex;align-items:center;justify-content:center;height:100%&quot;>🍞</span>'">
        </div>
        <div class="hero-photo-sm">
          <img src="${IMG.samosa}"
            alt="Samosa" loading="eager"
            onerror="this.parentElement.innerHTML='<span style=&quot;font-size:2rem;display:flex;align-items:center;justify-content:center;height:100%&quot;>🥐</span>'">
        </div>
      </div>

      <!-- Floating badges -->
      <div class="hero-photo-badge-wrap">
        <div class="hero-photo-badge">
          <span class="hero-badge-icon">⭐</span>
          <div><div class="hero-badge-val">4.8</div><div class="hero-badge-sub">Avg. Rating</div></div>
        </div>
        <div class="hero-photo-badge hero-photo-badge-2">
          <span class="hero-badge-icon">🔥</span>
          <div><div class="hero-badge-val">50K+</div><div class="hero-badge-sub">Happy Eaters</div></div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ═══ CATEGORIES ═══ -->
<section id="categories" style="background:var(--white);padding:90px 5%">
  <div class="categories-header">
    <span class="section-label reveal">Food Categories</span>
    <h2 class="section-title reveal">Explore Our Menu</h2>
    <p class="section-sub reveal" style="margin:0 auto">Authentic Indian street food, flash-frozen to lock in that real street flavour.</p>
  </div>
  <div class="categories-scroll reveal">
    ${[
      { img: IMG.curry,    emoji:'🍛', name:'Pav Bhaji',     count:'6 variants', tag:'Bestseller' },
      { img: IMG.momos,    emoji:'🥟', name:'Momos',         count:'8 variants', tag:'Trending'  },
      { img: IMG.curry,    emoji:'🫘', name:'Chole',          count:'4 variants', tag:'Classic'   },
      { img: IMG.fried,    emoji:'🧆', name:'Snacks',         count:'12 variants',tag:'Popular'   },
      { img: IMG.wrap,     emoji:'🌯', name:'Wraps & Rolls',  count:'5 variants', tag:'New'       },
      { img: IMG.paneer,   emoji:'🍢', name:'Tikka',          count:'7 variants', tag:'Hot Pick'  },
    ].map(c => `
      <div class="cat-card" style="background-image:url('${c.img}')"
           onclick="document.getElementById('products').scrollIntoView({behavior:'smooth'})">
        <div class="cat-overlay"></div>
        <span class="cat-emoji">${c.emoji}</span>
        <div class="cat-name">${c.name}</div>
        <div class="cat-count">${c.count}</div>
        <span class="cat-tag">${c.tag}</span>
      </div>`).join('')}
  </div>
</section>

<!-- ═══ PRODUCTS ═══ -->
<section id="products" style="background:var(--cream);padding:90px 5%">
  <div class="products-header">
    <div>
      <span class="section-label">Featured</span>
      <h2 class="section-title">Top Picks For You</h2>
      <p class="section-sub">Flash-frozen at peak freshness. No compromises.</p>
    </div>
    <button class="btn-secondary" style="white-space:nowrap" onclick="navigate('/signup')">Start Ordering →</button>
  </div>
  <div class="products-grid">
    ${products.map(p => productCard(p)).join('')}
  </div>
</section>

<!-- ═══ HOW IT WORKS ═══ -->
<section id="how" style="background:linear-gradient(135deg,#4A2810 0%,#7B3F1A 100%);padding:90px 5%;color:#fff">
  <div class="how-header">
    <span class="section-label reveal" style="color:var(--orange-light)">Simple Process</span>
    <h2 class="section-title reveal" style="color:#fff">Ready in 3 Easy Steps</h2>
    <p class="section-sub reveal" style="margin:0 auto;color:rgba(255,255,255,.55)">From freezer to feast in under 5 minutes.</p>
  </div>
  <div class="how-steps">
    ${[
      {
        n:'1', emoji:'❄️', label:'Grab from freezer — zero thawing',
        img: IMG.packaged,
        title:'Take from Freezer',
        desc:'Pick your favourite Freezeats pack. No thawing needed, ever.',
      },
      {
        n:'2', emoji:'🔥', label:'Microwave, tawa, or air-fryer — 5 min',
        img: IMG.kitchen,
        title:'Heat for 5 Minutes',
        desc:'Microwave, tawa, or air-fryer — restaurant taste in minutes.',
      },
      {
        n:'3', emoji:'🍽️', label:'Bite into real street food flavour',
        img: IMG.momos,
        title:'Ready to Eat',
        desc:'Real street food taste. Anytime, anywhere. Zero regrets.',
      },
    ].map(s => `
      <div class="how-step reveal">
        <div class="step-photo-wrap">
          <span class="step-photo-num">${s.n}</span>
          <img src="${s.img}" alt="${s.title}" loading="lazy"
            onerror="this.style.display='none';this.parentElement.innerHTML+='<div style=\\'font-size:3rem;display:flex;align-items:center;justify-content:100%\\'>${s.emoji}</div>'">
          <div class="step-photo-label">${s.label}</div>
        </div>
        <div class="step-title">${s.title}</div>
        <div class="step-desc">${s.desc}</div>
      </div>`).join('')}
  </div>
</section>

<!-- ═══ WHY FREEZEATS ═══ -->
<section id="why" style="background:var(--white);padding:90px 5%">
  <div style="text-align:center">
    <span class="section-label reveal">Our Promise</span>
    <h2 class="section-title reveal">Why Choose Freezeats?</h2>
    <p class="section-sub reveal" style="margin:0 auto">We obsess over quality so you never have to compromise.</p>
  </div>
  <div class="why-grid">
    ${[
      { img: IMG.packaged, icon:'🧼', title:'Hygienic & Safe',      desc:'Manufactured in FSSAI-certified facilities with zero contamination risk. Sealed for freshness.' },
      { img: IMG.curry,    icon:'🤤', title:'Authentic Taste',       desc:'Recipes from real street food masters. That unmistakable Mumbai-Delhi street flavour, preserved.' },
      { img: IMG.momos,    icon:'🌿', title:'No Preservatives',      desc:'Flash-frozen technology means zero artificial preservatives — just pure, real ingredients.' },
      { img: IMG.fried,    icon:'⚡', title:'Ready in Minutes',      desc:'5-minute prep, zero skill required. Perfect for late nights, lazy mornings, and everything between.' },
      { img: IMG.samosa,   icon:'📦', title:'Easy Storage',          desc:'Stays fresh for 6 months in your freezer. Stock up and never worry about a craving again.' },
      { img: IMG.delivery, icon:'🚀', title:'Pan India Delivery',    desc:'Delivered cold in insulated packaging to your doorstep, anywhere in India.' },
    ].map((w, i) => `
      <div class="why-card reveal" style="transition-delay:${i*0.1}s">
        <div class="why-card-img">
          <img src="${w.img}" alt="${w.title}" loading="lazy"
            onerror="this.style.display='none';this.parentElement.style.background='var(--orange-pale)'">
          <div class="why-card-img-overlay"></div>
        </div>
        <div class="why-card-body">
          <span class="why-icon">${w.icon}</span>
          <div class="why-title">${w.title}</div>
          <div class="why-desc">${w.desc}</div>
        </div>
      </div>`).join('')}
  </div>
</section>

<!-- ═══ SUBSCRIPTION ═══ -->
<section id="subscription" style="background:linear-gradient(135deg,#FFF0E8,#FFE0CC);padding:90px 5%;position:relative;overflow:hidden">
  <div class="sub-grid">
    <div class="reveal-left">
      <span class="section-label">Save More</span>
      <h2 class="section-title">Subscribe & Stock Up</h2>
      <p class="section-sub">Weekly meal plans, hostel bulk orders, and café partnerships — a plan for every hunger.</p>
      <div class="sub-plans" id="sub-plans">
        ${[
          { name:'Weekly Snack Box',     desc:'15 items · Free delivery · Cancel anytime',                price:'₹499/wk',    active: true },
          { name:'Monthly Family Pack',  desc:'60 items · Priority delivery · Exclusive flavours',        price:'₹1,799/mo' },
          { name:'Bulk — Hostel & Café', desc:'200+ items · Custom branding · Account manager',           price:'Custom' },
        ].map(p => `
          <div class="sub-plan ${p.active ? 'active' : ''}"
               onclick="this.closest('.sub-plans').querySelectorAll('.sub-plan').forEach(x=>x.classList.remove('active'));this.classList.add('active')">
            <div class="plan-check"></div>
            <div><div class="plan-name">${p.name}</div><div class="plan-desc">${p.desc}</div></div>
            <div class="plan-price">${p.price}</div>
          </div>`).join('')}
      </div>
      <button class="btn-primary" style="margin-top:24px" onclick="navigate('/signup')">Subscribe Now →</button>
    </div>
    <div class="reveal-right">
      <div class="sub-visual-card">
        <div class="sub-photo-bg">
          <img src="${IMG.curry}" alt="Street Food"
            style="width:100%;height:100%;object-fit:cover;opacity:.3"
            loading="lazy" onerror="this.style.display='none'">
          <div style="position:absolute;inset:0;background:linear-gradient(135deg,rgba(74,40,16,0.88),rgba(123,63,26,0.82))"></div>
        </div>
        <div style="position:relative;z-index:1;text-align:center;color:#fff;padding:20px">
          <div class="sub-emoji">❄️</div>
          <div class="sub-card-title">Frozen Fresh, Always</div>
          <div class="sub-card-sub">Every pack sealed at peak freshness. No preservatives. Just pure street food love.</div>
          <button class="sub-btn" onclick="navigate('/signup')">Start My Plan</button>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ═══ TESTIMONIALS ═══ -->
<section id="testimonials" style="background:var(--cream);padding:90px 5%;overflow:hidden">
  <div class="testi-header" style="text-align:center;margin-bottom:48px">
    <span class="section-label reveal">Customer Love</span>
    <h2 class="section-title reveal">What Eaters Are Saying</h2>
  </div>
  <div class="testi-track-wrap">
    <div class="testi-track">
      ${[...testimonials(), ...testimonials()].map(t => `
        <div class="testi-card">
          <div class="testi-stars">${'★'.repeat(t.rating)}</div>
          <div class="testi-text">"${t.text}"</div>
          <div class="testi-author">
            <div class="testi-avatar">
              <img src="${t.avatar}" alt="${t.name}"
                onerror="this.parentElement.textContent='👤'">
            </div>
            <div>
              <div class="testi-name">${t.name}</div>
              <div class="testi-loc">📍 ${t.loc}</div>
            </div>
          </div>
        </div>`).join('')}
    </div>
  </div>
</section>

<!-- ═══ SCROLLING PHOTO STRIP ═══ -->
<div style="overflow:hidden;background:var(--brown);padding:0;line-height:0">
  <div style="display:flex;gap:0;animation:slide-testi 28s linear infinite;width:max-content">
    ${[IMG.curry, IMG.momos, IMG.pavBhaji, IMG.paneer, IMG.snack, IMG.wrap, IMG.fried, IMG.samosa,
       IMG.curry, IMG.momos, IMG.pavBhaji, IMG.paneer, IMG.snack, IMG.wrap, IMG.fried, IMG.samosa]
      .map(src => `<img src="${src}" loading="lazy" style="height:220px;width:340px;object-fit:cover;flex-shrink:0;display:block" onerror="this.style.display='none'">`).join('')}
  </div>
</div>

<!-- ═══ KITCHEN CTA ═══ -->
<section style="position:relative;overflow:hidden;padding:80px 5%;text-align:center">
  <div style="position:absolute;inset:0;z-index:0">
    <img src="${IMG.kitchen}" alt="Kitchen" loading="lazy"
      style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'">
    <div style="position:absolute;inset:0;background:linear-gradient(135deg,rgba(74,40,16,0.94),rgba(123,63,26,0.90))"></div>
  </div>
  <div style="position:relative;z-index:1">
    <span class="section-label" style="color:var(--orange-light)">For Cloud Kitchens</span>
    <h2 class="section-title reveal" style="color:#fff;margin-bottom:12px">Partner with Freezeats</h2>
    <p style="color:rgba(255,255,255,.7);max-width:520px;margin:0 auto 32px;line-height:1.8;font-size:.95rem">
      Reach 50,000+ hungry customers. Manage orders, menus, and earnings — all from your dashboard.
    </p>
    <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-bottom:36px">
      <button class="btn-primary" onclick="navigate('/signup')">🍳 Partner as a Kitchen</button>
      <button class="btn-secondary" style="color:#fff;border-color:rgba(255,255,255,0.35)"
        onclick="window.showToast('📩 Our team will reach out!')">Learn More →</button>
    </div>
    <div style="display:flex;gap:40px;justify-content:center;flex-wrap:wrap">
      <div style="text-align:center"><div style="font-family:'Syne',sans-serif;font-size:1.6rem;font-weight:800;color:var(--orange-light)">87+</div><div style="font-size:.78rem;color:rgba(255,255,255,.55)">Partner Kitchens</div></div>
      <div style="text-align:center"><div style="font-family:'Syne',sans-serif;font-size:1.6rem;font-weight:800;color:var(--orange-light)">12%</div><div style="font-size:.78rem;color:rgba(255,255,255,.55)">Commission Only</div></div>
      <div style="text-align:center"><div style="font-family:'Syne',sans-serif;font-size:1.6rem;font-weight:800;color:var(--orange-light)">₹9.2L+</div><div style="font-size:.78rem;color:rgba(255,255,255,.55)">Avg. Earnings</div></div>
    </div>
  </div>
</section>

<!-- ═══ FOOTER ═══ -->
<footer>
  <div class="footer-grid">
    <div>
      <div class="footer-logo">Freeze<span>ats</span></div>
      <p class="footer-tagline">Authentic frozen Indian street food, crafted with love and sealed with hygiene. Your cravings, answered anytime.</p>
      <div class="footer-social">
        <a class="social-btn" href="#">📘</a>
        <a class="social-btn" href="#">📸</a>
        <a class="social-btn" href="#">🐦</a>
        <a class="social-btn" href="#">▶️</a>
      </div>
    </div>
    <div>
      <h4>Menu</h4>
      <ul class="footer-links">
        <li><a onclick="document.getElementById('products')?.scrollIntoView({behavior:'smooth'})">Pav Bhaji</a></li>
        <li><a onclick="document.getElementById('products')?.scrollIntoView({behavior:'smooth'})">Momos</a></li>
        <li><a onclick="document.getElementById('products')?.scrollIntoView({behavior:'smooth'})">Chole</a></li>
        <li><a onclick="document.getElementById('products')?.scrollIntoView({behavior:'smooth'})">Snacks</a></li>
        <li><a onclick="navigate('/signup')">View All →</a></li>
      </ul>
    </div>
    <div>
      <h4>Company</h4>
      <ul class="footer-links">
        <li><a>About Us</a></li>
        <li><a>Our Story</a></li>
        <li><a>Careers</a></li>
        <li><a>Press</a></li>
      </ul>
    </div>
    <div>
      <h4>Support</h4>
      <ul class="footer-links">
        <li><a>FAQ</a></li>
        <li><a>Track Order</a></li>
        <li><a>Refund Policy</a></li>
        <li><a>Contact Us</a></li>
      </ul>
      <div style="margin-top:16px;font-size:.8rem;opacity:.6;line-height:1.8">
        📍 Mumbai, India<br>📞 +91 98765 43210<br>✉️ hello@freezeats.com
      </div>
    </div>
  </div>
  <div class="footer-bottom">
    <div class="footer-copy">© 2025 Freezeats. All rights reserved. Made with ❤️ in India.</div>
    <div class="footer-badges">
      <span class="badge-pill">FSSAI Certified</span>
      <span class="badge-pill">ISO 22000</span>
      <span class="badge-pill">100% Veg Available</span>
    </div>
  </div>
</footer>
  `;
}

// ── Product card ──────────────────────────────────────────────────────────────
function productCard(p) {
  return `
    <div class="product-card" onclick="openProductModal(${p.id})" style="cursor:pointer">
      <div class="product-img-wrap">
        <img src="${p.img}" alt="${p.name}" class="product-photo" loading="lazy"
          onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <div style="display:none;font-size:4.5rem;align-items:center;justify-content:center;width:100%;height:100%;background:var(--orange-pale)">${p.emoji}</div>
        <span class="product-badge">${p.badge}</span>
        <div class="product-img-overlay"></div>
      </div>
      <div class="product-body">
        <div class="product-name">${p.emoji} ${p.name}</div>
        <div class="product-desc">${p.desc}</div>
        <div class="product-rating">
          <span class="stars">${'★'.repeat(Math.floor(p.rating))}</span>
          <span>${p.rating} (${p.reviews.toLocaleString()})</span>
        </div>
        <div class="product-footer">
          <div class="product-price">₹${p.price}</div>
          <button class="add-btn" onclick="event.stopPropagation();window._cart.add(${p.id})">+ Add</button>
        </div>
      </div>
    </div>`;
}

// ── Testimonials data ─────────────────────────────────────────────────────────
function testimonials() {
  return [
    { name:'Aisha Kapoor',  loc:'Mumbai',    rating:5, text:'Honestly shocked at how authentic the Pav Bhaji tastes. Better than some dhabas in my area. Stocking up every week!', avatar:'https://randomuser.me/api/portraits/women/44.jpg' },
    { name:'Rahul Mehta',   loc:'Pune',      rating:5, text:'Perfect for hostel life. My whole floor is hooked on Freezeats momos. The chutney they include is 🔥',               avatar:'https://randomuser.me/api/portraits/men/32.jpg' },
    { name:'Priya Singh',   loc:'Delhi',     rating:5, text:'Finally a frozen food brand that cares about hygiene AND taste. The Chole is restaurant-level good.',                avatar:'https://randomuser.me/api/portraits/women/68.jpg' },
    { name:'Karan Joshi',   loc:'Bangalore', rating:4, text:'Gets me through those 2am hunger attacks. The Vada Pav is dangerously addictive.',                                  avatar:'https://randomuser.me/api/portraits/men/75.jpg' },
    { name:'Sneha Patel',   loc:'Ahmedabad', rating:5, text:'Gifted the family pack to my parents and they loved it. Dad said it tastes like the original chowpatty bhaji!',      avatar:'https://randomuser.me/api/portraits/women/26.jpg' },
    { name:'Vikram Nair',   loc:'Chennai',   rating:5, text:'Ordered for our office pantry. Everyone is obsessed. Easy reheating, great taste, zero waste. Highly recommend!',   avatar:'https://randomuser.me/api/portraits/men/85.jpg' },
  ];
}

// ── Mount hook ────────────────────────────────────────────────────────────────
export function onLandingMount() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.10, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => obs.observe(el));
}
