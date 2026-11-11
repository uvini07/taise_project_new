// Peças do topo da página inicial, usadas por todos os modelos (aba Estilo).
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown } from "lucide-react";
import BlurText from "../common/BlurText.jsx";
import { Sparkle } from "../common/SectionHeading.jsx";
import WhatsAppLink from "../common/WhatsAppLink.jsx";
import { WhatsAppIcon } from "../common/Icons.jsx";
import { useSettings } from "../../contexts/SettingsContext.jsx";
import { FALLBACK_IMAGES } from "../../config/defaults.js";
import { waMessages } from "../../utils/whatsapp.js";
import { track } from "../../services/analyticsService.js";
import { sitePath } from "../../config/tenant.js";

export function useHeroData() {
  const { settings } = useSettings();
  const { hero } = settings;
  const images = hero.images?.length ? hero.images : FALLBACK_IMAGES.hero;
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (images.length < 2) return undefined;
    const id = setInterval(() => setActive((i) => (i + 1) % images.length), 7000);
    return () => clearInterval(id);
  }, [images.length]);
  return { settings, hero, images, active, setActive };
}

/** Fotos em troca suave (crossfade) dentro de uma moldura qualquer. */
export function Slides({ images, active, sizes = "100vw", zoom = true }) {
  return images.map((img, i) => (
    <div key={img.url} className={`absolute inset-0 transition-opacity duration-[1600ms] ${i === active ? "opacity-100" : "opacity-0"}`} aria-hidden={i !== active}>
      <img
        src={img.url}
        srcSet={img.thumbUrl ? `${img.thumbUrl} 800w, ${img.url} 1600w` : undefined}
        sizes={sizes}
        alt={i === 0 ? img.alt || "" : ""}
        className={`h-full w-full object-cover ${zoom && i === active ? "animate-slow-zoom" : ""}`}
        style={{ objectPosition: img.focus || "center 35%" }}
        loading={i === 0 ? "eager" : "lazy"}
        fetchpriority={i === 0 ? "high" : undefined}
        decoding="async"
      />
    </div>
  ));
}

export function Dots({ images, active, setActive, light = true, className = "" }) {
  if (images.length < 2) return null;
  return (
    <div className={`flex gap-2 ${className}`} role="tablist" aria-label="Fotos de destaque">
      {images.map((img, i) => (
        <button key={img.url} role="tab" aria-selected={i === active} aria-label={`Foto ${i + 1}`} onClick={() => setActive(i)}
          className={`h-[3px] rounded-full transition-all duration-500 ${i === active
            ? `w-10 ${light ? "bg-cream" : "bg-wine-900"}`
            : `w-5 ${light ? "bg-cream/40 hover:bg-cream/70" : "bg-ink/20 hover:bg-ink/40"}`}`} />
      ))}
    </div>
  );
}

/** Selo, título, subtítulo e botões. tone="light" sobre foto/cor escura. */
export function HeroText({ settings, hero, tone = "light", align = "left" }) {
  const light = tone === "light";
  const center = align === "center";
  return (
    <div className={center ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      {hero.eyebrow && (
        <p className={`eyebrow flex animate-fade-up items-center gap-2 ${center ? "justify-center" : ""} ${light ? "!text-gold-light" : ""}`}>
          <Sparkle className="h-2.5 w-2.5" /> {hero.eyebrow}
        </p>
      )}
      <BlurText text={hero.title} className={`display-xl mt-5 text-balance ${light ? "!text-cream" : "!text-ink"}`} delay={150} />
      {hero.subtitle && (
        <p className={`mt-6 max-w-xl animate-fade-up text-base leading-relaxed [animation-delay:600ms] sm:text-lg ${center ? "mx-auto" : ""} ${light ? "text-cream/80" : "text-ink-soft"}`}>
          {hero.subtitle}
        </p>
      )}
      <div className={`mt-9 flex animate-fade-up flex-wrap items-center gap-3 [animation-delay:800ms] ${center ? "justify-center" : ""}`}>
        <Link to={sitePath("/pacotes")} className={`${light ? "btn-gold" : "btn-primary"} px-7 py-3.5`} onClick={() => track.cta("hero-pacotes")}>
          {hero.primaryLabel || "Conhecer os pacotes"} <ArrowRight className="h-4 w-4" />
        </Link>
        <Link to={sitePath("/galeria")} className={`${light ? "btn-light" : "btn-outline"} px-7 py-3.5`} onClick={() => track.cta("hero-galeria")}>
          {hero.secondaryLabel || "Ver a galeria"}
        </Link>
        <WhatsAppLink message={waMessages.quote(settings.brandName)} context="hero"
          className={`inline-flex items-center gap-2 px-3 py-3 text-sm underline-offset-4 hover:underline ${light ? "text-cream/85 hover:text-white" : "text-ink-soft hover:text-wine-900"}`}>
          <WhatsAppIcon className="h-4 w-4" /> Pedir orçamento
        </WhatsAppLink>
      </div>
    </div>
  );
}

export const ScrollCue = ({ light = true }) => (
  <a href="#sobre" className={`absolute bottom-6 left-1/2 z-10 -translate-x-1/2 p-2 transition ${light ? "text-cream/60 hover:text-cream" : "text-ink-muted hover:text-ink"}`} aria-label="Rolar para a próxima seção">
    <ChevronDown className="h-5 w-5 animate-bounce" />
  </a>
);
