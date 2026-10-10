import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Check, Crown, Gift, Lock } from "lucide-react";
import PageLoader from "../../components/common/PageLoader.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import SmartImage from "../../components/common/SmartImage.jsx";
import Reveal from "../../components/common/Reveal.jsx";
import { Sparkle } from "../../components/common/SectionHeading.jsx";
import { Checkbox, TextArea, TextField } from "../../components/common/Fields.jsx";
import { EmptyState, ErrorState } from "../../components/common/States.jsx";
import WhatsAppLink from "../../components/common/WhatsAppLink.jsx";
import { WhatsAppIcon } from "../../components/common/Icons.jsx";
import Countdown from "../../components/vip/Countdown.jsx";
import { useCampaigns, loadCampaigns } from "../../hooks/useCampaigns.js";
import { useServerNow } from "../../hooks/useServerNow.js";
import { useDocumentMeta } from "../../hooks/useDocumentMeta.js";
import { useToast } from "../../contexts/ToastContext.jsx";
import { useSettings } from "../../contexts/SettingsContext.jsx";
import { campaignPhase, isVipMember, registerVip } from "../../services/vipService.js";
import { track } from "../../services/analyticsService.js";
import { CONSENT_TEXT_DEFAULT } from "../../config/constants.js";
import { formatDateTime } from "../../utils/format.js";
import { paragraphs } from "../../utils/text.js";
import { isValidEmail, normalizePhoneBR, validateName } from "../../utils/validation.js";
import { waMessages } from "../../utils/whatsapp.js";

function SignupForm({ campaign, onDone }) {
  const toast = useToast();
  const fields = campaign.fields || {};
  const consentText = campaign.consentText || CONSENT_TEXT_DEFAULT;
  const [form, setForm] = useState({ name: "", phone: "", email: "", preferences: "", consent: false });
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const err = {};
    const nameErr = validateName(form.name);
    if (nameErr) err.name = nameErr;
    const phone = normalizePhoneBR(form.phone);
    if (!phone) err.phone = "Informe um WhatsApp válido com DDD.";
    if (fields.requireEmail && !form.email) err.email = "Informe seu e-mail.";
    if (form.email && !isValidEmail(form.email)) err.email = "E-mail inválido.";
    if (!form.consent) err.consent = "É preciso autorizar para entrar na lista.";
    setErrors(err);
    if (Object.keys(err).length) return;
    setSending(true);
    try {
      await registerVip(campaign, {
        name: form.name.trim(), phone,
        email: fields.askEmail === false ? "" : form.email.trim(),
        preferences: fields.askPreferences === false ? "" : form.preferences.trim(),
        consentText,
      });
      track.vipSignup(campaign.id);
      loadCampaigns(true);
      onDone({ name: form.name.trim(), phone });
    } catch (ex) {
      if (ex.code === "duplicate") setErrors({ phone: ex.message });
      else if (ex.code === "full") toast.error(ex.message);
      else if (ex.code === "permission-denied") toast.error("As inscrições desta campanha não estão abertas no momento.");
      else toast.error("Não foi possível concluir a inscrição. Tente novamente.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <TextField label="Nome completo" autoComplete="name" maxLength={120} value={form.name} error={errors.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <TextField label="WhatsApp com DDD" type="tel" inputMode="tel" autoComplete="tel" placeholder="(11) 90000-0000"
        value={form.phone} error={errors.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
      {fields.askEmail !== false && (
        <TextField label={fields.requireEmail ? "E-mail" : "E-mail (opcional)"} type="email" autoComplete="email" maxLength={160}
          value={form.email} error={errors.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      )}
      {fields.askPreferences !== false && (
        <TextArea label={fields.preferencesLabel || "Preferências ou observações (opcional)"} rows={3} maxLength={1000}
          value={form.preferences} onChange={(e) => setForm({ ...form, preferences: e.target.value })} />
      )}
      <div>
        <Checkbox checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })}
          label={<>{consentText} <Link to="/politicas#privacidade" target="_blank" className="text-wine-900 underline underline-offset-2">Política de privacidade</Link>.</>} />
        {errors.consent && <p className="field-error ml-7">{errors.consent}</p>}
      </div>
      <button type="submit" className="btn-primary w-full py-3.5" disabled={sending}>
        {sending ? <Spinner className="h-4 w-4" /> : <Crown className="h-4 w-4" />} Entrar na lista VIP
      </button>
    </form>
  );
}

