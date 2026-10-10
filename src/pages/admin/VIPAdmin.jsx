import { useMemo, useState } from "react";
import { Crown, Download, ExternalLink, Pencil, Plus, Rocket, Search, ShieldCheck, Trash2 } from "lucide-react";
import { AdminHeader, ImageInput, ListEditor, Section } from "../../components/admin/AdminUI.jsx";
import { Checkbox, SelectField, TextArea, TextField, Toggle } from "../../components/common/Fields.jsx";
import Badge from "../../components/common/Badge.jsx";
import Modal from "../../components/common/Modal.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import PageLoader from "../../components/common/PageLoader.jsx";
import { EmptyState, ErrorState } from "../../components/common/States.jsx";
import { useConfirm } from "../../components/common/useConfirm.jsx";
import { WhatsAppIcon } from "../../components/common/Icons.jsx";
import Countdown from "../../components/vip/Countdown.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";
import { useAsync } from "../../hooks/useAsync.js";
import {
  deleteCampaign, deleteRegistrations, expiredRegistrations, findDuplicates, launchVipAccess, listCampaigns,
  listRegistrations, saveCampaign, setCampaignStatus, updateRegistration,
} from "../../services/admin/vipAdmin.js";
import { listAllPackages } from "../../services/admin/packagesAdmin.js";
import { campaignPhase } from "../../services/vipService.js";
import { uploadImage, deleteStoragePaths } from "../../services/imageService.js";
import { AFTER_END_ACTIONS, CAMPAIGN_STATUS, CONSENT_TEXT_DEFAULT, VIP_STATUS } from "../../config/constants.js";
import { centsToInput, formatDateTime, fromDateTimeInput, parseBRLToCents, toDate, toDateTimeInput, toDayKey } from "../../utils/format.js";
import { downloadCSV } from "../../utils/csv.js";
import { slugify } from "../../utils/text.js";
import { formatPhoneBR } from "../../utils/validation.js";
import { whatsappLink } from "../../utils/whatsapp.js";
import { isPublicStatus } from "../../utils/lots.js";

const PHASE_LABEL = {
  upcoming: ["Inscrições em breve", "neutral"],
  open: ["Inscrições abertas", "success"],
  full: ["Lista cheia", "warning"],
  registrationClosed: ["Inscrições encerradas", "warning"],
  ended: ["Encerrada", "muted"],
};

