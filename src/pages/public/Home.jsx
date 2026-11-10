import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useOutletContext } from "react-router-dom";
import { ArrowRight, ChevronDown, MapPin, Quote } from "lucide-react";
import BlurText from "../../components/common/BlurText.jsx";
import Reveal from "../../components/common/Reveal.jsx";
import SectionHeading, { Divider, Sparkle } from "../../components/common/SectionHeading.jsx";
import SmartImage from "../../components/common/SmartImage.jsx";
import WhatsAppLink from "../../components/common/WhatsAppLink.jsx";
import { WhatsAppIcon } from "../../components/common/Icons.jsx";
import { Skeleton } from "../../components/common/PageLoader.jsx";
import PackageCard from "../../components/packages/PackageCard.jsx";
import PromoEvent from "../../components/packages/PromoEvent.jsx";
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
import { sitePath } from "../../config/tenant.js";
import { effectiveLayout, layoutById } from "../../config/siteStyle.js";

// ---------------------------------------------------------------------------
// Topo da página inicial: 5 modelos (aba Estilo do painel). Todos usam os
// mesmos textos e fotos de Configurações; muda só a estrutura.

function useHeroData() {
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
function Slides({ images, active, sizes = "100vw", zoom = true }) {
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

function Dots({ images, active, setActive, light = true, className = "" }) {
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
function HeroText({ settings, hero, tone = "light", align = "left" }) {
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

const ScrollCue = ({ light = true }) => (
  <a href="#sobre" className={`absolute bottom-6 left-1/2 z-10 -translate-x-1/2 p-2 transition ${light ? "text-cream/60 hover:text-cream" : "text-ink-muted hover:text-ink"}`} aria-label="Rolar para a próxima seção">
    <ChevronDown className="h-5 w-5 animate-bounce" />
  </a>
);

/** 1. Clássico: foto em tela cheia com o texto por cima. */
function HeroClassico() {
  const d = useHeroData();
  return (
    <section className="relative flex min-h-[calc(100svh-var(--top-offset,0px))] items-end overflow-hidden bg-wine-950 text-cream" aria-label="Apresentação">
      <Slides images={d.images} active={d.active} />
      <div className="absolute inset-0 bg-gradient-to-t from-wine-950/90 via-wine-950/35 to-wine-950/30" aria-hidden />
      <div className="container-x relative z-10 pb-16 pt-32 sm:pb-20"><HeroText {...d} /></div>
      <Dots {...d} className="absolute bottom-8 right-6 z-10 hidden sm:flex" />
      <ScrollCue />
    </section>
  );
}

/** 2. Diagonal: texto sobre a cor principal, foto cortada em diagonal. */
function HeroDiagonal() {
  const d = useHeroData();
  return (
    <section className="relative overflow-hidden bg-wine-950 text-cream lg:min-h-[calc(100svh-var(--top-offset,0px))]" aria-label="Apresentação">
      {/* Celular: foto em cima, cortada em diagonal embaixo. Computador: metade direita, cortada à esquerda. */}
      <div className="relative h-[58svh] [clip-path:polygon(0_0,100%_0,100%_82%,0_100%)] lg:absolute lg:inset-y-0 lg:right-0 lg:h-auto lg:w-[58%] lg:[clip-path:polygon(22%_0,100%_0,100%_100%,0_100%)]">
        <Slides images={d.images} active={d.active} sizes="(min-width: 1024px) 58vw, 100vw" />
        <div className="absolute inset-0 bg-wine-950/15" aria-hidden />
      </div>
      <span className="pointer-events-none absolute -left-24 top-1/3 hidden h-72 w-72 rounded-full border border-cream/10 lg:block" aria-hidden />
      <div className="container-x relative z-10 flex items-center pb-16 pt-10 lg:min-h-[calc(100svh-var(--top-offset,0px))] lg:py-32">
        <div className="lg:w-[46%]"><HeroText {...d} /></div>
      </div>
      <Dots {...d} className="absolute bottom-8 right-8 z-10 hidden lg:flex" />
    </section>
  );
}

/** 3. Dividido: foto de um lado, texto do outro, fundo claro. */
function HeroDividido() {
  const d = useHeroData();
  return (
    <section className="grid bg-ivory lg:min-h-[calc(100svh-var(--top-offset,0px))] lg:grid-cols-2" aria-label="Apresentação">
      <div className="relative min-h-[52svh] overflow-hidden lg:min-h-0">
        <Slides images={d.images} active={d.active} sizes="(min-width: 1024px) 50vw, 100vw" />
        <Dots {...d} className="absolute bottom-6 left-6 z-10" />
      </div>
      <div className="flex items-center px-5 py-16 sm:px-10 lg:px-16 xl:px-24">
        <HeroText {...d} tone="dark" />
      </div>
    </section>
  );
}

/** 4. Arco: título centralizado e a foto numa moldura em arco. */
function HeroArco() {
  const d = useHeroData();
  return (
    <section className="relative overflow-hidden bg-paper pb-16 pt-14 sm:pt-20" aria-label="Apresentação">
      <span className="pointer-events-none absolute left-1/2 top-24 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-wine-900/[0.04]" aria-hidden />
      <div className="container-x relative">
        <HeroText {...d} tone="dark" align="center" />
        <div className="relative mx-auto mt-14 aspect-[4/5] max-w-md overflow-hidden rounded-t-full shadow-lift sm:aspect-[16/11] sm:max-w-4xl sm:rounded-t-[999px]">
          <Slides images={d.images} active={d.active} sizes="(min-width: 640px) 900px, 100vw" />
        </div>
        <Dots {...d} light={false} className="mt-6 justify-center" />
      </div>
    </section>
  );
}

/** 5. Mosaico: texto ao lado de uma composição com três fotos. */
function HeroMosaico() {
  const d = useHeroData();
  const pick = (k) => d.images[k % d.images.length];
  const tile = (img, cls, sizes) => (
    <div className={`relative overflow-hidden rounded-[28px] shadow-soft ${cls}`}>
      <img src={img.thumbUrl || img.url} srcSet={img.thumbUrl ? `${img.thumbUrl} 800w, ${img.url} 1600w` : undefined} sizes={sizes}
        alt="" className="h-full w-full object-cover" style={{ objectPosition: img.focus || "center 35%" }} loading="eager" decoding="async" />
    </div>
  );
  return (
    <section className="bg-ivory py-14 sm:py-20 lg:flex lg:min-h-[calc(100svh-var(--top-offset,0px))] lg:items-center" aria-label="Apresentação">
      <div className="container-x grid items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
        <HeroText {...d} tone="dark" />
        <div className="grid h-[460px] grid-cols-2 grid-rows-2 gap-3 sm:h-[560px] sm:gap-4">
          {tile(pick(0), "row-span-2 animate-fade-up", "(min-width: 1024px) 26vw, 50vw")}
          {tile(pick(1), "animate-fade-up [animation-delay:150ms]", "(min-width: 1024px) 26vw, 50vw")}
          {tile(pick(2), "animate-fade-up [animation-delay:300ms]", "(min-width: 1024px) 26vw, 50vw")}
        </div>
      </div>
    </section>
  );
}

const HEROES = { classico: HeroClassico, diagonal: HeroDiagonal, dividido: HeroDividido, arco: HeroArco, mosaico: HeroMosaico };

function Hero() {
  const { settings } = useSettings();
  const { search } = useLocation();
  const Comp = HEROES[effectiveLayout(settings.layout, search)] || HeroClassico;
  return <Comp />;
}

/** Faixa que aparece quando a fotógrafa abre a prévia de um modelo pela aba Estilo. */
function PreviewBadge() {
  const { search } = useLocation();
  const q = new URLSearchParams(search).get("modelo");
  if (!q) return null;
  const l = layoutById(q);
  return (
    <div className="fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-3 rounded-full bg-ink/90 py-2 pl-5 pr-2 text-sm text-white shadow-lift backdrop-blur">
      Prévia do modelo <b className="font-medium">{l.name}</b>
      <button type="button" onClick={() => window.close()} className="rounded-full bg-white/15 px-3 py-1.5 text-xs hover:bg-white/25">Fechar prévia</button>
    </div>
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
            <Link to={sitePath("/sobre")} className="link-underline inline-flex items-center gap-2 text-sm font-medium uppercase tracking-[0.18em] text-ink">
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
          <Reveal><Link to={sitePath("/galeria")} className="link-underline text-sm font-medium uppercase tracking-[0.18em]">Ver toda a galeria</Link></Reveal>
        </div>
        <div className="scrollbar-none -mx-5 mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
          {loading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] w-[70vw] shrink-0 sm:w-auto" />)}
          {list.map((c, i) => (
            <Reveal key={c.id} delay={i * 60} className="w-[70vw] shrink-0 snap-start sm:w-auto">
              <Link to={sitePath(`/galeria/${c.slug}`)} className="group relative block overflow-hidden rounded-[24px]" onClick={() => track.galleryCategory(c.id)}>
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
        <Reveal className="mt-12 text-center"><Link to={sitePath("/pacotes")} className="btn-outline">Ver todos os pacotes</Link></Reveal>
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
        <Reveal className="mt-10 text-center"><Link to={sitePath("/galeria")} className="btn-outline">Abrir a galeria completa</Link></Reveal>
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
              <Link to={sitePath(`/vip/${c.slug}`)} className="btn-gold" onClick={() => track.cta("home-vip")}>
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
      <Reveal className="grid gap-10 rounded-[32px] border border-ink/[.06] bg-surface p-8 shadow-soft sm:p-12 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="eyebrow">Vamos conversar</p>
          <h2 className="display-md mt-3 text-balance">Conte o que você imagina para o seu ensaio</h2>
          <p className="mt-4 text-ink-muted">Respondemos pelo WhatsApp com valores, datas disponíveis e todos os detalhes.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <WhatsAppLink message={waMessages.quote(settings.brandName)} context="home-contato" className="btn-primary">
              <WhatsAppIcon className="h-4 w-4" /> Chamar no WhatsApp
            </WhatsAppLink>
            <Link to={sitePath("/contato")} className="btn-outline">Outras formas de contato</Link>
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
      <PreviewBadge />
      <Hero />
      <PromoEvent />
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
