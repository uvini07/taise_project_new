// Ações do CLIENTE (sem login). O acesso é protegido pelo link único (o id da
// seleção/entrega, que é aleatório e impossível de adivinhar). O servidor lê os
// dados com a conta de serviço, então as seleções ficam totalmente privadas no
// banco — nada é exposto direto ao navegador.
import { ConfigError, adminDb } from "../../lib/admin.js";
import { BUCKETS, getUrl } from "../../lib/r2.js";
import { FieldValue } from "firebase-admin/firestore";

const okStr = (v, max = 80) => typeof v === "string" && v.length > 0 && v.length <= max;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });
  try {
    const { action, studio, kind, id, selectedIds, fileId } = req.body || {};
    if (!okStr(studio) || !okStr(id)) return res.status(400).json({ error: "Link inválido." });
    const col = kind === "entrega" ? "deliveries" : "selections";
    const snap = await adminDb().doc(`studios/${studio}/${col}/${id}`).get();
    if (!snap.exists) return res.status(404).json({ error: "Página não encontrada. Confira o link." });
    const d = snap.data();

    // Expira sozinho pela data (não depende do robô de limpeza).
    const expired = d.expiresAt?.toDate && d.expiresAt.toDate() < new Date();

    if (action === "gallery") {
      if (kind === "entrega") {
        if (d.status === "draft") return res.status(403).json({ error: "Esta entrega ainda não foi liberada." });
        if (expired) return res.status(410).json({ error: "O prazo para baixar estas fotos já encerrou." });
        const files = await Promise.all((d.files || []).map(async (f) => ({ id: f.id, name: f.name, size: f.size })));
        return res.status(200).json({ clientName: d.clientName || "", title: d.title || "", total: files.length, files, expiresAt: d.expiresAt?.toDate?.()?.toISOString() || null });
      }
      if (d.status === "draft") return res.status(403).json({ error: "Esta seleção ainda não foi liberada." });
      if (expired) return res.status(410).json({ error: "O prazo para escolher as fotos já encerrou." });
      const photos = await Promise.all((d.photos || []).map(async (p) => ({
        id: p.id, w: p.w, h: p.h,
        thumb: await getUrl(BUCKETS.selecao, p.tkey, { expiresIn: 3600 }),
        full: await getUrl(BUCKETS.selecao, p.key, { expiresIn: 3600 }),
      })));
      return res.status(200).json({ clientName: d.clientName || "", title: d.title || "", photoLimit: d.photoLimit || null, status: d.status, selectedIds: d.selectedIds || [], finished: d.status === "finished", total: photos.length, photos, expiresAt: d.expiresAt?.toDate?.()?.toISOString() || null });
    }

    if (action === "pick") {
      if (kind === "entrega") return res.status(400).json({ error: "Ação inválida." });
      if (d.status === "finished") return res.status(409).json({ error: "Esta seleção já foi finalizada." });
      if (expired) return res.status(410).json({ error: "O prazo para escolher as fotos já encerrou." });
      const valid = new Set((d.photos || []).map((p) => p.id));
      const picked = [...new Set((selectedIds || []).filter((x) => valid.has(x)))];
      if (d.photoLimit && picked.length > d.photoLimit) return res.status(400).json({ error: `Você pode escolher no máximo ${d.photoLimit} fotos.` });
      await snap.ref.update({ selectedIds: picked, status: "selecting", updatedAt: FieldValue.serverTimestamp() });
      return res.status(200).json({ ok: true, selectedIds: picked });
    }

    if (action === "finish") {
      if (kind === "entrega") return res.status(400).json({ error: "Ação inválida." });
      if (expired) return res.status(410).json({ error: "O prazo já encerrou." });
      const valid = new Set((d.photos || []).map((p) => p.id));
      const picked = [...new Set((selectedIds || []).filter((x) => valid.has(x)))];
      if (!picked.length) return res.status(400).json({ error: "Escolha pelo menos uma foto." });
      if (d.photoLimit && picked.length > d.photoLimit) return res.status(400).json({ error: `Você pode escolher no máximo ${d.photoLimit} fotos.` });
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
      return res.status(200).json({ url });
    }

    return res.status(400).json({ error: "Ação inválida." });
  } catch (err) {
    if (err instanceof ConfigError) return res.status(503).json({ error: err.message });
    console.error("fotos/cliente", err);
    return res.status(500).json({ error: "Erro inesperado." });
  }
}
