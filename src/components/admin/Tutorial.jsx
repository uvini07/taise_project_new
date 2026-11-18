// Tutorial de cada ferramenta: abre sozinho na primeira visita e pelo botão
// "Ver tutorial" quando a fotógrafa quiser rever.
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, GraduationCap, X } from "lucide-react";
import { TUTORIALS, tutorialKeyFor } from "../../config/tutorials.js";

const seenKey = (k) => `revela-tutorial-${k}`;
const wasSeen = (k) => { try { return !!localStorage.getItem(seenKey(k)); } catch { return true; } };
const markSeen = (k) => { try { localStorage.setItem(seenKey(k), "1"); } catch { /* sem storage */ } };

function Scene({ step }) {
  const Icon = step.icon;
  return (
    <div className="relative flex h-48 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-wine-900/10 via-gold/10 to-paper sm:h-56" aria-hidden>
      <span className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-wine-900/5" />
      <span className="absolute -bottom-12 -right-8 h-44 w-44 rounded-full bg-gold/10" />
      <div className="relative flex flex-col items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-wine-900 text-cream shadow-lift"><Icon className="h-8 w-8" strokeWidth={1.6} /></span>
        {step.ui?.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 px-4">
            {step.ui.map((u, i) => (
              <span key={u} className={`rounded-full px-3.5 py-1.5 text-xs font-medium shadow-soft ${i === 0 ? "bg-wine-900 text-cream" : "border border-ink/10 bg-surface text-ink-soft"}`}>{u}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function TutorialModal({ tkey, onClose }) {
  const t = TUTORIALS[tkey];
  const [i, setI] = useState(0);
  const close = useCallback(() => { markSeen(tkey); onClose(); }, [tkey, onClose]);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") setI((x) => Math.min(x + 1, t.steps.length - 1));
      if (e.key === "ArrowLeft") setI((x) => Math.max(x - 1, 0));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close, t]);
  if (!t) return null;
  const step = t.steps[i];
  const last = i === t.steps.length - 1;
  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-end justify-center bg-black/50 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="tut-title" onClick={close}>
      <div className="w-full max-w-lg animate-fade-up rounded-t-3xl bg-ivory p-5 shadow-2xl sm:rounded-3xl sm:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[.2em] text-ink-muted">Como usar · {t.title}</p>
          <button type="button" onClick={close} className="rounded-full p-2 hover:bg-ink/5" aria-label="Fechar tutorial"><X className="h-5 w-5" /></button>
        </div>
        <Scene step={step} />
        <h2 id="tut-title" className="mt-5 font-display text-2xl">{step.title}</h2>
        <p className="mt-2 min-h-[4.5rem] text-sm leading-relaxed text-ink-soft">{step.text}</p>
        <div className="mt-5 flex items-center gap-3">
          <div className="flex flex-1 gap-1.5" aria-label={`Passo ${i + 1} de ${t.steps.length}`}>
            {t.steps.map((_, k) => (
              <button key={k} type="button" onClick={() => setI(k)} aria-label={`Ir para o passo ${k + 1}`}
                className={`h-2 rounded-full transition-all ${k === i ? "w-6 bg-wine-900" : "w-2 bg-ink/15 hover:bg-ink/30"}`} />
            ))}
          </div>
          {i > 0 && <button type="button" className="btn-ghost btn-sm" onClick={() => setI(i - 1)}><ChevronLeft className="h-4 w-4" /> Voltar</button>}
          <button type="button" className="btn-primary btn-sm" onClick={() => (last ? close() : setI(i + 1))}>
            {last ? "Entendi" : <>Próximo <ChevronRight className="h-4 w-4" /></>}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Botão "Ver tutorial" da tela atual; abre sozinho na primeira visita. */
export function TutorialButton({ className = "btn-ghost btn-sm", tkey: forced, auto = true }) {
  const { pathname } = useLocation();
  const tkey = forced || tutorialKeyFor(pathname);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!tkey || !auto || wasSeen(tkey)) return undefined;
    // Visão geral: quem cuida da primeira visita é o tour de boas-vindas.
    if (tkey === "dashboard") { markSeen(tkey); return undefined; }
    const t = setTimeout(() => setOpen(true), 500);
    return () => clearTimeout(t);
  }, [tkey, auto]);
  if (!tkey) return null;
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}><GraduationCap className="h-4 w-4" /> Ver tutorial</button>
      {open && <TutorialModal tkey={tkey} onClose={() => setOpen(false)} />}
    </>
  );
}
