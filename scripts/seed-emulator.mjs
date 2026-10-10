// Popula os EMULADORES locais com dados de demonstração para testar o site
// sem tocar no projeto real. Recusa rodar se não estiver apontado para o
// emulador. Uso: npm run emulators (em outro terminal) e depois npm run seed:emulator
import { readFileSync } from "node:fs";
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { Timestamp, doc, setDoc } from "firebase/firestore";

const PROJECT = "demo-taisefoto";
const AUTH = "http://127.0.0.1:9099";
const EMAIL = process.env.DEMO_ADMIN_EMAIL || "admin@demo.local";
const PASSWORD = process.env.DEMO_ADMIN_PASSWORD || "demo-123456";

if (!PROJECT.startsWith("demo-")) throw new Error("Este script só roda contra o emulador (projeto demo-*).");

async function ensureUser() {
  const base = `${AUTH}/identitytoolkit.googleapis.com/v1`;
  const body = JSON.stringify({ email: EMAIL, password: PASSWORD, returnSecureToken: true });
  let r = await fetch(`${base}/accounts:signUp?key=demo`, { method: "POST", headers: { "Content-Type": "application/json" }, body });
  if (!r.ok) r = await fetch(`${base}/accounts:signInWithPassword?key=demo`, { method: "POST", headers: { "Content-Type": "application/json" }, body });
  const j = await r.json();
  if (!j.localId) throw new Error(`Falha ao criar usuário no emulador: ${JSON.stringify(j)}`);
  return j.localId;
}

const uid = await ensureUser();
const env = await initializeTestEnvironment({
  projectId: PROJECT,
  firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 },
});
const now = Date.now();
const ts = (h) => Timestamp.fromDate(new Date(now + h * 3600000));

await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  const put = (p, d) => setDoc(doc(db, p), d);
  await put(`adminUsers/${uid}`, { active: true, role: "owner", email: EMAIL, name: "Demo" });

  const photo = (i, cat, featured) => ({
    categoryId: cat, title: "", alt: `[DEMO] Foto ${i}`, url: ["/legacy/hero-1.webp", "/legacy/hero-2.webp", "/legacy/about-1.webp"][i % 3],
    thumbUrl: ["/legacy/hero-1-800.webp", "/legacy/hero-2-800.webp", "/legacy/about-1-800.webp"][i % 3],
    width: 1600, height: i % 3 === 2 ? 1066 : 1067, order: i, featured, published: true, createdAt: Timestamp.now(),
  });
  await put("galleryCategories/familia", { name: "[DEMO] Ensaios de família", slug: "ensaios-de-familia", description: "Categoria de demonstração.", visible: true, order: 1, coverUrl: "/legacy/hero-2.webp", coverThumbUrl: "/legacy/hero-2-800.webp" });
  await put("galleryCategories/infantil", { name: "[DEMO] Ensaios infantis", slug: "ensaios-infantis", description: "", visible: true, order: 2, coverUrl: "/legacy/hero-1.webp", coverThumbUrl: "/legacy/hero-1-800.webp" });
  for (let i = 1; i <= 8; i++) await put(`galleryPhotos/ph${i}`, photo(i, i % 2 ? "familia" : "infantil", i <= 6));

  await put("packages/p1", {
    name: "[DEMO] Pacote Família", slug: "demo-familia", categoryId: "familia", status: "published", order: 1, featured: true,
    description: "Pacote de demonstração para testes locais. Valores fictícios.", highlights: ["20 fotos editadas", "1 cenário"],
    coverUrl: "/legacy/hero-2.webp", coverThumbUrl: "/legacy/hero-2-800.webp", durationMin: 45, photosDelivered: "20 fotos",
    ctaMode: "booking", showRemaining: true, priceCents: 40000, promoPriceCents: null, rules: "Valores de demonstração",
  });
  await put("packageLots/p1l1", { packageId: "p1", public: true, status: "active", name: "1º lote", priceCents: 38000, capacity: 3, confirmedCount: 0, salesStart: null, salesEnd: null, order: 1 });
  await put("packageLots/p1l2", { packageId: "p1", public: true, status: "active", name: "2º lote", priceCents: 42000, capacity: 5, confirmedCount: 0, salesStart: null, salesEnd: null, order: 2 });
  await put("packages/p2", {
    name: "[DEMO] Ensaio Individual", slug: "demo-individual", categoryId: "infantil", status: "published", order: 2,
    description: "Contratação pelo WhatsApp (demonstração).", highlights: [], coverUrl: "/legacy/hero-1.webp", coverThumbUrl: "/legacy/hero-1-800.webp",
    durationMin: 60, ctaMode: "whatsapp", priceCents: 50000, promoPriceCents: 45000,
  });
  await put("packages/p3", { name: "[DEMO] Rascunho", status: "draft", order: 3, priceCents: 1000 });
  await put("meta/packages", { publishedIds: ["p1", "p2"] });

  const weekly = Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((d) => [d, { enabled: true, start: "09:00", end: "17:00" }]));
  await put("availability/config", {
    bookingEnabled: true, weekly, sessionMinutes: 45, bufferMinutes: 15, capacityPerSlot: 1, maxPerDay: null,
    minAdvanceHours: 2, maxAdvanceDays: 60, openFrom: null, openUntil: null, blockedDates: [], blockedRanges: [], specialDates: [], location: "", publicNote: "",
  });

  await put("vipCampaigns/c1", {
    name: "[DEMO] Lista VIP de teste", slug: "demo", status: "published", description: "Campanha de demonstração.", benefits: ["Acesso antecipado", "Preço especial"],
    registrationStart: null, registrationEnd: ts(48), vipAccessStartsAt: ts(-1), countdownEndsAt: ts(20), afterEndAction: "message", endMessage: "Encerrada.",
    maxRegistrations: 50, showBanner: true, fields: { askEmail: true, requireEmail: false, askPreferences: true }, consentText: "Autorizo o uso dos meus dados para esta campanha (demonstração).",
    retentionDays: 365, vipPricing: { p1: 30000 }, createdAt: Timestamp.now(),
  });
});
await env.cleanup();
console.log(`Emulador populado. Admin: ${EMAIL} / ${PASSWORD} (uid ${uid})`);
