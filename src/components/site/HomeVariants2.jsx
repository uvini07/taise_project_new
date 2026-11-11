// Modelos Cinema, Revista, Polaroid, Minimalista e Imersivo: topo da página
// inicial e seções. Usam os mesmos dados de sempre; muda só o desenho.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Instagram, MapPin } from "lucide-react";
import Reveal from "../common/Reveal.jsx";
import SmartImage from "../common/SmartImage.jsx";
import WhatsAppLink from "../common/WhatsAppLink.jsx";
import { WhatsAppIcon } from "../common/Icons.jsx";
import { Skeleton } from "../common/PageLoader.jsx";
import Lightbox from "../gallery/Lightbox.jsx";
import { useSettings } from "../../contexts/SettingsContext.jsx";
import { useFeaturedPhotos } from "../../hooks/usePublicData.js";
import { waMessages } from "../../utils/whatsapp.js";
import { track } from "../../services/analyticsService.js";
import { sitePath } from "../../config/tenant.js";
import { Dots, HeroText, ScrollCue, Slides, useHeroData } from "./heroParts.jsx";
import { MoreLink, catLink, useAbout, useVisibleCats } from "./HomeVariants.jsx";

const useTestimonials = () => {
  const { settings } = useSettings();
  const items = settings.testimonials.filter((t) => t.text && t.name);
  return settings.display.showTestimonials ? items : [];
};
const useGallery = (n) => {
  const { settings } = useSettings();
  const { data } = useFeaturedPhotos(n);
  return settings.display.showFeaturedGallery ? data || [] : [];
};
const Eyebrow = ({ children, className = "" }) => <p className={`eyebrow ${className}`}>{children}</p>;

// ==================================================================== CINEMA
// Site escuro, fotos em formato de cinema (faixas pretas), detalhes dourados.

export function HeroCinema() {
  const d = useHeroData();
  return (
    <section className="relative flex min-h-[calc(100svh-var(--top-offset,0px))] flex-col bg-black text-cream" aria-label="Apresentação">
      <div className="h-[9svh] shrink-0 bg-black" aria-hidden />
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        <Slides images={d.images} active={d.active} />
        <div className="absolute inset-0 bg-black/45" aria-hidden />
        <div className="container-x relative z-10 py-16 text-center">
          <HeroText {...d} align="center" />
        </div>
        <Dots {...d} className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2" />
      </div>
      <div className="flex h-[9svh] shrink-0 items-center justify-between bg-black px-6 text-[10px] uppercase tracking-[0.3em] text-cream/40 sm:px-10" aria-hidden>
        <span>{d.settings.brandName}</span><span>{String(d.active + 1).padStart(2, "0")} / {String(d.images.length).padStart(2, "0")}</span>
      </div>
    </section>
  );
}

export function AboutCinema() {
  const { about, photo, first, second } = useAbout();
  return (
    <section id="sobre" className="container-x scroll-mt-24 py-24 sm:py-32">
      <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
        <Reveal className="group relative">
          <SmartImage src={photo.url} thumb={photo.thumbUrl} alt={photo.alt} sizes="(min-width:1024px) 50vw, 100vw"
            className="aspect-[21/10] r-img" imgClassName="grayscale transition duration-1000 group-hover:grayscale-0" />
          <span className="absolute -bottom-3 left-6 h-px w-24 bg-gold" aria-hidden />
        </Reveal>
        <div>
          <Eyebrow className="!text-gold">Sobre</Eyebrow>
          <h2 className="display-lg mt-3 text-balance">{about.title}</h2>
          <div className="mt-6 space-y-4 leading-relaxed text-ink-soft">{first && <p>{first}</p>}{second && <p>{second}</p>}</div>
          <div className="mt-8"><MoreLink to={sitePath("/sobre")}>Conhecer minha história</MoreLink></div>
        </div>
      </div>
    </section>
  );
}

