// Seletor de fonte: algumas sugestões à vista + "Ver mais fontes", que abre
// um modal com todas, busca por nome/estilo e filtro por categoria.
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Search, X } from "lucide-react";
import { FONT_SAMPLE_TEXT, loadFont, loadFontSample } from "../../config/siteStyle.js";

const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function FontCard({ f, on, onPick, sample, big }) {
  return (
    <button type="button" onClick={() => onPick(f.id)} aria-pressed={on}
      className={`relative flex min-w-0 flex-col rounded-2xl border bg-surface p-3 text-left transition ${on ? "border-wine-900 ring-2 ring-wine-900/15" : "border-ink/10 hover:border-ink/30"}`}>
      <span className={`block truncate leading-tight text-ink ${big ? "text-3xl" : "text-lg"}`} style={{ fontFamily: `"${f.id}", serif` }}>{sample}</span>
      <span className="mt-2 block truncate text-sm font-medium">{f.label}</span>
      <span className="block truncate text-xs text-ink-muted">{f.mood || f.cat}</span>
      {on && <Check className="absolute right-2 top-2 h-4 w-4 text-wine-900" aria-label="Em uso" />}
    </button>
  );
}

/**
 * kind "display" (títulos) mostra "Aa"; "body" mostra uma frase curta.
 * featured = quantas aparecem antes do botão "Ver mais fontes".
 */
export default function FontPicker({ fonts, value, onChange, kind = "display", featured = 6, columns = "grid-cols-2 sm:grid-cols-3" }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Todas");
  const search = useRef(null);
  const sample = kind === "display" ? "Aa" : "Agende já";
  const bigSample = kind === "display" ? "Momentos" : "Agende o seu ensaio";

  // À vista: a fonte em uso primeiro, depois as primeiras da lista.
  const shown = useMemo(() => {
    const cur = fonts.find((f) => f.id === value);
    const rest = fonts.filter((f) => f.id !== value).slice(0, featured - (cur ? 1 : 0));
    return cur ? [cur, ...rest] : rest;
  }, [fonts, value, featured]);
  const cats = useMemo(() => ["Todas", ...new Set(fonts.map((f) => f.cat).filter(Boolean))], [fonts]);
  const list = useMemo(() => {
    const t = norm(q);
    return fonts.filter((f) => (cat === "Todas" || f.cat === cat) && (!t || norm(`${f.label} ${f.id} ${f.mood} ${f.cat}`).includes(t)));
  }, [fonts, q, cat]);

  useEffect(() => { shown.forEach((f) => loadFontSample(f, FONT_SAMPLE_TEXT)); }, [shown]);
  useEffect(() => {
    if (!open) return undefined;
    fonts.forEach((f) => loadFontSample(f, FONT_SAMPLE_TEXT));
    setTimeout(() => search.current?.focus(), 50);
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open, fonts]);

  const pick = (id) => { loadFont(fonts.find((f) => f.id === id)); onChange(id); };

  return (
    <div>
      <div className={`grid gap-2 ${columns}`}>
        {shown.map((f) => <FontCard key={f.id} f={f} on={f.id === value} onPick={pick} sample={sample} />)}
      </div>
      <button type="button" className="btn-ghost btn-sm mt-3" onClick={() => setOpen(true)}>
        <Search className="h-4 w-4" /> Ver mais fontes ({fonts.length})
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Escolher fonte" onClick={() => setOpen(false)}>
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-ivory shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-3 border-b border-ink/10 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-2xl">{kind === "display" ? "Fonte dos títulos" : "Fonte dos textos"}</h2>
                <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-ink/5" aria-label="Fechar"><X className="h-5 w-5" /></button>
              </div>
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden />
                <input ref={search} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome ou estilo (ex.: romântica, caligrafia)"
                  className="field-input !pl-9" aria-label="Buscar fonte" />
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {cats.map((c) => (
                  <button key={c} type="button" onClick={() => setCat(c)} aria-pressed={cat === c}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-xs ${cat === c ? "border-wine-900 bg-wine-900 text-cream" : "border-ink/15 text-ink-soft hover:border-ink/30"}`}>{c}</button>
                ))}
              </div>
            </div>
            <div className="overflow-y-auto p-4 sm:p-5">
              {list.length ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {list.map((f) => <FontCard key={f.id} f={f} on={f.id === value} big onPick={(id) => { pick(id); setOpen(false); }} sample={bigSample} />)}
                </div>
              ) : <p className="py-10 text-center text-sm text-ink-muted">Nenhuma fonte encontrada para “{q}”.</p>}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
