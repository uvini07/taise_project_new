// Upload de imagens: valida, reduz e converte para WebP no navegador antes de
// enviar. Sem o plano Blaze o Firebase Storage não está disponível, então cada
// arquivo é guardado no Firestore (coleção imageBlobs, em base64, até ~700 KB)
// e servido pela função /api/img/{id} (Vercel), com cache de CDN. Cada foto vira duas versões — "full" (até 2048px) para a visualização
// ampliada e "thumb" (até 720px) para as grades — além de um mini placeholder
// (≈20px) guardado no próprio documento para o efeito de carregamento suave.
import { collection, deleteDoc, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebase.js";
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


function stampWatermark(canvas, text) {
  const ctx = canvas.getContext("2d");
  const size = Math.max(14, Math.round(Math.min(canvas.width, canvas.height) / 18));
  ctx.save();
  ctx.font = `600 ${size}px Georgia, serif`;
  ctx.fillStyle = "rgba(255,255,255,0.32)";
  ctx.strokeStyle = "rgba(0,0,0,0.12)";
  ctx.lineWidth = Math.max(1, size / 24);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(-Math.PI / 7);
  const stepX = ctx.measureText(text).width + size * 3;
  const stepY = size * 5;
  const reach = Math.hypot(canvas.width, canvas.height);
  for (let y = -reach; y <= reach; y += stepY) {
    for (let x = -reach + ((y / stepY) % 2 ? stepX / 2 : 0); x <= reach; x += stepX) {
      ctx.strokeText(text, x, y);
      ctx.fillText(text, x, y);
    }
  }
  ctx.restore();
}

/**
 * Marca d'água reforçada, feita para resistir a "removedores" com IA:
 * trama de linhas finas na foto inteira, texto denso com posição, ângulo e
 * opacidade variando em cada foto, e uma marca grande no centro (onde
 * normalmente está o rosto/assunto). Quanto mais área coberta e menos
 * previsível o padrão, pior a IA consegue reconstruir o que está por baixo.
 */
function stampStrongWatermark(canvas, text, brand) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height, min = Math.min(W, H);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const angle = (Math.random() < 0.5 ? -1 : 1) * rnd(Math.PI / 9, Math.PI / 5);
  const reach = Math.hypot(W, H);
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(angle);

  // 1) Trama de linhas finas (claras e escuras alternadas).
  const gap = Math.max(6, Math.round(min / 70));
  ctx.lineWidth = Math.max(1, min / 900);
  for (let x = -reach, i = 0; x <= reach; x += gap, i++) {
    ctx.strokeStyle = i % 2 ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.07)";
    ctx.beginPath(); ctx.moveTo(x, -reach); ctx.lineTo(x, reach); ctx.stroke();
  }

  // 2) Texto denso com variação em cada repetição.
  const size = Math.max(12, Math.round(min / 24));
  ctx.font = `600 ${size}px Georgia, serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = Math.max(1, size / 10);
  const stepX = ctx.measureText(text).width + size * 1.4;
  const stepY = size * 2.6;
  const offX = rnd(0, stepX), offY = rnd(0, stepY);
  for (let y = -reach + offY, row = 0; y <= reach; y += stepY, row++) {
    for (let x = -reach + offX + (row % 2 ? stepX / 2 : 0); x <= reach; x += stepX) {
      const a = rnd(0.26, 0.42);
      ctx.strokeStyle = `rgba(0,0,0,${(a * 0.55).toFixed(3)})`;
      ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
      const jx = rnd(-size * 0.35, size * 0.35), jy = rnd(-size * 0.25, size * 0.25);
      ctx.strokeText(text, x + jx, y + jy);
      ctx.fillText(text, x + jx, y + jy);
    }
  }
  ctx.restore();

  // 3) Marca grande no centro, por cima do assunto principal.
  ctx.save();
  ctx.translate(W / 2 + rnd(-W * 0.05, W * 0.05), H / 2 + rnd(-H * 0.05, H * 0.05));
  ctx.rotate(angle * 0.6);
  const big = Math.round(min / 7);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `600 ${big}px Georgia, serif`;
  ctx.lineWidth = Math.max(2, big / 14);
  ctx.strokeStyle = "rgba(0,0,0,0.22)";
  ctx.fillStyle = "rgba(255,255,255,0.48)";
  const label = (brand || text).toUpperCase();
  ctx.strokeText(label, 0, 0);
  ctx.fillText(label, 0, 0);
  if (text !== brand) {
    ctx.font = `600 ${Math.round(big / 2.6)}px Georgia, serif`;
    ctx.lineWidth = Math.max(1, big / 30);
    ctx.strokeText(text, 0, big * 0.85);
    ctx.fillText(text, 0, big * 0.85);
  }
  ctx.restore();
}

/** Corta o canvas em blocos e devolve outro canvas com os blocos embaralhados. */
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

/**
 * Versão leve para o cliente escolher (seleção de fotos): prévia WebP pequena
 * com marca d'água + miniatura para a grade. Com `scramble`, os arquivos são
 * gravados embaralhados (só a página monta a foto). O original não sai do
 * computador da fotógrafa.
 */
export async function makeSelectionPreview(file, {
  maxEdge = 1200, thumbEdge = 400, quality = 0.72, watermark = "", brand = "", strong = true, scramble = true,
} = {}) {
  const err = validateImageFile(file);
  if (err) throw new Error(err);
  const bmp = await loadBitmap(file);
  const width = bmp.width, height = bmp.height;
  const mark = (c) => { if (!watermark) return; if (strong) stampStrongWatermark(c, watermark, brand); else stampWatermark(c, watermark); };
  const finish = (c, grid) => (scramble ? scrambleCanvas(c, grid, grid) : { canvas: c, meta: null });

  const bigSrc = draw(bmp, maxEdge);
  mark(bigSrc);
  const big = finish(bigSrc, 6);
  const preview = await toBlob(big.canvas, quality);

  const smallSrc = draw(bmp, thumbEdge);
  mark(smallSrc);
  const small = finish(smallSrc, 4);
  const thumb = await toBlob(small.canvas, 0.7);
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
