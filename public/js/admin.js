/* ===== CMSK Store — Admin logic ===== */
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const fmt = (n) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(n);

const api = async (url, opts) => {
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
};

const esc = (str) =>
  String(str ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

let products = [];
let slides = [];

/* ---------- Toast ---------- */
function toast(message, type = "success") {
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.setAttribute("role", "status");
  const icon =
    type === "error"
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;
  el.innerHTML = `${icon}<span></span>`;
  el.querySelector("span").textContent = message;
  $("#toastWrap").appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

/* ---------- Confirm dialog ---------- */
function confirmDialog({ title, message, confirmText = "ลบ" }) {
  return new Promise((resolve) => {
    const root = $("#modalRoot");
    root.innerHTML = `
      <div class="modal-scrim" id="scrim">
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="m-title">
          <h3 id="m-title">${esc(title)}</h3>
          <p>${esc(message)}</p>
          <div class="modal-actions">
            <button class="btn btn-ghost" id="m-cancel">ยกเลิก</button>
            <button class="btn btn-solid-danger" id="m-ok">${esc(confirmText)}</button>
          </div>
        </div>
      </div>`;
    const close = (val) => { root.innerHTML = ""; resolve(val); };
    $("#m-ok").addEventListener("click", () => close(true));
    $("#m-cancel").addEventListener("click", () => close(false));
    $("#scrim").addEventListener("click", (e) => { if (e.target.id === "scrim") close(false); });
    document.addEventListener("keydown", function onKey(e) {
      if (e.key === "Escape") { document.removeEventListener("keydown", onKey); close(false); }
    });
    $("#m-ok").focus();
  });
}

/* ---------- Tabs ---------- */
$$(".side-link[data-tab]").forEach((btn) =>
  btn.addEventListener("click", () => {
    $$(".side-link[data-tab]").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    $$(".tab-panel").forEach((p) => p.classList.remove("active"));
    $(`#tab-${btn.dataset.tab}`).classList.add("active");
  })
);

/* ---------- Image preview ---------- */
function bindPreview(inputSel, previewSel, placeholder) {
  const input = $(inputSel);
  const prev = $(previewSel);
  input.addEventListener("input", () => {
    const url = input.value.trim();
    if (url) prev.innerHTML = `<img src="${esc(url)}" alt="ตัวอย่าง" onerror="this.parentNode.innerHTML='<span>ไม่สามารถโหลดรูปได้</span>'" />`;
    else prev.innerHTML = `<span>${placeholder}</span>`;
  });
}
bindPreview("#p-image", "#p-preview", "ตัวอย่างรูปภาพจะแสดงที่นี่");
bindPreview("#h-image", "#h-preview", "ตัวอย่างรูปพื้นหลังจะแสดงที่นี่");

/* =====================================================
   STATS
===================================================== */
function renderStats() {
  $("#statProducts").textContent = products.length;
  $("#statHero").textContent = slides.length;
  $("#statCats").textContent = new Set(products.map((p) => p.category).filter(Boolean)).size;
  $("#catList").innerHTML = [...new Set(products.map((p) => p.category).filter(Boolean))]
    .map((c) => `<option value="${esc(c)}">`)
    .join("");
}

/* =====================================================
   PRODUCTS
===================================================== */
async function loadProducts() {
  products = await api("/api/products");
  renderProducts();
  renderStats();
}

function renderProducts() {
  const list = $("#productList");
  if (!products.length) {
    list.innerHTML = `<div class="empty"><p>ยังไม่มีสินค้า — เพิ่มสินค้าแรกได้จากฟอร์มด้านบน</p></div>`;
    return;
  }
  list.innerHTML = products
    .map(
      (p) => `
      <div class="row" data-id="${p.id}">
        ${p.image ? `<img class="row-thumb" src="${esc(p.image)}" alt="" onerror="this.style.visibility='hidden'" />` : `<div class="row-thumb"></div>`}
        <div class="row-main">
          <p class="row-title">${esc(p.name)}</p>
          <div class="row-meta">
            <span class="tag">${esc(p.category)}</span>
            <span>${p.stock === null ? "สต็อกไม่จำกัด" : `สต็อก ${p.stock} ชิ้น`}</span>
          </div>
        </div>
        <span class="row-price">${fmt(p.price)}</span>
        <button class="btn btn-danger del-product" data-id="${p.id}" data-name="${esc(p.name)}" aria-label="ลบ ${esc(p.name)}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          ลบ
        </button>
      </div>`
    )
    .join("");

  list.querySelectorAll(".del-product").forEach((btn) =>
    btn.addEventListener("click", async () => {
      const ok = await confirmDialog({
        title: "ลบสินค้า?",
        message: `ต้องการลบ "${btn.dataset.name}" ออกจากร้านใช่หรือไม่ การกระทำนี้ไม่สามารถย้อนกลับได้`,
      });
      if (!ok) return;
      try {
        await api(`/api/products/${btn.dataset.id}`, { method: "DELETE" });
        toast("ลบสินค้าเรียบร้อยแล้ว");
        await loadProducts();
      } catch (e) {
        toast("ลบไม่สำเร็จ: " + e.message, "error");
      }
    })
  );
}

/* Product form */
const productForm = $("#productForm");
productForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  $("#err-name").textContent = "";
  $("#err-price").textContent = "";
  $("#p-name").classList.remove("invalid");
  $("#p-price").classList.remove("invalid");

  const name = $("#p-name").value.trim();
  const price = $("#p-price").value;
  let bad = false;
  if (!name) { $("#err-name").textContent = "กรุณากรอกชื่อสินค้า"; $("#p-name").classList.add("invalid"); bad = true; }
  if (price === "" || Number(price) < 0 || isNaN(Number(price))) { $("#err-price").textContent = "กรุณากรอกราคาที่ถูกต้อง"; $("#p-price").classList.add("invalid"); bad = true; }
  if (bad) { (name ? $("#p-price") : $("#p-name")).focus(); return; }

  const btn = $("#p-submit");
  btn.disabled = true;
  try {
    await api("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        price,
        category: $("#p-category").value.trim(),
        stock: $("#p-stock").value,
        image: $("#p-image").value.trim(),
        description: $("#p-description").value.trim(),
      }),
    });
    toast(`เพิ่ม "${name}" เรียบร้อยแล้ว`);
    productForm.reset();
    $("#p-preview").innerHTML = "<span>ตัวอย่างรูปภาพจะแสดงที่นี่</span>";
    await loadProducts();
  } catch (err) {
    toast("เพิ่มไม่สำเร็จ: " + err.message, "error");
  } finally {
    btn.disabled = false;
  }
});

