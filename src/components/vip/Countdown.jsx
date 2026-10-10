import { remainingParts, useServerNow } from "../../hooks/useServerNow.js";

const pad = (n) => String(n).padStart(2, "0");

/**
 * Contador até uma data final REAL (gravada na campanha). Não reinicia ao
 * recarregar e mostra o mesmo tempo em qualquer aparelho.
 */
export default function Countdown({ target, tone = "dark", compact = false, onDone }) {
  const now = useServerNow(1000);
  const r = remainingParts(target, now);
  if (r.done) { onDone?.(); return null; }
  const parts = [
    r.days > 0 && ["dias", r.days],
    ["horas", r.hours],
    ["min", r.minutes],
    ["seg", r.seconds],
  ].filter(Boolean);
  const color = tone === "light" ? "text-cream" : "text-wine-900";
  const label = `${r.days ? `${r.days} dias, ` : ""}${r.hours} horas, ${r.minutes} minutos`;
  if (compact) {
    return (
      <span className={`font-medium tabular-nums ${color}`} aria-label={`Faltam ${label}`}>
        {r.days > 0 && `${r.days}d `}{pad(r.hours)}:{pad(r.minutes)}:{pad(r.seconds)}
      </span>
    );
  }
  return (
    <div className="flex items-end gap-3 sm:gap-5" role="timer" aria-label={`Faltam ${label}`}>
      {parts.map(([lbl, v], i) => (
        <div key={lbl} className="flex items-end gap-3 sm:gap-5">
          <div className="text-center">
            <div className={`font-display text-4xl tabular-nums leading-none sm:text-5xl ${color}`}>{pad(v)}</div>
            <div className={`mt-1.5 text-[10px] uppercase tracking-[0.2em] ${tone === "light" ? "text-cream/60" : "text-ink-muted"}`}>{lbl}</div>
          </div>
          {i < parts.length - 1 && <span className={`pb-5 font-display text-2xl ${tone === "light" ? "text-cream/40" : "text-gold"}`}>:</span>}
        </div>
      ))}
    </div>
  );
}
