/* ===== CMSK Store — Storefront logic ===== */
const fmt = (n) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(n);

const $ = (sel) => document.querySelector(sel);
const api = async (url, opts) => {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
  return res.json();
};

let products = [];
let activeCategory = "ทั้งหมด";
let cart = 0;

/* ---------- Toast ---------- */
function toast(message, type = "success") {
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.setAttribute("role", "status");
  el.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg><span></span>`;
  el.querySelector("span").textContent = message;
  $("#toastWrap").appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

/* =====================================================
   BRAND SETTINGS (name + logo)
===================================================== */
async function loadSettings() {
  let s = { brandName: "YUAN SIKHIO Craft", logo: "" };
  try {
    s = { ...s, ...(await api("/api/settings")) };
  } catch {
    /* keep defaults */
  }
  const nameEl = $("#brandName");
  const footEl = $("#footerBrand");
  if (nameEl) nameEl.textContent = s.brandName;
  if (footEl) footEl.textContent = s.brandName;
  document.title = `${s.brandName} — งานคราฟต์คุณภาพ`;
  const mark = $("#brandLogo");
  if (mark && s.logo) {
    mark.classList.add("has-logo");
    mark.innerHTML = `<img src="${esc(s.logo)}" alt="${esc(s.brandName)}" />`;
  }
}

/* =====================================================
   HERO SLIDER
===================================================== */
let slides = [];
let heroIndex = 0;
let heroTimer = null;

async function loadHero() {
  try {
    slides = await api("/api/hero");
  } catch {
    slides = [];
  }
  renderHero();
}

function renderHero() {
  const track = $("#heroTrack");
  const dots = $("#heroDots");
  if (!slides.length) {
    track.innerHTML = `<div class="hero-slide"><div class="hero-overlay"><div class="hero-content"><h1 class="hero-title">ยินดีต้อนรับสู่ CMSK Store</h1><p class="hero-subtitle">เพิ่มสไลด์โปรโมชันได้ที่ระบบหลังบ้าน</p><a class="btn btn-primary" href="#products">เลือกชมสินค้า</a></div></div></div>`;
    dots.innerHTML = "";
    $("#heroPrev").classList.add("hide");
    $("#heroNext").classList.add("hide");
    return;
  }
  $("#heroPrev").classList.toggle("hide", slides.length < 2);
  $("#heroNext").classList.toggle("hide", slides.length < 2);

  track.innerHTML = slides
    .map(
      (s) => `
      <div class="hero-slide" role="group" aria-roledescription="slide">
        ${s.image ? `<img src="${esc(s.image)}" alt="${esc(s.title)}" loading="eager" />` : `<div style="width:100%;height:100%;background:linear-gradient(135deg,#4f46e5,#9333ea)"></div>`}
        <div class="hero-overlay">
          <div class="hero-content">
            <span class="hero-eyebrow"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 15 9l7 .5-5.5 4.5L18 21l-6-3.8L6 21l1.5-7L2 9.5 9 9z"/></svg> โปรโมชันเด่น</span>
            <h1 class="hero-title">${esc(s.title)}</h1>
            <p class="hero-subtitle">${esc(s.subtitle || "")}</p>
            <a class="btn btn-primary" href="${esc(s.ctaLink || "#products")}">${esc(s.ctaText || "ช้อปเลย")}</a>
          </div>
        </div>
      </div>`
    )
    .join("");

  dots.innerHTML = slides
    .map((_, i) => `<button class="hero-dot ${i === 0 ? "active" : ""}" role="tab" aria-label="สไลด์ที่ ${i + 1}" data-i="${i}"></button>`)
    .join("");
  dots.querySelectorAll(".hero-dot").forEach((d) =>
    d.addEventListener("click", () => goToSlide(Number(d.dataset.i)))
  );

  heroIndex = 0;
  updateHero();
  startAuto();
}

function updateHero() {
  $("#heroTrack").style.transform = `translateX(-${heroIndex * 100}%)`;
  $("#heroDots")
    .querySelectorAll(".hero-dot")
    .forEach((d, i) => d.classList.toggle("active", i === heroIndex));
}
function goToSlide(i) {
  heroIndex = (i + slides.length) % slides.length;
  updateHero();
  startAuto();
}
function startAuto() {
  clearInterval(heroTimer);
  if (slides.length < 2) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  heroTimer = setInterval(() => goToSlide(heroIndex + 1), 5500);
}

$("#heroPrev").addEventListener("click", () => goToSlide(heroIndex - 1));
$("#heroNext").addEventListener("click", () => goToSlide(heroIndex + 1));

/* =====================================================
   PRODUCTS
===================================================== */
function esc(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

async function loadProducts() {
  const grid = $("#productGrid");
  grid.innerHTML = Array.from({ length: 4 })
    .map(() => `<div class="card"><div class="skeleton card-media"></div><div class="card-body"><div class="skeleton" style="height:14px;width:50%"></div><div class="skeleton" style="height:18px;width:80%;margin-top:8px"></div></div></div>`)
    .join("");
  try {
    products = await api("/api/products");
  } catch {
    products = [];
  }
  renderChips();
  renderProducts();
}

function renderChips() {
  const cats = ["ทั้งหมด", ...new Set(products.map((p) => p.category).filter(Boolean))];
  $("#categoryChips").innerHTML = cats
    .map((c) => `<button class="chip ${c === activeCategory ? "active" : ""}" data-cat="${esc(c)}">${esc(c)}</button>`)
    .join("");
  $("#categoryChips")
    .querySelectorAll(".chip")
    .forEach((chip) =>
      chip.addEventListener("click", () => {
        activeCategory = chip.dataset.cat;
        renderChips();
        renderProducts();
      })
    );
}

function renderProducts() {
  const grid = $("#productGrid");
  const list = products.filter(
    (p) => activeCategory === "ทั้งหมด" || p.category === activeCategory
  );
  if (!list.length) {
    grid.innerHTML = `<div class="empty" style="grid-column:1/-1">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
      <p>ยังไม่มีสินค้าในหมวดนี้ — เพิ่มได้ที่ <a href="/admin.html" style="color:var(--primary);font-weight:600">ระบบหลังบ้าน</a></p>
    </div>`;
    return;
  }
  grid.innerHTML = list
    .map(
      (p) => `
      <article class="card" data-id="${p.id}" tabindex="0" role="button" aria-label="ดูรายละเอียด ${esc(p.name)}">
        <div class="card-media">
          ${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" />` : placeholderImg()}
        </div>
        <div class="card-body">
          <span class="card-cat">${esc(p.category)}</span>
          <h3 class="card-name">${esc(p.name)}</h3>
          <div class="card-foot">
            <span class="price">${fmt(p.price)}</span>
            <span class="btn btn-ghost" style="min-height:36px;padding:6px 12px;font-size:13px">ดูรายละเอียด</span>
          </div>
        </div>
      </article>`
    )
    .join("");

  grid.querySelectorAll(".card").forEach((card) => {
    const open = () => location.hash = `#product/${card.dataset.id}`;
    card.addEventListener("click", open);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
    });
  });
}

