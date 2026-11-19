// Recebimentos: como a fotógrafa recebe o SINAL dos agendamentos pelo site.
// O dinheiro cai direto na conta dela (Pix próprio, Mercado Pago ou InfinitePay).
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Check, Loader2, QrCode, Unplug, Wallet, Zap } from "lucide-react";
import { AdminHeader } from "../../components/admin/AdminUI.jsx";
import { TextField } from "../../components/common/Fields.jsx";
import { useSettings } from "../../contexts/SettingsContext.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";
import { saveSettings } from "../../services/admin/settingsAdmin.js";
import { pagamentosApi } from "../../services/pagamentosApi.js";

const OPTIONS = [
  { id: "none", title: "Não receber pelo site", text: "A cliente envia o pedido e vocês combinam o pagamento pelo WhatsApp.", Icon: Wallet },
  { id: "pix", title: "Pix (minha chave)", text: "Mostra o QR Code e o copia e cola da sua chave. Sem taxa. Você confirma o recebimento na Agenda.", Icon: QrCode },
  { id: "mercadopago", title: "Pix pelo Mercado Pago", text: "Pix gerado na sua conta Mercado Pago, com confirmação automática do pagamento.", Icon: Zap },
  { id: "infinitepay", title: "InfinitePay", text: "Checkout da InfinitePay com a sua InfiniteTag: Pix ou cartão, com aviso automático.", Icon: Zap },
];

