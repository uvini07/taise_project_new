import { LOGO, LOGO_ORDER, LOGO_VB } from "../revela/logoPaths.js";
// Upload de imagens: valida, reduz e converte para WebP no navegador antes de
// enviar. Sem o plano Blaze o Firebase Storage não está disponível, então cada
// arquivo é guardado no Firestore (coleção imageBlobs, em base64, até ~700 KB)
// e servido pela função /api/img/{id} (Vercel), com cache de CDN. Cada foto vira duas versões — "full" (até 2048px) para a visualização
// ampliada e "thumb" (até 720px) para as grades — além de um mini placeholder
// (≈20px) guardado no próprio documento para o efeito de carregamento suave.
import { collection, deleteDoc, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebase.js";
import { auth } from "./firebaseAuth.js";
import { scrambleMoves, scramblePlan } from "../utils/imageScramble.js";

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
export const MAX_INPUT_BYTES = 40 * 1024 * 1024;
const MAX_BLOB_BYTES = 700 * 1024;

export function validateImageFile(file) {
  if (!file) return "Nenhum arquivo selecionado.";
  if (!ACCEPTED_TYPES.includes(file.type)) return `${file.name}: formato não aceito (use JPG, PNG, WebP ou AVIF).`;
  if (file.size > MAX_INPUT_BYTES) return `${file.name}: arquivo maior que 40 MB.`;
  return null;
}

export async function loadBitmap(file) {
  if ("createImageBitmap" in window) {
    try { return await createImageBitmap(file, { imageOrientation: "from-image" }); } catch { /* cai no <img> */ }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

export function draw(bitmap, maxEdge) {
  const w = bitmap.width, h = bitmap.height;
  const scale = Math.min(1, maxEdge / Math.max(w, h));
  const cw = Math.max(1, Math.round(w * scale)), ch = Math.max(1, Math.round(h * scale));
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, cw, ch);
  return canvas;
}

export function toBlob(canvas, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((b) => {
      if (b && b.type === "image/webp") return resolve(b);
      // Navegadores sem codificador WebP: usa JPEG.
      canvas.toBlob((j) => resolve(j), "image/jpeg", quality);
    }, "image/webp", quality);
  });
}

export async function processImage(file, { maxEdge = 1800, thumbEdge = 720, quality = 0.82 } = {}) {
  const err = validateImageFile(file);
  if (err) throw new Error(err);
  const bmp = await loadBitmap(file);
  const width = bmp.width, height = bmp.height;
  if (width < 200 || height < 200) throw new Error(`${file.name}: imagem pequena demais (mínimo 200px).`);
  // Limite do documento do Firestore: reduz qualidade/tamanho até caber.
  let full, edge = maxEdge, q = quality;
  for (let i = 0; i < 8; i++) {
    full = await toBlob(draw(bmp, edge), q);
    if (full.size <= MAX_BLOB_BYTES) break;
    if (q > 0.6) q -= 0.08; else edge = Math.round(edge * 0.85);
  }
  if (full.size > MAX_BLOB_BYTES) throw new Error(`${file.name}: não foi possível reduzir a imagem o suficiente.`);
  maxEdge = edge;
  const thumb = await toBlob(draw(bmp, thumbEdge), 0.78);
  const tiny = draw(bmp, 20).toDataURL("image/jpeg", 0.5);
  if (bmp.close) bmp.close();
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return { full, thumb, placeholder: tiny, width: Math.round(width * scale), height: Math.round(height * scale) };
}


/**
 * Marca d'água da Revela: só faixas diagonais com a logo "revela" e o texto
 * (estúdio · cliente), repetidas na foto inteira, com posição sorteada em
 * cada foto. Discreta para ver a foto, mas cobre tudo (difícil de recortar).
 */
let logoPaths = null;
function revelaLogo() {
  if (!logoPaths && typeof Path2D !== "undefined") logoPaths = LOGO_ORDER.map((k) => new Path2D(LOGO[k]));
  return logoPaths;
}
function stampRevelaWatermark(canvas, text) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height, min = Math.min(W, H);
  const reach = Math.hypot(W, H);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const paths = revelaLogo();
  const [, , vbW, vbH] = LOGO_VB.split(" ").map(Number);
  const logoH = Math.max(10, Math.round(min / 26));
  const logoW = (vbW / vbH) * logoH;
  const size = Math.round(logoH * 0.62);
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(-Math.PI / 6);
  ctx.font = `500 ${size}px Georgia, serif`;
  ctx.textBaseline = "middle";
  const label = text ? `  ·  ${text}` : "";
  const itemW = logoW + (label ? ctx.measureText(label).width : 0) + logoH * 2.2;
  const stepY = logoH * 4.2;
  const offX = rnd(0, itemW), offY = rnd(0, stepY);
  ctx.lineWidth = Math.max(0.8, logoH / 22);
  for (let y = -reach + offY, row = 0; y <= reach; y += stepY, row++) {
    for (let x = -reach + offX + (row % 2 ? itemW / 2 : 0); x <= reach; x += itemW) {
      ctx.save();
      ctx.translate(x, y - logoH / 2);
      ctx.scale(logoH / vbH, logoH / vbH);
      ctx.fillStyle = "rgba(255,255,255,0.30)";
      ctx.strokeStyle = "rgba(0,0,0,0.10)";
      if (paths) for (const p of paths) { ctx.fill(p); ctx.stroke(p); }
      ctx.restore();
      if (label) {
        ctx.fillStyle = "rgba(255,255,255,0.28)";
        ctx.strokeStyle = "rgba(0,0,0,0.10)";
        ctx.strokeText(label, x + logoW, y);
        ctx.fillText(label, x + logoW, y);
      }
    }
  }
  ctx.restore();
}

