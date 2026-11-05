import { useMemo, useRef, useState } from "react";
import { Copy, ExternalLink, FlaskConical, FolderOpen, ImagePlus, RefreshCw, UploadCloud } from "lucide-react";
import Modal from "../common/Modal.jsx";
import Spinner from "../common/Spinner.jsx";
import { SelectField, TextArea, TextField, Toggle } from "../common/Fields.jsx";
import { WhatsAppIcon } from "../common/Icons.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";
import { CLIENT_PATHS, DELIVERY_DEFAULTS, SELECTION_DEFAULTS } from "../../config/constants.js";
import { clientMessage, clientSlug, randomCode, validateSlug } from "../../utils/clientGallery.js";
import { centsToInput, parseBRLToCents } from "../../utils/format.js";
import { slugify } from "../../utils/text.js";
import { whatsappLink } from "../../utils/whatsapp.js";
import { DEMO_MODE } from "../../services/admin/clientPagesDemo.js";

export function clientUrl(kind, slug) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/${CLIENT_PATHS[kind]}/${slug}`;
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

/** Endereço da página do cliente com copiar, WhatsApp e abrir. */
export function ClientLink({ kind, item, compact = false }) {
  const toast = useToast();
  const url = clientUrl(kind, item.slug);
  const message = clientMessage(kind, { clientName: item.clientName, url, expiresAt: item.expiresAt, photoLimit: item.photoLimit });
  const wa = item.phone ? whatsappLink(item.phone, message) : `https://wa.me/?text=${encodeURIComponent(message)}`;
  async function copy(text, ok) {
    try { await navigator.clipboard.writeText(text); toast.success(ok); } catch { toast.error("Não foi possível copiar. Selecione o texto e copie manualmente."); }
  }
  return (
    <div className={compact ? "" : "rounded-2xl border border-ink/10 bg-paper p-3"}>
      <p className="truncate text-xs text-ink-muted" title={url}>
        <span className="opacity-70">{url.replace(/^https?:\/\//, "").replace(item.slug, "")}</span>
        <span className="font-medium text-ink">{item.slug}</span>
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <button type="button" className="btn-ghost btn-sm" onClick={() => copy(url, "Link copiado.")}><Copy className="h-4 w-4" /> Copiar link</button>
        <button type="button" className="btn-ghost btn-sm" onClick={() => copy(message, "Mensagem copiada.")}>Copiar mensagem</button>
        <a className="btn-ghost btn-sm" href={wa} target="_blank" rel="noopener noreferrer"><WhatsAppIcon className="h-4 w-4" /> WhatsApp</a>
        <button type="button" className="btn-ghost btn-sm" disabled={DEMO_MODE} title={DEMO_MODE ? "A página do cliente será criada na próxima etapa" : undefined}
          onClick={() => window.open(url, "_blank", "noopener")}>
          <ExternalLink className="h-4 w-4" /> Ver página
        </button>
      </div>
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
    const slugErr = validateSlug(slug, taken);
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
        ? { ...base, photoLimit: Number(f.photoLimit), deadlineDays: Number(f.deadlineDays), watermark: !!f.watermark, allowExtras: !!f.allowExtras, extraPriceCents: f.allowExtras ? extraPriceCents : null }
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
            <div className="space-y-4 sm:col-span-2">
              <Toggle label="Marca d'água nas prévias" hint="Protege as fotos enquanto o cliente ainda não pagou." checked={f.watermark} onChange={(v) => setF((x) => ({ ...x, watermark: v }))} />
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
