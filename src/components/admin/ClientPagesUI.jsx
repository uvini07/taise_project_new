import { useMemo, useRef, useState } from "react";
import { Copy, ExternalLink, FlaskConical, FolderOpen, ImagePlus, KeyRound, RefreshCw, UploadCloud } from "lucide-react";
import Modal from "../common/Modal.jsx";
import Spinner from "../common/Spinner.jsx";
import { SelectField, TextArea, TextField, Toggle } from "../common/Fields.jsx";
import { WhatsAppIcon } from "../common/Icons.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";
import { CLIENT_PATHS, DELIVERY_DEFAULTS, R2_FREE_BYTES, SELECTION_DEFAULTS, WEBP_QUALITY } from "../../config/constants.js";
import { clientMessage, clientSlug, daysLeft, effectiveStatus, formatBytes, randomCode, validateSlug } from "../../utils/clientGallery.js";
import { AlertTriangle, Clock3, Database } from "lucide-react";
import { centsToInput, parseBRLToCents } from "../../utils/format.js";
import { slugify } from "../../utils/text.js";
import { whatsappLink } from "../../utils/whatsapp.js";
import { DEMO_MODE, setClientPassword } from "../../services/admin/clientPages.js";
import { useConfirm } from "../common/useConfirm.jsx";
import { sitePath } from "../../config/tenant.js";
import { useSettings } from "../../contexts/SettingsContext.jsx";

