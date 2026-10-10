import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, CalendarCheck, Check, Clock, Crown } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader.jsx";
import MonthCalendar from "../../components/forms/MonthCalendar.jsx";
import PageLoader from "../../components/common/PageLoader.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import { Checkbox, TextArea, TextField } from "../../components/common/Fields.jsx";
import { EmptyState, ErrorState } from "../../components/common/States.jsx";
import WhatsAppLink from "../../components/common/WhatsAppLink.jsx";
import { WhatsAppIcon } from "../../components/common/Icons.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";
import { useSettings } from "../../contexts/SettingsContext.jsx";
import { useAsync } from "../../hooks/useAsync.js";
import { usePublicPackages } from "../../hooks/usePublicData.js";
import { useCampaigns } from "../../hooks/useCampaigns.js";
import { useDocumentMeta } from "../../hooks/useDocumentMeta.js";
import { createBookingRequest, fetchTakenLocks, getAvailability, SlotTakenError } from "../../services/agendaService.js";
import { campaignPhase } from "../../services/vipService.js";
import { track } from "../../services/analyticsService.js";
import { addDays, formatBRL, formatDayLong, todayKey } from "../../utils/format.js";
import { generateSlots, monthDays } from "../../utils/slots.js";
import { packageAvailability } from "../../utils/lots.js";
import { normalizePhoneBR, isValidEmail, validateName } from "../../utils/validation.js";
import { waMessages } from "../../utils/whatsapp.js";

const STEPS = ["Pacote", "Data", "Horário", "Seus dados"];

function readVipSession() {
  try { return JSON.parse(sessionStorage.getItem("tf-vip") || "null"); } catch { return null; }
}

