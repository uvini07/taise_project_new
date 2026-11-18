// Ações do CLIENTE (sem login). O acesso é protegido pelo link único (o id da
// seleção/entrega, que é aleatório e impossível de adivinhar). O servidor lê os
// dados com a conta de serviço, então as seleções ficam totalmente privadas no
// banco — nada é exposto direto ao navegador.
import { ConfigError, adminDb } from "../../lib/admin.js";
import { BUCKETS, getUrl } from "../../lib/r2.js";
import { FieldValue } from "firebase-admin/firestore";
import { LOCK_MINUTES, MAX_FAILS, checkPassword } from "../../lib/clientPass.js";

const okStr = (v, max = 80) => typeof v === "string" && v.length > 0 && v.length <= max;

// A Taíse (estúdio original) guarda tudo na raiz do banco; os demais em studios/{slug}/.
const LEGACY_SLUG = "tarufino";
async function studioName(slug) {
  if (slug === LEGACY_SLUG) return "Taíse Foto";
  const s = (await adminDb().doc(`studios/${slug}`).get().catch(() => null))?.data() || {};
  return s.name || s.studioName || s.brandName || "";
}
const IMG = /\.(jpe?g|png|webp|heic|heif|gif|avif)$/i;
const docPath = (studio, col, id) => (studio === LEGACY_SLUG ? `${col}/${id}` : `studios/${studio}/${col}/${id}`);

