import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays, CalendarPlus, Check, ChevronLeft, ChevronRight, Clock, History, List, Plus, Receipt, RotateCcw, Save, Trash2, X,
} from "lucide-react";
import { AdminHeader, Section } from "../../components/admin/AdminUI.jsx";
import { SelectField, TextArea, TextField, Toggle } from "../../components/common/Fields.jsx";
import Badge from "../../components/common/Badge.jsx";
import Modal from "../../components/common/Modal.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import PageLoader from "../../components/common/PageLoader.jsx";
import { EmptyState, ErrorState } from "../../components/common/States.jsx";
import { useConfirm } from "../../components/common/useConfirm.jsx";
import { WhatsAppIcon } from "../../components/common/Icons.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";
import { useSettings } from "../../contexts/SettingsContext.jsx";
import { useAsync } from "../../hooks/useAsync.js";
import { APPOINTMENT_STATUS } from "../../config/constants.js";
import {
  addAppointmentNote, changeAppointmentStatus, createManualAppointment, freeSlotsForAdmin, listAppointments,
  listOpenRequests, rescheduleAppointment, saveAvailability, updateAppointmentDetails,
} from "../../services/admin/agendaAdmin.js";
import { fetchTakenLocks, getAvailability } from "../../services/agendaService.js";
import { listAllPackages } from "../../services/admin/packagesAdmin.js";
import { createIncomeFromAppointment } from "../../services/admin/financeAdmin.js";
import {
  addDays, centsToInput, formatBRL, formatDateTime, formatDayBR, formatDayLong, formatMonth, parseBRLToCents, todayKey, weekday,
} from "../../utils/format.js";
import { WEEKDAYS, generateSlots, withAvailabilityDefaults } from "../../utils/slots.js";
import { packageAvailability } from "../../utils/lots.js";
import { formatPhoneBR, normalizePhoneBR, validateName } from "../../utils/validation.js";
import { whatsappLink } from "../../utils/whatsapp.js";

const monthRange = (m) => ({ from: `${m}-01`, to: addDays(`${addDays(`${m}-01`, 32).slice(0, 7)}-01`, -1) });

