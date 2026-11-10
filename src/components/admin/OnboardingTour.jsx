import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, CalendarDays, Crown, Heart, Palette, Sparkles, X,
} from "lucide-react";
import { useSettings } from "../../contexts/SettingsContext.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { isLegacyStudio } from "../../config/tenant.js";
import { saveSettings } from "../../services/admin/settingsAdmin.js";

// Apresentação rápida que aparece no primeiro acesso de um estúdio novo.
// Setas (ou as do teclado) passam os slides; "Pular" fecha. No fim, leva para
// a aba Estilo, onde a fotógrafa escolhe o modelo do site.

const SLIDES = (name) => [
  {
    icon: Sparkles,
    title: `Boas-vindas, ${name}!`,
    text: "Em menos de um minuto você conhece o que a Revela faz por você. Use as setas para passar ou pule quando quiser.",
  },
  {
    icon: Palette,
    title: "Um site com a sua cara",
    text: "Escolha entre 5 modelos de site e mude fontes, cores, textos e fotos. Tudo é editável, sem precisar de designer.",
  },
  {
    icon: CalendarDays,
    title: "Pacotes e agenda com sinal",
    text: "Monte pacotes com preço por lote. A cliente escolhe o horário no seu site e o horário sai da agenda na hora.",
  },
  {
    icon: Heart,
    title: "Seleção e entrega de fotos",
    text: "A cliente escolhe as favoritas numa galeria protegida e baixa as editadas por um link elegante, tudo no mesmo lugar.",
  },
  {
    icon: Crown,
    title: "Lista VIP e financeiro",
    text: "Abra campanhas de Natal e Dia das Mães com lista VIP e acompanhe quanto entrou. Vamos começar pelo seu site?",
  },
];

const seenKey = (studio) => `revela-tour:${studio}`;

export default function OnboardingTour() {
  const { settings, loading } = useSettings();
  const { admin } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  const slides = SLIDES(admin?.studioName || settings.brandName || "fotógrafa");

  // Primeiro acesso de estúdio novo (a Taíse não vê).
  useEffect(() => {
    if (loading || !admin?.studio || isLegacyStudio(admin.studio) || settings.onboardingDone) return;
    let seen = false;
    try { seen = localStorage.getItem(seenKey(admin.studio)) === "1"; } catch { /* sem armazenamento */ }
    if (!seen) setOpen(true);
  }, [loading, admin?.studio, settings.onboardingDone]);

  // "Rever apresentação" (aba Estilo).
  useEffect(() => {
    const show = () => { setI(0); setOpen(true); };
    window.addEventListener("revela:tour", show);
    return () => window.removeEventListener("revela:tour", show);
  }, []);

  const close = useCallback((goToStyle) => {
    setOpen(false);
    try { localStorage.setItem(seenKey(admin?.studio), "1"); } catch { /* sem armazenamento */ }
    if (!settings.onboardingDone) saveSettings({ onboardingDone: true }).catch(() => {});
    if (goToStyle) navigate("/adm/estilo");
  }, [admin?.studio, settings.onboardingDone, navigate]);

  const last = i === slides.length - 1;
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "ArrowRight") setI((x) => Math.min(x + 1, slides.length - 1));
      if (e.key === "ArrowLeft") setI((x) => Math.max(x - 1, 0));
      if (e.key === "Escape") close(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, slides.length, close]);

  if (!open) return null;
  const S = slides[i];
  const Icon = S.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      <div className="relative w-full max-w-lg animate-fade-up overflow-hidden rounded-3xl bg-surface shadow-lift">
        <button type="button" onClick={() => close(false)} className="absolute right-4 top-4 z-10 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-white hover:bg-white/15">
          Pular <X className="h-4 w-4" aria-hidden />
        </button>

        <div className="relative flex h-48 items-center justify-center overflow-hidden bg-wine-900">
          <span className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-cream/10" aria-hidden />
          <span className="absolute -bottom-16 right-6 h-48 w-48 rounded-full bg-gold/25" aria-hidden />
          <span key={i} className="relative flex h-20 w-20 animate-fade-up items-center justify-center rounded-3xl bg-cream/15 text-cream ring-1 ring-cream/25">
            <Icon className="h-9 w-9" strokeWidth={1.5} aria-hidden />
          </span>
        </div>

        <div key={`t${i}`} className="animate-fade-up px-7 pb-2 pt-7">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-ink-muted">{i + 1} de {slides.length}</p>
          <h2 id="tour-title" className="mt-2 font-display text-3xl leading-tight">{S.title}</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{S.text}</p>
        </div>

        <div className="flex items-center justify-between gap-3 px-7 pb-7 pt-5">
          <div className="flex gap-1.5" aria-hidden>
            {slides.map((_, k) => (
              <button key={k} type="button" tabIndex={-1} onClick={() => setI(k)}
                className={`h-1.5 rounded-full transition-all ${k === i ? "w-6 bg-wine-900" : "w-1.5 bg-ink/20"}`} />
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setI((x) => x - 1)} disabled={i === 0} aria-label="Anterior"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 text-ink transition hover:bg-ink/5 disabled:opacity-30">
              <ArrowLeft className="h-4 w-4" />
            </button>
            {last ? (
              <button type="button" onClick={() => close(true)} className="btn-primary">
                Escolher o estilo do site <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button type="button" onClick={() => setI((x) => x + 1)} aria-label="Próximo"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-wine-900 text-cream transition hover:bg-wine-800">
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
