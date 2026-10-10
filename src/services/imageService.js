// Upload de imagens: valida, reduz e converte para WebP no navegador antes de
// enviar. Cada foto vira duas versões — "full" (até 2048px) para a visualização
// ampliada e "thumb" (até 720px) para as grades — além de um mini placeholder
// (≈20px) guardado no próprio documento para o efeito de carregamento suave.
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "./firebaseStorage.js";

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
export const MAX_INPUT_BYTES = 40 * 1024 * 1024;

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

export async function processImage(file, { maxEdge = 2048, thumbEdge = 720, quality = 0.84 } = {}) {
  const err = validateImageFile(file);
  if (err) throw new Error(err);
  const bmp = await loadBitmap(file);
  const width = bmp.width, height = bmp.height;
  if (width < 200 || height < 200) throw new Error(`${file.name}: imagem pequena demais (mínimo 200px).`);
  const full = await toBlob(draw(bmp, maxEdge), quality);
  const thumb = await toBlob(draw(bmp, thumbEdge), 0.78);
  const tiny = draw(bmp, 20).toDataURL("image/jpeg", 0.5);
  if (bmp.close) bmp.close();
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return { full, thumb, placeholder: tiny, width: Math.round(width * scale), height: Math.round(height * scale) };
}

function ext(blob) {
  return blob.type === "image/webp" ? "webp" : "jpg";
}

export function uploadBlob(path, blob, onProgress) {
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(ref(storage, path), blob, {
      contentType: blob.type,
      cacheControl: "public, max-age=31536000",
    });
    task.on("state_changed",
      (s) => onProgress?.(s.bytesTransferred / s.totalBytes),
      reject,
      async () => resolve({ path, url: await getDownloadURL(task.snapshot.ref) }));
  });
}

/**
 * Processa e envia uma imagem para public/{folder}/... Retorna URLs, caminhos
 * no Storage, dimensões e placeholder.
 */
export async function uploadImage(file, folder, { onProgress, thumb = true, maxEdge } = {}) {
  const p = await processImage(file, maxEdge ? { maxEdge } : undefined);
  const stamp = Date.now().toString(36);
  const fullUp = await uploadBlob(`public/${folder}/${stamp}-full.${ext(p.full)}`, p.full, (x) => onProgress?.(thumb ? x * 0.8 : x));
  let thumbUp = null;
  if (thumb) thumbUp = await uploadBlob(`public/${folder}/${stamp}-thumb.${ext(p.thumb)}`, p.thumb, (x) => onProgress?.(0.8 + x * 0.2));
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

export async function deleteStoragePaths(paths) {
  await Promise.all((paths || []).filter(Boolean).map((p) =>
    deleteObject(ref(storage, p)).catch((e) => {
      if (e?.code !== "storage/object-not-found") console.warn("Falha ao apagar", p, e);
    })));
}
