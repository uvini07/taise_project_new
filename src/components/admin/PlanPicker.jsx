// Escolha de plano com botão de assinar (painel e tela de teste encerrado).
import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { PLANS } from "../../revela/data.js";
import { startCheckout } from "../../services/billing.js";

export default function PlanPicker({ current, onError }) {
  const [busy, setBusy] = useState("");
  async function go(id) {
    setBusy(id);
    try { await startCheckout(id); } catch (e) { onError?.(e.message); setBusy(""); }
  }
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {PLANS.map((p) => (
        <div key={p.id} className={`flex flex-col rounded-2xl border bg-surface p-5 text-left ${p.recommended ? "border-wine-900 ring-2 ring-wine-900/15" : "border-ink/10"}`}>
          <div className="flex items-center justify-between">
            <p className="font-display text-2xl text-ink">{p.name}</p>
            {p.recommended && <span className="rounded-full bg-wine-900 px-2.5 py-0.5 text-[11px] font-medium text-cream">Mais escolhido</span>}
          </div>
          <p className="mt-1 text-sm text-ink-muted">{p.forWho}</p>
          <p className="mt-4 font-display text-3xl text-ink">R$ {p.price}<span className="text-sm text-ink-muted">/mês</span></p>
          <ul className="mt-4 flex-1 space-y-1.5 text-sm text-ink-soft">
            {p.limits.map((l) => <li key={l.k} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-wine-900" />{l.label}</li>)}
          </ul>
          <button type="button" onClick={() => go(p.id)} disabled={!!busy}
            className={`mt-5 inline-flex items-center justify-center gap-2 ${p.recommended ? "btn-primary" : "btn-outline"} disabled:opacity-60`}>
            {busy === p.id && <Loader2 className="h-4 w-4 animate-spin" />}
            {current === p.id ? "Assinar este plano" : `Assinar ${p.name}`}
          </button>
        </div>
      ))}
    </div>
  );
}
