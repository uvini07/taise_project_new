// Ações de fotos da FOTÓGRAFA (precisa estar logada). Dá links de upload,
// apaga arquivos e informa o uso de armazenamento. Toda chave é validada para
// começar com o prefixo do próprio estúdio: ninguém sobe ou apaga foto de outro.
import { ConfigError, studioOfUser, userFrom } from "../../lib/admin.js";
import { BUCKETS, del, putUrl, usageBytes } from "../../lib/r2.js";

const MAX_KEYS = 60; // por chamada

function allowedPrefix(bucketName, slug) {
  if (bucketName === "selecao") return `sel/${slug}/`;
  if (bucketName === "entrega") return `ent/${slug}/`;
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });
  try {
    const user = await userFrom(req);
    if (!user) return res.status(401).json({ error: "Entre no painel." });
    const mine = await studioOfUser(user.uid);
    if (!mine) return res.status(403).json({ error: "Esta conta não tem um estúdio." });
    const { action, bucket, keys } = req.body || {};
    const bucketName = bucket === "entrega" ? "entrega" : "selecao";
    const prefix = allowedPrefix(bucketName, mine.slug);

    if (action === "usage") {
      const [sel, ent] = await Promise.all([usageBytes(BUCKETS.selecao, `sel/${mine.slug}/`), usageBytes(BUCKETS.entrega, `ent/${mine.slug}/`)]);
      return res.status(200).json({ bytes: sel + ent, selecao: sel, entrega: ent });
    }

    const list = Array.isArray(keys) ? keys : [];
    if (!list.length) return res.status(400).json({ error: "Nada para processar." });
    if (list.length > MAX_KEYS) return res.status(400).json({ error: `Muitos arquivos de uma vez (máx. ${MAX_KEYS}).` });
    // Segurança: toda chave tem que ser do próprio estúdio.
    for (const k of list) { const key = typeof k === "string" ? k : k?.key; if (!key || !key.startsWith(prefix)) return res.status(403).json({ error: "Caminho não permitido." }); }

    if (action === "upload") {
      const urls = await Promise.all(list.map(async (k) => ({ key: k.key, url: await putUrl(BUCKETS[bucketName], k.key, k.contentType || "application/octet-stream") })));
      return res.status(200).json({ urls });
    }
    if (action === "delete") {
      await del(BUCKETS[bucketName], list.map((k) => (typeof k === "string" ? k : k.key)));
      return res.status(200).json({ ok: true });
    }
    return res.status(400).json({ error: "Ação inválida." });
  } catch (err) {
    if (err instanceof ConfigError) return res.status(503).json({ error: err.message });
    console.error("fotos/studio", err);
    return res.status(500).json({ error: "Erro inesperado nas fotos." });
  }
}