export default function PaymentsAdmin() {
  const { settings } = useSettings();
  const toast = useToast();
  const [f, setF] = useState(() => ({ provider: "none", depositPercent: 30, pixKey: "", pixName: "", pixCity: "", infiniteTag: "", ...(settings.payments || {}) }));
  const [saving, setSaving] = useState(false);
  const [mp, setMp] = useState({ loading: true, connected: false, account: null });
  const [mpBusy, setMpBusy] = useState(false);
  const up = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const [params, setParams] = useSearchParams();

  // Volta do "Conectar com Mercado Pago".
  useEffect(() => {
    const r = params.get("mp");
    if (!r) return;
    if (r === "ok") { toast.success("Mercado Pago conectado!"); setF((x) => ({ ...x, provider: "mercadopago" })); }
    else toast.error("Não foi possível conectar o Mercado Pago. Tente de novo.");
    params.delete("mp"); setParams(params, { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function oauthMp() {
    setMpBusy(true);
    try { const { url } = await pagamentosApi({ action: "mpauthurl" }, { authed: true }); window.location.href = url; }
    catch (e) { toast.error(e.message); setMpBusy(false); }
  }

  useEffect(() => {
    pagamentosApi({ action: "mpinfo" }, { authed: true })
      .then((r) => setMp({ loading: false, ...r }))
      .catch(() => setMp({ loading: false, connected: false, account: null }));
  }, []);

  async function save() {
    const pct = Math.round(Number(f.depositPercent));
    if (f.provider !== "none" && !(pct >= 1 && pct <= 100)) return toast.error("O sinal deve ser de 1% a 100%.");
    if (f.provider === "pix" && (!f.pixKey.trim() || !f.pixName.trim())) return toast.error("Informe a chave Pix e o nome de quem recebe.");
    if (f.provider === "infinitepay" && !f.infiniteTag.trim()) return toast.error("Informe a sua InfiniteTag.");
    if (f.provider === "mercadopago" && !mp.connected) return toast.error("Conecte o Mercado Pago antes de salvar.");
    setSaving(true);
    try {
      const payments = { provider: f.provider, depositPercent: pct || 30, pixKey: f.pixKey.trim(), pixName: f.pixName.trim(), pixCity: f.pixCity.trim(), infiniteTag: f.infiniteTag.trim().replace(/^[@$]/, "") };
      await saveSettings({ payments });
      toast.success(f.provider === "none" ? "Salvo. O site não cobra o sinal." : "Salvo! O site já oferece o pagamento do sinal.");
    } catch { toast.error("Não foi possível salvar."); }
    finally { setSaving(false); }
  }

  async function disconnectMp() {
    setMpBusy(true);
    try { await pagamentosApi({ action: "mpremove" }, { authed: true }); setMp({ loading: false, connected: false, account: null }); }
    catch (e) { toast.error(e.message); }
    finally { setMpBusy(false); }
  }

  return (
    <>
      <AdminHeader title="Recebimentos" text="Escolha como a cliente paga o sinal ao agendar pelo site. O dinheiro vai direto para a sua conta: a Revela não fica com nada." />

      <div className="grid gap-3 sm:grid-cols-2">
        {OPTIONS.map(({ id, title, text, Icon }) => {
          const on = f.provider === id;
          // Mercado Pago: "Em breve" até a conexão automática estar configurada.
          const soon = id === "mercadopago" && !mp.loading && !mp.oauth && !mp.connected;
          return (
            <button key={id} type="button" disabled={soon} onClick={() => setF((x) => ({ ...x, provider: id }))} aria-pressed={on}
              className={`card flex items-start gap-3 p-4 text-left transition ${on ? "ring-2 ring-wine-900" : soon ? "cursor-not-allowed opacity-60" : "hover:border-ink/30"}`}>
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${on ? "bg-wine-900 text-cream" : "bg-surface text-ink-soft"}`}><Icon className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 font-medium">{title}{on && <Check className="h-4 w-4 text-wine-900" />}{soon && <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-medium text-gold-dark">Em breve</span>}</span>
                <span className="mt-1 block text-sm text-ink-muted">{text}</span>
              </span>
            </button>
          );
        })}
      </div>

      {f.provider !== "none" && (
        <div className="card mt-6 space-y-4 p-5">
          <TextField label="Sinal (% do valor do pacote)" type="number" min={1} max={100} inputMode="numeric" value={f.depositPercent} onChange={up("depositPercent")} className="sm:max-w-xs"
            hint="Ex.: 30 = a cliente paga 30% ao agendar e o restante combinado com você." />

          {f.provider === "pix" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Chave Pix" value={f.pixKey} onChange={up("pixKey")} placeholder="CPF, CNPJ, e-mail, celular ou chave aleatória" hint="Celular com +55 e DDD (ex.: +5511999998888)." />
              <TextField label="Nome de quem recebe" value={f.pixName} onChange={up("pixName")} placeholder="Como aparece no banco" />
              <TextField label="Cidade" value={f.pixCity} onChange={up("pixCity")} placeholder="Ex.: São Paulo" />
            </div>
          )}

          {f.provider === "mercadopago" && (
            <div className="space-y-3">
              {mp.loading ? <p className="flex items-center gap-2 text-sm text-ink-muted"><Loader2 className="h-4 w-4 animate-spin" /> Verificando conexão…</p>
                : mp.connected ? (
                  <div className="flex flex-wrap items-center gap-3 rounded-xl bg-success/10 p-3 text-sm">
                    <Check className="h-4 w-4 text-success" />
                    <span className="flex-1">Conectado: <strong>{mp.account?.nickname || mp.account?.email || `conta ${mp.account?.id}`}</strong></span>
                    <button type="button" className="btn-ghost btn-sm" disabled={mpBusy} onClick={disconnectMp}><Unplug className="h-4 w-4" /> Desconectar</button>
                  </div>
                ) : (
                  <>
                    <button type="button" className="btn-primary w-full justify-center py-3 sm:w-auto" disabled={mpBusy || !mp.oauth} onClick={oauthMp}>
                      {mpBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />} Conectar com Mercado Pago
                    </button>
                    <p className="text-xs text-ink-muted">{mp.oauth
                      ? "Você entra na sua conta do Mercado Pago, autoriza a Revela e volta pra cá já conectada."
                      : "A conexão com o Mercado Pago estará disponível em breve. Enquanto isso, use o Pix com a sua chave ou a InfinitePay."}</p>
                  </>
                )}
            </div>
          )}

          {f.provider === "infinitepay" && (
            <TextField label="Sua InfiniteTag" value={f.infiniteTag} onChange={up("infiniteTag")} placeholder="ex.: nanafotos" className="sm:max-w-sm"
              hint="É o seu @ na InfinitePay (aparece no app, em Perfil). Sem o $ ou @." />
          )}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button type="button" className="btn-primary" onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Salvar</button>
      </div>
    </>
  );
}
