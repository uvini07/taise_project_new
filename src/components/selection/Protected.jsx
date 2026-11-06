import { createPortal } from "react-dom";
import { ShieldCheck } from "lucide-react";

/**
 * Imagem protegida: sem arrastar, sem menu de "salvar imagem" e com uma
 * camada transparente por cima, para o toque longo e o clique direito não
 * pegarem a foto. Use dentro de uma área com proteção ativa (useCopyProtection).
 */
export function ProtectedImg({ src, className = "", imgClassName = "h-full w-full object-cover", loading = "lazy" }) {
  return (
    <span className={`protect-area relative block ${className}`} onContextMenu={(e) => e.preventDefault()}>
      <img src={src} alt="" draggable={false} loading={loading} className={imgClassName} />
      <span className="absolute inset-0" aria-hidden />
    </span>
  );
}

/** Tela que cobre as fotos enquanto a janela está sem foco ou num atalho de print. */
export function ProtectionShield({ show, brand }) {
  if (!show) return null;
  return createPortal(
    <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center gap-3 bg-ivory px-6 text-center" role="status">
      <ShieldCheck className="h-10 w-10 text-gold" strokeWidth={1.3} aria-hidden />
      <p className="font-display text-3xl">Fotos protegidas</p>
      <p className="max-w-sm text-sm text-ink-muted">
        As fotos ficam ocultas enquanto esta janela não está em uso. Clique ou toque aqui para continuar escolhendo.
      </p>
      {brand && <p className="mt-2 text-xs uppercase tracking-[.25em] text-ink-muted">{brand}</p>}
    </div>,
    document.body,
  );
}