// Qualidade das prévias para o cliente: fixa e propositalmente baixa (anti-pirataria).
export const PREVIEW_MAX_EDGE = 1000;
export const PREVIEW_QUALITY = 0.55;

function scrambleCanvas(src, cols, rows) {
  const plan = scramblePlan(src.width, src.height, cols, rows);
  const out = document.createElement("canvas");
  out.width = plan.fileWidth;
  out.height = plan.fileHeight;
  const ctx = out.getContext("2d");
  for (const { from: f, to: t } of scrambleMoves(plan, "scramble")) ctx.drawImage(src, f.x, f.y, f.w, f.h, t.x, t.y, f.w, f.h);
  const { perm, tileW, tileH, pad, width, height } = plan;
  return { canvas: out, meta: { cols, rows, tileW, tileH, pad, width, height, perm } };
}

export async function makeSelectionPreview(file, {
  maxEdge = PREVIEW_MAX_EDGE, thumbEdge = 400, quality = PREVIEW_QUALITY, watermark = "", scramble = true,
} = {}) {
  const err = validateImageFile(file);
  if (err) throw new Error(err);
  const bmp = await loadBitmap(file);
  const width = bmp.width, height = bmp.height;
  // Sempre com a marca da Revela; o texto (estúdio · cliente) é opcional.
  const mark = (c) => stampRevelaWatermark(c, watermark);
  const finish = (c, grid) => (scramble ? scrambleCanvas(c, grid, grid) : { canvas: c, meta: null });

  const bigSrc = draw(bmp, maxEdge);
  mark(bigSrc);
  const big = finish(bigSrc, 6);
  const preview = await toBlob(big.canvas, quality);

  const smallSrc = draw(bmp, thumbEdge);
  mark(smallSrc);
  const small = finish(smallSrc, 4);
  const thumb = await toBlob(small.canvas, 0.6);
  if (bmp.close) bmp.close();
  return {
    preview, thumb, previewScramble: big.meta, thumbScramble: small.meta,
    width: big.meta?.width || big.canvas.width, height: big.meta?.height || big.canvas.height, originalWidth: width, originalHeight: height,
  };
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1]);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

/** Guarda a imagem no Cloudflare R2 (pela API do site) e devolve { path, url }.
 *  Se o R2 falhar, cai no jeito antigo (Firestore imageBlobs) para não travar o envio. */
export async function uploadBlob(folder, blob, onProgress) {
  onProgress?.(0.1);
  const data = await blobToBase64(blob);
  try {
    const token = await auth.currentUser?.getIdToken();
    const r = await fetch("/api/img/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ data, contentType: blob.type, folder }),
    });
    if (r.ok) { const j = await r.json(); onProgress?.(1); return { path: j.path, url: j.url }; }
  } catch { /* usa o Firestore abaixo */ }
  const ref = doc(collection(db, "imageBlobs"));
  await setDoc(ref, { data, contentType: blob.type, size: blob.size, folder, createdAt: serverTimestamp(), owner: auth.currentUser?.uid || "" });
  onProgress?.(1);
  return { path: `imageBlobs/${ref.id}`, url: `/api/img/${ref.id}` };
}

/**
 * Processa e envia uma imagem. Retorna URLs, caminhos, dimensões e placeholder.
 */
export async function uploadImage(file, folder, { onProgress, thumb = true, maxEdge } = {}) {
  const p = await processImage(file, maxEdge ? { maxEdge } : undefined);
  const fullUp = await uploadBlob(folder, p.full, (x) => onProgress?.(thumb ? x * 0.8 : x));
  let thumbUp = null;
  if (thumb) thumbUp = await uploadBlob(folder, p.thumb, (x) => onProgress?.(0.8 + x * 0.2));
  return {
    url: fullUp.url,
    path: fullUp.path,
    thumbUrl: thumbUp?.url || fullUp.url,
    thumbPath: thumbUp?.path || null,
    width: p.width,
    height: p.height,
    placeholder: p.placeholder,
  };
}

/** Apaga arquivos enviados (aceita caminhos imageBlobs/{id}; ignora outros). */
export async function deleteStoragePaths(paths) {
  const list = (paths || []).filter((p) => typeof p === "string" && p.startsWith("imageBlobs/"));
  if (!list.length) return;
  const token = await auth.currentUser?.getIdToken().catch(() => null);
  await Promise.all(list.map(async (p) => {
    // A mesma imagem pode estar no R2 (nova ou já migrada) e no Firestore (antiga): apaga dos dois.
    await fetch(`/api/img/${p.slice("imageBlobs/".length)}`, { method: "DELETE", headers: token ? { Authorization: `Bearer ${token}` } : {} }).catch(() => {});
    await deleteDoc(doc(db, p)).catch(() => {});
  }));
}
