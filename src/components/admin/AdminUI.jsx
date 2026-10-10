import { useRef, useState } from "react";
import { ImagePlus, Plus, Trash2, X } from "lucide-react";
import Spinner from "../common/Spinner.jsx";
import { PERIODS } from "../../utils/period.js";

export function AdminHeader({ title, text, actions }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-4xl">{title}</h1>
        {text && <p className="mt-1.5 max-w-2xl text-sm text-ink-muted">{text}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint, icon: Icon, tone = "default", onClick }) {
  const tones = {
    default: "text-ink",
    wine: "text-wine-900",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
    muted: "text-ink-muted",
  };
  const Tag = onClick ? "button" : "div";
  return (
    <Tag onClick={onClick} className={`card card-pad flex h-full flex-col text-left ${onClick ? "transition hover:shadow-lift" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-ink-muted">{label}</span>
        {Icon && <Icon className="h-4 w-4 text-gold" strokeWidth={1.6} aria-hidden />}
      </div>
      <span className={`mt-3 font-display text-3xl tabular-nums leading-none sm:text-[2.1rem] ${tones[tone]}`}>{value}</span>
      {hint && <span className="mt-2 text-xs text-ink-muted">{hint}</span>}
    </Tag>
  );
}

export function PeriodPicker({ value, custom, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap gap-1 rounded-full border border-ink/10 bg-white p-1">
        {PERIODS.map((p) => (
          <button key={p.id} onClick={() => onChange(p.id, custom)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${value === p.id ? "bg-wine-900 text-cream" : "text-ink-soft hover:bg-ink/5"}`}>
            {p.label}
          </button>
        ))}
      </div>
      {value === "custom" && (
        <div className="flex items-center gap-2 text-xs">
          <input type="date" className="field-input !w-auto !py-1.5 text-xs" value={custom.from || ""} onChange={(e) => onChange("custom", { ...custom, from: e.target.value })} aria-label="Data inicial" />
          <span>até</span>
          <input type="date" className="field-input !w-auto !py-1.5 text-xs" value={custom.to || ""} onChange={(e) => onChange("custom", { ...custom, to: e.target.value })} aria-label="Data final" />
        </div>
      )}
    </div>
  );
}

/**
 * Envio de uma imagem com prévia. upload(file, onProgress) deve retornar o
 * objeto de imagem ({ url, thumbUrl, path, ... }).
 */
export function ImageInput({ label, value, onUpload, onRemove, aspect = "aspect-[4/3]", hint }) {
  const input = useRef(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");
  async function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    setProgress(0);
    try { await onUpload(file, setProgress); } catch (err) { setError(err.message || "Falha no envio."); } finally { setProgress(null); }
  }
  return (
    <div>
      {label && <p className="field-label">{label}</p>}
      <div className={`relative overflow-hidden rounded-2xl border border-dashed border-ink/20 bg-paper ${aspect}`}>
        {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : (
          <button type="button" onClick={() => input.current?.click()} className="flex h-full w-full flex-col items-center justify-center gap-2 text-sm text-ink-muted hover:text-ink">
            <ImagePlus className="h-6 w-6 text-gold" strokeWidth={1.4} /> Escolher imagem
          </button>
        )}
        {progress != null && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/80 text-sm">
            <Spinner /> {Math.round(progress * 100)}%
          </div>
        )}
        {value && progress == null && (
          <div className="absolute right-2 top-2 flex gap-1">
            <button type="button" onClick={() => input.current?.click()} className="rounded-full bg-white/90 px-3 py-1.5 text-xs shadow hover:bg-white">Trocar</button>
            {onRemove && <button type="button" onClick={onRemove} className="rounded-full bg-white/90 p-1.5 text-danger shadow hover:bg-white" aria-label="Remover imagem"><X className="h-4 w-4" /></button>}
          </div>
        )}
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={pick} />
      {error ? <p className="field-error">{error}</p> : hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}

/** Lista editável de textos curtos (destaques, benefícios...). */
export function ListEditor({ label, items = [], onChange, placeholder = "Novo item", max = 20 }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (!v || items.length >= max) return;
    onChange([...items, v]);
    setDraft("");
  };
  return (
    <div>
      {label && <p className="field-label">{label}</p>}
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={`${it}-${i}`} className="flex items-center gap-2">
            <input className="field-input !py-2" value={it} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} aria-label={`Item ${i + 1}`} />
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="rounded-full p-2 text-ink-muted hover:bg-danger/10 hover:text-danger" aria-label="Remover item">
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      {items.length < max && (
        <div className="mt-2 flex gap-2">
          <input className="field-input !py-2" value={draft} placeholder={placeholder} onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
          <button type="button" onClick={add} className="btn-outline btn-sm shrink-0"><Plus className="h-4 w-4" /> Adicionar</button>
        </div>
      )}
    </div>
  );
}

export function Section({ title, text, children, actions }) {
  return (
    <section className="card card-pad">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">{title}</h2>
          {text && <p className="mt-1 text-sm text-ink-muted">{text}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
