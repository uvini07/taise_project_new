// Pagamento do sinal logo depois do pedido de agendamento.
// Mostra Pix (QR + copia e cola) ou leva ao checkout da InfinitePay, conforme
// o que a fotógrafa escolheu em Recebimentos. Sem método configurado: não aparece.
import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Check, Copy, CreditCard, Loader2 } from "lucide-react";
import { pagamentosApi } from "../../services/pagamentosApi.js";
import { pixPayload } from "../../utils/pix.js";
import { formatBRL } from "../../utils/format.js";
import { currentStudio } from "../../config/tenant.js";

export default function PayDeposit({ apptId, payments, priceCents = 0 }) {
  const provider = payments?.provider;
  const [state, setState] = useState({ loading: false, error: null, data: null });
  const [qrImg, setQrImg] = useState(null);
  const [copied, setCopied] = useState(false);
  const [paid, setPaid] = useState(false);
  const poll = useRef(null);
  const studio = currentStudio();

  const start = useCallback(async (mode) => {
    setState({ loading: mode, error: null, data: null });
    try {
      const d = await pagamentosApi({ action: "start", studio, apptId, mode });
      if (d.status === "paid") { setPaid(d); setState({ loading: false, error: null, data: d }); return; }
      if (d.provider === "infinitepay" && d.url) { window.location.href = d.url; return; }
      const code = d.provider === "pix" ? pixPayload({ key: d.pixKey, name: d.pixName, city: d.pixCity, amountCents: d.amountCents, txid: d.txid }) : d.qr;
      setQrImg(d.qrBase64 ? `data:image/png;base64,${d.qrBase64}` : await QRCode.toDataURL(code, { margin: 1, width: 480 }));
      setState({ loading: false, error: null, data: { ...d, code } });
    } catch (e) { setState({ loading: false, error: e.message, data: null }); }
  }, [studio, apptId]);

  // Mercado Pago confirma sozinho: consulta a cada 5 s enquanto a tela está aberta.
  useEffect(() => {
    if (state.data?.provider !== "mercadopago" || paid) return undefined;
    poll.current = setInterval(async () => {
      try { const s = await pagamentosApi({ action: "status", studio, apptId }); if (s.status === "paid") setPaid(s); } catch { /* tenta de novo */ }
    }, 5000);
    return () => clearInterval(poll.current);
  }, [state.data?.provider, paid, studio, apptId]);

  if (!provider || provider === "none") return null;
  const pct = Math.min(100, Math.max(1, Number(payments.depositPercent) || 30));
  const depositCents = Math.max(100, Math.round((priceCents * pct) / 100));
  const restOf = (paidCents) => Math.max(0, priceCents - (paidCents || 0));

  if (paid) {
    const full = paid.mode === "total";
    const rest = restOf(paid.amountCents);
    return (
      <div className="card card-pad mt-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success"><Check className="h-6 w-6" /></div>
        <p className="mt-3 font-medium">{full || !rest ? "Pagamento completo!" : "Sinal pago!"}</p>
        <p className="mt-1 text-sm text-ink-muted">
          {full || !rest
            ? "O ensaio está quitado. A fotógrafa já recebeu o pagamento."
            : <>Você pagou {formatBRL(paid.amountCents)}. Faltam <strong>{formatBRL(rest)}</strong>, combinados com a fotógrafa.</>}
        </p>
      </div>
    );
  }

  if (!state.data) {
    const via = provider === "infinitepay" ? "Pix ou cartão" : "Pix";
    return (
      <div className="card card-pad mt-6 text-left">
        <p className="font-medium">Garanta o seu horário</p>
        <p className="mt-1 text-sm text-ink-muted">Para reservar, pague o sinal de {pct}% por {via}. Se preferir, já quite o ensaio inteiro. O valor vai direto para a fotógrafa.</p>
        {priceCents > 0 && <p className="mt-3 text-sm">Valor do pacote: <strong>{formatBRL(priceCents)}</strong></p>}
        {state.error && <p className="mt-2 text-sm text-danger">{state.error}</p>}
        <div className="mt-4 grid gap-2">
          <button type="button" onClick={() => start("sinal")} disabled={!!state.loading} className="btn-primary w-full justify-between py-3">
            <span className="flex items-center gap-2">{state.loading === "sinal" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />} Pagar o sinal ({pct}%)</span>
            <span>{formatBRL(depositCents)}</span>
          </button>
          {priceCents > depositCents && (
            <button type="button" onClick={() => start("total")} disabled={!!state.loading} className="btn-outline w-full justify-between py-3">
              <span className="flex items-center gap-2">{state.loading === "total" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Quitar tudo agora</span>
              <span>{formatBRL(priceCents)}</span>
            </button>
          )}
        </div>
        {priceCents > depositCents && <p className="mt-2 text-xs text-ink-muted">Pagando só o sinal, faltam {formatBRL(priceCents - depositCents)} para combinar com a fotógrafa.</p>}
      </div>
    );
  }

  const d = state.data;
  return (
    <div className="card card-pad mt-6 text-center">
      <p className="text-sm text-ink-muted">{d.mode === "total" ? "Pagamento total" : `Sinal (${pct}%)`}</p>
      <p className="font-display text-3xl">{formatBRL(d.amountCents)}</p>
      {d.mode !== "total" && restOf(d.amountCents) > 0 && <p className="text-xs text-ink-muted">Depois faltam {formatBRL(restOf(d.amountCents))}</p>}
      {qrImg && <img src={qrImg} alt="QR Code Pix" className="mx-auto mt-4 h-56 w-56 rounded-xl bg-white p-2" />}
      <p className="mt-3 text-xs text-ink-muted">Abra o app do banco, escolha Pix e leia o QR Code, ou copie o código:</p>
      <div className="mt-2 flex items-center gap-2 rounded-xl bg-surface p-2">
        <code className="min-w-0 flex-1 truncate text-left text-xs">{d.code}</code>
        <button type="button" className="btn-primary btn-sm shrink-0"
          onClick={async () => { try { await navigator.clipboard.writeText(d.code); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { /* sem área de transferência */ } }}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      {d.provider === "mercadopago"
        ? <p className="mt-3 flex items-center justify-center gap-2 text-xs text-ink-muted"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Aguardando o pagamento… a confirmação é automática.</p>
        : <p className="mt-3 text-xs text-ink-muted">Pix para <strong>{d.pixName || d.pixKey}</strong>. Depois de pagar, a fotógrafa confirma o recebimento.</p>}
    </div>
  );
}