function placeholderImg() {
  return `<div style="width:100%;height:100%;display:grid;place-items:center;color:#cbd5e1;background:#f1f5f9"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/></svg></div>`;
}

/* =====================================================
   PRODUCT DETAIL (hash routing)
===================================================== */
async function renderDetail(id) {
  const view = $("#detailView");
  $("#homeView").classList.add("hide");
  view.classList.remove("hide");
  window.scrollTo({ top: 0, behavior: "instant" });

  let p = products.find((x) => x.id === id);
  if (!p) {
    try { p = await api(`/api/products/${id}`); } catch { p = null; }
  }
  if (!p) {
    view.innerHTML = `<div class="empty"><p>ไม่พบสินค้านี้</p><a class="btn btn-ghost" href="#">← กลับหน้าแรก</a></div>`;
    return;
  }
  const inStock = p.stock === null || p.stock > 0;
  view.innerHTML = `
    <a class="back-link" href="#">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
      กลับไปหน้าสินค้า
    </a>
    <div class="detail">
      <div class="detail-media">
        ${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" />` : placeholderImg()}
      </div>
      <div>
        <span class="detail-cat">${esc(p.category)}</span>
        <h1 class="detail-title">${esc(p.name)}</h1>
        <div class="detail-price">${fmt(p.price)}</div>
        <div class="stock-badge ${inStock ? "stock-in" : "stock-out"}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          ${inStock ? (p.stock === null ? "พร้อมจำหน่าย" : `มีสินค้า ${p.stock} ชิ้น`) : "สินค้าหมด"}
        </div>
        <p class="detail-desc">${esc(p.description || "ยังไม่มีรายละเอียดสินค้า")}</p>
        <button class="btn btn-primary btn-block" id="addToCart" ${inStock ? "" : "disabled"}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
          ${inStock ? "เพิ่มลงตะกร้า" : "สินค้าหมด"}
        </button>
      </div>
    </div>`;

  const addBtn = $("#addToCart");
  if (addBtn && inStock) {
    addBtn.addEventListener("click", () => {
      cart++;
      $("#cartCount").textContent = cart;
      $("#cartCount").classList.remove("hide");
      toast(`เพิ่ม "${p.name}" ลงตะกร้าแล้ว`);
    });
  }
}

function showHome() {
  $("#detailView").classList.add("hide");
  $("#homeView").classList.remove("hide");
}

function handleRoute() {
  const hash = location.hash;
  if (hash.startsWith("#product/")) {
    renderDetail(hash.split("/")[1]);
  } else {
    showHome();
    if (hash === "#products") {
      document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
    }
  }
}

window.addEventListener("hashchange", handleRoute);
$("#brandHome").addEventListener("click", (e) => {
  if (location.hash) { e.preventDefault(); location.hash = ""; showHome(); window.scrollTo({ top: 0 }); }
});
$("#cartBtn").addEventListener("click", () =>
  toast(cart ? `มีสินค้าในตะกร้า ${cart} รายการ` : "ตะกร้าว่างเปล่า", cart ? "success" : "error")
);

/* ---------- init ---------- */
(async function init() {
  await Promise.all([loadSettings(), loadHero(), loadProducts()]);
  handleRoute();
})();
