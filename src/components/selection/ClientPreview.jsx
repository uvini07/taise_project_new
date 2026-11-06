import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Heart, ShieldCheck, X } from "lucide-react";
import { ProtectedImg, ProtectionShield } from "./Protected.jsx";
import { useCopyProtection } from "../../hooks/useCopyProtection.js";
import { useBodyLock } from "../../hooks/useBodyLock.js";

/**
 * Pré-visualização de como o cliente vê a seleção, com a mesma proteção
 * contra cópia da página definitiva. As escolhas feitas aqui não são salvas.
 */
export default function ClientPreview({ selection, brand, onClose }) {
  const protect = selection.copyProtection !== false;
  const shielded = useCopyProtection(protect);
  const [picked, setPicked] = useState(() => new Set(selection.selectedIds || []));
  const [view, setView] = useState(null);
  useBodyLock(true);
  const photos = selection.photos;
  const limit = Number(selection.photoLimit) || photos.length;
  const over = picked.size > limit;
  const current = view != null ? photos[view] : null;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") { if (view != null) setView(null); else onClose(); }
      if (view != null && e.key === "ArrowRight") setView((v) => (v + 1) % photos.length);
      if (view != null && e.key === "ArrowLeft") setView((v) => (v - 1 + photos.length) % photos.length);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [view, photos.length, onClose]);

  const toggle = (id) => setPicked((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const counter = useMemo(() => `${picked.size} de ${limit}`, [picked.size, limit]);

  return createPortal(
    <div className="fixed inset-0 z-[90] flex flex-col bg-paper" role="dialog" aria-modal="true" aria-label="Visualização do cliente">
      <div className="flex items-center gap-3 border-b border-ink/10 bg-wine-900 px-4 py-2 text-xs text-cream sm:px-6">
        <ShieldCheck className="h-4 w-4 shrink-0" />
        <p className="flex-1">Pré-visualização: é assim que o cliente vê. {protect ? "Proteção contra cópia ativa — teste clique direito, toque longo e atalhos de print." : "Proteção contra cópia desligada neste ensaio."} Escolhas feitas aqui não são salvas.</p>
        <button onClick={onClose} className="rounded-full p-1.5 hover:bg-cream/10" aria-label="Fechar pré-visualização"><X className="h-5 w-5" /></button>
      </div>

      <header className="flex flex-wrap items-end justify-between gap-3 px-4 pb-4 pt-6 sm:px-8">
        <div>
          <p className="text-xs uppercase tracking-[.25em] text-ink-muted">{brand}</p>
          <h1 className="font-display text-4xl">{selection.clientName}</h1>
          {selection.title && <p className="text-sm text-ink-muted">{selection.title}</p>}
        </div>
        <div className={`rounded-full px-4 py-2 text-sm font-medium ${over ? "bg-warning/15 text-warning" : "bg-wine-900 text-cream"}`}>
          <Heart className="mr-1.5 inline h-4 w-4 fill-current align-[-3px]" /> {counter} escolhidas
        </div>
      </header>
      {selection.message && <p className="mx-4 mb-4 max-w-2xl rounded-2xl bg-surface p-4 text-sm text-ink-soft sm:mx-8">{selection.message}</p>}

      <div className="protect-area flex-1 overflow-y-auto px-4 pb-10 sm:px-8">
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
          {photos.map((p, i) => {
            const on = picked.has(p.id);
            return (
              <li key={p.id} className={`relative overflow-hidden rounded-xl bg-surface ${on ? "ring-2 ring-wine-900" : ""}`}>
                <button type="button" className="block aspect-[4/5] w-full" onClick={() => setView(i)} aria-label={`Ampliar foto ${i + 1}`}>
                  <ProtectedImg src={p.thumbUrl} className="h-full w-full" />
                </button>
                <button type="button" onClick={() => toggle(p.id)} aria-pressed={on} aria-label={on ? "Desmarcar" : "Escolher"}
                  className={`absolute bottom-2 right-2 grid h-10 w-10 place-items-center rounded-full shadow-lift transition ${on ? "bg-wine-900 text-cream" : "bg-surface/90 text-wine-900"}`}>
                  <Heart className={`h-5 w-5 ${on ? "fill-current" : ""}`} />
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {current && (
        <div className="protect-area fixed inset-0 z-[100] flex items-center justify-center bg-[#120607]/95" onClick={(e) => { if (e.target === e.currentTarget) setView(null); }}>
          <ProtectedImg key={current.id} src={current.previewUrl} loading="eager" className="max-h-[86vh] max-w-[94vw]" imgClassName="max-h-[86vh] max-w-[94vw] object-contain" />
          <button onClick={() => setView(null)} className="absolute right-3 top-3 rounded-full p-3 text-cream/80 hover:text-white" aria-label="Fechar"><X className="h-6 w-6" /></button>
          <button onClick={() => setView((v) => (v - 1 + photos.length) % photos.length)} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-3 text-cream/80 hover:text-white" aria-label="Anterior"><ChevronLeft className="h-8 w-8" /></button>
          <button onClick={() => setView((v) => (v + 1) % photos.length)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-3 text-cream/80 hover:text-white" aria-label="Próxima"><ChevronRight className="h-8 w-8" /></button>
          <button onClick={() => toggle(current.id)} className={`absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full px-5 py-3 text-sm font-medium shadow-lift ${picked.has(current.id) ? "bg-wine-900 text-cream" : "bg-surface text-wine-900"}`}>
            <Heart className={`h-5 w-5 ${picked.has(current.id) ? "fill-current" : ""}`} /> {picked.has(current.id) ? "Escolhida" : "Escolher esta foto"} · {counter}
          </button>
        </div>
      )}

      <ProtectionShield show={shielded} brand={brand} />
    </div>,
    document.body,
  );
}
