// Lista compacta de seleções/entregas para o dia a dia: busca, filtros com
// contagem, ordem por urgência e uma linha por cliente (cabe muitos na tela).
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ChevronRight, Search, X } from "lucide-react";
import Badge from "../common/Badge.jsx";
import { WhatsAppIcon } from "../common/Icons.jsx";
import { clientUrl } from "./ClientPagesUI.jsx";
import { clientMessage, daysLeft } from "../../utils/clientGallery.js";
import { whatsappLink } from "../../utils/whatsapp.js";

const PAGE = 30;
const norm = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const fmtDay = (d) => (d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "");

function readFilter(key, fallback) { try { return localStorage.getItem(key) || fallback; } catch { return fallback; } }
function saveFilter(key, v) { try { localStorage.setItem(key, v); } catch { /* sem storage */ } }

/**
 * items: [{ id, clientName, title, phone, st, expiresAt, ... }]
 * config: { kind, base, statusMap, filters: [{ key, label, test }], needs(item) → texto|null, progress(item) → texto, sortKey }
 */
export default function ClientList({ items, kind, base, statusMap, filters, needs, progress, empty }) {
  const storeKey = `revela-filtro-${kind}`;
  const [filter, setFilterState] = useState(() => readFilter(storeKey, "acao"));
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const setFilter = (k) => { setFilterState(k); saveFilter(storeKey, k); setLimit(PAGE); };

  const enriched = useMemo(() => items.map((it) => ({ ...it, need: needs(it), left: daysLeft(it.expiresAt) })), [items, needs]);
  const counts = useMemo(() => Object.fromEntries(filters.map((f) => [f.key, enriched.filter(f.test).length])), [enriched, filters]);
  const active = filters.find((f) => f.key === filter) || filters[0];

  const shown = useMemo(() => {
    const words = norm(q).split(/\s+/).filter(Boolean);
    return enriched
      .filter((it) => (words.length ? true : active.test(it)))
      .filter((it) => words.every((w) => norm(`${it.clientName} ${it.title} ${it.phone}`).includes(w)))
      .sort((a, b) => {
        // Urgência primeiro: precisa de ação → vence antes → mais recente.
        if (!!a.need !== !!b.need) return a.need ? -1 : 1;
        const la = a.left ?? 9999, lb = b.left ?? 9999;
        if (la !== lb && !["finished", "expired", "downloaded"].includes(a.st)) return la - lb;
        return (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0);
      });
  }, [enriched, active, q]);

  return (
    <div>
      <div className="sticky top-0 z-10 -mx-1 mb-3 space-y-2 bg-paper/95 px-1 py-2 backdrop-blur">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar cliente, ensaio ou telefone"
            className="w-full rounded-full border border-ink/10 bg-surface py-2.5 pl-10 pr-10 text-sm outline-none focus:border-wine-900" />
          {q && <button type="button" onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-muted hover:bg-ink/5" aria-label="Limpar busca"><X className="h-4 w-4" /></button>}
        </label>
        {!q && (
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist">
            {filters.map((f) => (
              <button key={f.key} type="button" role="tab" aria-selected={active.key === f.key} onClick={() => setFilter(f.key)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition ${active.key === f.key ? "bg-wine-900 text-cream" : "border border-ink/10 bg-surface text-ink-soft hover:bg-ink/5"}`}>
                {f.label} <span className={`ml-1 tabular-nums ${active.key === f.key ? "opacity-80" : "text-ink-muted"}`}>{counts[f.key]}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {!shown.length ? (
        <p className="rounded-2xl border border-dashed border-ink/15 px-4 py-10 text-center text-sm text-ink-muted">
          {q ? `Nenhum resultado para “${q}”.` : active.empty || empty}
        </p>
      ) : (
        <ul className="divide-y divide-ink/5 overflow-hidden rounded-2xl border border-ink/10 bg-surface">
          {shown.slice(0, limit).map((it) => {
            const st = statusMap[it.st] || { label: it.st, tone: "neutral" };
            const released = it.st !== "draft";
            const urgent = released && it.left != null && it.left <= 2 && !["finished", "expired", "downloaded"].includes(it.st);
            const msg = released ? clientMessage(kind, { clientName: it.clientName, url: clientUrl(kind, it.id), expiresAt: it.expiresAt, photoLimit: it.photoLimit }) : "";
            const wa = released && it.phone ? whatsappLink(it.phone, msg) : null;
            return (
              <li key={it.id} className="flex items-center gap-2 pr-2 hover:bg-paper/60">
                <Link to={`${base}/${it.id}`} className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-ink">{it.clientName || "Sem nome"}</p>
                      <Badge tone={st.tone}>{st.label}</Badge>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-ink-muted">
                      {[released && it.expiresAt && !["finished", "expired", "downloaded"].includes(it.st) ? (it.left === 0 ? "vence hoje" : `vence ${fmtDay(it.expiresAt)}`) : null,
                        progress(it), it.title,
                      ].filter(Boolean).join(" · ")}
                    </p>
                    {it.need && (
                      <p className={`mt-1 inline-flex items-center gap-1 text-xs font-medium ${urgent ? "text-danger" : "text-warning"}`}>
                        <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> {it.need}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
                </Link>
                {wa && (
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-full p-2 text-[#1fa855] hover:bg-[#25D366]/10" aria-label={`Abrir WhatsApp de ${it.clientName}`} title="WhatsApp (sem senha; para reenviar a senha, abra e use Resetar senha)">
                    <WhatsAppIcon className="h-5 w-5" />
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {shown.length > limit && (
        <button type="button" className="btn-ghost btn-sm mx-auto mt-3 flex" onClick={() => setLimit((l) => l + PAGE)}>Mostrar mais ({shown.length - limit})</button>
      )}
    </div>
  );
}
