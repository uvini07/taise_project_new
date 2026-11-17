// Motor do Cloudflare R2 (API compatível com S3). Só roda no servidor: as
// chaves (R2_*) nunca vão para o navegador. O navegador recebe apenas "links
// assinados" de curta duração para subir ou baixar um arquivo específico.
import { DeleteObjectsCommand, GetObjectCommand, HeadObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ConfigError } from "./admin.js";

export const BUCKETS = { selecao: process.env.R2_BUCKET_SELECAO || "revela-selecao", entrega: process.env.R2_BUCKET_ENTREGA || "revela-entrega" };

let client = null;
export function r2() {
  if (client) return client;
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) throw new ConfigError("Falta a configuração do R2 (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY) na Vercel.");
  client = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  });
  return client;
}

/** Link assinado para SUBIR um arquivo nessa chave exata (expira em minutos). */
export const putUrl = (bucket, key, contentType, expiresIn = 900) =>
  getSignedUrl(r2(), new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }), { expiresIn });

/** Link assinado para BAIXAR/VER um arquivo (expira). downloadName força "salvar como". */
export const getUrl = (bucket, key, { expiresIn = 3600, downloadName } = {}) =>
  getSignedUrl(r2(), new GetObjectCommand({ Bucket: bucket, Key: key, ...(downloadName ? { ResponseContentDisposition: `attachment; filename="${downloadName.replace(/"/g, "")}"` } : {}) }), { expiresIn });

/** Apaga vários objetos de uma vez (apagar é grátis no R2). */
export async function del(bucket, keys) {
  const list = (keys || []).filter(Boolean);
  if (!list.length) return;
  // O S3 aceita até 1000 por chamada.
  for (let i = 0; i < list.length; i += 1000) {
    await r2().send(new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: list.slice(i, i + 1000).map((Key) => ({ Key })), Quiet: true } }));
  }
}

/** Lista as chaves com um prefixo (ex.: todas as fotos de um ensaio). */
export async function listKeys(bucket, prefix) {
  const out = [];
  let token;
  do {
    const r = await r2().send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: token }));
    (r.Contents || []).forEach((o) => out.push(o.Key));
    token = r.IsTruncated ? r.NextContinuationToken : undefined;
  } while (token);
  return out;
}

/** Soma o tamanho ocupado por um prefixo (para mostrar o uso de armazenamento). */
export async function usageBytes(bucket, prefix) {
  let total = 0; let token;
  do {
    const r = await r2().send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: token }));
    (r.Contents || []).forEach((o) => { total += o.Size || 0; });
    token = r.IsTruncated ? r.NextContinuationToken : undefined;
  } while (token);
  return total;
}

export async function exists(bucket, key) {
  try { await r2().send(new HeadObjectCommand({ Bucket: bucket, Key: key })); return true; } catch { return false; }
}

// Caminhos determinísticos (reenviar sobrescreve, nunca duplica) e isolados por estúdio.
const safe = (s) => String(s || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 60);
export const selKey = (slug, selId, photoId) => `sel/${safe(slug)}/${safe(selId)}/${safe(photoId)}.webp`;
export const selThumbKey = (slug, selId, photoId) => `sel/${safe(slug)}/${safe(selId)}/${safe(photoId)}_t.webp`;
export const entKey = (slug, delId, fileId, name) => `ent/${safe(slug)}/${safe(delId)}/${safe(fileId)}-${safe(name).slice(0, 40) || "foto"}`;
export const selPrefix = (slug, selId) => `sel/${safe(slug)}/${safe(selId)}/`;
export const entPrefix = (slug, delId) => `ent/${safe(slug)}/${safe(delId)}/`;
