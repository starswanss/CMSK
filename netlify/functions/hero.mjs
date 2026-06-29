import { getStore } from "@netlify/blobs";

/* Seed data — used the first time the Blobs store is empty */
const SEED = [
  {
    id: "hero1",
    title: "คอลเลกชันใหม่ มาแล้ว",
    subtitle: "ดีไซน์มินิมอล คัดสรรคุณภาพ ส่งตรงถึงบ้านคุณ พร้อมส่วนลดต้อนรับสมาชิกใหม่",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80",
    ctaText: "ช้อปสินค้าใหม่",
    ctaLink: "#products",
    createdAt: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "hero2",
    title: "เทคโนโลยีเพื่อชีวิตที่ดีกว่า",
    subtitle: "สินค้าอิเล็กทรอนิกส์รุ่นล่าสุด รับประกันของแท้ 100% พร้อมบริการหลังการขาย",
    image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1600&q=80",
    ctaText: "ดูสินค้าไอที",
    ctaLink: "#products",
    createdAt: "2026-06-02T00:00:00.000Z",
  },
  {
    id: "hero3",
    title: "ลดสูงสุด 30% เฉพาะเดือนนี้",
    subtitle: "เลือกซื้อสินค้าไลฟ์สไตล์คุณภาพในราคาพิเศษ จำนวนจำกัด",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&q=80",
    ctaText: "ช้อปโปรโมชัน",
    ctaLink: "#products",
    createdAt: "2026-06-03T00:00:00.000Z",
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
  const store = getStore("cmsk-hero");
  const id = context.params?.id;
  const method = req.method;

  if (method === "GET") {
    return json(await getList(store));
  }

  if (method === "POST") {
    const body = await req.json().catch(() => ({}));
    const { title, subtitle, image, ctaText, ctaLink } = body;
    if (!title) return json({ error: "title is required" }, 400);
    const list = await getList(store);
    const slide = {
      id: newId(),
      title: String(title).trim(),
      subtitle: (subtitle || "").trim(),
      image: (image || "").trim(),
      ctaText: (ctaText || "ช้อปเลย").trim(),
      ctaLink: (ctaLink || "#products").trim(),
      createdAt: new Date().toISOString(),
    };
    list.push(slide);
    await store.setJSON("list", list);
    return json(slide, 201);
  }

  if (method === "DELETE") {
    if (!id) return json({ error: "id required" }, 400);
    const list = await getList(store);
    const next = list.filter((s) => s.id !== id);
    if (next.length === list.length)
      return json({ error: "Slide not found" }, 404);
    await store.setJSON("list", next);
    return json({ ok: true });
  }

  return json({ error: "Method not allowed" }, 405);
};

export const config = { path: ["/api/hero", "/api/hero/:id"] };