function VipAccess({ campaign }) {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  async function check(e) {
    e.preventDefault();
    const p = normalizePhoneBR(phone);
    if (!p) return setError("Informe o WhatsApp usado na inscrição, com DDD.");
    setChecking(true);
    setError("");
    try {
      if (await isVipMember(campaign.id, p)) {
        try { sessionStorage.setItem("tf-vip", JSON.stringify({ campaignId: campaign.id, phone: p })); } catch { /* aba privada */ }
        track.cta(`vip-acesso-${campaign.id}`);
        navigate("/agenda");
      } else {
        setError("Não encontramos este número na lista VIP desta campanha.");
      }
    } catch {
      setError("Não foi possível verificar agora. Tente novamente.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <form onSubmit={check} noValidate className="space-y-4">
      <TextField label="WhatsApp cadastrado na lista VIP" type="tel" inputMode="tel" autoComplete="tel" placeholder="(11) 90000-0000"
        value={phone} error={error} onChange={(e) => setPhone(e.target.value)} />
      <button className="btn-gold w-full py-3.5" disabled={checking}>
        {checking ? <Spinner className="h-4 w-4" /> : <Lock className="h-4 w-4" />} Acessar condições VIP
      </button>
    </form>
  );
}

function CampaignView({ campaign }) {
  const now = useServerNow(1000);
  const p = campaignPhase(campaign, now, campaign.count);
  const [done, setDone] = useState(null);
  useDocumentMeta({ title: campaign.name, description: campaign.description, image: campaign.imageUrl });

  if (p.phase === "ended") {
    if (campaign.afterEndAction === "redirect" && campaign.redirectTo?.startsWith("/")) return <Navigate to={campaign.redirectTo} replace />;
    return (
      <section className="container-x py-24">
        <EmptyState icon={Gift} title={`${campaign.name} foi encerrada`}
          text={campaign.afterEndAction === "message" && campaign.endMessage ? campaign.endMessage : "Fique de olho nas nossas redes para as próximas campanhas."}
          action={<div className="flex flex-wrap justify-center gap-3"><Link to="/pacotes" className="btn-primary">Ver pacotes</Link>
            <WhatsAppLink message={waMessages.campaign(campaign.name)} context="vip-encerrada" className="btn-outline"><WhatsAppIcon className="h-4 w-4" /> WhatsApp</WhatsAppLink></div>} />
      </section>
    );
  }

  const benefits = campaign.benefits || [];
  return (
    <>
      <section className="relative overflow-hidden bg-wine-900 text-cream grain">
        {campaign.imageUrl && (
          <SmartImage src={campaign.imageUrl} thumb={campaign.imageThumbUrl} alt="" priority className="absolute inset-0 opacity-30" sizes="100vw" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-wine-950 via-wine-950/80 to-wine-950/40" aria-hidden />
        <div className="container-x relative py-20 sm:py-28">
          <p className="eyebrow flex animate-fade-up items-center gap-2 !text-gold-light"><Sparkle className="h-2.5 w-2.5" /> Lista VIP</p>
          <h1 className="display-xl mt-4 max-w-3xl animate-fade-up text-balance !text-cream">{campaign.name}</h1>
          {campaign.description && <p className="mt-5 max-w-xl animate-fade-up text-lg text-cream/80">{campaign.description}</p>}
          {p.countdownEnd && (
            <div className="mt-10 animate-fade-up">
              <p className="mb-3 text-xs uppercase tracking-[0.2em] text-cream/60">
                {p.vipAccess ? "Acesso VIP termina em" : "Campanha termina em"} · {formatDateTime(p.countdownEnd)}
              </p>
              <Countdown target={p.countdownEnd} tone="light" />
            </div>
          )}
        </div>
      </section>

      <section className="container-x grid gap-12 py-16 lg:grid-cols-12 lg:py-20">
        <div className="lg:col-span-6">
          {benefits.length > 0 && (
            <Reveal>
              <h2 className="display-md">Vantagens de quem está na lista</h2>
              <ul className="mt-6 space-y-3">
                {benefits.map((b) => (
                  <li key={b} className="flex gap-3 text-ink-soft"><Check className="mt-1 h-4 w-4 shrink-0 text-wine-700" aria-hidden /> {b}</li>
                ))}
              </ul>
            </Reveal>
          )}
          {campaign.details && (
            <Reveal className="mt-10 space-y-4 leading-relaxed text-ink-soft">
              {paragraphs(campaign.details).map((x) => <p key={x}>{x}</p>)}
            </Reveal>
          )}
          {p.regEnd && p.phase === "open" && <p className="mt-8 text-sm text-ink-muted">Inscrições até {formatDateTime(p.regEnd)}.</p>}
        </div>

        <div className="space-y-6 lg:col-span-6">
          {p.vipAccess && (
            <Reveal className="card card-pad border-gold/40">
              <h2 className="flex items-center gap-2 font-display text-3xl"><Crown className="h-6 w-6 text-gold" /> Já está na lista?</h2>
              <p className="mb-5 mt-2 text-sm text-ink-muted">O acesso antecipado está liberado. Confirme seu WhatsApp para agendar com as condições VIP.</p>
              <VipAccess campaign={campaign} />
            </Reveal>
          )}

          <Reveal className="card card-pad">
            {done ? (
              <div className="py-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-wine-900 text-cream"><Check className="h-7 w-7" /></div>
                <h2 className="mt-5 font-display text-3xl">Você está na lista, {done.name.split(" ")[0]}!</h2>
                <p className="mt-2 text-ink-muted">Quando o acesso VIP abrir, avisamos pelo WhatsApp.</p>
              </div>
            ) : p.phase === "open" ? (
              <>
                <h2 className="font-display text-3xl">Quero entrar na lista</h2>
                <p className="mb-6 mt-2 text-sm text-ink-muted">Leva menos de um minuto.</p>
                <SignupForm campaign={campaign} onDone={setDone} />
              </>
            ) : (
              <div className="py-4 text-center">
                <h2 className="font-display text-2xl">
                  {p.phase === "upcoming" ? "Inscrições em breve" : p.phase === "full" ? "As vagas da lista se esgotaram" : "Inscrições encerradas"}
                </h2>
                <p className="mt-2 text-sm text-ink-muted">
                  {p.phase === "upcoming" && p.regStart ? `Abrem em ${formatDateTime(p.regStart)}.` : "Fale com a gente para saber das próximas oportunidades."}
                </p>
                <WhatsAppLink message={waMessages.campaign(campaign.name)} context="vip-fechada" className="btn-outline mt-5"><WhatsAppIcon className="h-4 w-4" /> Falar no WhatsApp</WhatsAppLink>
              </div>
            )}
          </Reveal>
        </div>
      </section>
    </>
  );
}

export default function VIP() {
  const { slug } = useParams();
  const { campaigns, loading, error } = useCampaigns();
  const { settings } = useSettings();
  useDocumentMeta({ title: "Lista VIP" });

  const campaign = useMemo(() => {
    if (slug) return campaigns.find((c) => c.slug === slug) || null;
    const now = new Date();
    return campaigns
      .filter((c) => c.status === "published" && campaignPhase(c, now, c.count).phase !== "ended")
      .sort((a, b) => (a.countdownEndsAt?.seconds || Infinity) - (b.countdownEndsAt?.seconds || Infinity))[0] || null;
  }, [campaigns, slug]);

  useEffect(() => { if (campaign) track.cta(`vip-view-${campaign.id}`); }, [campaign?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <PageLoader />;
  if (error) return <div className="container-x py-16"><ErrorState error={error} /></div>;
  if (!campaign || (campaign.afterEndAction === "hide" && campaignPhase(campaign).phase === "ended")) {
    return (
      <section className="container-x py-24">
        <EmptyState icon={Crown} title={slug ? "Campanha não encontrada" : "Nenhuma lista VIP aberta agora"}
          text="As campanhas VIP dão acesso antecipado e condições especiais. Chame no WhatsApp para saber da próxima."
          action={<WhatsAppLink message={waMessages.general(settings.brandName)} context="vip-vazia" className="btn-primary"><WhatsAppIcon className="h-4 w-4" /> Avise-me da próxima</WhatsAppLink>} />
      </section>
    );
  }
  return <CampaignView key={campaign.id} campaign={campaign} />;
}
