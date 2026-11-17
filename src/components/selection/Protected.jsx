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
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='440' height='240'><g transform='rotate(-30 220 120)'>`
      + `<text x='220' y='122' text-anchor='middle' font-family='Georgia,serif' font-size='13' fill='white' fill-opacity='0.20' stroke='black' stroke-opacity='0.08' stroke-width='0.5'>${safe}</text></g></svg>`;
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
      <span className="absolute inset-0" style={overlay ? { backgroundImage: overlay, backgroundSize: "440px 240px" } : undefined} aria-hidden />
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

/** Aviso ao abrir a seleção: por que a marca d'água e a qualidade reduzida. */
export function AntiPiracyNotice({ open, onClose, brand }) {
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/60 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="antipiracy-title">
      <div className="w-full max-w-md rounded-3xl bg-ivory p-6 text-center shadow-2xl">
        <ShieldCheck className="mx-auto h-10 w-10 text-gold" strokeWidth={1.3} aria-hidden />
        <h2 id="antipiracy-title" className="mt-3 font-display text-3xl">Suas fotos estão protegidas</h2>
        <p className="mt-3 text-sm text-ink-soft">
          As imagens desta página aparecem com <strong>marca d'água</strong> e em <strong>qualidade reduzida</strong> de propósito:
          são ferramentas contra pirataria, para que ninguém copie ou use as fotos sem autorização.
        </p>
        <p className="mt-3 text-sm text-ink-soft">
          Fique tranquilo(a): depois que você escolher suas fotos, {brand ? <strong>{brand}</strong> : "a fotógrafa"} vai
          disponibilizá-las <strong>em alta qualidade e sem marca d'água</strong>.
        </p>
        <button type="button" onClick={onClose} className="btn-primary mt-6 w-full justify-center">Entendi, ver as fotos</button>
      </div>
    </div>,
    document.body,
  );
}
