import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, formatMonth, weekday } from "../../utils/format.js";

const WD = ["D", "S", "T", "Q", "Q", "S", "S"];
const WD_FULL = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

/**
 * Calendário mensal. days: [{ day, open, free, reason, label }]
 * Dias sem horário livre aparecem desabilitados com o motivo no título.
 */
export default function MonthCalendar({ month, days, selected, onSelect, onMonth, canPrev, canNext, loading }) {
  const first = `${month}-01`;
  const lead = weekday(first);
  const prevMonth = addDays(first, -1).slice(0, 7);
  const nextMonth = addDays(first, 32).slice(0, 7);

  return (
    <div className="select-none">
      <div className="mb-4 flex items-center justify-between">
        <button type="button" className="rounded-full p-2 hover:bg-ink/5 disabled:opacity-30" onClick={() => onMonth(prevMonth)} disabled={!canPrev} aria-label="Mês anterior">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="font-display text-2xl" aria-live="polite">{formatMonth(first)}</p>
        <button type="button" className="rounded-full p-2 hover:bg-ink/5 disabled:opacity-30" onClick={() => onMonth(nextMonth)} disabled={!canNext} aria-label="Próximo mês">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] uppercase tracking-wider text-ink-muted" aria-hidden>
        {WD.map((d, i) => <span key={i} className="py-1">{d}</span>)}
      </div>
      <div className={`mt-1 grid grid-cols-7 gap-1 transition-opacity ${loading ? "opacity-50" : ""}`} role="grid" aria-label={`Dias de ${formatMonth(first)}`}>
        {Array.from({ length: lead }).map((_, i) => <span key={`e${i}`} />)}
        {days.map((d) => {
          const available = d.open && d.free > 0;
          const isSel = selected === d.day;
          const n = Number(d.day.slice(8));
          const title = available ? `${d.free} ${d.free === 1 ? "horário livre" : "horários livres"}${d.label ? ` · ${d.label}` : ""}` : d.open ? "Sem horários livres" : d.reason;
          return (
            <button key={d.day} type="button" role="gridcell" disabled={!available || loading}
              aria-selected={isSel} aria-label={`${n} de ${formatMonth(first)}, ${WD_FULL[weekday(d.day)]}. ${title}`} title={title}
              onClick={() => onSelect(d.day)}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition ${
                isSel ? "bg-wine-900 text-cream shadow-soft"
                  : available ? "bg-surface text-ink hover:bg-wine-50 hover:text-wine-900 border border-ink/10"
                    : "text-ink-muted/40 line-through decoration-ink/20"}`}>
              {n}
              {available && d.label && <span className={`absolute bottom-1 h-1 w-1 rounded-full ${isSel ? "bg-gold-light" : "bg-gold"}`} aria-hidden />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
