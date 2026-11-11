// Seções da página inicial nos modelos Diagonal, Dividido, Arco e Mosaico.
// O modelo Clássico usa as seções originais, em pages/public/Home.jsx.
// Todas usam os mesmos dados (Configurações, Galeria, Pacotes): muda o desenho.
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Instagram, MapPin, Quote } from "lucide-react";
import Reveal from "../common/Reveal.jsx";
import SectionHeading, { Sparkle } from "../common/SectionHeading.jsx";
import SmartImage from "../common/SmartImage.jsx";
import WhatsAppLink from "../common/WhatsAppLink.jsx";
import { WhatsAppIcon } from "../common/Icons.jsx";
import { Skeleton } from "../common/PageLoader.jsx";
import Lightbox from "../gallery/Lightbox.jsx";
import { useSettings } from "../../contexts/SettingsContext.jsx";
import { useCategories, useFeaturedPhotos } from "../../hooks/usePublicData.js";
import { FALLBACK_IMAGES } from "../../config/defaults.js";
import { paragraphs } from "../../utils/text.js";
import { waMessages } from "../../utils/whatsapp.js";
import { track } from "../../services/analyticsService.js";
import { sitePath } from "../../config/tenant.js";

// ------------------------------------------------------------------ comum
function useAbout() {
  const { settings } = useSettings();
  const { about } = settings;
  const photo = about.photoUrl ? { url: about.photoUrl, thumbUrl: about.photoThumbUrl, alt: about.photoAlt || "" } : FALLBACK_IMAGES.about;
  const [first, second] = paragraphs(about.text);
  return { settings, about, photo, first, second };
}
const MoreLink = ({ to, children, light = false }) => (
  <Link to={to} className={`link-underline inline-flex items-center gap-2 text-sm font-medium uppercase tracking-[0.18em] ${light ? "text-cream" : "text-ink"}`}>
    {children} <ArrowRight className="h-4 w-4" />
  </Link>
);
const useVisibleCats = (n = 8) => {
  const { data, loading } = useCategories();
  return { list: (data || []).filter((c) => c.coverUrl).slice(0, n), loading };
};
const catLink = (c) => sitePath(`/galeria/${c.slug}`);

// ================================================================ DIAGONAL
// Faixas escuras e claras alternadas, cortes em diagonal, números grandes.

export function AboutDiagonal() {
  const { about, photo, first, second } = useAbout();
  return (
    <section id="sobre" className="relative scroll-mt-24 overflow-hidden bg-wine-950 py-24 text-cream sm:py-32 [clip-path:polygon(0_6%,100%_0,100%_94%,0_100%)]">
      <div className="container-x grid items-center gap-14 lg:grid-cols-2">
        <div>
          <p className="eyebrow !text-gold-light">Sobre</p>
          <h2 className="display-lg mt-3 !text-cream text-balance">{about.title}</h2>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-cream/75 sm:text-lg">
            {first && <p>{first}</p>}{second && <p>{second}</p>}
          </div>
          <div className="mt-8"><MoreLink to={sitePath("/sobre")} light>Conhecer minha história</MoreLink></div>
        </div>
        <Reveal className="relative">
          <SmartImage src={photo.url} thumb={photo.thumbUrl} alt={photo.alt} sizes="(min-width:1024px) 45vw, 90vw"
            className="aspect-[4/5] [clip-path:polygon(14%_0,100%_0,86%_100%,0_100%)]" />
          {about.signature && <span className="absolute -bottom-4 left-4 font-display text-4xl italic text-gold-light">{about.signature}</span>}
        </Reveal>
      </div>
    </section>
  );
}

