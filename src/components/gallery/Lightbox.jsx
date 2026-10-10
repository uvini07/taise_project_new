import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useBodyLock } from "../../hooks/useBodyLock.js";

/** Visualização ampliada: setas do teclado, deslizar no celular, Esc fecha. */
export default function Lightbox({ photos, index, onClose, onIndex }) {
  const open = index != null && index >= 0;
  useBodyLock(open);
  const touch = useRef(null);
  const closeBtn = useRef(null);
  const photo = open ? photos[index] : null;

  const go = useCallback((d) => {
    if (!open) return;
    onIndex((index + d + photos.length) % photos.length);
  }, [open, index, photos.length, onIndex]);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.activeElement;
    closeBtn.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); prev?.focus?.(); };
  }, [open, go, onClose]);

  // Pré-carrega a próxima foto.
  useEffect(() => {
    if (!open || photos.length < 2) return;
    const next = photos[(index + 1) % photos.length];
    const img = new Image();
    img.src = next.url;
  }, [open, index, photos]);

  if (!open || !photo) return null;
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Foto ampliada" className="fixed inset-0 z-[90] flex animate-fade-in items-center justify-center bg-[#120607]/95"
      onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touch.current == null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        touch.current = null;
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <img key={photo.id} src={photo.url} alt={photo.alt || photo.title || ""} className="max-h-[88vh] max-w-[94vw] animate-fade-in object-contain shadow-2xl" />
      {(photo.title || photos.length > 1) && (
        <div className="pointer-events-none absolute bottom-4 left-0 right-0 text-center text-xs tracking-wider text-cream/70">
          {photo.title && <span className="mr-3 font-display text-base italic text-cream">{photo.title}</span>}
          {index + 1} / {photos.length}
        </div>
      )}
      <button ref={closeBtn} onClick={onClose} aria-label="Fechar" className="absolute right-3 top-3 rounded-full p-3 text-cream/80 hover:bg-white/10 hover:text-white"><X className="h-6 w-6" /></button>
      {photos.length > 1 && (
        <>
          <button onClick={() => go(-1)} aria-label="Foto anterior" className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full p-3 text-cream/80 hover:bg-white/10 hover:text-white sm:block"><ChevronLeft className="h-7 w-7" /></button>
          <button onClick={() => go(1)} aria-label="Próxima foto" className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full p-3 text-cream/80 hover:bg-white/10 hover:text-white sm:block"><ChevronRight className="h-7 w-7" /></button>
        </>
      )}
    </div>,
    document.body,
  );
}
