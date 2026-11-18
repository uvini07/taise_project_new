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

export default function PayDeposit({ apptId, payments }) {
  const provider = payments?.provider;
  const [state, setState] = useState({ loading: false, error: null, data: null });
  const [qrImg, setQrImg] = useState(null);
  const [copied, setCopied] = useState(false);
  const [paid, setPaid] = useState(false);
  const poll = useRef(null);
  const studio = currentStudio();

  const start = useCallback(async () => {
    setState({ loading: true, error: null, data: null });
    try {
      const d = await pagamentosApi({ action: "start", studio, apptId });
      if (d.status === "paid") { setPaid(true); setState({ loading: false, error: null, data: d }); return; }
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
      try { const s = await pagamentosApi({ action: "status", studio, apptId }); if (s.status === "paid") setPaid(true); } catch { /* tenta de novo */ }
    }, 5000);
    return () => clearInterval(poll.current);
  }, [state.data?.provider, paid, studio, apptId]);

  if (!provider || provider === "none") return null;
  const pct = Number(payments.depositPercent) || 30;

  if (paid) {
    return (
      <div className="card card-pad mt-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success"><Check className="h-6 w-6" /></div>
        <p className="mt-3 font-medium">Sinal pago!</p>
        <p className="mt-1 text-sm text-ink-muted">A fotógrafa já recebeu o pagamento. É só aguardar a confirmação do horário.</p>
      </div>
    );
  }

  if (!state.data) {
    return (
      <div className="card card-pad mt-6 text-left">
        <p className="font-medium">Garanta o seu horário</p>
        <p className="mt-1 text-sm text-ink-muted">Pague o sinal de {pct}% agora{provider === "infinitepay" ? " por Pix ou cartão" : " por Pix"}. O valor vai direto para a fotógrafa.</p>
        {state.error && <p className="mt-2 text-sm text-danger">{state.error}</p>}
        <button type="button" onClick={start} disabled={state.loading} className="btn-primary mt-4 w-full py-3">
          {state.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />} Pagar o sinal
        </button>
      </div>
    );
  }

  const d = state.data;
  return (
    <div className="card card-pad mt-6 text-center">
      <p className="text-sm text-ink-muted">Sinal ({pct}%)</p>
      <p className="font-display text-3xl">{formatBRL(d.amountCents)}</p>
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
