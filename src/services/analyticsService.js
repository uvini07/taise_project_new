// Métricas próprias e anônimas: contadores diários em analyticsDaily/{dia}.
// Nenhum dado pessoal é gravado. As regras só aceitam +1 em um contador por
// escrita. O Google Analytics (Firebase Analytics) é opcional e só é ativado
// depois que o visitante aceita os cookies.
import { doc, increment, setDoc } from "firebase/firestore";
import { db, app, useEmulators } from "./firebase.js";
import { toDayKey } from "../utils/format.js";

const CONSENT_KEY = "tf-cookie-consent";
const safe = (fn, fallback = null) => { try { return fn(); } catch { return fallback; } };

export function getConsent() {
  return safe(() => localStorage.getItem(CONSENT_KEY));
}

export function setConsent(value) {
  safe(() => localStorage.setItem(CONSENT_KEY, value));
  if (value === "accepted") initGoogleAnalytics();
}

let gaPromise = null;
export function initGoogleAnalytics() {
  if (gaPromise || typeof window === "undefined" || useEmulators) return gaPromise;
  if (getConsent() !== "accepted") return null;
  gaPromise = import("firebase/analytics")
    .then(async ({ isSupported, getAnalytics }) => ((await isSupported()) ? getAnalytics(app) : null))
    .catch(() => null);
  return gaPromise;
}

async function gaEvent(name, params) {
  const a = await (gaPromise || initGoogleAnalytics());
  if (!a) return;
  const { logEvent } = await import("firebase/analytics");
  logEvent(a, name, params);
}

const isBot = () => typeof navigator !== "undefined" && (navigator.webdriver || /bot|crawl|spider|lighthouse/i.test(navigator.userAgent));
const isAdminPath = () => typeof location !== "undefined" && location.pathname.startsWith("/adm");
const clean = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

/** Soma 1 ao contador `key` do dia. */
export function bump(key) {
  if (isBot() || isAdminPath()) return;
  const day = toDayKey(new Date());
  setDoc(doc(db, "analyticsDaily", day), { [key]: increment(1), _k: key }, { merge: true })
    .catch(() => { /* métrica nunca pode quebrar o site */ });
}

function once(storage, key) {
  return safe(() => {
    const s = storage();
    if (s.getItem(key)) return false;
    s.setItem(key, "1");
    return true;
  }, false);
}

/** Chamado a cada troca de página. */
export function trackPageView(path) {
  bump("pv");
  const slug = clean(path.split("/")[1] || "inicio") || "inicio";
  bump(`page__${slug}`);
  gaEvent("page_view", { page_path: path });

  if (once(() => sessionStorage, "tf-visit")) {
    bump("visit");
    const day = toDayKey(new Date());
    if (once(() => localStorage, `tf-uv-${day}`)) bump("uv");
    bump(`src__${trafficSource()}`);
  }
}

function trafficSource() {
  const params = new URLSearchParams(location.search);
  const utm = params.get("utm_source");
  if (utm) return clean(utm) || "outro";
  if (!document.referrer) return "direto";
  try {
    const host = new URL(document.referrer).hostname.replace(/^www\./, "");
    if (host === location.hostname) return "interno";
    if (/instagram/.test(host)) return "instagram";
    if (/facebook|fb\.com/.test(host)) return "facebook";
    if (/google\./.test(host)) return "google";
    if (/whatsapp|wa\.me/.test(host)) return "whatsapp";
    if (/tiktok/.test(host)) return "tiktok";
    return clean(host.split(".").slice(-2, -1)[0]) || "outro";
  } catch {
    return "outro";
  }
}

export const track = {
  whatsapp: (context) => { bump("wa"); gaEvent("contact_whatsapp", { context }); },
  cta: (label) => { bump("cta"); gaEvent("select_content", { content_type: "cta", item_id: label }); },
  packageView: (id) => { bump(`pkg__${clean(id)}`); gaEvent("view_item", { item_id: id }); },
  galleryCategory: (id) => { bump(`gcat__${clean(id)}`); gaEvent("select_content", { content_type: "gallery_category", item_id: id }); },
  vipSignup: (campaignId) => { bump("vip_signup"); bump(`camp__${clean(campaignId)}`); gaEvent("sign_up", { method: "vip", campaign: campaignId }); },
  booking: (packageId) => { bump("booking"); gaEvent("generate_lead", { item_id: packageId }); },
};