function StatusBadge({ status }) {
  const s = APPOINTMENT_STATUS[status] || { label: status, tone: "neutral" };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

/** Ações de status com revalidação e confirmação quando há aviso. */
function useStatusActions(onDone) {
  const toast = useToast();
  const [confirmUI, confirm] = useConfirm();
  const [busy, setBusy] = useState(null);

  async function change(a, to) {
    if (to === "cancelled" && !(await confirm({ title: "Cancelar agendamento?", danger: true, confirmLabel: "Cancelar agendamento",
      text: "O horário volta a ficar livre na agenda e a vaga volta para o lote. O histórico é mantido." }))) return;
    setBusy(a.id);
    try {
      await changeAppointmentStatus(a.id, to);
      toast.success(`Status: ${APPOINTMENT_STATUS[to].label}.`);
      onDone();
    } catch (e) {
      if (e.code === "schedule-warning" || e.code === "conflict") {
        const ok = await confirm({ title: "Atenção", confirmLabel: "Confirmar mesmo assim", danger: e.code === "conflict",
          text: <><p>{e.message}</p><p className="mt-2">Deseja continuar mesmo assim?</p></> });
        if (ok) {
          try { await changeAppointmentStatus(a.id, to, { force: true, note: `Confirmado com aviso: ${e.message}` }); toast.success("Status atualizado."); onDone(); }
          catch (e2) { toast.error(e2.message); }
        }
      } else {
        toast.error(e.message || "Não foi possível atualizar.");
      }
    } finally {
      setBusy(null);
    }
  }
  return { confirmUI, change, busy };
}

function AppointmentActions({ a, change, busy, onOpen }) {
  const { settings } = useSettings();
  if (busy === a.id) return <Spinner />;
  return (
    <div className="flex flex-wrap gap-1.5">
      {(a.status === "requested" || a.status === "awaiting") && (
        <button className="btn-primary btn-sm" onClick={() => change(a, "confirmed")}><Check className="h-4 w-4" /> Confirmar</button>
      )}
      {a.status === "requested" && <button className="btn-ghost btn-sm" onClick={() => change(a, "awaiting")}>Aguardando</button>}
      {a.status === "confirmed" && <button className="btn-ghost btn-sm" onClick={() => change(a, "done")}>Realizado</button>}
      <a className="btn-ghost btn-sm" href={whatsappLink(a.phone, `Olá, ${a.name.split(" ")[0]}! Aqui é da ${settings.brandName}, sobre o seu ensaio em ${formatDayBR(a.date)} às ${a.time}.`)}
        target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp de ${a.name}`}><WhatsAppIcon className="h-4 w-4" /></a>
      <button className="btn-ghost btn-sm" onClick={() => onOpen(a)}>Detalhes</button>
    </div>
  );
}

function AppointmentModal({ a, cfg, onClose, onChanged, change }) {
  const toast = useToast();
  const [tab, setTab] = useState("info");
  const [note, setNote] = useState("");
  const [edit, setEdit] = useState({ name: a.name, phone: formatPhoneBR(a.phone), email: a.email || "", notes: a.notes || "", price: centsToInput(a.priceCents) });
  const [newDate, setNewDate] = useState(a.date);
  const [slots, setSlots] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tab !== "reschedule" || !newDate) return;
    setSlots(null);
    fetchTakenLocks(newDate, newDate).then(({ taken }) => {
      const mine = new Set(a.slotLockIds || []);
      const free = new Set([...taken].filter((x) => !mine.has(x)));
      setSlots(freeSlotsForAdmin(cfg, newDate, free, a.durationMin));
    });
  }, [tab, newDate]); // eslint-disable-line react-hooks/exhaustive-deps

  async function run(fn, ok) {
    setSaving(true);
    try { await fn(); toast.success(ok); onChanged(); } catch (e) { toast.error(e.message || "Não foi possível concluir."); } finally { setSaving(false); }
  }

  const history = [...(a.history || [])].reverse();
  return (
    <Modal open onClose={onClose} title={a.name} size="lg">
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <StatusBadge status={a.status} />
        {a.vipCampaignId && <Badge tone="gold">VIP</Badge>}
        <span className="text-sm text-ink-muted">{formatDayLong(a.date)}, {a.time} · {a.durationMin} min</span>
      </div>
      <div className="mb-5 flex gap-1 border-b border-ink/10" role="tablist">
        {[["info", "Dados"], ["reschedule", "Remarcar"], ["history", "Histórico"]].map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm ${tab === k ? "border-wine-900 text-wine-900" : "border-transparent text-ink-muted"}`}>{l}</button>
        ))}
      </div>

      {tab === "info" && (
        <div className="space-y-5">
          <dl className="grid gap-3 rounded-2xl bg-paper p-4 text-sm sm:grid-cols-2">
            <div><dt className="text-ink-muted">Pacote</dt><dd>{a.packageName || "—"} {a.lotName && `· ${a.lotName}`}</dd></div>
            <div><dt className="text-ink-muted">Valor combinado</dt><dd>{formatBRL(a.priceCents)}</dd></div>
            <div><dt className="text-ink-muted">Origem</dt><dd>{a.source === "admin" ? "Lançado no painel" : "Site"}</dd></div>
            <div><dt className="text-ink-muted">Pedido em</dt><dd>{formatDateTime(a.createdAt)}</dd></div>
          </dl>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Nome" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            <TextField label="WhatsApp" value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} />
            <TextField label="E-mail" value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} />
            <TextField label="Valor (R$)" value={edit.price} onChange={(e) => setEdit({ ...edit, price: e.target.value })} hint="Alterar não muda o preço do lote." />
            <TextArea className="sm:col-span-2" label="Observações do cliente" rows={3} value={edit.notes} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} />
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary btn-sm" disabled={saving} onClick={() => {
              const phone = normalizePhoneBR(edit.phone);
              if (!phone) return toast.error("WhatsApp inválido.");
              run(() => updateAppointmentDetails(a.id, { name: edit.name.trim(), phone, email: edit.email.trim() || null, notes: edit.notes.trim() || null, priceCents: parseBRLToCents(edit.price) }), "Dados atualizados.");
            }}><Save className="h-4 w-4" /> Salvar dados</button>
            <button className="btn-outline btn-sm" disabled={saving} onClick={() => run(() => createIncomeFromAppointment(a), "Receita lançada no financeiro como pendente.")}>
              <Receipt className="h-4 w-4" /> Lançar receita
            </button>
            {a.status !== "cancelled" ? (
              <button className="btn-ghost btn-sm text-danger" onClick={() => change(a, "cancelled")}><X className="h-4 w-4" /> Cancelar agendamento</button>
            ) : (
              <button className="btn-ghost btn-sm" onClick={() => change(a, "requested")}><RotateCcw className="h-4 w-4" /> Reativar</button>
            )}
          </div>
          <div className="flex gap-2">
            <input className="field-input !py-2" placeholder="Adicionar anotação ao histórico" value={note} onChange={(e) => setNote(e.target.value)} />
            <button className="btn-outline btn-sm shrink-0" disabled={!note.trim() || saving} onClick={() => run(async () => { await addAppointmentNote(a.id, note.trim()); setNote(""); }, "Anotação salva.")}>Anotar</button>
          </div>
        </div>
      )}

      {tab === "reschedule" && (
        <div className="space-y-4">
          <TextField label="Nova data" type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
          {!slots ? <Spinner /> : !slots.length ? <p className="text-sm text-ink-muted">Sem expediente configurado nesta data.</p> : (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {slots.map((s) => (
                <button key={s.time} disabled={!s.available || saving} className={`rounded-xl border px-2 py-2 text-sm tabular-nums ${s.available ? "border-ink/15 hover:border-wine-900" : "bg-paper text-ink-muted/50 line-through"}`}
                  onClick={() => run(() => rescheduleAppointment(a.id, { date: newDate, time: s.time }), `Remarcado para ${formatDayBR(newDate)} às ${s.time}.`)}>
                  {s.time}
                </button>
              ))}
            </div>
          )}
          <p className="text-xs text-ink-muted">A remarcação libera o horário antigo e reserva o novo na mesma operação. Horários riscados já estão ocupados.</p>
        </div>
      )}

      {tab === "history" && (
        <ol className="space-y-3 text-sm">
          {!history.length && <p className="text-ink-muted">Sem alterações registradas.</p>}
          {history.map((h, i) => (
            <li key={i} className="flex gap-3">
              <History className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <div>
                <p>
                  {h.action === "status" && <>Status: {APPOINTMENT_STATUS[h.from]?.label || h.from} → <b>{APPOINTMENT_STATUS[h.to]?.label || h.to}</b></>}
                  {h.action === "reschedule" && <>Remarcado de {h.from} para <b>{h.to}</b></>}
                  {h.action === "note" && <>Anotação</>}
                  {h.action === "edit" && <>Dados editados ({(h.fields || []).join(", ")})</>}
                  {h.action === "create" && <>Criado no painel</>}
                </p>
                {h.note && <p className="text-ink-muted">{h.note}</p>}
                <p className="text-xs text-ink-muted">{formatDateTime(h.at)} · {h.by}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Modal>
  );
}

function NewAppointmentModal({ cfg, packages, onClose, onSaved }) {
  const toast = useToast();
  const [f, setF] = useState({ name: "", phone: "", email: "", notes: "", packageId: "", lotId: "", price: "", date: todayKey(), time: "", status: "confirmed" });
  const [slots, setSlots] = useState(null);
  const [saving, setSaving] = useState(false);
  const pkg = packages.find((p) => p.id === f.packageId);
  const duration = Number(pkg?.durationMin) || Number(cfg.sessionMinutes) || 60;

  useEffect(() => {
    if (!f.date) return;
    setSlots(null);
    fetchTakenLocks(f.date, f.date).then(({ taken }) => setSlots(freeSlotsForAdmin(cfg, f.date, taken, duration)));
  }, [f.date, duration]); // eslint-disable-line react-hooks/exhaustive-deps

  function pickPackage(id) {
    const p = packages.find((x) => x.id === id);
    const lot = p ? packageAvailability(p, p.lots).lot || p.lots.find((l) => !l.archived) : null;
    setF((x) => ({ ...x, packageId: id, lotId: lot?.id || "", price: centsToInput(lot?.priceCents ?? p?.priceCents) }));
  }

  async function save() {
    const nameErr = validateName(f.name);
    const phone = normalizePhoneBR(f.phone);
    if (nameErr || !phone || !f.date || !f.time) return toast.error(nameErr || (!phone ? "WhatsApp inválido." : "Escolha data e horário."));
    const lot = pkg?.lots.find((l) => l.id === f.lotId);
    setSaving(true);
    try {
      await createManualAppointment({
        name: f.name.trim(), phone, email: f.email.trim(), notes: f.notes.trim(),
        packageId: pkg?.id || null, packageName: pkg?.name || "", lotId: lot?.id || null, lotName: lot?.name || "",
        priceCents: parseBRLToCents(f.price), date: f.date, time: f.time, durationMin: duration, status: f.status,
      });
      toast.success("Agendamento criado.");
      onSaved();
    } catch (e) {
      toast.error(e.message || "Não foi possível criar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Novo agendamento" size="lg"
      footer={<><button className="btn-ghost" onClick={onClose}>Cancelar</button><button className="btn-primary" onClick={save} disabled={saving}>{saving && <Spinner className="h-4 w-4" />} Criar</button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Nome *" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} data-autofocus />
        <TextField label="WhatsApp *" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        <SelectField label="Pacote" value={f.packageId} onChange={(e) => pickPackage(e.target.value)}>
          <option value="">Sem pacote</option>
          {packages.filter((p) => !p.archived).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </SelectField>
        {pkg?.lots.length ? (
          <SelectField label="Lote" value={f.lotId} onChange={(e) => { const l = pkg.lots.find((x) => x.id === e.target.value); setF({ ...f, lotId: e.target.value, price: centsToInput(l?.priceCents) }); }}>
            {pkg.lots.filter((l) => !l.archived).map((l) => <option key={l.id} value={l.id}>{l.name} — {formatBRL(l.priceCents)}</option>)}
          </SelectField>
        ) : <div />}
        <TextField label="Valor (R$)" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} />
        <SelectField label="Status" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
          {["requested", "awaiting", "confirmed", "done"].map((s) => <option key={s} value={s}>{APPOINTMENT_STATUS[s].label}</option>)}
        </SelectField>
        <TextField label="Data *" type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value, time: "" })} />
        <TextField label="Horário *" type="time" step="300" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} hint="Escolha abaixo ou digite um encaixe." />
      </div>
      <div className="mt-4">
        {!slots ? <Spinner /> : slots.length > 0 && (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {slots.map((s) => (
              <button key={s.time} disabled={!s.available} onClick={() => setF({ ...f, time: s.time })}
                className={`rounded-xl border px-2 py-2 text-sm tabular-nums ${f.time === s.time ? "border-wine-900 bg-wine-900 text-cream" : s.available ? "border-ink/15 hover:border-wine-900" : "bg-paper text-ink-muted/50 line-through"}`}>
                {s.time}
              </button>
            ))}
          </div>
        )}
      </div>
      <TextArea className="mt-4" label="Observações" rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
    </Modal>
  );
}

function AvailabilityForm({ initial, packages, onSaved }) {
  const toast = useToast();
  const [c, setC] = useState(() => withAvailabilityDefaults(initial));
  const [saving, setSaving] = useState(false);
  const [previewDay, setPreviewDay] = useState(addDays(todayKey(), 2));
  const set = (k, v) => setC((x) => ({ ...x, [k]: v }));
  const setDay = (d, k, v) => setC((x) => ({ ...x, weekly: { ...x.weekly, [d]: { ...x.weekly[d], [k]: v } } }));
  const listSet = (k, i, field, v) => setC((x) => ({ ...x, [k]: x[k].map((it, j) => (j === i ? { ...it, [field]: v } : it)) }));
  const preview = useMemo(() => generateSlots({ ...c, minAdvanceHours: 0 }, previewDay, {}), [c, previewDay]);

  async function save() {
    const errs = [];
    for (let d = 0; d < 7; d++) { const w = c.weekly[d]; if (w.enabled && w.start >= w.end) errs.push(`${WEEKDAYS[d]}: o fim deve ser depois do início.`); }
    if (!(Number(c.sessionMinutes) >= 5)) errs.push("Duração da sessão inválida.");
    c.specialDates.forEach((s) => { if (!s.date || s.start >= s.end) errs.push(`Data especial ${s.date || "sem data"}: horário inválido.`); });
    c.blockedRanges.forEach((r) => { if (!r.start || !r.end || r.start > r.end) errs.push("Período bloqueado com datas inválidas."); });
    if (errs.length) return toast.error(errs.join(" "));
    setSaving(true);
    try {
      await saveAvailability({
        ...c,
        sessionMinutes: Number(c.sessionMinutes), bufferMinutes: Number(c.bufferMinutes) || 0,
        capacityPerSlot: Math.max(1, Number(c.capacityPerSlot) || 1),
        maxPerDay: c.maxPerDay ? Number(c.maxPerDay) : null,
        minAdvanceHours: Number(c.minAdvanceHours) || 0, maxAdvanceDays: Number(c.maxAdvanceDays) || 0,
        openFrom: c.openFrom || null, openUntil: c.openUntil || null,
      });
      toast.success("Disponibilidade salva. O site já usa as novas regras.");
      onSaved();
    } catch (e) {
      toast.error(e.message || "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Section title="Funcionamento" actions={<button className="btn-primary btn-sm" onClick={save} disabled={saving}>{saving ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />} Salvar</button>}>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <Toggle label="Agenda on-line aberta" hint="Desligada, ninguém consegue enviar pedidos pelo site." checked={c.bookingEnabled} onChange={(v) => set("bookingEnabled", v)} />
            <div className="divide-y divide-ink/5 rounded-2xl border border-ink/10">
              {WEEKDAYS.map((name, d) => (
                <div key={d} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                  <label className="flex w-28 items-center gap-2 text-sm">
                    <input type="checkbox" className="accent-wine-900" checked={c.weekly[d].enabled} onChange={(e) => setDay(d, "enabled", e.target.checked)} /> {name}
                  </label>
                  <input type="time" className="field-input !w-auto !py-1.5 text-sm" disabled={!c.weekly[d].enabled} value={c.weekly[d].start} onChange={(e) => setDay(d, "start", e.target.value)} aria-label={`${name} início`} />
                  <span className="text-sm text-ink-muted">às</span>
                  <input type="time" className="field-input !w-auto !py-1.5 text-sm" disabled={!c.weekly[d].enabled} value={c.weekly[d].end} onChange={(e) => setDay(d, "end", e.target.value)} aria-label={`${name} fim`} />
                </div>
              ))}
            </div>
          </div>
          <div className="grid content-start gap-4 sm:grid-cols-2">
            <TextField label="Duração padrão da sessão (min)" type="number" min="5" value={c.sessionMinutes} onChange={(e) => set("sessionMinutes", e.target.value)} hint="Pacotes podem ter duração própria." />
            <TextField label="Intervalo entre sessões (min)" type="number" min="0" value={c.bufferMinutes} onChange={(e) => set("bufferMinutes", e.target.value)} />
            <TextField label="Atendimentos por horário" type="number" min="1" max="20" value={c.capacityPerSlot} onChange={(e) => set("capacityPerSlot", e.target.value)} hint="Use mais de 1 em minissessões com várias equipes/cenários." />
            <TextField label="Máximo por dia" type="number" min="0" placeholder="Sem limite" value={c.maxPerDay ?? ""} onChange={(e) => set("maxPerDay", e.target.value)} />
            <TextField label="Antecedência mínima (horas)" type="number" min="0" value={c.minAdvanceHours} onChange={(e) => set("minAdvanceHours", e.target.value)} />
            <TextField label="Agenda aberta até (dias à frente)" type="number" min="0" value={c.maxAdvanceDays} onChange={(e) => set("maxAdvanceDays", e.target.value)} />
            <TextField label="Agenda abre em" type="date" value={c.openFrom || ""} onChange={(e) => set("openFrom", e.target.value)} />
            <TextField label="Agenda fecha em" type="date" value={c.openUntil || ""} onChange={(e) => set("openUntil", e.target.value)} />
            <TextField className="sm:col-span-2" label="Local do atendimento" value={c.location} onChange={(e) => set("location", e.target.value)} />
            <TextArea className="sm:col-span-2" label="Aviso na página da agenda" rows={2} value={c.publicNote} onChange={(e) => set("publicNote", e.target.value)} />
          </div>
        </div>
      </Section>

      <Section title="Datas bloqueadas e feriados" actions={<button className="btn-outline btn-sm" onClick={() => set("blockedDates", [...c.blockedDates, { date: "", reason: "" }])}><Plus className="h-4 w-4" /> Data</button>}>
        <div className="space-y-2">
          {!c.blockedDates.length && <p className="text-sm text-ink-muted">Nenhuma data bloqueada.</p>}
          {c.blockedDates.map((b, i) => (
            <div key={i} className="flex flex-wrap gap-2">
              <input type="date" className="field-input !w-auto !py-2" value={b.date} onChange={(e) => listSet("blockedDates", i, "date", e.target.value)} aria-label="Data" />
              <input className="field-input !py-2 sm:flex-1" placeholder="Motivo (ex.: feriado)" value={b.reason} onChange={(e) => listSet("blockedDates", i, "reason", e.target.value)} />
              <button className="rounded-full p-2 text-danger hover:bg-danger/10" onClick={() => set("blockedDates", c.blockedDates.filter((_, j) => j !== i))} aria-label="Remover"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-between">
          <h3 className="font-medium">Períodos indisponíveis (férias, viagens)</h3>
          <button className="btn-outline btn-sm" onClick={() => set("blockedRanges", [...c.blockedRanges, { start: "", end: "", reason: "" }])}><Plus className="h-4 w-4" /> Período</button>
        </div>
        <div className="mt-3 space-y-2">
          {c.blockedRanges.map((r, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <input type="date" className="field-input !w-auto !py-2" value={r.start} onChange={(e) => listSet("blockedRanges", i, "start", e.target.value)} aria-label="Início" />
              <span className="text-sm">a</span>
              <input type="date" className="field-input !w-auto !py-2" value={r.end} onChange={(e) => listSet("blockedRanges", i, "end", e.target.value)} aria-label="Fim" />
              <input className="field-input !py-2 sm:flex-1" placeholder="Motivo" value={r.reason} onChange={(e) => listSet("blockedRanges", i, "reason", e.target.value)} />
              <button className="rounded-full p-2 text-danger hover:bg-danger/10" onClick={() => set("blockedRanges", c.blockedRanges.filter((_, j) => j !== i))} aria-label="Remover"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Datas especiais e eventos" text="Abrem um horário próprio numa data (mesmo em dia sem atendimento) e podem ser exclusivas de alguns pacotes."
        actions={<button className="btn-outline btn-sm" onClick={() => set("specialDates", [...c.specialDates, { date: "", start: "09:00", end: "17:00", label: "", packageIds: [] }])}><Plus className="h-4 w-4" /> Data especial</button>}>
        <div className="space-y-3">
          {!c.specialDates.length && <p className="text-sm text-ink-muted">Nenhuma data especial.</p>}
          {c.specialDates.map((s, i) => (
            <div key={i} className="rounded-2xl border border-ink/10 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <input type="date" className="field-input !w-auto !py-2" value={s.date} onChange={(e) => listSet("specialDates", i, "date", e.target.value)} aria-label="Data" />
                <input type="time" className="field-input !w-auto !py-2" value={s.start} onChange={(e) => listSet("specialDates", i, "start", e.target.value)} aria-label="Início" />
                <span className="text-sm">às</span>
                <input type="time" className="field-input !w-auto !py-2" value={s.end} onChange={(e) => listSet("specialDates", i, "end", e.target.value)} aria-label="Fim" />
                <input className="field-input !py-2 sm:flex-1" placeholder="Nome (ex.: Minissessão Dia das Crianças)" value={s.label} onChange={(e) => listSet("specialDates", i, "label", e.target.value)} />
                <button className="rounded-full p-2 text-danger hover:bg-danger/10" onClick={() => set("specialDates", c.specialDates.filter((_, j) => j !== i))} aria-label="Remover"><Trash2 className="h-4 w-4" /></button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="text-xs text-ink-muted">Exclusiva para:</span>
                {packages.filter((p) => !p.archived).map((p) => {
                  const on = (s.packageIds || []).includes(p.id);
                  return (
                    <button key={p.id} type="button" onClick={() => listSet("specialDates", i, "packageIds", on ? s.packageIds.filter((x) => x !== p.id) : [...(s.packageIds || []), p.id])}
                      className={`chip ${on ? "border-wine-900 bg-wine-900 text-cream" : "border-ink/15"}`}>{p.name}</button>
                  );
                })}
                {!(s.packageIds || []).length && <span className="text-xs text-ink-muted">todos os pacotes</span>}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Prévia dos horários">
        <div className="flex flex-wrap items-center gap-3">
          <input type="date" className="field-input !w-auto !py-2" value={previewDay} onChange={(e) => setPreviewDay(e.target.value)} aria-label="Dia da prévia" />
          <span className="text-sm text-ink-muted">{formatDayLong(previewDay)}</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {preview.length ? preview.map((s) => <span key={s.time} className="rounded-lg border border-ink/10 px-3 py-1.5 text-sm tabular-nums">{s.time}</span>)
            : <p className="text-sm text-ink-muted">Sem horários neste dia com as regras atuais.</p>}
        </div>
      </Section>
    </div>
  );
}

function MonthGrid({ month, appts, onOpen }) {
  const first = `${month}-01`;
  const lead = weekday(first);
  const days = [];
  for (let d = first; d.startsWith(month); d = addDays(d, 1)) days.push(d);
  const byDay = appts.reduce((m, a) => ({ ...m, [a.date]: [...(m[a.date] || []), a] }), {});
  const today = todayKey();
  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-7 border-b border-ink/5 bg-paper/60 text-center text-[11px] uppercase tracking-wider text-ink-muted">
        {WEEKDAYS.map((w) => <div key={w} className="py-2">{w.slice(0, 3)}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: lead }).map((_, i) => <div key={`e${i}`} className="min-h-24 border-b border-r border-ink/5 bg-paper/30" />)}
        {days.map((d) => (
          <div key={d} className={`min-h-24 border-b border-r border-ink/5 p-1.5 ${d === today ? "bg-wine-50/60" : ""}`}>
            <p className={`mb-1 text-xs ${d === today ? "font-semibold text-wine-900" : "text-ink-muted"}`}>{Number(d.slice(8))}</p>
            <div className="space-y-1">
              {(byDay[d] || []).map((a) => (
                <button key={a.id} onClick={() => onOpen(a)}
                  className={`block w-full truncate rounded-md px-1.5 py-0.5 text-left text-[11px] ${
                    a.status === "confirmed" ? "bg-success/15 text-success" : a.status === "cancelled" ? "bg-ink/5 text-ink-muted line-through"
                      : a.status === "done" ? "bg-paper text-ink-soft" : "bg-warning/15 text-warning"}`}>
                  {a.time} {a.name.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AgendaAdmin() {
  const [tab, setTab] = useState("appointments");
  const [view, setView] = useState("list");
  const [month, setMonth] = useState(todayKey().slice(0, 7));
  const [statusFilter, setStatusFilter] = useState("active");
  const [open, setOpen] = useState(null);
  const [creating, setCreating] = useState(false);

  const base = useAsync(async () => {
    const [cfg, packages, pending] = await Promise.all([getAvailability(), listAllPackages(), listOpenRequests()]);
    return { cfg, packages, pending };
  }, []);
  const appts = useAsync(() => listAppointments(monthRange(month)), [month]);

  const reloadAll = () => { base.reload(); appts.reload(); };
  const { confirmUI, change, busy } = useStatusActions(() => { reloadAll(); setOpen(null); });

  const list = useMemo(() => (appts.data || []).filter((a) => statusFilter === "all" ? true
    : statusFilter === "active" ? a.status !== "cancelled" : a.status === statusFilter), [appts.data, statusFilter]);

  if (base.loading && !base.data) return <PageLoader />;
  if (base.error) return <ErrorState error={base.error} onRetry={base.reload} />;
  const { cfg, packages, pending } = base.data;

  return (
    <>
      {confirmUI}
      <AdminHeader title="Agenda" text="Pedidos, confirmações e regras de disponibilidade."
        actions={tab === "appointments" && <button className="btn-primary" onClick={() => setCreating(true)}><CalendarPlus className="h-4 w-4" /> Novo agendamento</button>} />

      <div className="mb-6 flex gap-1" role="tablist">
        {[["appointments", "Agendamentos"], ["availability", "Disponibilidade"]].map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`rounded-full px-4 py-2 text-sm ${tab === k ? "bg-wine-900 text-cream" : "bg-white text-ink-soft hover:bg-ink/5"}`}>{l}</button>
        ))}
      </div>

      {tab === "availability" ? (
        <AvailabilityForm initial={cfg} packages={packages} onSaved={base.reload} />
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <Section title={`Aguardando sua resposta (${pending.length})`} text="Pedidos do site. Confirmar revalida o horário e as vagas do lote no momento do clique.">
              <ul className="divide-y divide-ink/5">
                {pending.map((a) => (
                  <li key={a.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{a.name} {a.vipCampaignId && <Badge tone="gold">VIP</Badge>}</p>
                      <p className="text-sm text-ink-muted">{formatDayLong(a.date)}, {a.time} · {a.packageName} · {formatBRL(a.priceCents)}</p>
                    </div>
                    <StatusBadge status={a.status} />
                    <AppointmentActions a={a} change={change} busy={busy} onOpen={setOpen} />
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 rounded-full border border-ink/10 bg-white p-1">
              <button className="rounded-full p-1.5 hover:bg-ink/5" onClick={() => setMonth(addDays(`${month}-01`, -1).slice(0, 7))} aria-label="Mês anterior"><ChevronLeft className="h-4 w-4" /></button>
              <span className="min-w-36 text-center text-sm font-medium">{formatMonth(`${month}-01`)}</span>
              <button className="rounded-full p-1.5 hover:bg-ink/5" onClick={() => setMonth(addDays(`${month}-01`, 32).slice(0, 7))} aria-label="Próximo mês"><ChevronRight className="h-4 w-4" /></button>
            </div>
            <select className="field-input !w-auto !rounded-full !py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filtrar status">
              <option value="active">Ativos</option>
              <option value="all">Todos</option>
              {Object.entries(APPOINTMENT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <div className="ml-auto flex rounded-full border border-ink/10 bg-white p-1">
              <button className={`rounded-full px-3 py-1.5 text-sm ${view === "list" ? "bg-ink text-cream" : ""}`} onClick={() => setView("list")}><List className="mr-1 inline h-4 w-4" />Lista</button>
              <button className={`rounded-full px-3 py-1.5 text-sm ${view === "calendar" ? "bg-ink text-cream" : ""}`} onClick={() => setView("calendar")}><CalendarDays className="mr-1 inline h-4 w-4" />Calendário</button>
            </div>
          </div>

          {appts.error ? <ErrorState error={appts.error} onRetry={appts.reload} />
            : appts.loading && !appts.data ? <div className="py-10 text-center"><Spinner /></div>
              : view === "calendar" ? <MonthGrid month={month} appts={list} onOpen={setOpen} />
                : !list.length ? <EmptyState icon={Clock} title="Nada neste mês" text="Nenhum agendamento com esse filtro." />
                  : (
                    <div className="table-wrap">
                      <table className="table">
                        <thead><tr><th>Data</th><th>Cliente</th><th>Pacote</th><th>Valor</th><th>Status</th><th className="text-right">Ações</th></tr></thead>
                        <tbody>
                          {list.map((a) => (
                            <tr key={a.id}>
                              <td className="whitespace-nowrap tabular-nums">{formatDayBR(a.date)}<br /><span className="text-ink-muted">{a.time}</span></td>
                              <td><p className="font-medium">{a.name}</p><p className="text-xs text-ink-muted">{formatPhoneBR(a.phone)}</p></td>
                              <td className="text-sm">{a.packageName || "—"}<br /><span className="text-xs text-ink-muted">{a.lotName}</span></td>
                              <td className="whitespace-nowrap tabular-nums">{formatBRL(a.priceCents)}</td>
                              <td><StatusBadge status={a.status} /></td>
                              <td><div className="flex justify-end"><AppointmentActions a={a} change={change} busy={busy} onOpen={setOpen} /></div></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
        </div>
      )}

      {open && <AppointmentModal key={open.id + (open.updatedAt?.seconds || "")} a={open} cfg={cfg} change={change} onClose={() => setOpen(null)} onChanged={() => { reloadAll(); setOpen(null); }} />}
      {creating && <NewAppointmentModal cfg={cfg} packages={packages} onClose={() => setCreating(false)} onSaved={() => { setCreating(false); reloadAll(); }} />}
    </>
  );
}
