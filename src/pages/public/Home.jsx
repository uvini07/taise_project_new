import { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { ArrowRight, ChevronDown, MapPin, Quote } from "lucide-react";
import BlurText from "../../components/common/BlurText.jsx";
import Reveal from "../../components/common/Reveal.jsx";
import SectionHeading, { Divider, Sparkle } from "../../components/common/SectionHeading.jsx";
import SmartImage from "../../components/common/SmartImage.jsx";
import WhatsAppLink from "../../components/common/WhatsAppLink.jsx";
import { WhatsAppIcon } from "../../components/common/Icons.jsx";
import { Skeleton } from "../../components/common/PageLoader.jsx";
import PackageCard from "../../components/packages/PackageCard.jsx";
import MasonryGrid from "../../components/gallery/MasonryGrid.jsx";
import Lightbox from "../../components/gallery/Lightbox.jsx";
import Countdown from "../../components/vip/Countdown.jsx";
import { useSettings } from "../../contexts/SettingsContext.jsx";
import { useCategories, useFeaturedPhotos, usePublicPackages } from "../../hooks/usePublicData.js";
import { useDocumentMeta } from "../../hooks/useDocumentMeta.js";
import { FALLBACK_IMAGES } from "../../config/defaults.js";
import { paragraphs } from "../../utils/text.js";
import { waMessages } from "../../utils/whatsapp.js";
import { track } from "../../services/analyticsService.js";

function Hero() {
  const { settings } = useSettings();
  const { hero } = settings;
  const images = hero.images?.length ? hero.images : FALLBACK_IMAGES.hero;
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (images.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const id = setInterval(() => setActive((i) => (i + 1) % images.length), 7000);
    return () => clearInterval(id);
  }, [images.length]);

  return (
    <section className="relative flex min-h-[calc(100svh-var(--top-offset,0px))] items-end overflow-hidden bg-wine-950 text-cream" aria-label="Apresentação">
      {images.map((img, i) => (
        <div key={img.url} className={`absolute inset-0 transition-opacity duration-[1600ms] ${i === active ? "opacity-100" : "opacity-0"}`} aria-hidden={i !== active}>
          <img
            src={img.url}
            srcSet={img.thumbUrl ? `${img.thumbUrl} 800w, ${img.url} 1600w` : undefined}
            sizes="100vw"
            alt={i === 0 ? img.alt || "" : ""}
            className={`h-full w-full object-cover ${i === active ? "animate-slow-zoom" : ""}`}
            style={{ objectPosition: img.focus || "center 35%" }}
            loading={i === 0 ? "eager" : "lazy"}
            fetchpriority={i === 0 ? "high" : undefined}
            decoding="async"
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-[#1d0306]/90 via-[#1d0306]/35 to-[#1d0306]/30" aria-hidden />

      <div className="container-x relative z-10 pb-16 pt-32 sm:pb-20">
        <div className="max-w-3xl">
          {hero.eyebrow && (
            <p className="eyebrow flex animate-fade-up items-center gap-2 !text-gold-light">
              <Sparkle className="h-2.5 w-2.5" /> {hero.eyebrow}
            </p>
          )}
          <BlurText text={hero.title} className="display-xl mt-5 text-balance !text-cream" delay={150} />
          {hero.subtitle && (
            <p className="mt-6 max-w-xl animate-fade-up text-base leading-relaxed text-cream/80 [animation-delay:600ms] sm:text-lg">
              {hero.subtitle}
            </p>
          )}
          <div className="mt-9 flex animate-fade-up flex-wrap items-center gap-3 [animation-delay:800ms]">
            <Link to="/pacotes" className="btn-gold px-7 py-3.5" onClick={() => track.cta("hero-pacotes")}>
              {hero.primaryLabel || "Conhecer os pacotes"} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/galeria" className="btn-light px-7 py-3.5" onClick={() => track.cta("hero-galeria")}>
              {hero.secondaryLabel || "Ver a galeria"}
            </Link>
            <WhatsAppLink message={waMessages.quote(settings.brandName)} context="hero"
              className="inline-flex items-center gap-2 px-3 py-3 text-sm text-cream/85 underline-offset-4 hover:text-white hover:underline">
              <WhatsAppIcon className="h-4 w-4" /> Pedir orçamento
            </WhatsAppLink>
          </div>
        </div>
      </div>

      {images.length > 1 && (
        <div className="absolute bottom-8 right-6 z-10 hidden gap-2 sm:flex" role="tablist" aria-label="Fotos de destaque">
          {images.map((img, i) => (
            <button key={img.url} role="tab" aria-selected={i === active} aria-label={`Foto ${i + 1}`} onClick={() => setActive(i)}
              className={`h-[3px] rounded-full transition-all duration-500 ${i === active ? "w-10 bg-cream" : "w-5 bg-cream/40 hover:bg-cream/70"}`} />
          ))}
        </div>
      )}
      <a href="#sobre" className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 p-2 text-cream/60 transition hover:text-cream" aria-label="Rolar para a próxima seção">
        <ChevronDown className="h-5 w-5 animate-bounce" />
      </a>
    </section>
  );
}

function AboutTeaser() {
  const { settings } = useSettings();
  const { about } = settings;
  const photo = about.photoUrl ? { url: about.photoUrl, thumbUrl: about.photoThumbUrl, alt: about.photoAlt || "" } : FALLBACK_IMAGES.about;
  const [first, ...rest] = paragraphs(about.text);
  return (
    <section id="sobre" className="container-x scroll-mt-24 py-24 sm:py-32">
      <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-20">
        <Reveal className="relative mx-auto w-full max-w-md lg:col-span-5">
          <SmartImage src={photo.url} thumb={photo.thumbUrl} alt={photo.alt} sizes="(min-width:1024px) 40vw, 90vw" className="arch-soft aspect-[4/5] shadow-lift" />
          <div className="arch-soft pointer-events-none absolute -inset-3 -z-10 border border-gold/40" aria-hidden />
          <Sparkle className="absolute -right-3 top-10 h-5 w-5 text-gold" />
        </Reveal>
        <div className="lg:col-span-7">
          <SectionHeading eyebrow="Sobre" title={about.title} />
          <Reveal delay={120} className="mt-6 space-y-4 text-base leading-relaxed text-ink-soft sm:text-lg">
            {first && <p className="text-pretty">{first}</p>}
            {rest.slice(0, 1).map((p) => <p key={p} className="text-pretty">{p}</p>)}
          </Reveal>
          <Reveal delay={200} className="mt-8 flex flex-wrap items-center gap-6">
            {about.signature && <span className="font-display text-3xl italic text-wine-900">{about.signature}</span>}
            <Link to="/sobre" className="link-underline inline-flex items-center gap-2 text-sm font-medium uppercase tracking-[0.18em] text-ink">
              Conhecer minha história <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Categories() {
  const { data: cats, loading } = useCategories();
  const list = (cats || []).filter((c) => c.coverUrl).slice(0, 8);
  if (!loading && !list.length) return null;
  return (
    <section className="bg-paper py-24 sm:py-28">
      <div className="container-x">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading eyebrow="Ensaios" title="Para cada momento, um olhar" />
          <Reveal><Link to="/galeria" className="link-underline text-sm font-medium uppercase tracking-[0.18em]">Ver toda a galeria</Link></Reveal>
        </div>
        <div className="scrollbar-none -mx-5 mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
          {loading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] w-[70vw] shrink-0 sm:w-auto" />)}
          {list.map((c, i) => (
            <Reveal key={c.id} delay={i * 60} className="w-[70vw] shrink-0 snap-start sm:w-auto">
              <Link to={`/galeria/${c.slug}`} className="group relative block overflow-hidden rounded-[24px]" onClick={() => track.galleryCategory(c.id)}>
                <SmartImage src={c.coverUrl} thumb={c.coverThumbUrl} placeholder={c.coverPlaceholder} alt="" sizes="(min-width:1024px) 25vw, 70vw"
                  className="aspect-[3/4]" imgClassName="transition-transform duration-[1.2s] ease-soft group-hover:scale-[1.05]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent" aria-hidden />
                <div className="absolute inset-x-0 bottom-0 p-5 text-cream">
                  <h3 className="font-display text-2xl !text-cream">{c.name}</h3>
                  <span className="mt-1 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-cream/75 transition group-hover:gap-2.5">
                    Ver fotos <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedPackages() {
  const { data: pkgs, loading } = usePublicPackages();
  const { data: cats } = useCategories();
  const catName = useMemo(() => Object.fromEntries((cats || []).map((c) => [c.id, c.name])), [cats]);
  const list = (pkgs || []).slice(0, 3);
  if (!loading && !list.length) return null;
  return (
    <section className="container-x py-24 sm:py-32">
      <SectionHeading eyebrow="Pacotes" title="Escolha a experiência ideal" align="center"
        text="Valores, o que está incluso e as condições de cada ensaio, sem letras miúdas." />
      <div className={`mx-auto mt-14 grid gap-6 md:grid-cols-2 ${list.length === 1 ? "max-w-md md:grid-cols-1" : list.length === 2 ? "max-w-4xl" : "lg:grid-cols-3"}`}>
        {loading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[520px] rounded-[28px]" />)}
        {list.map((p, i) => (
          <Reveal key={p.id} delay={i * 80}><PackageCard pkg={p} categoryName={catName[p.categoryId]} featured={p.featured} /></Reveal>
        ))}
      </div>
      {(pkgs || []).length > 3 && (
        <Reveal className="mt-12 text-center"><Link to="/pacotes" className="btn-outline">Ver todos os pacotes</Link></Reveal>
      )}
    </section>
  );
}

function FeaturedGallery() {
  const { settings } = useSettings();
  const { data: photos } = useFeaturedPhotos(12);
  const [open, setOpen] = useState(null);
  if (!settings.display.showFeaturedGallery || !photos?.length) return null;
  return (
    <section className="bg-paper py-24 sm:py-28">
      <div className="container-x">
        <SectionHeading eyebrow="Galeria" title="Histórias que já contamos" align="center" />
        <Reveal className="mt-12"><MasonryGrid photos={photos} onOpen={setOpen} columns="columns-2 md:columns-3" /></Reveal>
        <Reveal className="mt-10 text-center"><Link to="/galeria" className="btn-outline">Abrir a galeria completa</Link></Reveal>
      </div>
      <Lightbox photos={photos} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
    </section>
  );
}

function VipCallout({ featured }) {
  if (!featured) return null;
  const { c, p } = featured;
  return (
    <section className="container-x py-12">
      <Reveal className="relative overflow-hidden rounded-[32px] bg-wine-900 text-cream grain">
        <div className="grid items-center gap-10 p-8 sm:p-12 lg:grid-cols-2 lg:p-16">
          <div>
            <p className="eyebrow flex items-center gap-2 !text-gold-light"><Sparkle className="h-2.5 w-2.5" /> Lista VIP</p>
            <h2 className="display-lg mt-4 !text-cream">{c.name}</h2>
            {c.description && <p className="mt-4 max-w-lg leading-relaxed text-cream/75">{c.description}</p>}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={`/vip/${c.slug}`} className="btn-gold" onClick={() => track.cta("home-vip")}>
                {p.vipAccess ? "Acessar como VIP" : p.phase === "open" ? "Entrar na lista VIP" : "Saiba mais"}
              </Link>
            </div>
          </div>
          {p.countdownEnd && (
            <div className="lg:justify-self-end">
              <p className="mb-4 text-xs uppercase tracking-[0.2em] text-cream/60">{p.vipAccess ? "Acesso VIP termina em" : "Campanha termina em"}</p>
              <Countdown target={p.countdownEnd} tone="light" />
            </div>
          )}
        </div>
      </Reveal>
    </section>
  );
}

function Testimonials() {
  const { settings } = useSettings();
  const items = settings.testimonials.filter((t) => t.text && t.name);
  if (!settings.display.showTestimonials || !items.length) return null;
  return (
    <section className="container-x py-24 sm:py-28">
      <SectionHeading eyebrow="Depoimentos" title="Quem já viveu a experiência" align="center" />
      <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.slice(0, 6).map((t, i) => (
          <Reveal key={i} delay={i * 70} as="figure" className="card card-pad flex h-full flex-col">
            <Quote className="h-6 w-6 text-gold" strokeWidth={1.4} aria-hidden />
            <blockquote className="mt-4 flex-1 font-display text-xl italic leading-relaxed text-ink">“{t.text}”</blockquote>
            <figcaption className="mt-6 text-sm">
              <span className="font-medium text-ink">{t.name}</span>
              {t.context && <span className="text-ink-muted"> · {t.context}</span>}
            </figcaption>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function ContactStrip() {
  const { settings } = useSettings();
  const { contact } = settings;
  return (
    <section className="container-x pt-12">
      <Reveal className="grid gap-10 rounded-[32px] border border-ink/[.06] bg-white p-8 shadow-soft sm:p-12 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="eyebrow">Vamos conversar</p>
          <h2 className="display-md mt-3 text-balance">Conte o que você imagina para o seu ensaio</h2>
          <p className="mt-4 text-ink-muted">Respondemos pelo WhatsApp com valores, datas disponíveis e todos os detalhes.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <WhatsAppLink message={waMessages.quote(settings.brandName)} context="home-contato" className="btn-primary">
              <WhatsAppIcon className="h-4 w-4" /> Chamar no WhatsApp
            </WhatsAppLink>
            <Link to="/contato" className="btn-outline">Outras formas de contato</Link>
          </div>
        </div>
        {contact.address && (
          <div className="rounded-[24px] bg-paper p-7">
            <MapPin className="h-5 w-5 text-gold" aria-hidden />
            <p className="mt-3 font-display text-2xl leading-snug">{contact.address}</p>
            {contact.addressLine2 && <p className="text-ink-muted">{contact.addressLine2}</p>}
            {contact.city && <p className="text-ink-muted">{contact.city}</p>}
            {contact.studioNote && <p className="mt-3 text-sm text-ink-muted">{contact.studioNote}</p>}
            {contact.mapUrl && (
              <a href={contact.mapUrl} target="_blank" rel="noopener noreferrer" className="link-underline mt-5 inline-flex items-center gap-2 text-sm font-medium">
                Abrir no mapa <ArrowRight className="h-4 w-4" />
              </a>
            )}
          </div>
        )}
      </Reveal>
    </section>
  );
}

export default function Home() {
  useDocumentMeta({});
  const { featuredCampaign } = useOutletContext() || {};
  return (
    <>
      <Hero />
      <AboutTeaser />
      <Categories />
      <FeaturedPackages />
      <VipCallout featured={featuredCampaign} />
      <FeaturedGallery />
      <Testimonials />
      <div className="container-x"><Divider className="my-4" /></div>
      <ContactStrip />
    </>
  );
}
