// Upload de imagens: valida, reduz e converte para WebP no navegador antes de
// enviar. Sem o plano Blaze o Firebase Storage não está disponível, então cada
// arquivo é guardado no Firestore (coleção imageBlobs, em base64, até ~700 KB)
// e servido pela função /api/img/{id} (Vercel), com cache de CDN. Cada foto vira duas versões — "full" (até 2048px) para a visualização
// ampliada e "thumb" (até 720px) para as grades — além de um mini placeholder
// (≈20px) guardado no próprio documento para o efeito de carregamento suave.
import { collection, deleteDoc, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebase.js";

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
export const MAX_INPUT_BYTES = 40 * 1024 * 1024;
const MAX_BLOB_BYTES = 700 * 1024;

export function validateImageFile(file) {
  if (!file) return "Nenhum arquivo selecionado.";
  if (!ACCEPTED_TYPES.includes(file.type)) return `${file.name}: formato não aceito (use JPG, PNG, WebP ou AVIF).`;
  if (file.size > MAX_INPUT_BYTES) return `${file.name}: arquivo maior que 40 MB.`;
  return null;
}

async function loadBitmap(file) {
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

function draw(bitmap, maxEdge) {
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

function toBlob(canvas, quality) {
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


function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1]);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

/** Grava um arquivo em imageBlobs e devolve { path, url }. */
export async function uploadBlob(folder, blob, onProgress) {
  const ref = doc(collection(db, "imageBlobs"));
  onProgress?.(0.1);
  const data = await blobToBase64(blob);
  await setDoc(ref, { data, contentType: blob.type, size: blob.size, folder, createdAt: serverTimestamp() });
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
  await Promise.all((paths || []).filter((p) => typeof p === "string" && p.startsWith("imageBlobs/")).map((p) =>
    deleteDoc(doc(db, p)).catch((e) => console.warn("Falha ao apagar", p, e))));
}
