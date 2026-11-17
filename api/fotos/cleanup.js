// Robô diário (Vercel Cron): apaga do R2 as seleções e entregas vencidas e
// marca como "expirado". Apagar no R2 é grátis; isso é o que segura o custo.
// Protegido por CRON_SECRET para ninguém disparar de fora.
import { ConfigError, adminDb } from "../../lib/admin.js";
import { FieldValue } from "firebase-admin/firestore";
import { BUCKETS, del, entPrefix, listKeys, selPrefix } from "../../lib/r2.js";

async function sweep(col, bucket, prefixFn, now) {
  let apagadas = 0;
  const studios = await adminDb().collection("studios").get();
  for (const st of studios.docs) {
    const slug = st.id;
    const q = await st.ref.collection(col).where("expiresAt", "<=", now).get();
    for (const doc of q.docs) {
      const d = doc.data();
      if (d.status === "draft" || d.status === "expired") continue;
      // Apaga TUDO sob o prefixo (pega qualquer arquivo órfão também).
      const keys = await listKeys(bucket, prefixFn(slug, doc.id));
      await del(bucket, keys);
      await doc.ref.update({ status: "expired", photos: col === "selections" ? FieldValue.delete() : undefined, files: col === "deliveries" ? [] : undefined, expiredAt: FieldValue.serverTimestamp() });
      apagadas += 1;
    }
  }
  return apagadas;
}

export default async function handler(req, res) {
  // Só a Vercel Cron (ou quem tem o segredo) roda isto.
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.authorization || "";
  if (secret && auth !== `Bearer ${secret}`) return res.status(401).json({ error: "Não autorizado." });
  try {
    const now = new Date();
    const sel = await sweep("selections", BUCKETS.selecao, selPrefix, now);
    const ent = await sweep("deliveries", BUCKETS.entrega, entPrefix, now);
    console.log(JSON.stringify({ limpeza: "ok", selecoes: sel, entregas: ent }));
    return res.status(200).json({ ok: true, selecoes: sel, entregas: ent });
  } catch (err) {
    if (err instanceof ConfigError) return res.status(503).json({ error: err.message });
    console.error("fotos/cleanup", err);
    return res.status(500).json({ error: "Erro na limpeza." });
  }
}