function CampaignEditor({ initial, packages, onClose, onSaved }) {
  const toast = useToast();
  const [f, setF] = useState(() => ({
    name: "", description: "", details: "", benefits: [], status: "draft", imageUrl: "", imagePath: "", imageThumbUrl: "", imageThumbPath: "",
    afterEndAction: "message", endMessage: "", redirectTo: "/pacotes", maxRegistrations: null, showBanner: true,
    fields: { askEmail: true, requireEmail: false, askPreferences: true, preferencesLabel: "" },
    consentText: CONSENT_TEXT_DEFAULT, retentionDays: 365, vipPricing: {},
    ...initial,
    slug: initial?.slug || "",
    registrationStartText: toDateTimeInput(initial?.registrationStart),
    registrationEndText: toDateTimeInput(initial?.registrationEnd),
    vipAccessStartsAtText: toDateTimeInput(initial?.vipAccessStartsAt),
    countdownEndsAtText: toDateTimeInput(initial?.countdownEndsAt),
    pricingText: Object.fromEntries(Object.entries(initial?.vipPricing || {}).map(([k, v]) => [k, centsToInput(v)])),
  }));
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);
  const up = (k) => (e) => setF((x) => ({ ...x, [k]: e?.target ? (e.target.type === "checkbox" ? e.target.checked : e.target.value) : e }));
  const upField = (k) => (v) => setF((x) => ({ ...x, fields: { ...x.fields, [k]: v?.target ? v.target.checked : v } }));

  async function save() {
    const errs = [];
    if (!f.name.trim()) errs.push("Informe o nome da campanha.");
    const regStart = fromDateTimeInput(f.registrationStartText);
    const regEnd = fromDateTimeInput(f.registrationEndText);
    const accessStart = fromDateTimeInput(f.vipAccessStartsAtText);
    const countdownEnd = fromDateTimeInput(f.countdownEndsAtText);
    if (regStart && regEnd && regStart > regEnd) errs.push("O fim das inscrições é antes do início.");
    if (accessStart && !countdownEnd) errs.push("Defina a data final do contador para o acesso VIP.");
    if (accessStart && countdownEnd && accessStart >= countdownEnd) errs.push("O acesso VIP precisa começar antes do fim do contador.");
    if (f.afterEndAction === "redirect" && !String(f.redirectTo || "").startsWith("/")) errs.push("O redirecionamento deve ser uma página do site (ex.: /pacotes).");
    const vipPricing = {};
    for (const [pid, txt] of Object.entries(f.pricingText)) {
      if (!txt) continue;
      const c = parseBRLToCents(txt);
      if (c == null) errs.push("Preço VIP inválido."); else vipPricing[pid] = c;
    }
    if (!(f.consentText || "").trim() || f.consentText.trim().length < 10) errs.push("O texto de consentimento é obrigatório.");
    setErrors(errs);
    if (errs.length) return;
    setSaving(true);
    try {
      const { registrationStartText, registrationEndText, vipAccessStartsAtText, countdownEndsAtText, pricingText, id, count, createdAt, updatedAt, ...rest } = f;
      await saveCampaign(initial?.id || null, {
        ...rest,
        name: f.name.trim(), slug: slugify(f.slug || f.name),
        benefits: f.benefits.map((b) => b.trim()).filter(Boolean),
        registrationStart: regStart, registrationEnd: regEnd, vipAccessStartsAt: accessStart, countdownEndsAt: countdownEnd,
        maxRegistrations: f.maxRegistrations ? Number(f.maxRegistrations) : null,
        retentionDays: Number(f.retentionDays) || 0,
        consentText: f.consentText.trim(),
        vipPricing,
      });
      toast.success("Campanha salva.");
      onSaved();
    } catch (e) {
      setErrors([e.message || "Não foi possível salvar."]);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={initial?.id ? `Editar: ${initial.name}` : "Nova campanha VIP"} size="xl"
      footer={<><button className="btn-ghost" onClick={onClose}>Cancelar</button><button className="btn-primary" onClick={save} disabled={saving}>{saving && <Spinner className="h-4 w-4" />} Salvar campanha</button></>}>
      <div className="space-y-8">
        {errors.length > 0 && <ul role="alert" className="list-disc space-y-1 rounded-2xl bg-danger/5 p-4 pl-8 text-sm text-danger">{errors.map((e) => <li key={e}>{e}</li>)}</ul>}
        <section className="grid gap-5 md:grid-cols-3">
          <div className="space-y-5 md:col-span-2">
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField label="Nome *" value={f.name} onChange={up("name")} maxLength={100} placeholder="Ex.: Lista VIP — Dia das Crianças" />
              <TextField label="Endereço da página" value={f.slug} onChange={up("slug")} placeholder={slugify(f.name) || "nome-da-campanha"} hint={`/vip/${slugify(f.slug || f.name) || "…"}`} />
            </div>
            <TextArea label="Descrição curta" rows={2} value={f.description} onChange={up("description")} maxLength={300} />
            <TextArea label="Detalhes (opcional)" rows={4} value={f.details} onChange={up("details")} />
            <ListEditor label="Vantagens VIP" items={f.benefits} onChange={up("benefits")} placeholder="Ex.: acesso antecipado à agenda" />
          </div>
          <div className="space-y-4">
            <ImageInput label="Imagem" value={f.imageThumbUrl || f.imageUrl}
              onUpload={async (file, p) => {
                const img = await uploadImage(file, `campaigns/${slugify(f.name) || "campanha"}`, { onProgress: p });
                if (f.imagePath) deleteStoragePaths([f.imagePath, f.imageThumbPath]);
                setF((x) => ({ ...x, imageUrl: img.url, imageThumbUrl: img.thumbUrl, imagePath: img.path, imageThumbPath: img.thumbPath }));
              }}
              onRemove={() => setF((x) => ({ ...x, imageUrl: "", imageThumbUrl: "" }))} />
            <SelectField label="Status" value={f.status} onChange={up("status")}>
              {Object.entries(CAMPAIGN_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </SelectField>
            <Toggle label="Mostrar faixa no topo do site" checked={f.showBanner} onChange={up("showBanner")} />
          </div>
        </section>

        <section>
          <h3 className="mb-1 font-display text-2xl">Prazos e contador</h3>
          <p className="mb-4 text-sm text-ink-muted">O contador usa a data final gravada aqui: é igual em qualquer aparelho e não reinicia ao recarregar. Sem urgência falsa — o prazo é real.</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <TextField label="Inscrições a partir de" type="datetime-local" value={f.registrationStartText} onChange={up("registrationStartText")} />
            <TextField label="Inscrições até" type="datetime-local" value={f.registrationEndText} onChange={up("registrationEndText")} />
            <TextField label="Acesso VIP começa em" type="datetime-local" value={f.vipAccessStartsAtText} onChange={up("vipAccessStartsAtText")} hint="Libera o botão de acesso VIP." />
            <TextField label="Contador termina em" type="datetime-local" value={f.countdownEndsAtText} onChange={up("countdownEndsAtText")} />
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            <SelectField label="Quando o contador terminar" value={f.afterEndAction} onChange={up("afterEndAction")}>
              {Object.entries(AFTER_END_ACTIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </SelectField>
            {f.afterEndAction === "message" && <TextArea className="sm:col-span-2" label="Mensagem de encerramento" rows={2} value={f.endMessage} onChange={up("endMessage")} />}
            {f.afterEndAction === "redirect" && <TextField label="Encaminhar para" value={f.redirectTo} onChange={up("redirectTo")} placeholder="/pacotes" />}
            <TextField label="Limite de inscritos" type="number" min="0" placeholder="Sem limite" value={f.maxRegistrations ?? ""} onChange={up("maxRegistrations")} />
          </div>
        </section>

        <section>
          <h3 className="mb-1 font-display text-2xl">Preços VIP</h3>
          <p className="mb-4 text-sm text-ink-muted">Durante o acesso VIP, quem confirmar o WhatsApp da lista agenda com estes valores. Em branco = valor normal do lote.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {packages.filter((p) => !p.archived && isPublicStatus(p.status)).map((p) => (
              <TextField key={p.id} label={p.name} inputMode="decimal" placeholder="Valor normal" value={f.pricingText[p.id] || ""}
                onChange={(e) => setF((x) => ({ ...x, pricingText: { ...x.pricingText, [p.id]: e.target.value } }))} />
            ))}
            {!packages.some((p) => isPublicStatus(p.status)) && <p className="text-sm text-ink-muted">Publique pacotes para definir preços VIP.</p>}
          </div>
        </section>

        <section>
          <h3 className="mb-4 font-display text-2xl">Formulário e privacidade</h3>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-3">
              <p className="text-sm text-ink-muted">Nome e WhatsApp são sempre pedidos.</p>
              <Checkbox label="Pedir e-mail" checked={f.fields.askEmail !== false} onChange={upField("askEmail")} />
              {f.fields.askEmail !== false && <Checkbox label="E-mail obrigatório" checked={!!f.fields.requireEmail} onChange={upField("requireEmail")} />}
              <Checkbox label="Pedir preferências/observações" checked={f.fields.askPreferences !== false} onChange={upField("askPreferences")} />
              {f.fields.askPreferences !== false && (
                <TextField label="Pergunta das preferências" placeholder="Preferências ou observações (opcional)" value={f.fields.preferencesLabel || ""}
                  onChange={(e) => setF((x) => ({ ...x, fields: { ...x.fields, preferencesLabel: e.target.value } }))} />
              )}
            </div>
            <div className="space-y-4">
              <TextArea label="Texto de consentimento (LGPD) *" rows={4} value={f.consentText} onChange={up("consentText")} maxLength={1000} hint="Fica gravado junto com cada inscrição." />
              <TextField label="Guardar inscrições por (dias)" type="number" min="0" value={f.retentionDays} onChange={up("retentionDays")} hint="Depois disso, o painel avisa e permite excluir. 0 = sem prazo." />
            </div>
          </div>
        </section>
      </div>
    </Modal>
  );
}

export default function VIPAdmin() {
  const toast = useToast();
  const [confirmUI, confirm] = useConfirm();
  const { data, loading, error, reload } = useAsync(async () => {
    const [campaigns, regs, packages] = await Promise.all([listCampaigns(), listRegistrations(), listAllPackages()]);
    return { campaigns, regs, packages };
  }, []);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState({ campaign: "", status: "", from: "", to: "", q: "", onlyDup: false });
  const [busy, setBusy] = useState(null);

  const campaigns = data?.campaigns || [];
  const regs = data?.regs || [];
  const dupIds = useMemo(() => findDuplicates(regs), [regs]);
  const expired = useMemo(() => expiredRegistrations(regs, campaigns), [regs, campaigns]);
  const campName = Object.fromEntries(campaigns.map((c) => [c.id, c.name]));

  const filtered = regs.filter((r) => {
    const day = toDayKey(toDate(r.createdAt) || new Date());
    const q = filter.q.trim().toLowerCase();
    return (!filter.campaign || r.campaignId === filter.campaign)
      && (!filter.status || r.status === filter.status)
      && (!filter.from || day >= filter.from) && (!filter.to || day <= filter.to)
      && (!filter.onlyDup || dupIds.has(r.id))
      && (!q || r.name.toLowerCase().includes(q) || r.phone.includes(q.replace(/\D/g, "") || "\u0000") || (r.email || "").toLowerCase().includes(q));
  });

  async function act(id, fn, ok) {
    setBusy(id);
    try { await fn(); if (ok) toast.success(ok); reload(); } catch (e) { toast.error(e.message || "Não foi possível concluir."); } finally { setBusy(null); }
  }

  function exportCSV() {
    downloadCSV(`inscritos-vip-${toDayKey(new Date())}.csv`, filtered, [
      { label: "Nome", value: (r) => r.name },
      { label: "WhatsApp", value: (r) => formatPhoneBR(r.phone) },
      { label: "E-mail", value: (r) => r.email || "" },
      { label: "Campanha", value: (r) => r.campaignName || campName[r.campaignId] || "" },
      { label: "Preferências", value: (r) => r.preferences || "" },
      { label: "Status", value: (r) => VIP_STATUS[r.status]?.label || r.status },
      { label: "Consentimento", value: (r) => (r.consent ? "Sim" : "Não") },
      { label: "Data do cadastro", value: (r) => formatDateTime(r.createdAt) },
    ]);
  }

  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <>
      {confirmUI}
      <AdminHeader title="Lista VIP" text="Campanhas com cadastro, contador real e acesso antecipado. Os dados dos inscritos só são visíveis aqui."
        actions={<button className="btn-primary" onClick={() => setEditing({})}><Plus className="h-4 w-4" /> Nova campanha</button>} />

      <div className="space-y-6">
        {!campaigns.length ? (
          <EmptyState icon={Crown} title="Nenhuma campanha ainda" text="Crie uma campanha para Natal, Dia das Crianças, minissessões ou qualquer ação especial."
            action={<button className="btn-primary" onClick={() => setEditing({})}><Plus className="h-4 w-4" /> Criar campanha</button>} />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {campaigns.map((c) => {
              const p = campaignPhase(c, new Date(), c.count);
              const [phaseLabel, phaseTone] = PHASE_LABEL[p.phase];
              return (
                <div key={c.id} className="card card-pad">
                  <div className="flex flex-wrap items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-2xl">{c.name}</p>
                      <p className="text-xs text-ink-muted">/vip/{c.slug}</p>
                    </div>
                    <Badge tone={CAMPAIGN_STATUS[c.status].tone}>{CAMPAIGN_STATUS[c.status].label}</Badge>
                    {c.status === "published" && <Badge tone={phaseTone}>{phaseLabel}</Badge>}
                    {p.vipAccess && <Badge tone="gold">Acesso VIP ativo</Badge>}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-xs uppercase tracking-wider text-ink-muted">Inscritos</p><p className="font-display text-2xl">{c.count}{c.maxRegistrations ? <span className="text-base text-ink-muted"> / {c.maxRegistrations}</span> : ""}</p></div>
                    <div><p className="text-xs uppercase tracking-wider text-ink-muted">Contador</p>
                      {p.countdownEnd && p.phase !== "ended" ? <Countdown target={p.countdownEnd} compact /> : <p className="text-ink-muted">{p.countdownEnd ? "Encerrado" : "Sem data final"}</p>}
                      {p.countdownEnd && <p className="text-xs text-ink-muted">{formatDateTime(p.countdownEnd)}</p>}
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {busy === c.id ? <Spinner /> : (
                      <>
                        <button className="btn-ghost btn-sm" onClick={() => setEditing(c)}><Pencil className="h-4 w-4" /> Editar</button>
                        {c.status !== "published" && <button className="btn-outline btn-sm" onClick={() => act(c.id, () => setCampaignStatus(c.id, "published"), "Campanha publicada.")}>Publicar</button>}
                        {c.status === "published" && (
                          <button className="btn-outline btn-sm" onClick={async () => {
                            const ok = await confirm({ title: "Lançar acesso VIP agora?", confirmLabel: "Lançar por 24h",
                              text: "Libera agora o acesso antecipado para quem está na lista, com contador de 24 horas a partir deste momento. As datas ficam gravadas na campanha e podem ser ajustadas depois." });
                            if (ok) act(c.id, () => launchVipAccess(c.id, 24), "Acesso VIP liberado por 24 horas.");
                          }}><Rocket className="h-4 w-4" /> Lançar acesso VIP (24h)</button>
                        )}
                        {c.status === "published" && <button className="btn-ghost btn-sm" onClick={() => act(c.id, () => setCampaignStatus(c.id, "closed"), "Campanha encerrada.")}>Encerrar</button>}
                        {c.status !== "draft" && <a className="btn-ghost btn-sm" href={`/vip/${c.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> Ver página</a>}
                        <button className="btn-ghost btn-sm text-danger" aria-label={`Excluir ${c.name}`}
                          onClick={async () => { if (await confirm({ title: "Excluir campanha?", danger: true, confirmLabel: "Excluir", text: "Só é possível excluir campanhas sem inscritos." })) act(c.id, () => deleteCampaign(c), "Campanha excluída."); }}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {expired.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-warning/25 bg-warning/5 p-4 text-sm">
            <ShieldCheck className="h-5 w-5 text-warning" />
            <p className="flex-1">{expired.length} inscrição(ões) passaram do prazo de retenção definido na campanha (LGPD).</p>
            <button className="btn-outline btn-sm" onClick={async () => {
              if (await confirm({ title: "Excluir inscrições vencidas?", danger: true, confirmLabel: "Excluir", text: `${expired.length} inscrição(ões) serão apagadas definitivamente.` })) {
                act("purge", () => deleteRegistrations(expired, "retention"), "Inscrições vencidas excluídas.");
              }
            }}>Excluir vencidas</button>
          </div>
        )}

        <Section title={`Inscritos (${filtered.length})`}
          actions={<button className="btn-outline btn-sm" onClick={exportCSV} disabled={!filtered.length}><Download className="h-4 w-4" /> Exportar CSV</button>}>
          <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
            <div className="relative lg:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <input className="field-input !py-2 pl-9" placeholder="Buscar nome, WhatsApp ou e-mail" value={filter.q} onChange={(e) => setFilter({ ...filter, q: e.target.value })} />
            </div>
            <select className="field-input !py-2" value={filter.campaign} onChange={(e) => setFilter({ ...filter, campaign: e.target.value })} aria-label="Campanha">
              <option value="">Todas as campanhas</option>
              {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className="field-input !py-2" value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })} aria-label="Status">
              <option value="">Todos os status</option>
              {Object.entries(VIP_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <input type="date" className="field-input !py-2" value={filter.from} onChange={(e) => setFilter({ ...filter, from: e.target.value })} aria-label="De" />
            <input type="date" className="field-input !py-2" value={filter.to} onChange={(e) => setFilter({ ...filter, to: e.target.value })} aria-label="Até" />
          </div>
          <label className="mb-4 flex items-center gap-2 text-sm text-ink-muted">
            <input type="checkbox" className="accent-wine-900" checked={filter.onlyDup} onChange={(e) => setFilter({ ...filter, onlyDup: e.target.checked })} />
            Só possíveis duplicados ({dupIds.size}) — mesmo WhatsApp ou e-mail em mais de uma inscrição
          </label>

          {!filtered.length ? <p className="py-8 text-center text-sm text-ink-muted">Nenhum inscrito com esses filtros.</p> : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Nome</th><th>Contato</th><th>Campanha</th><th>Cadastro</th><th>Status</th><th /></tr></thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id}>
                      <td><p className="font-medium">{r.name} {dupIds.has(r.id) && <Badge tone="warning">Duplicado?</Badge>}</p>{r.preferences && <p className="mt-1 max-w-xs text-xs text-ink-muted">{r.preferences}</p>}</td>
                      <td className="text-sm"><p>{formatPhoneBR(r.phone)}</p><p className="text-ink-muted">{r.email}</p></td>
                      <td className="text-sm">{r.campaignName || campName[r.campaignId]}</td>
                      <td className="whitespace-nowrap text-sm">{formatDateTime(r.createdAt)}</td>
                      <td>
                        <select className="field-input !w-auto !py-1.5 text-xs" value={r.status} aria-label="Status do contato"
                          onChange={(e) => act(r.id, () => updateRegistration(r.id, { status: e.target.value }))}>
                          {Object.entries(VIP_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                      </td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <a className="btn-ghost btn-sm" href={whatsappLink(r.phone)} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp de ${r.name}`}><WhatsAppIcon className="h-4 w-4" /></a>
                          <button className="btn-ghost btn-sm text-danger" aria-label={`Excluir ${r.name}`}
                            onClick={async () => { if (await confirm({ title: "Excluir inscrição?", danger: true, confirmLabel: "Excluir", text: "Use para pedidos de exclusão (LGPD). A vaga volta para a lista." })) act(r.id, () => deleteRegistrations([r]), "Inscrição excluída."); }}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      </div>

      {editing && <CampaignEditor initial={editing.id ? editing : null} packages={data.packages} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </>
  );
}

