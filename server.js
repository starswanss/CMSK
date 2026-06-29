import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, "data");
const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");
const HERO_FILE = path.join(DATA_DIR, "hero.json");

app.use(express.json({ limit: "5mb" }));
app.use(express.static(path.join(__dirname, "public")));

/* ---------- storage helpers ---------- */
async function readJson(file, fallback) {
  try {
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeJson(file, data) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf-8");
}

const newId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/* ---------- Products API ---------- */
app.get("/api/products", async (_req, res) => {
  const products = await readJson(PRODUCTS_FILE, []);
  res.json(products);
});

app.get("/api/products/:id", async (req, res) => {
  const products = await readJson(PRODUCTS_FILE, []);
  const product = products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

app.post("/api/products", async (req, res) => {
  const { name, price, category, image, description, stock } = req.body || {};
  if (!name || price === undefined || price === null || price === "") {
    return res.status(400).json({ error: "name and price are required" });
  }
  const products = await readJson(PRODUCTS_FILE, []);
  const product = {
    id: newId(),
    name: String(name).trim(),
    price: Number(price),
    category: (category || "ทั่วไป").trim(),
    image: (image || "").trim(),
    description: (description || "").trim(),
    stock: stock === undefined || stock === "" ? null : Number(stock),
    createdAt: new Date().toISOString(),
  };
  products.unshift(product);
  await writeJson(PRODUCTS_FILE, products);
  res.status(201).json(product);
});

app.put("/api/products/:id", async (req, res) => {
  const products = await readJson(PRODUCTS_FILE, []);
  const idx = products.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Product not found" });
  const { name, price, category, image, description, stock } = req.body || {};
  products[idx] = {
    ...products[idx],
    ...(name !== undefined && { name: String(name).trim() }),
    ...(price !== undefined && price !== "" && { price: Number(price) }),
    ...(category !== undefined && { category: category.trim() }),
    ...(image !== undefined && { image: image.trim() }),
    ...(description !== undefined && { description: description.trim() }),
    ...(stock !== undefined && { stock: stock === "" ? null : Number(stock) }),
  };
  await writeJson(PRODUCTS_FILE, products);
  res.json(products[idx]);
});

app.delete("/api/products/:id", async (req, res) => {
  const products = await readJson(PRODUCTS_FILE, []);
  const next = products.filter((p) => p.id !== req.params.id);
  if (next.length === products.length)
    return res.status(404).json({ error: "Product not found" });
  await writeJson(PRODUCTS_FILE, next);
  res.json({ ok: true });
});

/* ---------- Hero slides API ---------- */
app.get("/api/hero", async (_req, res) => {
  const slides = await readJson(HERO_FILE, []);
  res.json(slides);
});

app.post("/api/hero", async (req, res) => {
  const { title, subtitle, image, ctaText, ctaLink } = req.body || {};
  if (!title) return res.status(400).json({ error: "title is required" });
  const slides = await readJson(HERO_FILE, []);
  const slide = {
    id: newId(),
    title: String(title).trim(),
    subtitle: (subtitle || "").trim(),
    image: (image || "").trim(),
    ctaText: (ctaText || "ช้อปเลย").trim(),
    ctaLink: (ctaLink || "#products").trim(),
    createdAt: new Date().toISOString(),
  };
  slides.push(slide);
  await writeJson(HERO_FILE, slides);
  res.status(201).json(slide);
});

app.delete("/api/hero/:id", async (req, res) => {
  const slides = await readJson(HERO_FILE, []);
  const next = slides.filter((s) => s.id !== req.params.id);
  if (next.length === slides.length)
    return res.status(404).json({ error: "Slide not found" });
  await writeJson(HERO_FILE, next);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`\n  CMSK Store running:`);
  console.log(`  • Storefront : http://localhost:${PORT}/`);
  console.log(`  • Admin      : http://localhost:${PORT}/admin.html\n`);
});
