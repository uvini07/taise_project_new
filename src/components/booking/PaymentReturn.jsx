// Tela de volta do checkout (InfinitePay): "Compra realizada com sucesso!",
// com o que foi pago (sinal ou total) assim que o aviso do pagamento chega.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Loader2 } from "lucide-react";
import { pagamentosApi } from "../../services/pagamentosApi.js";
import { currentStudio, sitePath } from "../../config/tenant.js";
import { formatBRL } from "../../utils/format.js";

export default function PaymentReturn({ apptId }) {
  const [st, setSt] = useState(null);
  useEffect(() => {
    let alive = true; let n = 0;
    const tick = async () => {
      try {
        const s = await pagamentosApi({ action: "status", studio: currentStudio(), apptId });
        if (!alive) return;
        setSt(s);
        if (s.status === "paid") return;
      } catch { /* tenta de novo */ }
      if (alive && ++n < 24) setTimeout(tick, 5000); // até ~2 min
    };
    tick();
    return () => { alive = false; };
  }, [apptId]);

  const paid = st?.status === "paid";
  const full = paid && (st.mode === "total" || (st.totalCents && st.amountCents >= st.totalCents));
  const rest = paid && !full ? Math.max(0, (st.totalCents || 0) - (st.amountCents || 0)) : 0;

  return (
    <section className="container-x flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-md animate-fade-up text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success text-white"><Check className="h-8 w-8" /></div>
        <h1 className="display-md mt-6">Compra realizada com sucesso!</h1>
        <div className="card card-pad mt-8 text-left text-sm">
          {!paid ? (
            <p className="flex items-center gap-2 text-ink-muted"><Loader2 className="h-4 w-4 animate-spin" /> Confirmando o pagamento… pode levar alguns segundos.</p>
          ) : (
            <dl className="space-y-2">
              <div className="flex justify-between gap-4"><dt className="text-ink-muted">Pagamento</dt><dd className="font-medium">{full ? "Valor total (quitado)" : "Sinal"}</dd></div>
              {st.amountCents ? <div className="flex justify-between gap-4"><dt className="text-ink-muted">Valor pago</dt><dd className="font-medium">{formatBRL(st.amountCents)}</dd></div> : null}
              {rest > 0 && <div className="flex justify-between gap-4"><dt className="text-ink-muted">Falta pagar</dt><dd className="font-medium">{formatBRL(rest)}</dd></div>}
            </dl>
          )}
        </div>
        <p className="mt-4 text-sm text-ink-muted">{full
          ? "Seu ensaio está quitado. A fotógrafa já recebeu o pagamento e vai confirmar o horário com você pelo WhatsApp."
          : "Seu horário está garantido. A fotógrafa já recebeu o aviso e vai confirmar tudo com você pelo WhatsApp."}</p>
        <Link to={sitePath("/")} className="btn-primary mt-8">Voltar ao início</Link>
      </div>
    </section>
  );
}
