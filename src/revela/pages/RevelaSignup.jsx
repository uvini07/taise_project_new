import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Info, Loader2 } from "lucide-react";
import RevelaLayout from "../components/RevelaLayout.jsx";
import AuthScene from "../components/AuthScene.jsx";
import { PasswordInput, TextInput, inputCls } from "../components/Field.jsx";
import { PLANS, planById } from "../data.js";
import { cleanSlugInput, slugProblem, suggestSlug } from "../slug.js";
import { siteHost, useRevelaMeta } from "../hooks.js";
import { isValidEmail, normalizePhoneBR } from "../../utils/validation.js";
import { TRIAL_DAYS, authErrorMessage, hasStudio, isSlugTaken, loginWithGoogle, googleRedirectResult, signupErrorMessage, signupStudio } from "../../services/authService.js";
import { auth } from "../../services/firebaseAuth.js";
import GoogleButton from "../components/GoogleButton.jsx";
import { supportLink } from "../../config/support.js";

// Cadastro aberto em modo de teste: cria a conta e o estúdio com 30 dias
// grátis. A cobrança do plano entra depois (Mercado Pago).
const SIGNUP_OPEN = true;

const STEPS = ["Plano", "Seus dados", "Endereço", "Revisão"];

function Progress({ step }) {
  return (
    <ol className="mb-8 grid grid-cols-4 gap-2" aria-label="Etapas do cadastro">
      {STEPS.map((s, i) => (
        <li key={s} aria-current={i === step ? "step" : undefined}>
          <span className="block h-1.5 overflow-hidden rounded-full bg-rv-ameixa/10">
            <span className="block h-full origin-left rounded-full bg-rv-rosa transition-transform duration-500" style={{ transform: `scaleX(${i <= step ? 1 : 0})` }} />
          </span>
          <span className={`mt-2 block text-[12px] sm:text-[13px] ${i === step ? "font-medium text-rv-ameixa" : "text-rv-ink2"}`}>{s}</span>
        </li>
      ))}
    </ol>
  );
}