// Rastreamento: acessos e tentativas de captura ficam no próprio registro
// (últimos MAX_LOG), para a fotógrafa ver no painel.
const MAX_LOG = 200;
const EVENT_TYPES = new Set(["open", "print_key", "capture_shortcut", "print_page", "devtools", "save_attempt", "download"]);
function device(ua = "") {
  const os = /iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "Outro";
  const br = /Edg\//.test(ua) ? "Edge" : /CriOS|Chrome\//.test(ua) ? "Chrome" : /FxiOS|Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Navegador";
  return `${os} · ${br}`;
}
async function track(ref, d, req, type, extra = {}) {
  const h = req.headers || {};
  const ip = String(h["x-forwarded-for"] || "").split(",")[0].trim() || null;
  const city = h["x-vercel-ip-city"] ? decodeURIComponent(String(h["x-vercel-ip-city"])) : null;
  const entry = { type, at: new Date(), device: device(String(h["user-agent"] || "")), ip, city, ...extra };
  const log = [...(d.activity || []), entry].slice(-MAX_LOG);
  const patch = { activity: log };
  if (type !== "open" && type !== "download") patch.captureAlerts = FieldValue.increment(1);
  await ref.update(patch).catch(() => {});
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });
  try {
    const { action, studio, kind, id, selectedIds, fileId, password, type, photoIndex, photoId, text } = req.body || {};
    if (!okStr(studio) || !okStr(id)) return res.status(400).json({ error: "Link inválido." });
    const col = kind === "entrega" ? "deliveries" : "selections";
    const snap = await adminDb().doc(docPath(studio, col, id)).get();
    if (!snap.exists) return res.status(404).json({ error: "Página não encontrada. Confira o link." });
    const d = snap.data();

    // Senha de acesso (gerada ao liberar o link). Páginas antigas, sem senha, seguem abertas.
    if (d.access?.hash) {
      const lockedUntil = d.accessLockedUntil?.toDate?.();
      if (lockedUntil && lockedUntil > new Date()) {
        const min = Math.ceil((lockedUntil - new Date()) / 60000);
        return res.status(429).json({ error: `Muitas tentativas erradas. Tente de novo em ${min} min.`, needPassword: true });
      }
      if (!password) return res.status(401).json({ error: "Digite a senha que você recebeu com o link.", needPassword: true });
      if (!checkPassword(password, d.access)) {
        const fails = (d.accessFails || 0) + 1;
        const lock = fails >= MAX_FAILS;
        await snap.ref.update(lock ? { accessFails: 0, accessLockedUntil: new Date(Date.now() + LOCK_MINUTES * 60000) } : { accessFails: fails });
        return res.status(401).json({ error: lock ? `Muitas tentativas erradas. Tente de novo em ${LOCK_MINUTES} min.` : "Senha incorreta. Confira a mensagem que você recebeu.", needPassword: true, wrong: true });
      }
      if (d.accessFails) snap.ref.update({ accessFails: 0 }).catch(() => {});
    }

    // Expira sozinho pela data (não depende do robô de limpeza).
    const expired = d.expiresAt?.toDate && d.expiresAt.toDate() < new Date();

    if (action === "event") {
      if (!EVENT_TYPES.has(type) || type === "open" || type === "download") return res.status(400).json({ error: "Evento inválido." });
      const n = Number.isInteger(photoIndex) && photoIndex >= 0 && photoIndex < 5000 ? photoIndex + 1 : null;
      await track(snap.ref, d, req, type, n ? { photo: n } : {});
      return res.status(200).json({ ok: true });
    }

    if (action === "gallery") {
      if (d.status !== "draft" && !expired) await track(snap.ref, d, req, "open");
      if (kind === "entrega") {
        if (d.status === "draft") return res.status(403).json({ error: "Esta entrega ainda não foi liberada." });
        if (expired) return res.status(410).json({ error: "O prazo para baixar estas fotos já encerrou." });
        const files = await Promise.all((d.files || []).map(async (f) => {
          const img = (f.type || "").startsWith("image/") || IMG.test(f.name || "");
          // A miniatura (WebP leve) abre a galeria rápido; arquivos antigos sem miniatura usam o original.
          const thumb = f.tkey ? await getUrl(BUCKETS.entrega, f.tkey, { expiresIn: 3600 }) : img ? await getUrl(BUCKETS.entrega, f.key, { expiresIn: 3600 }) : null;
          return { id: f.id, name: f.name, size: f.size, width: f.width || null, height: f.height || null, thumb, image: img };
        }));
        const cover = files.find((f) => f.id === d.coverId && f.thumb) || files.find((f) => f.thumb) || null;
        const coverUrl = d.cover?.key ? await getUrl(BUCKETS.entrega, d.cover.key, { expiresIn: 3600 }) : null;
        return res.status(200).json({ coverUrl, studioName: await studioName(studio), clientName: d.clientName || "", title: d.title || "", total: files.length, files, coverId: cover?.id || null, expiresAt: d.expiresAt?.toDate?.()?.toISOString() || null });
      }
      if (d.status === "draft") return res.status(403).json({ error: "Esta seleção ainda não foi liberada." });
      if (expired) return res.status(410).json({ error: "O prazo para escolher as fotos já encerrou." });
      const photos = await Promise.all((d.photos || []).map(async (p) => ({
        id: p.id, width: p.width || null, height: p.height || null,
        thumb: await getUrl(BUCKETS.selecao, p.tkey, { expiresIn: 3600 }),
        full: await getUrl(BUCKETS.selecao, p.key, { expiresIn: 3600 }),
        thumbScramble: p.thumbScramble || null, fullScramble: p.previewScramble || null,
      })));
      return res.status(200).json({ coverUrl: d.cover?.key ? await getUrl(BUCKETS.selecao, d.cover.key, { expiresIn: 3600 }) : null, studioName: await studioName(studio), coverId: (photos.find((p) => p.id === d.coverId) || photos[0])?.id || null, clientName: d.clientName || "", title: d.title || "", message: d.message || "", photoLimit: d.photoLimit || null, allowExtras: !!d.allowExtras, extraPriceCents: d.extraPriceCents || null, status: d.status, selectedIds: d.selectedIds || [], comments: d.comments || {}, finished: d.status === "finished", copyProtection: d.copyProtection !== false, total: photos.length, photos, expiresAt: d.expiresAt?.toDate?.()?.toISOString() || null });
    }

    if (action === "pick") {
      if (kind === "entrega") return res.status(400).json({ error: "Ação inválida." });
      if (d.status === "finished") return res.status(409).json({ error: "Esta seleção já foi finalizada." });
      if (expired) return res.status(410).json({ error: "O prazo para escolher as fotos já encerrou." });
      const valid = new Set((d.photos || []).map((p) => p.id));
      const picked = [...new Set((selectedIds || []).filter((x) => valid.has(x)))];
      if (d.photoLimit && !d.allowExtras && picked.length > d.photoLimit) return res.status(400).json({ error: `Você pode escolher no máximo ${d.photoLimit} fotos.` });
      await snap.ref.update({ selectedIds: picked, status: "selecting", updatedAt: FieldValue.serverTimestamp() });
      return res.status(200).json({ ok: true, selectedIds: picked });
    }

    if (action === "comment") {
      // Pedido do cliente para uma foto ("deixa sem edição", "tira a espinha"…).
      if (kind === "entrega") return res.status(400).json({ error: "Ação inválida." });
      if (d.status === "finished") return res.status(409).json({ error: "Esta seleção já foi finalizada." });
      if (expired) return res.status(410).json({ error: "O prazo já encerrou." });
      if (!(d.photos || []).some((p) => p.id === photoId)) return res.status(404).json({ error: "Foto não encontrada." });
      const t = String(text || "").replace(/\s+/g, " ").trim().slice(0, 300);
      await snap.ref.update({ [`comments.${photoId}`]: t ? { text: t, at: new Date() } : FieldValue.delete(), updatedAt: FieldValue.serverTimestamp() });
      return res.status(200).json({ ok: true, text: t });
    }

    if (action === "finish") {
      if (kind === "entrega") return res.status(400).json({ error: "Ação inválida." });
      if (expired) return res.status(410).json({ error: "O prazo já encerrou." });
      const valid = new Set((d.photos || []).map((p) => p.id));
      const picked = [...new Set((selectedIds || []).filter((x) => valid.has(x)))];
      if (!picked.length) return res.status(400).json({ error: "Escolha pelo menos uma foto." });
      if (d.photoLimit && !d.allowExtras && picked.length > d.photoLimit) return res.status(400).json({ error: `Você pode escolher no máximo ${d.photoLimit} fotos.` });
      await snap.ref.update({ selectedIds: picked, status: "finished", finishedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
      return res.status(200).json({ ok: true, finished: true });
    }

    if (action === "download") {
      if (kind !== "entrega") return res.status(400).json({ error: "Ação inválida." });
      if (d.status === "draft") return res.status(403).json({ error: "Entrega não liberada." });
      if (expired) return res.status(410).json({ error: "O prazo para baixar já encerrou." });
      const file = (d.files || []).find((f) => f.id === fileId);
      if (!file) return res.status(404).json({ error: "Arquivo não encontrado." });
      const url = await getUrl(BUCKETS.entrega, file.key, { expiresIn: 3600, downloadName: file.name });
      snap.ref.update({ downloads: FieldValue.increment(1) }).catch(() => {});
      await track(snap.ref, d, req, "download", { file: String(file.name).slice(0, 120) });
      return res.status(200).json({ url });
    }

    return res.status(400).json({ error: "Ação inválida." });
  } catch (err) {
    if (err instanceof ConfigError) return res.status(503).json({ error: err.message });
    console.error("fotos/cliente", err);
    return res.status(500).json({ error: "Erro inesperado." });
  }
}
