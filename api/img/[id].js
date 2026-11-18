// Imagens do site do estúdio (logo, topo, galeria, pacotes…).
// Guardadas no Cloudflare R2 (bucket R2_BUCKET_SITE, chave img/{id}) e servidas
// aqui com cache longo na CDN da Vercel. O endereço /api/img/{id} não muda.
//
// Migração automática: imagens antigas ainda no Firestore (imageBlobs/{id}) são
// servidas de lá e copiadas para o R2 na primeira visita.
//
//   GET    /api/img/{id}     → a imagem
//   POST   /api/img/upload   → { data(base64), contentType } (logado) → { id, url, path }
//   DELETE /api/img/{id}     → apaga (logado, mesmo estúdio)
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { randomBytes } from "node:crypto";
import { ConfigError, adminDb, studioOfUser, userFrom } from "../../lib/admin.js";
import { r2 } from "../../lib/r2.js";

export const config = { api: { bodyParser: { sizeLimit: "4mb" } } };

const PROJECT = process.env.VITE_FIREBASE_PROJECT_ID || "taisefoto";
const BUCKET = process.env.R2_BUCKET_SITE || "revela-site";
const TYPES = new Set(["image/webp", "image/jpeg", "image/png", "image/avif", "image/svg+xml"]);
const okId = (id) => /^[A-Za-z0-9]{10,40}$/.test(String(id || ""));
const key = (id) => `img/${id}`;

async function fromR2(id) {
  try {
    const r = await r2().send(new GetObjectCommand({ Bucket: BUCKET, Key: key(id) }));
    return { type: r.ContentType || "image/webp", buf: Buffer.from(await r.Body.transformToByteArray()) };
  } catch { return null; }
}

async function fromFirestore(id) {
  const r = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/imageBlobs/${id}`);
  if (!r.ok) return null;
  const doc = await r.json();
  const data = doc.fields?.data?.stringValue;
  if (!data) return null;
  return { type: doc.fields?.contentType?.stringValue || "image/webp", buf: Buffer.from(data, "base64") };
}

function send(res, img) {
  res.setHeader("Content-Type", img.type);
  res.setHeader("Cache-Control", "public, max-age=31536000, s-maxage=31536000, immutable");
  res.status(200).send(img.buf);
}

export default async function handler(req, res) {
  const { id } = req.query;
  try {
    if (req.method === "GET") {
      if (!okId(id)) return res.status(400).end("id inválido");
      const hit = await fromR2(id);
      if (hit) return send(res, hit);
      const old = await fromFirestore(id);
      if (!old) return res.status(404).end("não encontrada");
      // Copia para o R2 (a próxima leitura já vem de lá). Falhou? Serve do mesmo jeito.
      await r2().send(new PutObjectCommand({ Bucket: BUCKET, Key: key(id), Body: old.buf, ContentType: old.type, Metadata: { origem: "firestore" } })).catch(() => {});
      return send(res, old);
    }

    const user = await userFrom(req);
    if (!user) return res.status(401).json({ error: "Entre na sua conta." });
    const slug = (await studioOfUser(user.uid, user.email))?.slug;
    if (!slug) return res.status(403).json({ error: "Conta sem estúdio." });

    if (req.method === "POST" && id === "upload") {
      const { data, contentType } = req.body || {};
      if (!TYPES.has(contentType) || typeof data !== "string" || !data) return res.status(400).json({ error: "Imagem inválida." });
      const buf = Buffer.from(data, "base64");
      if (!buf.length || buf.length > 3 * 1024 * 1024) return res.status(400).json({ error: "Imagem grande demais." });
      const newId = randomBytes(15).toString("hex").slice(0, 24);
      await r2().send(new PutObjectCommand({ Bucket: BUCKET, Key: key(newId), Body: buf, ContentType: contentType, Metadata: { studio: slug } }));
      return res.status(200).json({ id: newId, url: `/api/img/${newId}`, path: `imageBlobs/${newId}` });
    }

    if (req.method === "DELETE") {
      if (!okId(id)) return res.status(400).json({ error: "id inválido" });
      // No R2: só o dono apaga. Cópias migradas do Firestore não têm dono gravado:
      // valem as regras do documento antigo (o painel apaga o documento à parte).
      const head = await r2().send(new HeadObjectCommand({ Bucket: BUCKET, Key: key(id) })).catch(() => null);
      const owner = head?.Metadata?.studio;
      if (owner && owner !== slug) return res.status(403).json({ error: "Imagem de outro estúdio." });
      if (!owner && head) {
        const snap = await adminDb().doc(`imageBlobs/${id}`).get().catch(() => null);
        if (snap?.exists && snap.data().owner && snap.data().owner !== user.uid && slug !== "tarufino") return res.status(403).json({ error: "Imagem de outro estúdio." });
      }
      if (head) await r2().send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key(id) }));
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: "Método inválido." });
  } catch (err) {
    if (err instanceof ConfigError) return res.status(503).json({ error: err.message });
    console.error("img", err);
    return res.status(500).json({ error: "Erro ao processar a imagem." });
  }
}
