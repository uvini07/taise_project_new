// Ações de fotos da FOTÓGRAFA (logada). O SERVIDOR gera os caminhos (sempre
// dentro do próprio estúdio) e devolve links de upload de curta duração.
// Também apaga arquivos e informa o uso de armazenamento.
import { FieldValue } from "firebase-admin/firestore";
import { ConfigError, adminDb, studioOfUser, userFrom } from "../../lib/admin.js";
import { generatePassword, hashPassword } from "../../lib/clientPass.js";
import { BUCKETS, del, entKey, entPrefix, getUrl, listKeys, putUrl, selKey, selPrefix, selThumbKey, usageBytes } from "../../lib/r2.js";

const MAX_ITEMS = 40; // por chamada

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });
  try {
    const user = await userFrom(req);
    if (!user) return res.status(401).json({ error: "Entre no painel." });
    const mine = await studioOfUser(user.uid, user.email);
    if (!mine) return res.status(403).json({ error: "Esta conta não tem um estúdio." });
    const slug = mine.slug;
    const { action, kind, parentId, items, keys } = req.body || {};
    const isEntrega = kind === "entrega";
    const bucket = isEntrega ? BUCKETS.entrega : BUCKETS.selecao;

    if (action === "usage") {
      const [sel, ent] = await Promise.all([usageBytes(BUCKETS.selecao, `sel/${slug}/`), usageBytes(BUCKETS.entrega, `ent/${slug}/`)]);
      return res.status(200).json({ bytes: sel + ent, selecao: sel, entrega: ent });
    }

    if (action === "upload") {
      if (!parentId || !Array.isArray(items) || !items.length) return res.status(400).json({ error: "Nada para enviar." });
      if (items.length > MAX_ITEMS) return res.status(400).json({ error: `Muitos arquivos de uma vez (máx. ${MAX_ITEMS}).` });
      const out = await Promise.all(items.map(async (it) => {
        const id = String(it.id || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);
        if (!id) throw new Error("item sem id");
        if (isEntrega) {
          const key = entKey(slug, parentId, id, it.name || "foto");
          const out = { id, key, url: await putUrl(bucket, key, it.contentType || "application/octet-stream") };
          // Miniatura WebP só para a galeria do cliente (mesma pasta: some junto na limpeza).
          if (it.thumb) { out.tkey = `${key}_t.webp`; out.turl = await putUrl(bucket, out.tkey, "image/webp"); }
          return out;
        }
        const key = selKey(slug, parentId, id);
        const tkey = selThumbKey(slug, parentId, id);
        return { id, key, tkey, url: await putUrl(bucket, key, "image/webp"), turl: await putUrl(bucket, tkey, "image/webp") };
      }));
      return res.status(200).json({ items: out });
    }

    if (action === "setpass") {
      // Gera (ou reseta) a senha do cliente. Só o hash fica no banco; a senha
      // em texto volta UMA vez para a fotógrafa mandar junto com o link.
      if (!parentId || typeof parentId !== "string" || parentId.length > 80) return res.status(400).json({ error: "Página inválida." });
      const col = isEntrega ? "deliveries" : "selections";
      const ref = adminDb().doc(slug === "tarufino" ? `${col}/${parentId}` : `studios/${slug}/${col}/${parentId}`);
      if (!(await ref.get()).exists) return res.status(404).json({ error: "Página não encontrada." });
      const password = generatePassword();
      await ref.update({ access: { ...hashPassword(password), setAt: FieldValue.serverTimestamp() }, accessFails: 0, accessLockedUntil: null });
      return res.status(200).json({ password });
    }

    if (action === "viewurls") {
      // Links temporários para a fotógrafa VER as fotos que já subiu.
      const pfx = isEntrega ? `ent/${slug}/` : `sel/${slug}/`;
      const list = (keys || []).filter((k) => typeof k === "string" && k.startsWith(pfx)).slice(0, 2000);
      const urls = {};
      await Promise.all(list.map(async (k) => { urls[k] = await getUrl(bucket, k, { expiresIn: 3600 }); }));
      return res.status(200).json({ urls });
    }
    if (action === "delete") {
      // Apaga por chaves (validadas) ou um ensaio inteiro (por prefixo).
      
      if (parentId) { const pfx = isEntrega ? entPrefix(slug, parentId) : selPrefix(slug, parentId); const list = await listKeys(bucket, pfx); await del(bucket, list); return res.status(200).json({ ok: true, apagadas: list.length }); }
      const list = (keys || []).filter((k) => typeof k === "string" && k.startsWith(isEntrega ? `ent/${slug}/` : `sel/${slug}/`));
      await del(bucket, list);
      return res.status(200).json({ ok: true, apagadas: list.length });
    }
    return res.status(400).json({ error: "Ação inválida." });
  } catch (err) {
    if (err instanceof ConfigError) return res.status(503).json({ error: err.message });
    console.error("fotos/studio", err);
    return res.status(500).json({ error: "Erro inesperado nas fotos." });
  }
}