export function clientUrl(kind, slug) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}${sitePath(`/${CLIENT_PATHS[kind]}/${slug}`)}`;
}

export function DemoBanner() {
  if (!DEMO_MODE) return null;
  return (
    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-gold/30 bg-gold/10 p-4 text-sm">
      <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" strokeWidth={1.6} aria-hidden />
      <p className="text-ink-soft">
        <strong className="text-ink">Modo demonstração.</strong> As telas já funcionam, mas ainda não há banco de dados nem armazenamento:
        as fotos ficam só neste navegador e <strong>somem ao recarregar a página</strong>. A página do cliente será ligada na próxima etapa.
      </p>
    </div>
  );
}

/**
 * Aviso de vencimento: lista o que vence em até N dias e ainda está ativo
 * (esperando o cliente ou disponível para download). Some quando não há nada.
 */
export function ExpiryAlert({ items = [], kind, days = 2 }) {
  const now = new Date();
  const active = kind === "delivery" ? ["available", "downloaded"] : ["sent", "selecting"];
  const soon = items.filter((it) => {
    const st = effectiveStatus(it, now);
    if (!active.includes(st) || !it.expiresAt) return false;
    const d = daysLeft(it.expiresAt, now);
    return d >= 0 && d <= days;
  });
  if (!soon.length) return null;
  const label = kind === "delivery" ? "entrega(s)" : "seleção(ões)";
  return (
    <div role="alert" className="mb-4 flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm">
      <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
      <div>
        <p className="font-medium text-ink">{soon.length} {label} vencem em até {days} dia(s).</p>
        <p className="text-ink-muted">Quando o prazo acaba, as fotos são apagadas automaticamente do Cloudflare. Avise o cliente ou estenda o prazo: {soon.map((s) => s.clientName).filter(Boolean).slice(0, 6).join(", ")}{soon.length > 6 ? "…" : ""}.</p>
      </div>
    </div>
  );
}

/**
 * Medidor de armazenamento: usa o tamanho guardado no banco (sem custo). Mostra
 * o quanto do limite grátis do Cloudflare (10 GB) está em uso e avisa ao se
 * aproximar — é o que evita cobrança inesperada.
 */
export function StorageMeter({ bytes = 0, label = "Armazenamento no Cloudflare" }) {
  const pct = Math.min(100, (bytes / R2_FREE_BYTES) * 100);
  const level = pct >= 95 ? "danger" : pct >= 80 ? "warning" : "ok";
  const bar = level === "danger" ? "bg-danger" : level === "warning" ? "bg-warning" : "bg-wine-900";
  const extraGB = Math.max(0, (bytes - R2_FREE_BYTES) / (1024 ** 3));
  return (
    <div className="rounded-2xl border border-ink/10 bg-paper p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-medium text-ink"><Database className="h-4 w-4 text-ink-muted" /> {label}</p>
        <p className="text-sm text-ink-muted">{formatBytes(bytes)} de 10 GB grátis</p>
      </div>
      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-ink/10">
        <div className={`h-full rounded-full transition-all ${bar}`} style={{ width: `${Math.max(2, pct)}%` }} />
      </div>
      {level === "ok" && <p className="mt-2 text-xs text-ink-muted">Dentro do limite grátis. As fotos vencidas são apagadas sozinhas, liberando espaço.</p>}
      {level === "warning" && (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-warning"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Chegando ao limite grátis. Acima de 10 GB, o Cloudflare cobra ~US$ 0,015 por GB/mês. Dica: use a qualidade “Econômica” nas próximas seleções.</p>
      )}
      {level === "danger" && (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-danger"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Acima do limite grátis em {extraGB.toFixed(1)} GB (~US$ {(extraGB * 0.015).toFixed(2)}/mês). Finalize e entregue seleções antigas para liberar espaço.</p>
      )}
    </div>
  );
}

/** Endereço da página do cliente com copiar, WhatsApp e abrir. */
export function ClientLink({ kind, item, compact = false, password = null, onPassword }) {
  const toast = useToast();
  const { confirm, confirmUI } = useConfirm();
  const [resetting, setResetting] = useState(false);
  // O link usa o id aleatório (impossível de adivinhar), não o endereço curto.
  const url = clientUrl(kind, item.id);
  const released = item.status && item.status !== "draft";
  const hasPass = !!item.access || !!password;
  const message = clientMessage(kind, { clientName: item.clientName, url, expiresAt: item.expiresAt, photoLimit: item.photoLimit, password });
  const wa = item.phone ? whatsappLink(item.phone, message) : `https://wa.me/?text=${encodeURIComponent(message)}`;
  async function copy(text, ok) {
    try { await navigator.clipboard.writeText(text); toast.success(ok); } catch { toast.error("Não foi possível copiar. Selecione o texto e copie manualmente."); }
  }
  async function reset() {
    if (hasPass && !(await confirm({ title: "Gerar nova senha?", confirmLabel: "Gerar nova senha",
      text: "A senha atual deixa de funcionar na hora. Mande a nova senha para o cliente." }))) return;
    setResetting(true);
    try { const p = await setClientPassword(kind, item.id); onPassword?.(p); toast.success("Nova senha gerada. Mande a mensagem para o cliente."); }
    catch (e) { toast.error(e.message || "Não foi possível gerar a senha."); }
    finally { setResetting(false); }
  }
  return (
    <div className={compact ? "" : "rounded-2xl border border-ink/10 bg-paper p-3"}>
      {confirmUI}
      <p className="truncate text-xs text-ink-muted" title={url}>
        <span className="opacity-70">{url.replace(/^https?:\/\//, "").replace(item.id, "")}</span>
        <span className="font-medium text-ink">{item.id}</span>
      </p>
      {released && (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl bg-surface px-3 py-2 text-sm">
          <KeyRound className="h-4 w-4 text-gold" aria-hidden />
          {password
            ? <><span className="text-ink-muted">Senha:</span> <strong className="font-mono tracking-[.2em]">{password}</strong>
                <button type="button" className="btn-ghost btn-sm" onClick={() => copy(password, "Senha copiada.")}><Copy className="h-4 w-4" /></button></>
            : <span className="text-ink-muted">{hasPass ? "Senha protegida (não fica salva). Esqueceu? Gere outra." : "Sem senha ainda."}</span>}
          <button type="button" className="btn-ghost btn-sm ml-auto" disabled={resetting} onClick={reset}>
            {resetting ? <Spinner className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />} {hasPass ? "Resetar senha" : "Gerar senha"}
          </button>
        </div>
      )}
      <div className="mt-2 flex flex-wrap gap-1.5">
        <button type="button" className="btn-ghost btn-sm" onClick={() => copy(url, "Link copiado.")}><Copy className="h-4 w-4" /> Copiar link</button>
        <button type="button" className="btn-ghost btn-sm" onClick={() => copy(message, password ? "Mensagem com a senha copiada." : "Mensagem copiada (sem a senha).")}>Copiar mensagem</button>
        <a className="btn-ghost btn-sm" href={wa} target="_blank" rel="noopener noreferrer"><WhatsAppIcon className="h-4 w-4" /> WhatsApp</a>
        <button type="button" className="btn-ghost btn-sm" disabled={DEMO_MODE} title={DEMO_MODE ? "A página do cliente será criada na próxima etapa" : undefined}
          onClick={() => window.open(url, "_blank", "noopener")}>
          <ExternalLink className="h-4 w-4" /> Ver página
        </button>
      </div>
      {released && hasPass && !password && <p className="mt-2 text-xs text-ink-muted">A mensagem só leva a senha logo depois de gerá-la. Para reenviar, use “Resetar senha”.</p>}
    </div>
  );
}

/** Área de arrastar e soltar fotos (aceita escolher arquivos ou uma pasta inteira). */
export function DropZone({ onFiles, accept = "image/jpeg,image/png,image/webp,image/avif", title, hint, busy, disabled }) {
  const files = useRef(null);
  const folder = useRef(null);
  const [over, setOver] = useState(false);
  const pick = (list) => { const arr = [...(list || [])]; if (arr.length) onFiles(arr); };
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); if (!disabled) pick(e.dataTransfer.files); }}
      className={`rounded-2xl border-2 border-dashed p-6 text-center transition ${over ? "border-wine-900 bg-wine-50" : "border-ink/15 bg-surface"} ${disabled ? "opacity-60" : ""}`}>
      {busy ? <Spinner className="mx-auto h-8 w-8" /> : <UploadCloud className="mx-auto h-8 w-8 text-gold" strokeWidth={1.4} aria-hidden />}
      <p className="mt-2 text-sm font-medium">{title}</p>
      {hint && <p className="mx-auto mt-1 max-w-lg text-xs text-ink-muted">{hint}</p>}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <button type="button" className="btn-primary btn-sm" disabled={disabled} onClick={() => files.current?.click()}><ImagePlus className="h-4 w-4" /> Escolher fotos</button>
        <button type="button" className="btn-outline btn-sm" disabled={disabled} onClick={() => folder.current?.click()}><FolderOpen className="h-4 w-4" /> Escolher pasta</button>
      </div>
      <input ref={files} type="file" multiple accept={accept} className="hidden" onChange={(e) => { pick(e.target.files); e.target.value = ""; }} />
      <input ref={folder} type="file" multiple webkitdirectory="" directory="" className="hidden"
        onChange={(e) => { pick([...e.target.files].filter((f) => !accept || accept.split(",").includes(f.type))); e.target.value = ""; }} />
    </div>
  );
}