/* =====================================================
   HERO SLIDES
===================================================== */
async function loadHero() {
  slides = await api("/api/hero");
  renderHero();
  renderStats();
}

function renderHero() {
  const list = $("#heroList");
  if (!slides.length) {
    list.innerHTML = `<div class="empty"><p>ยังไม่มีสไลด์ — เพิ่มสไลด์แรกได้จากฟอร์มด้านบน</p></div>`;
    return;
  }
  list.innerHTML = slides
    .map(
      (s, i) => `
      <div class="row" data-id="${s.id}">
        ${s.image ? `<img class="row-thumb" src="${esc(s.image)}" alt="" onerror="this.style.visibility='hidden'" />` : `<div class="row-thumb"></div>`}
        <div class="row-main">
          <p class="row-title">${esc(s.title)}</p>
          <div class="row-meta">
            <span class="tag">สไลด์ที่ ${i + 1}</span>
            <span>${esc(s.subtitle ? s.subtitle.slice(0, 60) + (s.subtitle.length > 60 ? "…" : "") : "ไม่มีคำอธิบาย")}</span>
          </div>
        </div>
        <button class="btn btn-danger del-hero" data-id="${s.id}" data-name="${esc(s.title)}" aria-label="ลบสไลด์ ${esc(s.title)}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          ลบ
        </button>
      </div>`
    )
    .join("");

  list.querySelectorAll(".del-hero").forEach((btn) =>
    btn.addEventListener("click", async () => {
      const ok = await confirmDialog({
        title: "ลบสไลด์?",
        message: `ต้องการลบสไลด์ "${btn.dataset.name}" ใช่หรือไม่`,
      });
      if (!ok) return;
      try {
        await api(`/api/hero/${btn.dataset.id}`, { method: "DELETE" });
        toast("ลบสไลด์เรียบร้อยแล้ว");
        await loadHero();
      } catch (e) {
        toast("ลบไม่สำเร็จ: " + e.message, "error");
      }
    })
  );
}

const heroForm = $("#heroForm");
heroForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  $("#err-title").textContent = "";
  $("#h-title").classList.remove("invalid");
  const title = $("#h-title").value.trim();
  if (!title) {
    $("#err-title").textContent = "กรุณากรอกหัวข้อ";
    $("#h-title").classList.add("invalid");
    $("#h-title").focus();
    return;
  }
  try {
    await api("/api/hero", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        subtitle: $("#h-subtitle").value.trim(),
        image: $("#h-image").value.trim(),
        ctaText: $("#h-cta").value.trim(),
        ctaLink: $("#h-link").value.trim(),
      }),
    });
    toast(`เพิ่มสไลด์ "${title}" เรียบร้อยแล้ว`);
    heroForm.reset();
    $("#h-preview").innerHTML = "<span>ตัวอย่างรูปพื้นหลังจะแสดงที่นี่</span>";
    await loadHero();
  } catch (err) {
    toast("เพิ่มไม่สำเร็จ: " + err.message, "error");
  }
});

/* ---------- init ---------- */
(async function init() {
  try {
    await Promise.all([loadProducts(), loadHero()]);
  } catch (e) {
    toast("โหลดข้อมูลไม่สำเร็จ: " + e.message, "error");
  }
})();
