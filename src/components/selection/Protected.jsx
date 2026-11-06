import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { ShieldCheck } from "lucide-react";
import { scrambleMoves } from "../../utils/imageScramble.js";

/**
 * Desenha num <canvas> uma imagem guardada embaralhada (ver imageScramble.js).
 * Sem `scramble`, desenha a imagem como está. Não existe <img> com a foto
 * montada: "Salvar imagem" e a aba Rede só entregam o quebra-cabeça.
 */
export function ScrambledImage({ src, scramble, className = "", fit = "cover", label }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!src) return undefined;
    let alive = true;
    const img = new Image();
    img.decoding = "async";
    img.src = src;
    img.decode().then(() => {
      const c = ref.current;
      if (!alive || !c) return;
      const ctx = c.getContext("2d");
      if (!scramble) {
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);
        return;
      }
      const { cols, rows, tileW, tileH } = scramble;
      c.width = cols * tileW;
      c.height = rows * tileH;
      const plan = { ...scramble, width: c.width, height: c.height };
      for (const { from: f, to: t } of scrambleMoves(plan, "unscramble")) ctx.drawImage(img, f.x, f.y, f.w, f.h, t.x, t.y, t.w, t.h);
    }).catch(() => {});
    return () => { alive = false; };
  }, [src, scramble]);
  return <canvas ref={ref} role="img" aria-label={label || "Foto"} className={className} style={{ objectFit: fit }} />;
}

/** Marca d'água extra, desenhada por cima na tela (nome + data e hora). Sai em qualquer print. */
export function useLiveWatermark(text) {
  return useMemo(() => {
    if (!text) return null;
    const safe = String(text).replace(/[<>&"]/g, "");
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='360' height='180'><g transform='rotate(-24 180 90)'>`
      + `<text x='180' y='92' text-anchor='middle' font-family='Georgia,serif' font-size='15' fill='white' fill-opacity='0.30' stroke='black' stroke-opacity='0.14' stroke-width='0.6'>${safe}</text></g></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, [text]);
}

/**
 * Foto protegida: canvas (sem arquivo montado), sem arrastar, sem menu de
 * "salvar imagem", com camada transparente por cima e marca d'água ao vivo.
 */
export function ProtectedImg({ src, scramble, overlay, className = "", imgClassName = "h-full w-full", fit = "cover" }) {
  return (
    <span className={`protect-area relative block ${className}`} onContextMenu={(e) => e.preventDefault()}>
      <ScrambledImage src={src} scramble={scramble} className={imgClassName} fit={fit} />
      <span className="absolute inset-0" style={overlay ? { backgroundImage: overlay, backgroundSize: "360px 180px" } : undefined} aria-hidden />
    </span>
  );
}

const SHIELD_TEXT = {
  devtools: "Feche as ferramentas do navegador (Inspecionar) para voltar a ver as fotos.",
  default: "As fotos ficam ocultas enquanto esta janela não está em uso. Clique ou toque aqui para continuar escolhendo.",
};

/** Tela que cobre as fotos: janela sem foco, atalho de print ou DevTools aberto. */
export function ProtectionShield({ show, reason, brand }) {
  if (!show) return null;
  return createPortal(
    <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center gap-3 bg-ivory px-6 text-center" role="status">
      <ShieldCheck className="h-10 w-10 text-gold" strokeWidth={1.3} aria-hidden />
      <p className="font-display text-3xl">Fotos protegidas</p>
      <p className="max-w-sm text-sm text-ink-muted">{SHIELD_TEXT[reason] || SHIELD_TEXT.default}</p>
      {brand && <p className="mt-2 text-xs uppercase tracking-[.25em] text-ink-muted">{brand}</p>}
    </div>,
    document.body,
  );
}