/** Categorias como uma tira de filme, com os furinhos nas bordas. */
export function CategoriesFilm() {
  const { list, loading } = useVisibleCats(8);
  if (!loading && !list.length) return null;
  const holes = <span className="flex justify-between px-2 py-1.5" aria-hidden>{Array.from({ length: 18 }).map((_, i) => <i key={i} className="h-2 w-3 rounded-[2px] bg-ivory" />)}</span>;
  return (
    <section className="py-20 sm:py-24">
      <div className="container-x flex items-end justify-between gap-6">
        <div><Eyebrow className="!text-gold">Ensaios</Eyebrow><h2 className="display-lg mt-3">Em cartaz</h2></div>
        <MoreLink to={sitePath("/galeria")}>Ver toda a galeria</MoreLink>
      </div>
      <div className="scrollbar-none mt-12 overflow-x-auto bg-black">
        {holes}
        <div className="flex w-max gap-2 px-2">
          {loading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64 w-80" />)}
          {list.map((c) => (
            <Link key={c.id} to={catLink(c)} onClick={() => track.galleryCategory(c.id)} className="group relative block w-[78vw] max-w-md overflow-hidden">
              <SmartImage src={c.coverUrl} thumb={c.coverThumbUrl} placeholder={c.coverPlaceholder} alt="" sizes="440px" className="aspect-[3/2]"
                imgClassName="transition duration-700 group-hover:scale-105" />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 font-display text-2xl text-white">{c.name}</span>
            </Link>
          ))}
        </div>
        {holes}
      </div>
    </section>
  );
}

export function GalleryCinema() {
  const photos = useGallery(9);
  const [open, setOpen] = useState(null);
  if (!photos.length) return null;
  return (
    <section className="container-x py-20 sm:py-24">
      <Eyebrow className="!text-gold">Galeria</Eyebrow>
      <h2 className="display-lg mt-3">Cenas favoritas</h2>
      <div className="mt-10 grid grid-cols-2 gap-2 md:grid-cols-3">
        {photos.map((p, i) => (
          <button key={p.id} type="button" onClick={() => setOpen(i)} className={`group overflow-hidden ${i === 0 ? "col-span-2 row-span-2" : ""}`} aria-label="Ampliar foto">
            <SmartImage src={p.url} thumb={p.thumbUrl} placeholder={p.placeholder} alt={p.alt || ""} sizes="(min-width:768px) 33vw, 50vw"
              className="aspect-[16/10] h-full" imgClassName="opacity-90 transition duration-700 group-hover:scale-105 group-hover:opacity-100" />
          </button>
        ))}
      </div>
      <Lightbox photos={photos} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
    </section>
  );
}

export function TestimonialsCinema() {
  const items = useTestimonials();
  const [i, setI] = useState(0);
  if (!items.length) return null;
  const t = items[i % items.length];
  return (
    <section className="border-y border-gold/20 py-20 text-center sm:py-24">
      <div className="container-x">
        <Eyebrow className="!text-gold">Quem já viveu</Eyebrow>
        <blockquote key={i} className="mx-auto mt-6 max-w-3xl animate-fade-up font-display text-3xl leading-snug sm:text-4xl">“{t.text}”</blockquote>
        <p className="mt-6 text-sm uppercase tracking-[0.25em] text-ink-muted">{t.name}{t.context && ` · ${t.context}`}</p>
        {items.length > 1 && (
          <div className="mt-8 flex justify-center gap-3">
            <button type="button" onClick={() => setI((x) => (x - 1 + items.length) % items.length)} className="rounded-full border border-ink/20 p-2 hover:border-gold" aria-label="Anterior"><ChevronLeft className="h-4 w-4" /></button>
            <button type="button" onClick={() => setI((x) => (x + 1) % items.length)} className="rounded-full border border-ink/20 p-2 hover:border-gold" aria-label="Próximo"><ChevronRight className="h-4 w-4" /></button>
          </div>
        )}
      </div>
    </section>
  );
}

export function ContactCinema() {
  const { settings } = useSettings();
  return (
    <section className="container-x py-24 text-center sm:py-28">
      <h2 className="display-xl mx-auto max-w-4xl text-balance">Sua história merece uma tela grande.</h2>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <WhatsAppLink message={waMessages.quote(settings.brandName)} context="home-contato" className="btn-gold px-8 py-4"><WhatsAppIcon className="h-4 w-4" /> Reservar meu ensaio</WhatsAppLink>
        <Link to={sitePath("/pacotes")} className="btn-outline px-8 py-4">Ver pacotes</Link>
      </div>
    </section>
  );
}

// ==================================================================== REVISTA
// Capa de revista: nome enorme, colunas, capitulares, numeração e fios.

export function HeroRevista() {
  const d = useHeroData();
  const { settings, hero, images } = d;
  const second = images[1 % images.length];
  const { list: cats } = useVisibleCats(4);
  return (
    <section className="bg-ivory pb-12 pt-6 sm:pb-16" aria-label="Apresentação">
      <div className="container-x">
        <div className="flex items-center justify-between border-y-2 border-ink py-2 text-[11px] uppercase tracking-[0.24em] text-ink-soft">
          <span>{hero.eyebrow || "Fotografia"}</span><span className="hidden sm:inline">Edição de {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</span><span>Nº {String(new Date().getMonth() + 1).padStart(2, "0")}</span>
        </div>
        <p className="mt-4 truncate text-center font-display text-[17vw] font-medium leading-[0.85] tracking-tight text-wine-900 lg:text-[11rem]">{settings.brandName}</p>
        <div className="mt-8 grid gap-8 border-t border-ink/15 pt-8 lg:grid-cols-12">
          <div className="relative overflow-hidden lg:col-span-7"><div className="relative aspect-[4/3]"><Slides images={images} active={d.active} sizes="(min-width:1024px) 58vw, 100vw" zoom={false} /></div></div>
          <div className="flex flex-col lg:col-span-5">
            <HeroText {...d} tone="dark" />
            <div className="mt-8 hidden flex-1 items-end gap-4 border-t border-ink/15 pt-6 lg:flex">
              <img src={second.thumbUrl || second.url} alt="" className="h-28 w-24 object-cover" loading="lazy" />
              <p className="text-sm italic text-ink-soft">{cats.length ? `Nesta edição: ${cats.map((c) => c.name).join(" · ")}` : hero.subtitle}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function AboutRevista() {
  const { about, photo, first, second } = useAbout();
  // Destaque ("olho" da matéria): a primeira frase do próprio texto da fotógrafa.
  const pull = (first || "").split(/(?<=[.!?])\s/)[0];
  return (
    <section id="sobre" className="container-x scroll-mt-24 border-t-2 border-ink py-16 sm:py-20">
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="text-[11px] uppercase tracking-[0.24em] text-ink-muted">Perfil</p>
          <h2 className="display-lg mt-3 text-balance">{about.title}</h2>
          <SmartImage src={photo.url} thumb={photo.thumbUrl} alt={photo.alt} sizes="(min-width:1024px) 30vw, 100vw" className="mt-8 aspect-[3/4]" />
          {about.signature && <p className="mt-3 text-xs uppercase tracking-[0.2em] text-ink-muted">{about.signature}</p>}
        </div>
        <div className="lg:col-span-8 lg:border-l lg:border-ink/15 lg:pl-10">
          {first && <p className="text-lg leading-relaxed text-ink first-letter:float-left first-letter:mr-3 first-letter:font-display first-letter:text-7xl first-letter:leading-[0.8] first-letter:text-wine-900">{first}</p>}
          {second && <p className="mt-5 leading-relaxed text-ink-soft md:columns-2 md:gap-10">{second}</p>}
          {pull && (
            <blockquote className="my-10 border-y border-ink/15 py-6 font-display text-3xl italic leading-snug text-wine-900">“{pull}”</blockquote>
          )}
          <MoreLink to={sitePath("/sobre")}>Ler a matéria completa</MoreLink>
        </div>
      </div>
    </section>
  );
}

export function CategoriesRevista() {
  const { list, loading } = useVisibleCats(6);
  if (!loading && !list.length) return null;
  return (
    <section className="container-x border-t-2 border-ink py-16 sm:py-20">
      <div className="flex items-baseline justify-between gap-6">
        <h2 className="display-lg">Índice</h2>
        <MoreLink to={sitePath("/galeria")}>Ver todas</MoreLink>
      </div>
      <div className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {loading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="aspect-[4/5]" />)}
        {list.map((c, i) => (
          <Reveal key={c.id} delay={i * 60}>
            <Link to={catLink(c)} onClick={() => track.galleryCategory(c.id)} className="group block">
              <p className="mb-3 flex items-baseline justify-between border-b border-ink/15 pb-2 text-[11px] uppercase tracking-[0.24em] text-ink-muted">
                <span>Nº {String(i + 1).padStart(2, "0")}</span><ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
              </p>
              <SmartImage src={c.coverUrl} thumb={c.coverThumbUrl} placeholder={c.coverPlaceholder} alt="" sizes="(min-width:1024px) 33vw, 50vw"
                className="aspect-[4/5]" imgClassName="transition duration-700 group-hover:scale-[1.03]" />
              <h3 className="mt-4 font-display text-3xl transition group-hover:text-wine-900">{c.name}</h3>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function GalleryRevista() {
  const photos = useGallery(6);
  const [open, setOpen] = useState(null);
  if (!photos.length) return null;
  const span = ["lg:col-span-7 lg:row-span-2", "lg:col-span-5", "lg:col-span-5", "lg:col-span-4", "lg:col-span-4", "lg:col-span-4"];
  return (
    <section className="container-x border-t-2 border-ink py-16 sm:py-20">
      <h2 className="display-lg">Ensaio fotográfico</h2>
      <div className="mt-10 grid auto-rows-[220px] grid-cols-2 gap-4 lg:grid-cols-12">
        {photos.map((p, i) => (
          <button key={p.id} type="button" onClick={() => setOpen(i)} className={`group overflow-hidden ${span[i % span.length]}`} aria-label="Ampliar foto">
            <SmartImage src={p.url} thumb={p.thumbUrl} placeholder={p.placeholder} alt={p.alt || ""} sizes="50vw" className="h-full" imgClassName="transition duration-700 group-hover:scale-[1.03]" />
          </button>
        ))}
      </div>
      <Lightbox photos={photos} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
    </section>
  );
}

export function TestimonialsRevista() {
  const items = useTestimonials();
  if (!items.length) return null;
  return (
    <section className="container-x border-t-2 border-ink py-16 sm:py-20">
      <h2 className="display-lg">Cartas dos leitores</h2>
      <div className="mt-10 grid gap-10 md:grid-cols-3 md:divide-x md:divide-ink/15">
        {items.slice(0, 3).map((t, i) => (
          <figure key={i} className={i ? "md:pl-10" : ""}>
            <blockquote className="font-display text-2xl italic leading-snug">“{t.text}”</blockquote>
            <figcaption className="mt-4 text-[11px] uppercase tracking-[0.22em] text-ink-muted">— {t.name}{t.context && `, ${t.context}`}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export function ContactRevista() {
  const { settings } = useSettings();
  const { contact } = settings;
  return (
    <section className="container-x pt-6">
      <div className="border-4 border-double border-ink p-8 text-center sm:p-12">
        <p className="text-[11px] uppercase tracking-[0.3em] text-ink-muted">Anúncio</p>
        <h2 className="display-md mx-auto mt-3 max-w-2xl text-balance">Agenda aberta para novos ensaios</h2>
        {contact.address && <p className="mt-3 text-ink-soft">{contact.address}{contact.city ? ` — ${contact.city}` : ""}</p>}
        <WhatsAppLink message={waMessages.quote(settings.brandName)} context="home-contato" className="btn-primary mt-8"><WhatsAppIcon className="h-4 w-4" /> Falar pelo WhatsApp</WhatsAppLink>
      </div>
    </section>
  );
}

// =================================================================== POLAROID
// Álbum de recordações: fotos instantâneas tortinhas, fita adesiva, bilhetes.

const tilt = ["-rotate-3", "rotate-2", "-rotate-1", "rotate-3", "-rotate-2", "rotate-1"];
const Tape = ({ className = "" }) => <span className={`absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 rotate-[-4deg] bg-gold/35 backdrop-blur-sm ${className}`} aria-hidden />;
export function Polaroid({ src, thumb, caption, className = "", sizes = "300px", tape = true }) {
  return (
    <figure className={`relative bg-white p-3 pb-12 shadow-lift transition duration-500 hover:rotate-0 hover:scale-[1.02] ${className}`}>
      {tape && <Tape />}
      <SmartImage src={src} thumb={thumb} alt="" sizes={sizes} className="aspect-square" />
      {caption && <figcaption className="absolute inset-x-3 bottom-3 truncate text-center font-display text-xl italic text-ink-soft">{caption}</figcaption>}
    </figure>
  );
}

export function HeroPolaroid() {
  const d = useHeroData();
  const pick = (k) => d.images[k % d.images.length];
  return (
    <section className="relative overflow-hidden bg-paper py-16 sm:py-20 lg:flex lg:min-h-[calc(100svh-var(--top-offset,0px))] lg:items-center" aria-label="Apresentação">
      <span className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(rgb(var(--ink)/.08)_1px,transparent_1px)] [background-size:22px_22px]" aria-hidden />
      <div className="container-x relative grid items-center gap-16 lg:grid-cols-2">
        <HeroText {...d} tone="dark" />
        <div className="relative mx-auto h-[420px] w-full max-w-md sm:h-[480px]">
          <Polaroid src={pick(1).url} thumb={pick(1).thumbUrl} caption="" className="absolute left-0 top-6 w-[58%] -rotate-6" />
          <Polaroid src={pick(2).url} thumb={pick(2).thumbUrl} caption="" className="absolute right-0 top-0 w-[54%] rotate-6" />
          <Polaroid src={pick(0).url} thumb={pick(0).thumbUrl} caption={d.settings.brandName} className="absolute bottom-0 left-1/2 w-[62%] -translate-x-1/2 rotate-1" />
        </div>
      </div>
    </section>
  );
}

export function AboutPolaroid() {
  const { about, photo, first } = useAbout();
  return (
    <section id="sobre" className="container-x scroll-mt-24 py-24 sm:py-28">
      <div className="grid items-center gap-14 lg:grid-cols-[0.8fr_1.2fr]">
        <Polaroid src={photo.url} thumb={photo.thumbUrl} caption={about.signature || "Prazer!"} className="mx-auto w-72 -rotate-2" />
        <div className="relative rotate-[0.6deg] bg-surface p-8 shadow-soft sm:p-10">
          <Tape className="left-10 translate-x-0" />
          <Eyebrow>Sobre</Eyebrow>
          <h2 className="display-md mt-3 text-balance">{about.title}</h2>
          {first && <p className="mt-5 leading-relaxed text-ink-soft">{first}</p>}
          <div className="mt-7"><MoreLink to={sitePath("/sobre")}>Conhecer minha história</MoreLink></div>
        </div>
      </div>
    </section>
  );
}

export function CategoriesPolaroid() {
  const { list, loading } = useVisibleCats(6);
  if (!loading && !list.length) return null;
  return (
    <section className="bg-paper py-24 sm:py-28">
      <div className="container-x text-center">
        <Eyebrow>Ensaios</Eyebrow>
        <h2 className="display-lg mt-3">Nosso álbum de recordações</h2>
        <div className="mt-14 grid grid-cols-2 gap-8 sm:gap-10 lg:grid-cols-3">
          {loading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="aspect-[4/5]" />)}
          {list.map((c, i) => (
            <Link key={c.id} to={catLink(c)} onClick={() => track.galleryCategory(c.id)} className="block">
              <Polaroid src={c.coverUrl} thumb={c.coverThumbUrl} caption={c.name} className={tilt[i % tilt.length]} sizes="(min-width:1024px) 30vw, 45vw" tape={i % 2 === 0} />
            </Link>
          ))}
        </div>
        <Link to={sitePath("/galeria")} className="btn-outline mt-14">Folhear a galeria toda</Link>
      </div>
    </section>
  );
}

export function GalleryPolaroid() {
  const photos = useGallery(8);
  const [open, setOpen] = useState(null);
  if (!photos.length) return null;
  return (
    <section className="container-x py-24 sm:py-28">
      <div className="text-center"><Eyebrow>Galeria</Eyebrow><h2 className="display-lg mt-3">Momentos espalhados pela mesa</h2></div>
      <div className="mt-14 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((p, i) => (
          <button key={p.id} type="button" onClick={() => setOpen(i)} aria-label="Ampliar foto" className="block">
            <Polaroid src={p.thumbUrl || p.url} thumb={p.thumbUrl} className={`${tilt[(i + 2) % tilt.length]} !pb-6`} tape={false} sizes="25vw" />
          </button>
        ))}
      </div>
      <Lightbox photos={photos} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
    </section>
  );
}

export function TestimonialsNotes() {
  const items = useTestimonials();
  if (!items.length) return null;
  const colors = ["bg-[#FFF3B0]", "bg-[#FCE1E4]", "bg-[#DDF0E6]", "bg-[#E3E8FB]"];
  return (
    <section className="bg-paper py-24 sm:py-28">
      <div className="container-x">
        <div className="text-center"><Eyebrow>Depoimentos</Eyebrow><h2 className="display-lg mt-3">Bilhetinhos que recebemos</h2></div>
        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.slice(0, 6).map((t, i) => (
            <figure key={i} className={`relative ${colors[i % colors.length]} ${tilt[i % tilt.length]} p-7 text-[#3a332e] shadow-soft`}>
              <span className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-wine-900 shadow" aria-hidden />
              <blockquote className="font-display text-xl italic leading-relaxed">“{t.text}”</blockquote>
              <figcaption className="mt-4 text-sm font-medium">— {t.name}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ContactPostcard() {
  const { settings } = useSettings();
  const { contact } = settings;
  return (
    <section className="container-x pt-12">
      <Reveal className="relative mx-auto grid max-w-4xl -rotate-[0.6deg] gap-8 border border-ink/10 bg-surface p-8 shadow-lift sm:grid-cols-[1.3fr_1fr] sm:p-12">
        <div className="sm:border-r sm:border-dashed sm:border-ink/20 sm:pr-8">
          <Eyebrow>Cartão-postal</Eyebrow>
          <h2 className="display-md mt-3 text-balance">Vamos criar novas lembranças juntos?</h2>
          <WhatsAppLink message={waMessages.quote(settings.brandName)} context="home-contato" className="btn-primary mt-7"><WhatsAppIcon className="h-4 w-4" /> Mandar mensagem</WhatsAppLink>
        </div>
        <div className="relative">
          <span className="absolute right-0 top-0 grid h-20 w-16 place-items-center border-2 border-dashed border-wine-900/40 font-display text-xs uppercase text-wine-900/70" aria-hidden>Selo</span>
          <div className="mt-24 space-y-3 text-sm text-ink-soft">
            {[settings.brandName, contact.address, contact.city].filter(Boolean).map((l) => <p key={l} className="border-b border-ink/15 pb-2">{l}</p>)}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

// ================================================================ MINIMALISTA
// Muito respiro, tipografia pequena, uma foto grande por vez, nada de enfeite.

export function HeroMinimal() {
  const d = useHeroData();
  const { hero, images, active } = d;
  return (
    <section className="bg-ivory pt-20 sm:pt-28" aria-label="Apresentação">
      <div className="container-x max-w-3xl text-center">
        {hero.eyebrow && <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">{hero.eyebrow}</p>}
        <h1 className="mt-6 font-display text-4xl leading-tight text-balance sm:text-5xl">{hero.title}</h1>
        {hero.subtitle && <p className="mx-auto mt-5 max-w-lg text-ink-soft">{hero.subtitle}</p>}
        <div className="mt-8 flex justify-center gap-8 text-sm">
          <Link to={sitePath("/pacotes")} className="link-underline font-medium" onClick={() => track.cta("hero-pacotes")}>{hero.primaryLabel || "Conhecer os pacotes"}</Link>
          <Link to={sitePath("/galeria")} className="link-underline text-ink-soft" onClick={() => track.cta("hero-galeria")}>{hero.secondaryLabel || "Ver a galeria"}</Link>
        </div>
      </div>
      <div className="container-x mt-16 sm:mt-20">
        <div className="relative aspect-[4/5] overflow-hidden sm:aspect-[21/9]"><Slides images={images} active={active} zoom={false} /></div>
        <Dots {...d} light={false} className="mt-4 justify-end" />
      </div>
    </section>
  );
}

export function AboutMinimal() {
  const { about, photo, first } = useAbout();
  return (
    <section id="sobre" className="container-x scroll-mt-24 py-28 sm:py-40">
      <div className="mx-auto grid max-w-4xl gap-12 sm:grid-cols-[180px_1fr] sm:gap-16">
        <SmartImage src={photo.url} thumb={photo.thumbUrl} alt={photo.alt} sizes="180px" className="aspect-[3/4] w-40 sm:w-full" />
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">Sobre</p>
          <h2 className="mt-4 font-display text-3xl leading-tight">{about.title}</h2>
          {first && <p className="mt-5 leading-loose text-ink-soft">{first}</p>}
          <Link to={sitePath("/sobre")} className="link-underline mt-6 inline-block text-sm">Mais sobre mim</Link>
        </div>
      </div>
    </section>
  );
}

export function CategoriesMinimal() {
  const { list, loading } = useVisibleCats(6);
  if (!loading && !list.length) return null;
  return (
    <section className="container-x pb-28 sm:pb-40">
      <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">Ensaios</p>
      <div className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-3">
        {loading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="aspect-square" />)}
        {list.map((c) => (
          <Link key={c.id} to={catLink(c)} onClick={() => track.galleryCategory(c.id)} className="group block">
            <SmartImage src={c.coverUrl} thumb={c.coverThumbUrl} placeholder={c.coverPlaceholder} alt="" sizes="(min-width:640px) 33vw, 100vw" className="aspect-square"
              imgClassName="transition duration-700 group-hover:opacity-80" />
            <p className="mt-3 flex items-center justify-between text-sm"><span>{c.name}</span><ArrowUpRight className="h-4 w-4 opacity-0 transition group-hover:opacity-100" /></p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function GalleryMinimal() {
  const photos = useGallery(4);
  const [open, setOpen] = useState(null);
  if (!photos.length) return null;
  return (
    <section className="container-x pb-28 sm:pb-40">
      <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">Galeria</p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {photos.map((p, i) => (
          <button key={p.id} type="button" onClick={() => setOpen(i)} aria-label="Ampliar foto" className={i % 3 === 0 ? "sm:col-span-2" : ""}>
            <SmartImage src={p.url} thumb={p.thumbUrl} placeholder={p.placeholder} alt={p.alt || ""} sizes="(min-width:640px) 60vw, 100vw" className={i % 3 === 0 ? "aspect-[2/1]" : "aspect-[4/5]"} />
          </button>
        ))}
      </div>
      <Link to={sitePath("/galeria")} className="link-underline mt-8 inline-block text-sm">Ver todas as fotos</Link>
      <Lightbox photos={photos} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
    </section>
  );
}

export function TestimonialsMinimal() {
  const items = useTestimonials();
  if (!items.length) return null;
  return (
    <section className="container-x pb-28 sm:pb-40">
      <div className="mx-auto max-w-2xl space-y-14">
        {items.slice(0, 3).map((t, i) => (
          <figure key={i} className="text-center">
            <blockquote className="font-display text-2xl leading-relaxed">{t.text}</blockquote>
            <figcaption className="mt-4 text-xs uppercase tracking-[0.3em] text-ink-muted">{t.name}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export function ContactMinimal() {
  const { settings } = useSettings();
  return (
    <section className="container-x border-t border-ink/10 py-20 text-center">
      <p className="font-display text-3xl">Vamos conversar?</p>
      <WhatsAppLink message={waMessages.quote(settings.brandName)} context="home-contato" className="link-underline mt-5 inline-flex items-center gap-2 text-sm">
        Escrever no WhatsApp <ArrowRight className="h-4 w-4" />
      </WhatsAppLink>
    </section>
  );
}

// ==================================================================== IMERSIVO
// Tela cheia o tempo todo: fotos de ponta a ponta com o texto por cima.

export function HeroImersivo() {
  const d = useHeroData();
  const { images, active, setActive, hero } = d;
  const [tick, setTick] = useState(0);
  useEffect(() => { setTick((x) => x + 1); }, [active]);
  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-black text-cream" aria-label="Apresentação">
      <Slides images={images} active={active} />
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/30 to-transparent" aria-hidden />
      <div className="container-x relative z-10 grid items-center gap-10 py-28 lg:grid-cols-[auto_1fr]">
        <div className="hidden flex-col items-center gap-4 lg:flex" aria-hidden>
          <span className="font-display text-6xl leading-none">{String(active + 1).padStart(2, "0")}</span>
          <span className="h-24 w-px bg-cream/40" />
          <span className="text-sm text-cream/60">{String(images.length).padStart(2, "0")}</span>
        </div>
        <div className="lg:pl-10"><HeroText {...d} /></div>
      </div>
      {images.length > 1 && (
        <div className="absolute inset-x-0 bottom-0 z-10 grid" style={{ gridTemplateColumns: `repeat(${images.length}, 1fr)` }}>
          {images.map((img, i) => (
            <button key={img.url} type="button" onClick={() => setActive(i)} aria-label={`Foto ${i + 1}`} className="group h-1.5 bg-cream/20">
              <span key={i === active ? tick : undefined} className={`block h-full bg-cream ${i === active ? "animate-[grow_7s_linear_both]" : i < active ? "w-full" : "w-0"}`} />
            </button>
          ))}
        </div>
      )}
      <ScrollCue />
      <span className="sr-only">{hero.title}</span>
    </section>
  );
}

/** Faixa de foto de ponta a ponta, com o texto num cartão por cima. */
function Band({ src, children, align = "left", className = "" }) {
  return (
    <section className={`relative flex min-h-[80svh] items-center overflow-hidden ${className}`}>
      <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" decoding="async" />
      <div className="absolute inset-0 bg-black/35" aria-hidden />
      <div className={`container-x relative z-10 flex ${align === "right" ? "justify-end" : align === "center" ? "justify-center text-center" : ""}`}>{children}</div>
    </section>
  );
}

export function AboutImersivo() {
  const { about, photo, first } = useAbout();
  return (
    <div id="sobre" className="scroll-mt-24">
      <Band src={photo.url} align="right">
        <Reveal className="max-w-lg r-card bg-ivory/90 p-8 backdrop-blur-md sm:p-10">
          <Eyebrow>Sobre</Eyebrow>
          <h2 className="display-md mt-3 text-balance">{about.title}</h2>
          {first && <p className="mt-5 leading-relaxed text-ink-soft">{first}</p>}
          <div className="mt-7"><MoreLink to={sitePath("/sobre")}>Conhecer minha história</MoreLink></div>
        </Reveal>
      </Band>
    </div>
  );
}

export function CategoriesBands() {
  const { list } = useVisibleCats(4);
  if (!list.length) return null;
  return (
    <section aria-label="Ensaios">
      {list.map((c, i) => (
        <Link key={c.id} to={catLink(c)} onClick={() => track.galleryCategory(c.id)} className="group relative flex h-[46svh] items-center justify-center overflow-hidden text-white">
          <img src={c.coverUrl} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover transition duration-[1.4s] group-hover:scale-105" />
          <span className="absolute inset-0 bg-black/40 transition group-hover:bg-black/25" aria-hidden />
          <span className="relative text-center">
            <span className="block text-xs uppercase tracking-[0.35em] text-white/70">{String(i + 1).padStart(2, "0")} · Ensaio</span>
            <span className="mt-2 block font-display text-5xl sm:text-7xl">{c.name}</span>
            <span className="mt-4 inline-flex items-center gap-2 text-sm text-white/80 opacity-0 transition group-hover:opacity-100">Ver fotos <ArrowRight className="h-4 w-4" /></span>
          </span>
        </Link>
      ))}
    </section>
  );
}

export function GalleryScroll() {
  const photos = useGallery(10);
  const [open, setOpen] = useState(null);
  if (!photos.length) return null;
  return (
    <section className="bg-black py-20 text-cream">
      <div className="container-x flex items-end justify-between gap-6">
        <h2 className="display-lg !text-cream">Galeria</h2>
        <MoreLink to={sitePath("/galeria")} light>Ver tudo</MoreLink>
      </div>
      <div className="scrollbar-none mt-10 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 sm:px-8 lg:px-12">
        {photos.map((p, i) => (
          <button key={p.id} type="button" onClick={() => setOpen(i)} aria-label="Ampliar foto" className="h-[60svh] shrink-0 snap-center overflow-hidden r-img">
            <img src={p.thumbUrl || p.url} alt={p.alt || ""} className="h-full w-auto max-w-none object-cover" loading="lazy" decoding="async" />
          </button>
        ))}
      </div>
      <Lightbox photos={photos} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
    </section>
  );
}

export function TestimonialsImersivo() {
  const items = useTestimonials();
  const { images } = useHeroData();
  const [i, setI] = useState(0);
  if (!items.length) return null;
  const t = items[i % items.length];
  const bg = images[(images.length > 1 ? 1 : 0)];
  return (
    <Band src={bg.url} align="center" className="!min-h-[70svh] text-white">
      <div className="max-w-3xl">
        <blockquote key={i} className="animate-fade-up font-display text-3xl leading-snug sm:text-5xl">“{t.text}”</blockquote>
        <p className="mt-6 text-sm uppercase tracking-[0.25em] text-white/75">{t.name}</p>
        {items.length > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            {items.map((_, k) => <button key={k} type="button" onClick={() => setI(k)} aria-label={`Depoimento ${k + 1}`} className={`h-1 transition-all ${k === i ? "w-10 bg-white" : "w-5 bg-white/40"}`} />)}
          </div>
        )}
      </div>
    </Band>
  );
}

export function ContactImersivo() {
  const { settings } = useSettings();
  const { images } = useHeroData();
  const { contact, social } = settings;
  return (
    <Band src={images[images.length - 1].url} className="text-white">
      <div className="max-w-xl">
        <h2 className="display-lg !text-white text-balance">Vamos viver o seu ensaio?</h2>
        {contact.address && <p className="mt-4 flex items-center gap-2 text-white/80"><MapPin className="h-4 w-4" /> {contact.address}{contact.city ? ` · ${contact.city}` : ""}</p>}
        <div className="mt-8 flex flex-wrap gap-3">
          <WhatsAppLink message={waMessages.quote(settings.brandName)} context="home-contato" className="btn-gold"><WhatsAppIcon className="h-4 w-4" /> Chamar no WhatsApp</WhatsAppLink>
          {social.instagram && <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="btn-light"><Instagram className="h-4 w-4" /> Instagram</a>}
        </div>
      </div>
    </Band>
  );
}
