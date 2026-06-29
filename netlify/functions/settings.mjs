import { getStore } from "@netlify/blobs";

const DEFAULT_SETTINGS = { brandName: "YUAN SIKHIO Craft", logo: "" };

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

async function getSettings(store) {
  const data = await store.get("data", { type: "json" });
  if (!data) {
    await store.setJSON("data", DEFAULT_SETTINGS);
    return { ...DEFAULT_SETTINGS };
  }
  return { ...DEFAULT_SETTINGS, ...data };
}

export default async (req) => {
  const store = getStore("cmsk-settings");
  const method = req.method;

  if (method === "GET") {
    return json(await getSettings(store));
  }

  if (method === "PUT") {
    const { brandName, logo } = await req.json().catch(() => ({}));
    const current = await getSettings(store);
    const next = {
      ...current,
      ...(brandName !== undefined && {
        brandName: String(brandName).trim() || DEFAULT_SETTINGS.brandName,
      }),
      ...(logo !== undefined && { logo: String(logo) }),
    };
    await store.setJSON("data", next);
    return json(next);
  }

  return json({ error: "Method not allowed" }, 405);
};

export const config = { path: "/api/settings" };
