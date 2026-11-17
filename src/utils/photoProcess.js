// Processa a foto NO NAVEGADOR antes de subir (sem custo de servidor):
// - prévia da seleção: reduz, converte para WebP e aplica marca d'água;
// - miniatura: bem pequena, para a galeria carregar rápido.
// A entrega final NÃO passa por aqui: sobe o arquivo original em alta.

const PREVIEW_MAX = 1400; // maior lado da prévia
const THUMB_MAX = 480;    // maior lado da miniatura
const PREVIEW_Q = 0.72;   // qualidade WebP da prévia
const THUMB_Q = 0.6;

function fit(w, h, max) {
  if (w <= max && h <= max) return [w, h];
  const r = w > h ? max / w : max / h;
  return [Math.round(w * r), Math.round(h * r)];
}

function drawWatermark(ctx, w, h, text) {
  if (!text) return;
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "rgba(0,0,0,.25)";
  ctx.lineWidth = 1;
  const size = Math.max(16, Math.round(w / 22));
  ctx.font = `600 ${size}px Arial, sans-serif`;
  ctx.textBaseline = "middle";
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-Math.PI / 7);
  const step = size * 5;
  const label = `  ${text}  `;
  for (let y = -h; y < h; y += step) {
    for (let x = -w; x < w; x += ctx.measureText(label).width + size) {
      ctx.strokeText(label, x, y);
      ctx.fillText(label, x, y);
    }
  }
  ctx.restore();
}

async function toBlob(canvas, quality) {
  const blob = await new Promise((res) => canvas.toBlob(res, "image/webp", quality));
  if (blob) return blob;
  // Safari antigo sem WebP: cai para JPEG (raro).
  return new Promise((res) => canvas.toBlob(res, "image/jpeg", quality));
}

function render(bitmap, max, watermark) {
  const [w, h] = fit(bitmap.width, bitmap.height, max);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, w, h);
  if (watermark) drawWatermark(ctx, w, h, watermark);
  return { canvas, w, h };
}

/** Gera prévia (com marca d'água) e miniatura em WebP a partir de um arquivo. */
export async function processForSelection(file, { watermark = "" } = {}) {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new Error(`Não consegui abrir "${file.name}". Use JPG ou PNG.`);
  try {
    const big = render(bitmap, PREVIEW_MAX, watermark);
    const small = render(bitmap, THUMB_MAX, watermark);
    const [preview, thumb] = await Promise.all([toBlob(big.canvas, PREVIEW_Q), toBlob(small.canvas, THUMB_Q)]);
    return { preview, thumb, w: bitmap.width, h: bitmap.height };
  } finally {
    bitmap.close?.();
  }
}

export const isImage = (file) => /^image\//.test(file.type) && !/heic|heif/i.test(file.type);
