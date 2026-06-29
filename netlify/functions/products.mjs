import { getStore } from "@netlify/blobs";

/* Seed data — used the first time the Blobs store is empty */
const SEED = [
  {
    id: "seed1",
    name: "หูฟังไร้สาย Aura Pro",
    price: 2890,
    category: "อิเล็กทรอนิกส์",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
    description: "หูฟังไร้สายตัดเสียงรบกวน เสียงคมชัด แบตเตอรี่ใช้งานได้ยาวนานถึง 30 ชั่วโมง พร้อมเคสชาร์จพกพา",
    stock: 24,
    createdAt: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "seed2",
    name: "นาฬิกาข้อมือมินิมอล Nord",
    price: 4500,
    category: "แฟชั่น",
    image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800&q=80",
    description: "นาฬิกาดีไซน์มินิมอล หน้าปัดสะอาดตา สายหนังแท้ กันน้ำระดับ 3ATM เหมาะกับทุกโอกาส",
    stock: 12,
    createdAt: "2026-06-02T00:00:00.000Z",
  },
  {
    id: "seed3",
    name: "กระเป๋าเป้ Urban Daypack",
    price: 1690,
    category: "ไลฟ์สไตล์",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
    description: "กระเป๋าเป้วัสดุกันน้ำ ช่องใส่โน้ตบุ๊ก 15 นิ้ว ดีไซน์เรียบหรู เหมาะกับการเดินทางและทำงาน",
    stock: 40,
    createdAt: "2026-06-03T00:00:00.000Z",
  },
  {
    id: "seed4",
    name: "แก้วเก็บอุณหภูมิ Thermo 500ml",
    price: 790,
    category: "ไลฟ์สไตล์",
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80",
    description: "แก้วสเตนเลสเก็บความเย็น 24 ชม. เก็บความร้อน 12 ชม. ดีไซน์พกพาง่าย ฝาปิดสนิทกันรั่ว",
    stock: 100,
    createdAt: "2026-06-04T00:00:00.000Z",
  },
];

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

const newId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

async function getList(store) {
  const data = await store.get("list", { type: "json" });
  if (!data) {
    await store.setJSON("list", SEED);
    return [...SEED];
  }
  return data;
}

export default async (req, context) => {
  const store = getStore("cmsk-products");
  const id = context.params?.id;
  const method = req.method;

  if (method === "GET") {
    const list = await getList(store);
    if (id) {
      const item = list.find((p) => p.id === id);
      return item ? json(item) : json({ error: "Product not found" }, 404);
    }
    return json(list);
  }

  if (method === "POST") {
    const body = await req.json().catch(() => ({}));
    const { name, price, category, image, description, stock } = body;
    if (!name || price === undefined || price === null || price === "") {
      return json({ error: "name and price are required" }, 400);
    }
    const list = await getList(store);
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
    list.unshift(product);
    await store.setJSON("list", list);
    return json(product, 201);
  }

  if (method === "PUT") {
    if (!id) return json({ error: "id required" }, 400);
    const list = await getList(store);
    const idx = list.findIndex((p) => p.id === id);
    if (idx === -1) return json({ error: "Product not found" }, 404);
    const { name, price, category, image, description, stock } =
      await req.json().catch(() => ({}));
    list[idx] = {
      ...list[idx],
      ...(name !== undefined && { name: String(name).trim() }),
      ...(price !== undefined && price !== "" && { price: Number(price) }),
      ...(category !== undefined && { category: category.trim() }),
      ...(image !== undefined && { image: image.trim() }),
      ...(description !== undefined && { description: description.trim() }),
      ...(stock !== undefined && { stock: stock === "" ? null : Number(stock) }),
    };
    await store.setJSON("list", list);
    return json(list[idx]);
  }

  if (method === "DELETE") {
    if (!id) return json({ error: "id required" }, 400);
    const list = await getList(store);
    const next = list.filter((p) => p.id !== id);
    if (next.length === list.length)
      return json({ error: "Product not found" }, 404);
    await store.setJSON("list", next);
    return json({ ok: true });
  }

  return json({ error: "Method not allowed" }, 405);
};

export const config = { path: ["/api/products", "/api/products/:id"] };