export function CategoriesDiagonal() {
  const { list, loading } = useVisibleCats(6);
  if (!loading && !list.length) return null;
  return (
    <section className="container-x py-24 sm:py-28">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <SectionHeading eyebrow="Ensaios" title="Para cada momento, um olhar" />
        <MoreLink to={sitePath("/galeria")}>Ver toda a galeria</MoreLink>
      </div>
      <div className={`mt-12 grid gap-4 sm:grid-cols-2 ${list.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
        {loading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="aspect-[4/3]" />)}
        {list.map((c, i) => (
          <Reveal key={c.id} delay={i * 60}>
            <Link to={catLink(c)} onClick={() => track.galleryCategory(c.id)} className="group relative block overflow-hidden r-img bg-wine-950">
              <SmartImage src={c.coverUrl} thumb={c.coverThumbUrl} placeholder={c.coverPlaceholder} alt="" sizes="(min-width:1024px) 33vw, 100vw"
                className={`${list.length === 4 ? "aspect-[3/4]" : "aspect-[4/3]"} opacity-80 transition duration-700 group-hover:opacity-100`} imgClassName="transition-transform duration-[1.2s] group-hover:scale-105" />
              <span className="absolute left-5 top-4 font-display text-6xl leading-none text-cream/90">{String(i + 1).padStart(2, "0")}</span>
              <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent p-5 text-cream">
                <span className="font-display text-2xl">{c.name}</span>
                <ArrowUpRight className="h-5 w-5 transition group-hover:translate-x-1 group-hover:-translate-y-1" />
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function GalleryDark({ columns = "columns-2 md:columns-3" }) {
  const { settings } = useSettings();
  const { data: photos } = useFeaturedPhotos(12);
  const [open, setOpen] = useState(null);
  if (!settings.display.showFeaturedGallery || !photos?.length) return null;
  return (
    <section className="bg-wine-950 py-24 text-cream sm:py-28">
      <div className="container-x">
        <p className="eyebrow !text-gold-light">Galeria</p>
        <h2 className="display-lg mt-3 !text-cream">Histórias que já contamos</h2>
        <div className={`mt-12 ${columns} gap-3 sm:gap-4`}>
          {photos.map((p, i) => (
            <button key={p.id} type="button" onClick={() => setOpen(i)} className="mb-3 block w-full break-inside-avoid overflow-hidden r-small sm:mb-4" aria-label="Ampliar foto">
              <SmartImage src={p.url} thumb={p.thumbUrl} placeholder={p.placeholder} alt={p.alt || ""} width={p.width} height={p.height}
                sizes="(min-width:768px) 33vw, 50vw" imgClassName="transition duration-700 hover:scale-[1.03]" />
            </button>
          ))}
        </div>
        <div className="mt-10"><MoreLink to={sitePath("/galeria")} light>Abrir a galeria completa</MoreLink></div>
      </div>
      <Lightbox photos={photos} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
    </section>
  );
}

export function TestimonialsDiagonal() {
  const { settings } = useSettings();
  const items = settings.testimonials.filter((t) => t.text && t.name);
  const [i, setI] = useState(0);
  if (!settings.display.showTestimonials || !items.length) return null;
  const t = items[i % items.length];
  return (
    <section className="container-x py-24 sm:py-28">
      <div className="grid gap-10 lg:grid-cols-[auto_1fr] lg:gap-16">
        <span className="font-display text-[9rem] leading-[0.7] text-wine-900/15" aria-hidden>“</span>
        <figure>
          <blockquote key={i} className="animate-fade-up font-display text-3xl leading-snug text-ink sm:text-4xl">{t.text}</blockquote>
          <figcaption className="mt-6 text-sm"><b className="font-medium">{t.name}</b>{t.context && <span className="text-ink-muted"> · {t.context}</span>}</figcaption>
          {items.length > 1 && (
            <div className="mt-8 flex gap-2">
              {items.map((_, k) => (
                <button key={k} type="button" onClick={() => setI(k)} aria-label={`Depoimento ${k + 1}`}
                  className={`h-1.5 transition-all ${k === i ? "w-10 bg-wine-900" : "w-5 bg-ink/20"}`} />
              ))}
            </div>
          )}
        </figure>
      </div>
    </section>
  );
}

export function ContactDiagonal() {
  const { settings } = useSettings();
  const { contact } = settings;
  return (
    <section className="relative mt-12 overflow-hidden bg-wine-900 py-20 text-cream [clip-path:polygon(0_12%,100%_0,100%_100%,0_100%)] sm:py-24">
      <div className="container-x grid items-end gap-10 pt-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="eyebrow !text-gold-light">Vamos conversar</p>
          <h2 className="display-lg mt-3 !text-cream text-balance">Conte o que você imagina para o seu ensaio</h2>
          <div className="mt-8 flex flex-wrap gap-3">
            <WhatsAppLink message={waMessages.quote(settings.brandName)} context="home-contato" className="btn-gold"><WhatsAppIcon className="h-4 w-4" /> Chamar no WhatsApp</WhatsAppLink>
            <Link to={sitePath("/contato")} className="btn-light">Outras formas de contato</Link>
          </div>
        </div>
        {contact.address && (
          <div className="border-l-2 border-gold pl-6 text-cream/80">
            <p className="font-display text-2xl text-cream">{contact.address}</p>
            {contact.addressLine2 && <p>{contact.addressLine2}</p>}
            {contact.city && <p>{contact.city}</p>}
          </div>
        )}
      </div>
    </section>
  );
}

// ================================================================ DIVIDIDO
// Editorial: blocos 50/50 sem margem, índice em lista, linhas finas.

export function AboutDividido() {
  const { about, photo, first, second } = useAbout();
  return (
    <section id="sobre" className="grid scroll-mt-24 border-y border-ink/10 lg:grid-cols-2">
      <div className="flex items-center px-5 py-20 sm:px-10 lg:order-2 lg:px-16 xl:px-24">
        <div>
          <SectionHeading eyebrow="Sobre" title={about.title} />
          <div className="mt-6 space-y-4 text-base leading-relaxed text-ink-soft sm:text-lg">
            {first && <p>{first}</p>}{second && <p>{second}</p>}
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-6">
            {about.signature && <span className="font-display text-3xl italic text-wine-900">{about.signature}</span>}
            <MoreLink to={sitePath("/sobre")}>Conhecer minha história</MoreLink>
          </div>
        </div>
      </div>
      <SmartImage src={photo.url} thumb={photo.thumbUrl} alt={photo.alt} sizes="(min-width:1024px) 50vw, 100vw" className="min-h-[60svh] lg:order-1 lg:min-h-[640px]" />
    </section>
  );
}

export function CategoriesDividido() {
  const { list, loading } = useVisibleCats(8);
  const [hover, setHover] = useState(0);
  if (!loading && !list.length) return null;
  const cur = list[hover] || list[0];
  return (
    <section className="container-x py-24 sm:py-28">
      <SectionHeading eyebrow="Ensaios" title="Índice de ensaios" align="center" />
      <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_0.8fr] lg:items-start">
        <ul className="border-t border-ink/10">
          {loading && Array.from({ length: 4 }).map((_, i) => <li key={i} className="py-6"><Skeleton className="h-8 w-1/2" /></li>)}
          {list.map((c, i) => (
            <li key={c.id} className="border-b border-ink/10">
              <Link to={catLink(c)} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onClick={() => track.galleryCategory(c.id)}
                className="group flex items-center gap-6 py-5">
                <span className="w-8 text-xs tabular-nums text-ink-muted">{String(i + 1).padStart(2, "0")}</span>
                <SmartImage src={c.coverThumbUrl || c.coverUrl} alt="" sizes="80px" className="h-16 w-14 shrink-0 lg:hidden" />
                <span className="flex-1 font-display text-3xl transition group-hover:translate-x-2 group-hover:text-wine-900 sm:text-4xl">{c.name}</span>
                <ArrowRight className="h-5 w-5 text-ink-muted transition group-hover:text-wine-900" />
              </Link>
            </li>
          ))}
        </ul>
        {cur && (
          <div className="sticky top-32 hidden lg:block">
            <SmartImage key={cur.id} src={cur.coverUrl} thumb={cur.coverThumbUrl} alt="" sizes="40vw" className="aspect-[4/5] animate-fade-in" />
          </div>
        )}
      </div>
    </section>
  );
}

export function GalleryGrid() {
  const { settings } = useSettings();
  const { data: photos } = useFeaturedPhotos(9);
  const [open, setOpen] = useState(null);
  if (!settings.display.showFeaturedGallery || !photos?.length) return null;
  return (
    <section className="border-t border-ink/10 py-24 sm:py-28">
      <div className="container-x">
        <SectionHeading eyebrow="Galeria" title="Histórias que já contamos" align="center" />
        <div className="mt-12 grid grid-cols-2 gap-1 sm:grid-cols-3">
          {photos.map((p, i) => (
            <button key={p.id} type="button" onClick={() => setOpen(i)} className="group overflow-hidden" aria-label="Ampliar foto">
              <SmartImage src={p.thumbUrl || p.url} thumb={p.thumbUrl} placeholder={p.placeholder} alt={p.alt || ""} sizes="33vw"
                className="aspect-square" imgClassName="transition duration-700 group-hover:scale-105" />
            </button>
          ))}
        </div>
        <div className="mt-10 text-center"><Link to={sitePath("/galeria")} className="btn-outline">Abrir a galeria completa</Link></div>
      </div>
      <Lightbox photos={photos} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
    </section>
  );
}

export function TestimonialsDividido() {
  const { settings } = useSettings();
  const items = settings.testimonials.filter((t) => t.text && t.name);
  if (!settings.display.showTestimonials || !items.length) return null;
  return (
    <section className="border-t border-ink/10 bg-paper py-24 sm:py-28">
      <div className="container-x">
        <SectionHeading eyebrow="Depoimentos" title="Quem já viveu a experiência" align="center" />
        <div className="mt-14 grid divide-y divide-ink/10 border-y border-ink/10 md:grid-cols-2 md:divide-x md:divide-y-0">
          {items.slice(0, 4).map((t, i) => (
            <figure key={i} className="p-8 sm:p-10">
              <blockquote className="font-display text-2xl italic leading-relaxed">“{t.text}”</blockquote>
              <figcaption className="mt-5 text-xs uppercase tracking-[0.2em] text-ink-muted">{t.name}{t.context && ` · ${t.context}`}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ContactDividido() {
  const { settings } = useSettings();
  const { contact } = settings;
  return (
    <section className="grid border-t border-ink/10 lg:grid-cols-2">
      <div className="bg-wine-900 px-5 py-16 text-cream sm:px-10 lg:px-16 lg:py-24">
        <p className="eyebrow !text-gold-light">Vamos conversar</p>
        <h2 className="display-lg mt-3 !text-cream text-balance">Conte o que você imagina para o seu ensaio</h2>
        <WhatsAppLink message={waMessages.quote(settings.brandName)} context="home-contato" className="btn-gold mt-8"><WhatsAppIcon className="h-4 w-4" /> Chamar no WhatsApp</WhatsAppLink>
      </div>
      <div className="flex flex-col justify-center gap-2 px-5 py-16 sm:px-10 lg:px-16">
        {contact.address ? (
          <>
            <MapPin className="h-5 w-5 text-gold" aria-hidden />
            <p className="mt-2 font-display text-3xl">{contact.address}</p>
            {contact.addressLine2 && <p className="text-ink-muted">{contact.addressLine2}</p>}
            {contact.city && <p className="text-ink-muted">{contact.city}</p>}
          </>
        ) : <p className="font-display text-3xl">Atendimento com hora marcada</p>}
        <div className="mt-6"><MoreLink to={sitePath("/contato")}>Outras formas de contato</MoreLink></div>
      </div>
    </section>
  );
}

// =================================================================== ARCO
// Delicado e centralizado: fotos em arco, muito respiro.

export function AboutArco() {
  const { about, photo, first } = useAbout();
  return (
    <section id="sobre" className="container-x scroll-mt-24 py-24 text-center sm:py-32">
      <Reveal className="mx-auto w-56 sm:w-64">
        <SmartImage src={photo.url} thumb={photo.thumbUrl} alt={photo.alt} sizes="260px" className="aspect-[3/4] rounded-t-full shadow-lift" />
      </Reveal>
      <SectionHeading className="mt-10" eyebrow="Sobre" title={about.title} align="center" />
      {first && <p className="lead mx-auto mt-6 max-w-2xl text-pretty">{first}</p>}
      {about.signature && <p className="mt-6 font-display text-3xl italic text-wine-900">{about.signature}</p>}
      <div className="mt-8"><MoreLink to={sitePath("/sobre")}>Conhecer minha história</MoreLink></div>
    </section>
  );
}

export function CategoriesArco() {
  const { list, loading } = useVisibleCats(4);
  if (!loading && !list.length) return null;
  return (
    <section className="bg-paper py-24 sm:py-28">
      <div className="container-x">
        <SectionHeading eyebrow="Ensaios" title="Para cada momento, um olhar" align="center" />
        <div className="mt-14 grid grid-cols-2 gap-5 sm:gap-8 lg:grid-cols-4">
          {loading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-t-full" />)}
          {list.map((c, i) => (
            <Reveal key={c.id} delay={i * 70} className="text-center">
              <Link to={catLink(c)} onClick={() => track.galleryCategory(c.id)} className="group block">
                <SmartImage src={c.coverUrl} thumb={c.coverThumbUrl} placeholder={c.coverPlaceholder} alt="" sizes="(min-width:1024px) 25vw, 50vw"
                  className="aspect-[3/4] rounded-t-full" imgClassName="transition-transform duration-[1.2s] group-hover:scale-105" />
                <span className="mt-4 block font-display text-2xl transition group-hover:text-wine-900">{c.name}</span>
              </Link>
            </Reveal>
          ))}
        </div>
        <div className="mt-12 text-center"><Link to={sitePath("/galeria")} className="btn-outline">Ver toda a galeria</Link></div>
      </div>
    </section>
  );
}

export function TestimonialsArco() {
  const { settings } = useSettings();
  const items = settings.testimonials.filter((t) => t.text && t.name);
  const [i, setI] = useState(0);
  if (!settings.display.showTestimonials || !items.length) return null;
  const t = items[i % items.length];
  return (
    <section className="container-x py-24 text-center sm:py-28">
      <Sparkle className="mx-auto h-4 w-4 text-gold" />
      <blockquote key={i} className="mx-auto mt-6 max-w-3xl animate-fade-up font-display text-3xl italic leading-snug sm:text-4xl">“{t.text}”</blockquote>
      <p className="mt-6 text-sm text-ink-muted"><b className="font-medium text-ink">{t.name}</b>{t.context && ` · ${t.context}`}</p>
      {items.length > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {items.map((_, k) => (
            <button key={k} type="button" onClick={() => setI(k)} aria-label={`Depoimento ${k + 1}`}
              className={`h-2 rounded-full transition-all ${k === i ? "w-8 bg-wine-900" : "w-2 bg-ink/20"}`} />
          ))}
        </div>
      )}
    </section>
  );
}

export function ContactArco() {
  const { settings } = useSettings();
  const { contact, social } = settings;
  return (
    <section className="container-x pt-12">
      <Reveal className="mx-auto max-w-3xl rounded-t-[999px] bg-paper px-6 pb-16 pt-24 text-center sm:px-16">
        <p className="eyebrow">Vamos conversar</p>
        <h2 className="display-md mx-auto mt-3 max-w-xl text-balance">Conte o que você imagina para o seu ensaio</h2>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <WhatsAppLink message={waMessages.quote(settings.brandName)} context="home-contato" className="btn-primary"><WhatsAppIcon className="h-4 w-4" /> Chamar no WhatsApp</WhatsAppLink>
          {social.instagram && <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="btn-outline"><Instagram className="h-4 w-4" /> Instagram</a>}
        </div>
        {contact.address && <p className="mt-8 text-sm text-ink-muted">{contact.address}{contact.city ? ` · ${contact.city}` : ""}</p>}
      </Reveal>
    </section>
  );
}

// ================================================================ MOSAICO
// "Bento": blocos de tamanhos diferentes lado a lado.

export function AboutMosaico() {
  const { settings, about, photo, first } = useAbout();
  const { list } = useVisibleCats(2);
  return (
    <section id="sobre" className="container-x scroll-mt-24 py-20 sm:py-24">
      <div className="grid gap-4 md:grid-cols-4 md:grid-rows-[230px_230px]">
        <Reveal className="flex flex-col justify-between r-card bg-surface p-8 shadow-soft md:col-span-2 md:row-span-2 sm:p-10">
          <div>
            <p className="eyebrow">Sobre</p>
            <h2 className="display-md mt-3 text-balance">{about.title}</h2>
            {first && <p className="mt-5 leading-relaxed text-ink-soft">{first}</p>}
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            {about.signature && <span className="font-display text-3xl italic text-wine-900">{about.signature}</span>}
            <MoreLink to={sitePath("/sobre")}>Minha história</MoreLink>
          </div>
        </Reveal>
        <Reveal delay={80} className="md:col-span-2 md:h-full"><SmartImage src={photo.url} thumb={photo.thumbUrl} alt={photo.alt} sizes="50vw" className="aspect-[16/9] r-card md:aspect-auto md:h-full" /></Reveal>
        {list[0] && <Reveal delay={140} className="md:h-full"><SmartImage src={list[0].coverThumbUrl || list[0].coverUrl} alt="" sizes="25vw" className="aspect-square r-card md:aspect-auto md:h-full" /></Reveal>}
        <Reveal delay={200} className={`md:h-full ${list[0] ? "" : "md:col-span-2"}`}>
          <WhatsAppLink message={waMessages.quote(settings.brandName)} context="home-sobre" className="flex h-full min-h-[160px] flex-col justify-between r-card bg-wine-900 p-6 text-cream transition hover:bg-wine-800">
            <WhatsAppIcon className="h-6 w-6" />
            <span className="font-display text-2xl leading-tight">Vamos marcar o seu ensaio?</span>
          </WhatsAppLink>
        </Reveal>
      </div>
    </section>
  );
}

export function CategoriesMosaico() {
  const { list, loading } = useVisibleCats(5);
  if (!loading && !list.length) return null;
  const span = ["md:col-span-2 md:row-span-2", "", "", "md:col-span-2", ""];
  return (
    <section className="container-x py-20 sm:py-24">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <SectionHeading eyebrow="Ensaios" title="Para cada momento, um olhar" />
        <MoreLink to={sitePath("/galeria")}>Ver toda a galeria</MoreLink>
      </div>
      <div className="mt-12 grid auto-rows-[180px] grid-cols-2 gap-4 sm:auto-rows-[220px] md:grid-cols-4">
        {loading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className={`r-card ${span[i]}`} />)}
        {list.map((c, i) => (
          <Reveal key={c.id} delay={i * 60} className={span[i % span.length]}>
            <Link to={catLink(c)} onClick={() => track.galleryCategory(c.id)} className="group relative block h-full overflow-hidden r-card">
              <SmartImage src={c.coverUrl} thumb={c.coverThumbUrl} placeholder={c.coverPlaceholder} alt="" sizes="(min-width:768px) 50vw, 50vw"
                className="h-full" imgClassName="transition-transform duration-[1.2s] group-hover:scale-105" />
              <span className="absolute bottom-3 left-3 rounded-full bg-surface/90 px-4 py-2 text-sm font-medium text-ink shadow-soft backdrop-blur">{c.name}</span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function GalleryBento() {
  const { settings } = useSettings();
  const { data: photos } = useFeaturedPhotos(7);
  const [open, setOpen] = useState(null);
  if (!settings.display.showFeaturedGallery || !photos?.length) return null;
  const span = ["col-span-2 row-span-2", "", "", "row-span-2", "", "col-span-2", ""];
  return (
    <section className="container-x py-20 sm:py-24">
      <SectionHeading eyebrow="Galeria" title="Histórias que já contamos" />
      <div className="mt-12 grid auto-rows-[150px] grid-cols-2 gap-4 sm:auto-rows-[200px] md:grid-cols-4">
        {photos.map((p, i) => (
          <button key={p.id} type="button" onClick={() => setOpen(i)} className={`group overflow-hidden r-card ${span[i % span.length]}`} aria-label="Ampliar foto">
            <SmartImage src={p.url} thumb={p.thumbUrl} placeholder={p.placeholder} alt={p.alt || ""} sizes="50vw" className="h-full" imgClassName="transition duration-700 group-hover:scale-105" />
          </button>
        ))}
      </div>
      <div className="mt-10"><Link to={sitePath("/galeria")} className="btn-outline">Abrir a galeria completa</Link></div>
      <Lightbox photos={photos} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
    </section>
  );
}

export function TestimonialsMosaico() {
  const { settings } = useSettings();
  const items = settings.testimonials.filter((t) => t.text && t.name);
  if (!settings.display.showTestimonials || !items.length) return null;
  return (
    <section className="py-20 sm:py-24">
      <div className="container-x"><SectionHeading eyebrow="Depoimentos" title="Quem já viveu a experiência" /></div>
      <div className="scrollbar-none mt-12 flex snap-x gap-4 overflow-x-auto px-5 pb-4 sm:px-8 lg:px-[max(3rem,calc((100vw-80rem)/2+3rem))]">
        {items.map((t, i) => (
          <figure key={i} className="w-[82vw] max-w-sm shrink-0 snap-start r-card bg-surface p-7 shadow-soft">
            <Quote className="h-6 w-6 text-gold" strokeWidth={1.4} aria-hidden />
            <blockquote className="mt-4 leading-relaxed text-ink">{t.text}</blockquote>
            <figcaption className="mt-5 text-sm"><b className="font-medium">{t.name}</b>{t.context && <span className="text-ink-muted"> · {t.context}</span>}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export function ContactMosaico() {
  const { settings } = useSettings();
  const { contact, social } = settings;
  return (
    <section className="container-x grid gap-4 pt-8 md:grid-cols-3">
      <Reveal className="r-card bg-wine-900 p-8 text-cream md:col-span-2 sm:p-10">
        <p className="eyebrow !text-gold-light">Vamos conversar</p>
        <h2 className="display-md mt-3 !text-cream text-balance">Conte o que você imagina para o seu ensaio</h2>
        <WhatsAppLink message={waMessages.quote(settings.brandName)} context="home-contato" className="btn-gold mt-8"><WhatsAppIcon className="h-4 w-4" /> Chamar no WhatsApp</WhatsAppLink>
      </Reveal>
      <div className="grid gap-4">
        <Reveal delay={80} className="r-card bg-surface p-6 shadow-soft">
          <MapPin className="h-5 w-5 text-gold" aria-hidden />
          <p className="mt-2 font-display text-xl">{contact.address || "Atendimento com hora marcada"}</p>
          {contact.city && <p className="text-sm text-ink-muted">{contact.city}</p>}
        </Reveal>
        <Reveal delay={140}>
          {social.instagram ? (
            <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="flex h-full items-center justify-between r-card bg-paper p-6 transition hover:bg-sand">
              <span className="font-display text-xl">Me siga no Instagram</span><Instagram className="h-5 w-5 text-wine-900" />
            </a>
          ) : (
            <Link to={sitePath("/contato")} className="flex h-full items-center justify-between r-card bg-paper p-6 transition hover:bg-sand">
              <span className="font-display text-xl">Outras formas de contato</span><ArrowRight className="h-5 w-5 text-wine-900" />
            </Link>
          )}
        </Reveal>
      </div>
    </section>
  );
}