/** Barra de progresso simples. */
export function ProgressBar({ value, label }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div>
      {label && <div className="mb-1.5 flex justify-between text-xs text-ink-muted"><span>{label}</span><span className="tabular-nums">{pct}%</span></div>}
      <div className="h-2 overflow-hidden rounded-full bg-ink/10" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-wine-900 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/**
 * Cadastro/edição de uma página de cliente.
 * kind = "selection" (seleção de fotos) | "delivery" (entrega final).
 */
export function ClientEditor({ kind, initial, taken, selections = [], onClose, onSave }) {
  const brandName = useSettings().settings.brandName || "Seu estúdio";
  const isSelection = kind === "selection";
  const defaults = isSelection ? SELECTION_DEFAULTS : DELIVERY_DEFAULTS;
  const [code] = useState(() => randomCode(4));
  const [f, setF] = useState(() => ({
    clientName: "", phone: "", title: "", message: "", selectionId: "",
    ...defaults, ...initial,
    extraPriceText: centsToInput(initial?.extraPriceCents),
    useCode: initial?.slug ? false : true,
    slugTouched: !!initial?.slug,
    slugText: initial?.slug || "",
  }));
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);
  const up = (k) => (e) => setF((x) => ({ ...x, [k]: e?.target ? e.target.value : e }));

  const slug = useMemo(() => (f.slugTouched ? slugify(f.slugText) : clientSlug(f.clientName, f.useCode ? code : "")), [f.slugTouched, f.slugText, f.clientName, f.useCode, code]);
  const linkSent = !!initial?.sentAt;
  const slugChanged = linkSent && initial.slug !== slug;

  function pickSelection(id) {
    const s = selections.find((x) => x.id === id);
    setF((x) => ({
      ...x, selectionId: id,
      ...(s && !initial?.id ? { clientName: x.clientName || s.clientName, phone: x.phone || s.phone || "", title: x.title || s.title || "" } : {}),
    }));
  }

  async function save() {
    const errs = [];
    if (!f.clientName.trim()) errs.push("Informe o nome do cliente.");
    const slugErr = validateSlug(slug, Array.isArray(taken) ? taken : []);
    if (slugErr) errs.push(slugErr);
    let extraPriceCents = null;
    if (isSelection) {
      if (!(Number(f.photoLimit) > 0)) errs.push("Informe quantas fotos o cliente pode escolher.");
      if (!(Number(f.deadlineDays) >= 1)) errs.push("O prazo precisa ser de pelo menos 1 dia.");
      if (f.allowExtras && f.extraPriceText) {
        extraPriceCents = parseBRLToCents(f.extraPriceText);
        if (extraPriceCents == null) errs.push("Valor da foto extra inválido.");
      }
    } else if (!(Number(f.availableDays) >= 1)) errs.push("O prazo para download precisa ser de pelo menos 1 dia.");
    setErrors(errs);
    if (errs.length) return;
    setSaving(true);
    try {
      const base = { clientName: f.clientName.trim(), phone: f.phone.trim(), title: f.title.trim(), message: f.message.trim(), slug };
      await onSave(isSelection
        ? { ...base, photoLimit: Number(f.photoLimit), deadlineDays: Number(f.deadlineDays), watermark: !!f.watermark, watermarkStrong: !!f.watermarkStrong, watermarkClientName: !!f.watermarkClientName, copyProtection: !!f.copyProtection, allowExtras: !!f.allowExtras, extraPriceCents: f.allowExtras ? extraPriceCents : null, webpQuality: WEBP_QUALITY[f.webpQuality] ? f.webpQuality : "equilibrado" }
        : { ...base, availableDays: Number(f.availableDays), selectionId: f.selectionId || null });
    } catch (e) {
      setErrors([e.message || "Não foi possível salvar."]);
      setSaving(false);
    }
  }

  const title = initial?.id ? `Editar: ${initial.clientName}` : isSelection ? "Nova seleção de fotos" : "Nova entrega final";
  return (
    <Modal open onClose={onClose} title={title} size="lg"
      footer={<><button className="btn-ghost" onClick={onClose}>Cancelar</button><button className="btn-primary" onClick={save} disabled={saving}>{saving && <Spinner className="h-4 w-4" />} {initial?.id ? "Salvar" : "Criar página"}</button></>}>
      <div className="space-y-6">
        {errors.length > 0 && <ul role="alert" className="list-disc space-y-1 rounded-2xl bg-danger/5 p-4 pl-8 text-sm text-danger">{errors.map((e) => <li key={e}>{e}</li>)}</ul>}

        {!isSelection && selections.length > 0 && (
          <SelectField label="Vincular a uma seleção (opcional)" value={f.selectionId || ""} onChange={(e) => pickSelection(e.target.value)}
            hint="Com o vínculo, o painel confere se todas as fotos escolhidas foram entregues.">
            <option value="">Sem vínculo</option>
            {selections.map((s) => <option key={s.id} value={s.id}>{s.clientName}{s.title ? ` — ${s.title}` : ""}</option>)}
          </SelectField>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Nome do cliente *" value={f.clientName} onChange={up("clientName")} maxLength={80} placeholder="Ex.: Ana Souza" data-autofocus />
          <TextField label="WhatsApp do cliente" value={f.phone} onChange={up("phone")} inputMode="tel" placeholder="(11) 99999-9999" hint="Para mandar o link com um toque." />
          <TextField label="Ensaio" value={f.title} onChange={up("title")} maxLength={80} placeholder="Ex.: Ensaio gestante" className="sm:col-span-2" />
        </div>

        <div className="rounded-2xl border border-ink/10 bg-paper p-4">
          <p className="field-label">Endereço da página</p>
          <p className="break-all font-medium text-wine-900">{clientUrl(kind, slug || "…").replace(/^https?:\/\//, "")}</p>
          {!f.slugTouched && (
            <div className="mt-3">
              <Toggle label="Adicionar código de segurança" hint={`Fica /${CLIENT_PATHS[kind]}/${clientSlug(f.clientName || "nome", code)}. Evita que alguém adivinhe o link trocando só o nome.`}
                checked={f.useCode} onChange={(v) => setF((x) => ({ ...x, useCode: v }))} />
            </div>
          )}
          <div className="mt-3">
            {f.slugTouched ? (
              <TextField label="Personalizar endereço" value={f.slugText} onChange={up("slugText")} placeholder="ana-souza"
                hint={slugChanged ? "Atenção: o link que o cliente já recebeu vai parar de funcionar." : "Letras minúsculas, números e hífen."} />
            ) : (
              <button type="button" className="text-xs text-ink-muted underline hover:text-ink" onClick={() => setF((x) => ({ ...x, slugTouched: true, slugText: slug }))}>Personalizar endereço</button>
            )}
          </div>
        </div>

        {isSelection ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="Fotos que o cliente pode escolher *" type="number" min="1" value={f.photoLimit} onChange={up("photoLimit")} hint="Ex.: tirou 200, o pacote dá direito a 100." />
            <TextField label="Prazo para escolher (dias) *" type="number" min="1" value={f.deadlineDays} onChange={up("deadlineDays")} hint="Conta a partir do envio do link. Depois, as prévias são apagadas." />
            <SelectField label="Qualidade das prévias" value={f.webpQuality || "equilibrado"} onChange={up("webpQuality")}
              hint={WEBP_QUALITY[f.webpQuality]?.hint || WEBP_QUALITY.equilibrado.hint} className="sm:col-span-2">
              {Object.entries(WEBP_QUALITY).map(([k, q]) => <option key={k} value={k}>{q.label}</option>)}
            </SelectField>
            <div className="space-y-4 sm:col-span-2">
              <Toggle label="Marca d'água nas prévias" hint="Protege as fotos enquanto o cliente ainda não pagou." checked={f.watermark} onChange={(v) => setF((x) => ({ ...x, watermark: v }))} />
              {f.watermark && (
                <Toggle label="Marca d'água reforçada (anti-IA)" hint="Cobre a foto inteira com padrão denso, marca grande no centro e posição diferente em cada foto. Bem mais difícil de apagar com inteligência artificial."
                  checked={f.watermarkStrong} onChange={(v) => setF((x) => ({ ...x, watermarkStrong: v }))} />
              )}
              {f.watermark && (
                <Toggle label="Nome do cliente na marca d'água" hint={`Ex.: “${brandName} · ${f.clientName.trim() || "Ana Souza"}”. Se a foto vazar, dá para saber de quem veio — é o que mais desestimula prints.`}
                  checked={f.watermarkClientName} onChange={(v) => setF((x) => ({ ...x, watermarkClientName: v }))} />
              )}
              <Toggle label="Proteção contra cópia e prints" hint="Bloqueia clique direito, salvar imagem, arrastar e copiar; esconde as fotos em atalhos de print, ao abrir o Inspecionar e quando a janela perde o foco; põe nome, data e hora por cima das fotos. Dificulta muito, mas nenhum site impede prints 100% (no celular, nada bloqueia o print do aparelho)."
                checked={f.copyProtection} onChange={(v) => setF((x) => ({ ...x, copyProtection: v }))} />
              <Toggle label="Permitir fotos extras" hint="O cliente pode marcar mais fotos que o limite, pagando à parte." checked={f.allowExtras} onChange={(v) => setF((x) => ({ ...x, allowExtras: v }))} />
              {f.allowExtras && <TextField label="Valor por foto extra" inputMode="decimal" placeholder="R$ 0,00" value={f.extraPriceText} onChange={up("extraPriceText")} className="sm:max-w-xs" />}
            </div>
          </div>
        ) : (
          <TextField label="Disponível para download por (dias) *" type="number" min="1" value={f.availableDays} onChange={up("availableDays")} className="sm:max-w-xs"
            hint="Conta a partir da liberação. Depois, os arquivos são apagados." />
        )}

        <TextArea label="Recado para o cliente (opcional)" rows={3} value={f.message} onChange={up("message")} maxLength={600}
          placeholder={isSelection ? "Ex.: Escolha com calma! Qualquer dúvida, me chama no WhatsApp." : "Ex.: Foi um prazer fotografar vocês!"} />

        {initial?.id && linkSent && (
          <p className="flex items-center gap-2 text-xs text-ink-muted"><RefreshCw className="h-3.5 w-3.5" /> Mudar o prazo recalcula a data final a partir do envio do link.</p>
        )}
      </div>
    </Modal>
  );
}

const ACTIVITY = {
  open: { label: "Abriu a página", alert: false },
  download: { label: "Baixou", alert: false },
  print_key: { label: "Apertou Print Screen", alert: true },
  capture_shortcut: { label: "Atalho de captura de tela", alert: true },
  print_page: { label: "Tentou imprimir / salvar PDF", alert: true },
  devtools: { label: "Abriu as ferramentas do navegador", alert: true },
  save_attempt: { label: "Tentou salvar a foto", alert: true },
};
const asDate = (v) => (v?.toDate ? v.toDate() : v ? new Date(v) : null);

/** Rastreamento: acessos e tentativas de captura do cliente. */
export function ActivityLog({ item }) {
  const [onlyAlerts, setOnlyAlerts] = useState(false);
  const [all, setAll] = useState(false);
  const list = useMemo(() => [...(item.activity || [])].reverse(), [item.activity]);
  const alerts = list.filter((e) => ACTIVITY[e.type]?.alert).length;
  const opens = list.filter((e) => e.type === "open").length;
  const devices = new Set(list.map((e) => `${e.device}|${e.ip}`)).size;
  const shown = (onlyAlerts ? list.filter((e) => ACTIVITY[e.type]?.alert) : list).slice(0, all ? 200 : 8);
  return (
    <div className="card card-pad mb-6">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">Rastreamento</p>
        <span className="text-xs text-ink-muted">· {opens} acesso(s) · {devices} aparelho(s)</span>
        {alerts > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger"><AlertTriangle className="h-3.5 w-3.5" /> {alerts} tentativa(s) de captura</span>}
        {alerts > 0 && <button type="button" className="btn-ghost btn-sm ml-auto" onClick={() => setOnlyAlerts((v) => !v)}>{onlyAlerts ? "Ver tudo" : "Só tentativas"}</button>}
      </div>
      {!list.length ? <p className="text-sm text-ink-muted">Nenhum acesso ainda. Quando o cliente abrir o link, aparece aqui (aparelho, cidade e horário).</p> : (
        <ul className="divide-y divide-ink/5 text-sm">
          {shown.map((e, i) => {
            const meta = ACTIVITY[e.type] || { label: e.type };
            const at = asDate(e.at);
            return (
              <li key={i} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 py-2">
                <span className={`font-medium ${meta.alert ? "text-danger" : "text-ink"}`}>{meta.alert ? "⚠️ " : ""}{meta.label}{e.photo ? ` (foto ${e.photo})` : ""}{e.file ? `: ${e.file}` : ""}</span>
                <span className="text-xs text-ink-muted">{at ? at.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : ""} · {e.device}{e.city ? ` · ${e.city}` : ""}{e.ip ? ` · IP ${e.ip}` : ""}</span>
              </li>
            );
          })}
        </ul>
      )}
      {list.length > 8 && !all && <button type="button" className="btn-ghost btn-sm mt-2" onClick={() => setAll(true)}>Ver histórico completo</button>}
      <p className="mt-3 text-xs text-ink-muted">No celular o print não é detectável pelo navegador; a marca d'água com nome, data e hora identifica quem vazou. No computador, atalhos de print e tentativas de salvar são registrados.</p>
    </div>
  );
}