export default function Booking() {
  useDocumentMeta({ title: "Agenda", description: "Escolha o pacote, a data e o horário do seu ensaio." });
  const { settings } = useSettings();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const { data: pkgs, loading: pkgLoading, error: pkgError, reload } = usePublicPackages();
  const { data: cfg, loading: cfgLoading, error: cfgError } = useAsync(getAvailability, []);
  const { campaigns } = useCampaigns();

  const [step, setStep] = useState(0);
  const [pkgId, setPkgId] = useState(params.get("pacote") || "");
  const [month, setMonth] = useState(todayKey().slice(0, 7));
  const [locks, setLocks] = useState({ taken: new Set(), owners: new Map(), loading: false, month: null });
  const [day, setDay] = useState(null);
  const [slot, setSlot] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "", consent: false });
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(null);

  // Acesso VIP verificado na página da campanha (guardado só nesta aba).
  const vipSession = readVipSession();
  const vipCampaign = useMemo(() => {
    if (!vipSession) return null;
    const c = campaigns.find((x) => x.id === vipSession.campaignId);
    return c && campaignPhase(c, new Date(), c.count).vipAccess ? c : null;
  }, [campaigns, vipSession?.campaignId]); // eslint-disable-line react-hooks/exhaustive-deps

  const bookable = useMemo(() => (pkgs || [])
    .map((p) => ({ ...p, av: packageAvailability(p, p.lots) }))
    .filter((p) => p.ctaMode !== "whatsapp" && p.av.state === "available" && p.av.lot), [pkgs]);
  const pkg = bookable.find((p) => p.id === pkgId) || null;
  const lot = pkg?.av.lot || null;
  const vipPrice = vipCampaign && pkg ? vipCampaign.vipPricing?.[pkg.id] : undefined;
  const price = vipPrice ?? lot?.priceCents;
  const duration = Number(pkg?.durationMin) || Number(cfg?.sessionMinutes) || 60;
  const window_ = pkg ? { start: pkg.sessionStart || null, end: pkg.sessionEnd || null } : null;

  useEffect(() => { if (pkg && step === 0 && params.get("pacote")) setStep(1); }, [pkg]); // eslint-disable-line react-hooks/exhaustive-deps

  // Primeiro mês com data possível para o pacote.
  useEffect(() => {
    if (!pkg) return;
    const t = todayKey();
    const start = pkg.sessionStart && pkg.sessionStart > t ? pkg.sessionStart : t;
    setMonth(start.slice(0, 7));
  }, [pkg?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadLocks(m) {
    setLocks((l) => ({ ...l, loading: true }));
    try {
      const res = await fetchTakenLocks(`${m}-01`, `${m}-31`);
      setLocks({ ...res, loading: false, month: m });
    } catch (e) {
      setLocks((l) => ({ ...l, loading: false }));
      toast.error("Não foi possível carregar os horários. Verifique sua conexão.");
    }
  }
  useEffect(() => { if (pkg && step >= 1) loadLocks(month); }, [month, pkg?.id, step >= 1]); // eslint-disable-line react-hooks/exhaustive-deps

  const days = useMemo(() => {
    if (!cfg || !pkg || locks.month !== month) return monthDays(cfg || {}, month, { packageId: pkgId, window: window_ }).map((d) => ({ ...d, free: 0 }));
    return monthDays(cfg, month, { packageId: pkg.id, window: window_, taken: locks.taken, lockOwners: locks.owners, durationMin: duration });
  }, [cfg, pkg, month, locks, duration]); // eslint-disable-line react-hooks/exhaustive-deps

  const slots = useMemo(() => (cfg && day && pkg
    ? generateSlots(cfg, day, { packageId: pkg.id, window: window_, taken: locks.taken, lockOwners: locks.owners, durationMin: duration })
    : []), [cfg, day, pkg, locks, duration]); // eslint-disable-line react-hooks/exhaustive-deps

  const today = todayKey();
  const maxDay = cfg?.maxAdvanceDays ? addDays(today, cfg.maxAdvanceDays) : addDays(today, 365);
  const lastMonth = [maxDay, cfg?.openUntil, pkg?.sessionEnd].filter(Boolean).sort()[0].slice(0, 7);

  function choosePackage(id) {
    setPkgId(id); setDay(null); setSlot(null); setStep(1);
    params.set("pacote", id); setParams(params, { replace: true });
  }

  function validate() {
    const e = {};
    const nameErr = validateName(form.name);
    if (nameErr) e.name = nameErr;
    const phone = vipCampaign ? vipSession.phone : normalizePhoneBR(form.phone);
    if (!phone) e.phone = "Informe um WhatsApp válido com DDD.";
    if (form.email && !isValidEmail(form.email)) e.email = "E-mail inválido.";
    if (!form.consent) e.consent = "É preciso concordar para enviar o pedido.";
    setErrors(e);
    return Object.keys(e).length ? null : phone;
  }

  async function submit(ev) {
    ev.preventDefault();
    const phone = validate();
    if (!phone || !slot) return;
    setSending(true);
    try {
      const res = await createBookingRequest({
        pkg, lot, durationMin: duration,
        slot: { ...slot, date: day },
        name: form.name.trim(), phone, email: form.email.trim(), notes: form.notes.trim(),
        vip: vipCampaign ? { campaignId: vipCampaign.id, priceCents: price } : null,
      });
      track.booking(pkg.id);
      setDone(res);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      if (e instanceof SlotTakenError) {
        toast.error(e.message);
        setSlot(null); setStep(2); loadLocks(month);
      } else {
        toast.error(e.message || "Não foi possível enviar o pedido. Tente novamente.");
      }
    } finally {
      setSending(false);
    }
  }

  if (!settings.display.showAgenda) {
    return (
      <>
        <PageHeader eyebrow="Agenda" title="Agendamentos pelo WhatsApp" text="Fale com a gente para conferir as datas disponíveis." />
        <div className="container-x py-16 text-center">
          <WhatsAppLink message={waMessages.availability()} context="agenda-off" className="btn-primary"><WhatsAppIcon className="h-4 w-4" /> Consultar datas</WhatsAppLink>
        </div>
      </>
    );
  }

  if (done) {
    return (
      <section className="container-x flex min-h-[70vh] items-center justify-center py-16">
        <div className="w-full max-w-lg animate-fade-up text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-wine-900 text-cream"><Check className="h-8 w-8" /></div>
          <h1 className="display-md mt-6">Pedido enviado!</h1>
          <p className="mt-3 text-ink-muted">Seu horário fica reservado enquanto a fotógrafa confirma. Você recebe a confirmação e as instruções de pagamento pelo WhatsApp.</p>
          <dl className="card card-pad mt-8 space-y-2 text-left text-sm">
            <div className="flex justify-between gap-4"><dt className="text-ink-muted">Pacote</dt><dd className="text-right font-medium">{done.packageName} · {done.lotName}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-ink-muted">Data</dt><dd className="text-right font-medium">{formatDayLong(done.date)}, {done.time}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-ink-muted">Valor</dt><dd className="text-right font-medium">{formatBRL(done.priceCents)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-ink-muted">Código</dt><dd className="font-mono font-medium tracking-wider">{done.code}</dd></div>
          </dl>
          <WhatsAppLink message={waMessages.booking(done)} context="agenda-enviado" className="btn-primary mt-8 w-full py-3.5">
            <WhatsAppIcon className="h-4 w-4" /> Avisar pelo WhatsApp
          </WhatsAppLink>
          <Link to="/" className="btn-ghost mt-3">Voltar ao início</Link>
        </div>
      </section>
    );
  }

  if (pkgLoading || cfgLoading) return <PageLoader />;
  if (pkgError || cfgError) return <div className="container-x py-16"><ErrorState error={pkgError || cfgError} onRetry={reload} /></div>;

  return (
    <>
      <PageHeader eyebrow="Agenda" title="Agende o seu ensaio"
        text={cfg.publicNote || "Escolha o pacote, a data e o horário. O pedido fica reservado até a confirmação pelo WhatsApp."}>
        {vipCampaign && (
          <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-wine-900 px-4 py-2 text-sm text-cream">
            <Crown className="h-4 w-4 text-gold-light" /> Acesso VIP ativo: {vipCampaign.name}
          </p>
        )}
      </PageHeader>

      <section className="container-x py-12 sm:py-16">
        {!cfg.bookingEnabled || !bookable.length ? (
          <EmptyState icon={CalendarCheck}
            title={!cfg.bookingEnabled ? "Agenda temporariamente fechada" : "Nenhum pacote com agenda aberta"}
            text="Chame no WhatsApp para saber das próximas datas."
            action={<WhatsAppLink message={waMessages.availability()} context="agenda-vazia" className="btn-primary"><WhatsAppIcon className="h-4 w-4" /> Consultar datas</WhatsAppLink>} />
        ) : (
          <div className="grid gap-10 lg:grid-cols-12">
            <ol className="flex gap-2 overflow-x-auto lg:col-span-12" aria-label="Etapas">
              {STEPS.map((s, i) => (
                <li key={s} className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wider ${
                  i === step ? "bg-wine-900 text-cream" : i < step ? "bg-wine-50 text-wine-900" : "bg-paper text-ink-muted"}`} aria-current={i === step ? "step" : undefined}>
                  <span className="tabular-nums">{i + 1}</span> {s}
                </li>
              ))}
            </ol>

            <div className="lg:col-span-8">
              {step > 0 && (
                <button className="mb-6 inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink" onClick={() => setStep(step - 1)}>
                  <ArrowLeft className="h-4 w-4" /> Voltar
                </button>
              )}

              {step === 0 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {bookable.map((p) => {
                    const vp = vipCampaign?.vipPricing?.[p.id];
                    return (
                      <button key={p.id} onClick={() => choosePackage(p.id)}
                        className={`card card-pad text-left transition hover:-translate-y-0.5 hover:shadow-lift ${p.id === pkgId ? "ring-2 ring-wine-900" : ""}`}>
                        <p className="font-display text-2xl">{p.name}</p>
                        <p className="mt-1 text-sm text-ink-muted">{p.av.lot.name}{p.durationMin ? ` · ${p.durationMin} min` : ""}</p>
                        <p className="mt-4 font-display text-3xl text-wine-900">
                          {vp != null && <span className="mr-2 text-lg text-ink-muted line-through">{formatBRL(p.av.lot.priceCents)}</span>}
                          {formatBRL(vp ?? p.av.lot.priceCents)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}

              {step === 1 && pkg && (
                <div className="card card-pad max-w-md">
                  <MonthCalendar month={month} days={days} selected={day} loading={locks.loading}
                    onMonth={setMonth} canPrev={month > today.slice(0, 7)} canNext={month < lastMonth}
                    onSelect={(d) => { setDay(d); setSlot(null); setStep(2); }} />
                  <p className="mt-4 text-xs text-ink-muted">Dias riscados não têm horários livres.</p>
                </div>
              )}

              {step === 2 && day && (
                <div>
                  <h2 className="font-display text-3xl">{formatDayLong(day)}</h2>
                  {locks.loading ? <div className="py-10"><Spinner /></div> : (
                    <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {slots.map((s) => (
                        <button key={s.time} disabled={!s.available} onClick={() => { setSlot(s); setStep(3); }}
                          className={`rounded-xl border px-3 py-3 text-sm tabular-nums transition ${
                            slot?.time === s.time ? "border-wine-900 bg-wine-900 text-cream"
                              : s.available ? "border-ink/15 bg-white hover:border-wine-900" : "border-transparent bg-paper text-ink-muted/50 line-through"}`}
                          aria-label={`${s.time}${s.available ? "" : ` — ${s.reason}`}`}>
                          {s.time}
                        </button>
                      ))}
                    </div>
                  )}
                  {!locks.loading && !slots.some((s) => s.available) && <p className="mt-6 text-sm text-ink-muted">Sem horários livres neste dia. Escolha outra data.</p>}
                </div>
              )}

              {step === 3 && slot && (
                <form onSubmit={submit} noValidate className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <TextField label="Nome completo" autoComplete="name" value={form.name} error={errors.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={120} required />
                    {vipCampaign ? (
                      <TextField label="WhatsApp (lista VIP)" value={vipSession.phone.replace(/^55/, "")} disabled hint="Número verificado na lista VIP." />
                    ) : (
                      <TextField label="WhatsApp com DDD" type="tel" inputMode="tel" autoComplete="tel" placeholder="(11) 90000-0000"
                        value={form.phone} error={errors.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                    )}
                  </div>
                  <TextField label="E-mail (opcional)" type="email" autoComplete="email" value={form.email} error={errors.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={160} />
                  <TextArea label="Observações (opcional)" rows={3} maxLength={1000} value={form.notes}
                    placeholder="Quem participa do ensaio, idade das crianças, ideias…" onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                  <div>
                    <Checkbox checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })}
                      label={<>Concordo em ser contatado(a) pelo WhatsApp sobre este pedido e li a <Link to="/politicas" className="text-wine-900 underline underline-offset-2" target="_blank">política de privacidade</Link>.</>} />
                    {errors.consent && <p className="field-error ml-7">{errors.consent}</p>}
                  </div>
                  <button type="submit" className="btn-primary w-full py-3.5 sm:w-auto" disabled={sending}>
                    {sending ? <Spinner className="h-4 w-4" /> : <CalendarCheck className="h-4 w-4" />} Enviar pedido de agendamento
                  </button>
                  <p className="text-xs text-ink-muted">Não há pagamento pelo site. A confirmação e a forma de pagamento são combinadas pelo WhatsApp.</p>
                </form>
              )}
            </div>

            {pkg && (
              <aside className="lg:col-span-4">
                <div className="card card-pad lg:sticky lg:top-28">
                  <p className="eyebrow">Resumo</p>
                  <p className="mt-3 font-display text-2xl">{pkg.name}</p>
                  <p className="text-sm text-ink-muted">{lot?.name}</p>
                  <ul className="mt-5 space-y-2 text-sm text-ink-soft">
                    <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-gold" aria-hidden /> {duration} minutos</li>
                    {day && <li className="flex items-center gap-2"><CalendarCheck className="h-4 w-4 text-gold" aria-hidden /> {formatDayLong(day)}{slot ? `, ${slot.time}` : ""}</li>}
                  </ul>
                  <div className="mt-5 border-t border-ink/5 pt-4">
                    <p className="text-xs uppercase tracking-wider text-ink-muted">Valor</p>
                    <p className="font-display text-3xl text-wine-900">{formatBRL(price)}</p>
                    {vipPrice != null && <p className="text-xs text-gold-dark">Condição VIP aplicada</p>}
                  </div>
                  <Link to={`/pacotes/${pkg.slug || pkg.id}`} className="link-underline mt-5 inline-block text-sm text-ink-muted">Ver detalhes do pacote</Link>
                </div>
              </aside>
            )}
          </div>
        )}
      </section>
    </>
  );
}