export default function RevelaSignup() {
  useRevelaMeta("Criar conta", "Escolha o plano, preencha seus dados e o endereço do seu site na Revela.");
  const [params] = useSearchParams();
  const [step, setStep] = useState(0);
  const [plan, setPlan] = useState(planById(params.get("plano"))?.id || "profissional");
  const [f, setF] = useState({ name: "", studio: "", email: "", phone: "", password: "" });
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [submitErr, setSubmitErr] = useState("");
  const [taken, setTaken] = useState(null); // null = conferindo
  const navigate = useNavigate();

  const set = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }));
  // Cadastro com Google: sem senha; nome e e-mail vêm da conta Google.
  const [google, setGoogle] = useState(null); // { email, name }
  async function applyGoogleUser(u) {
    if (!u) return;
    if (await hasStudio(u.uid)) { navigate("/adm/dashboard", { replace: true }); return; }
    setGoogle({ email: u.email, name: u.displayName || "" });
    setF((v) => ({ ...v, email: u.email || v.email, name: v.name || u.displayName || "" }));
  }
  useEffect(() => {
    googleRedirectResult().then((r) => applyGoogleUser(r?.user || (params.get("google") ? auth.currentUser : null)));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  async function googleSignup() {
    setSubmitErr("");
    try { await applyGoogleUser(await loginWithGoogle()); } catch (e) { setSubmitErr(authErrorMessage(e)); }
  }
  const autoSlug = suggestSlug(f.studio || f.name);
  const address = slugTouched ? slug : autoSlug;
  // Confere no banco se o endereço está livre (espera a pessoa parar de digitar).
  useEffect(() => {
    if (slugProblem(address)) return undefined;
    setTaken(null);
    const t = setTimeout(() => isSlugTaken(address).then(setTaken), 400);
    return () => clearTimeout(t);
  }, [address]);
  const slugErr = slugProblem(address) || (taken ? "Este endereço já está em uso. Tente outro." : null);
  const chosen = useMemo(() => planById(plan), [plan]);

  function validateData() {
    const e = {};
    if (f.name.trim().length < 3) e.name = "Informe seu nome.";
    if (f.studio.trim().length < 2) e.studio = "Informe o nome do estúdio.";
    if (!isValidEmail(f.email)) e.email = "Informe um e-mail válido.";
    if (!normalizePhoneBR(f.phone)) e.phone = "Informe um WhatsApp com DDD.";
    if (!google && f.password.length < 8) e.password = "Use pelo menos 8 caracteres.";
    return e;
  }

  async function next() {
    if (step === 1) {
      const e = validateData();
      setErrors(e);
      if (Object.keys(e).length) return;
    }
    if (step === 2) {
      setSlugTouched(true);
      setSlug(address);
      if (slugErr) return;
      // Ainda conferindo: confere agora e só avança se estiver livre.
      if (taken === null) {
        const t = await isSlugTaken(address);
        setTaken(t);
        if (t) return;
      }
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  const back = () => setStep((s) => Math.max(0, s - 1));

  async function startTrial() {
    setBusy(true);
    setSubmitErr("");
    try {
      if (await isSlugTaken(address)) { setTaken(true); setStep(2); throw Object.assign(new Error(), { code: "permission-denied" }); }
      await signupStudio({ name: f.name, studio: f.studio, email: google ? google.email : f.email, phone: normalizePhoneBR(f.phone), password: f.password, slug: address, plan });
      navigate("/adm/dashboard", { replace: true });
    } catch (e) {
      setSubmitErr(signupErrorMessage(e));
      if (e?.code === "auth/email-already-in-use") setStep(1);
    } finally {
      setBusy(false);
    }
  }

  return (
    <RevelaLayout footer={false}>
      <section className="relative isolate flex min-h-[100svh] items-center bg-rv-lavanda pb-16 pt-28">
        <AuthScene />
        <div className="rv-wrap relative z-10">
          <div className="lg w-full min-w-0 max-w-[560px] p-5 sm:p-9" style={{ "--lg-r": "32px", "--lg-bg": "rgba(255,255,255,.58)" }}>
            <h1 className="text-[2.4rem] leading-[1.05] sm:text-[2.7rem]">Criar conta na Revela</h1>
            <p className="mb-8 mt-3 text-[16px] text-rv-ink2">Já tem conta? <Link to="/entrar" className="rv-link font-medium text-rv-ameixa">Entrar</Link>
              <span className="mx-2 text-rv-lilas" aria-hidden>·</span>
              <a href={supportLink()} target="_blank" rel="noopener noreferrer" className="rv-link font-medium text-rv-ameixa">Precisa de ajuda?</a></p>
            <Progress step={step} />

            <div key={step} className="animate-[rv-step-in_.5s_cubic-bezier(.16,1,.3,1)_both]">
              {step === 0 && (
                <fieldset>
                  <legend className="mb-4 text-[17px] font-medium text-rv-ameixa">Escolha o plano</legend>
                  <div className="space-y-3">
                    {PLANS.map((p) => (
                      <label key={p.id} className={`flex cursor-pointer items-center gap-4 rounded-2xl border bg-white/70 p-4 transition ${plan === p.id ? "border-rv-rosa ring-4 ring-rv-rosa/15" : "border-white/80 hover:border-rv-lilas/60"}`}>
                        <input type="radio" name="plano" value={p.id} checked={plan === p.id} onChange={() => setPlan(p.id)} className="sr-only" />
                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${plan === p.id ? "border-rv-rosa bg-rv-rosa text-white" : "border-rv-lilas/60"}`}>{plan === p.id && <Check className="h-3.5 w-3.5" />}</span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                            <span className="font-revela text-2xl text-rv-ameixa">{p.name}</span>
                            <span className="whitespace-nowrap text-[15px] text-rv-ameixa"><b className="font-medium">R$ {p.price}</b> por mês</span>
                          </span>
                          <span className="mt-0.5 block text-[14px] text-rv-ink2">{p.limits[0].label} · {p.limits[3].label.toLowerCase()}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className="mt-4 text-[14px] text-rv-ink2">Todos os planos têm todas as ferramentas. <Link to="/planos" className="rv-link font-medium text-rv-ameixa">Comparar os planos</Link></p>
                </fieldset>
              )}

              {step === 1 && (
                <div className="grid gap-5 sm:grid-cols-2">
                  {!google && (
                    <div className="sm:col-span-2">
                      <GoogleButton onClick={googleSignup}>Continuar com Google</GoogleButton>
                      <p className="mt-4 flex items-center gap-3 text-[13px] text-rv-ink2"><span className="h-px flex-1 bg-rv-ameixa/15" />ou preencha<span className="h-px flex-1 bg-rv-ameixa/15" /></p>
                    </div>
                  )}
                  {google && <p className="sm:col-span-2 rounded-2xl bg-white/70 px-4 py-3 text-[14px] text-rv-ameixa">Conectado com Google: <b className="font-medium">{google.email}</b>. Você vai entrar sempre com o Google, sem senha.</p>}
                  <TextInput className="sm:col-span-2" label="Seu nome" autoComplete="name" value={f.name} onChange={set("name")} error={errors.name} />
                  <TextInput className="sm:col-span-2" label="Nome do estúdio" autoComplete="organization" value={f.studio} onChange={set("studio")} error={errors.studio} placeholder="Ana Lima Fotografia" />
                  <TextInput label="E-mail" type="email" autoComplete="email" inputMode="email" value={f.email} onChange={set("email")} error={errors.email} readOnly={!!google} />
                  <TextInput label="WhatsApp" type="tel" autoComplete="tel" inputMode="tel" value={f.phone} onChange={set("phone")} error={errors.phone} placeholder="(11) 90000-0000" />
{!google && <PasswordInput className="sm:col-span-2" autoComplete="new-password" value={f.password} onChange={set("password")} error={errors.password} hint="Pelo menos 8 caracteres." />}
                </div>
              )}

              {step === 2 && (
                <div>
                  <p className="mb-4 text-[17px] font-medium text-rv-ameixa">Endereço do seu site</p>
                  <label className="block">
                    <span className="sr-only">Endereço</span>
                    {/* No celular o domínio fica numa linha pequena em cima e o campo ocupa a largura toda. */}
                    <span className={`${inputCls} flex flex-col gap-0 p-0 focus-within:border-rv-rosa focus-within:ring-4 focus-within:ring-rv-rosa/15 sm:flex-row sm:items-center`}>
                      <span className="min-w-0 shrink-0 select-none truncate px-4 pt-3 text-[13px] text-rv-ink2 sm:max-w-[60%] sm:py-3.5 sm:pr-0 sm:text-[16px]">{siteHost()}/</span>
                      <input className="min-w-0 flex-1 bg-transparent px-4 pb-3.5 pt-0.5 text-[17px] font-medium text-rv-ameixa outline-none focus:outline-none focus-visible:outline-none sm:pl-0 sm:pt-3.5 sm:text-[16px] sm:font-normal"
                        style={{ outline: "none", boxShadow: "none" }} value={address} aria-invalid={!!slugErr || undefined}
                        onChange={(e) => { setSlugTouched(true); setSlug(cleanSlugInput(e.target.value)); }} spellCheck="false" autoCapitalize="none" />
                    </span>
                  </label>
                  {slugErr
                    ? <p className="mt-2 text-[13px] font-medium text-rv-rosa">{slugErr}</p>
                    : taken === null
                      ? <p className="mt-2 inline-flex items-center gap-1.5 text-[13px] text-rv-ink2"><Loader2 className="h-3.5 w-3.5 animate-spin" />Conferindo…</p>
                      : <p className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#2F6B5C]"><Check className="h-3.5 w-3.5" />Disponível</p>}
                  <p className="mt-5 text-[14px] leading-relaxed text-rv-ink2">É o link que vai para o Instagram e para os clientes. Dá para trocar depois, nas configurações do estúdio.</p>
                </div>
              )}

              {step === 3 && (
                <div>
                  <dl className="divide-y divide-rv-ameixa/10 rounded-2xl bg-white/70 px-5 text-[15px]">
                    {[
                      ["Plano", `${chosen?.name} · R$ ${chosen?.price} por mês`],
                      ["Nome", f.name],
                      ["Estúdio", f.studio],
                      ["E-mail", f.email],
                      ["Endereço", `${siteHost()}/${address}`],
                    ].map(([k, v]) => (
                      <div key={k} className="flex flex-col gap-0.5 py-3 sm:flex-row sm:justify-between sm:gap-4 sm:py-3.5">
                        <dt className="shrink-0 text-[13px] text-rv-ink2 sm:text-[15px]">{k}</dt>
                        <dd className="min-w-0 break-all font-medium text-rv-ameixa sm:break-normal sm:truncate sm:text-right">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  {!SIGNUP_OPEN && (
                    <p className="mt-5 flex gap-3 rounded-2xl bg-rv-ameixa px-4 py-3.5 text-[14px] leading-relaxed text-rv-lavanda" role="status">
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-rv-rosa" aria-hidden />
                      O cadastro automático de novos estúdios abre em breve. Por enquanto, esta tela ainda não cria a conta.
                    </p>
                  )}
                  {SIGNUP_OPEN && (
                    <p className="mt-5 flex gap-3 rounded-2xl bg-white/70 px-4 py-3.5 text-[14px] leading-relaxed text-rv-ameixa">
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-rv-rosa" aria-hidden />
                      Você usa a Revela de graça por {TRIAL_DAYS} dias, com todas as ferramentas. Nenhum cartão é pedido agora.
                    </p>
                  )}
                  {submitErr && <p role="alert" className="mt-4 rounded-2xl bg-rv-rosa/10 px-4 py-3 text-[14px] text-rv-ameixa">{submitErr}</p>}
                </div>
              )}
            </div>

            {/* Celular: botões empilhados, largura toda, o principal em cima. */}
            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              {step > 0
                ? <button type="button" onClick={back} className="rv-btn lg lg-pill rv-btn-glass w-full justify-center sm:w-auto"><ArrowLeft className="h-4 w-4" aria-hidden />Voltar</button>
                : <span className="hidden sm:block" />}
              {step < STEPS.length - 1
                ? <button type="button" onClick={next} className="rv-btn rv-btn-primary w-full justify-center sm:w-auto">Continuar<ArrowRight className="h-4 w-4" aria-hidden /></button>
                : <button type="button" className="rv-btn rv-btn-primary w-full justify-center sm:w-auto" onClick={startTrial} disabled={!SIGNUP_OPEN || busy}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <span className="rv-btn-dot" aria-hidden />}
                    {busy ? "Criando seu estúdio…" : `Usar teste de ${TRIAL_DAYS} dias`}
                  </button>}
            </div>
          </div>
        </div>
      </section>
    </RevelaLayout>
  );
}
