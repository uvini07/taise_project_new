import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Reveal from "../common/Reveal.jsx";
import { Sparkle } from "../common/SectionHeading.jsx";
import PackageCard from "./PackageCard.jsx";
import { useSettings } from "../../contexts/SettingsContext.jsx";
import { useCategories, usePublicPackages } from "../../hooks/usePublicData.js";

/** Carrossel simples: desliza no celular, setas no desktop, troca sozinho. */
export function Carousel({ images }) {
  const ref = useRef(null);
  const [i, setI] = useState(0);
  const go = (n) => {
    const el = ref.current; if (!el) return;
    const next = (n + images.length) % images.length;
    el.scrollTo({ left: el.clientWidth * next, behavior: "smooth" });
    setI(next);
  };
  useEffect(() => {
    if (images.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const id = setInterval(() => go(i + 1), 6000);
    return () => clearInterval(id);
  }); // eslint-disable-line react-hooks/exhaustive-deps
  if (!images.length) return null;
  return (
    <div className="relative">
      <div ref={ref} className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto rounded-[28px]"
        onScroll={(e) => setI(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}>
        {images.map((img, k) => (
          <img key={img.url + k} src={img.url} srcSet={img.thumbUrl ? `${img.thumbUrl} 720w, ${img.url} 2048w` : undefined} sizes="(min-width:1280px) 1200px, 100vw"
            alt={img.alt || ""} loading={k === 0 ? "eager" : "lazy"} className="aspect-[16/9] w-full shrink-0 snap-center object-cover" />
        ))}
      </div>
      {images.length > 1 && (
        <>
          <button onClick={() => go(i - 1)} aria-label="Imagem anterior" className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-surface/90 p-2 shadow sm:block"><ChevronLeft className="h-5 w-5" /></button>
          <button onClick={() => go(i + 1)} aria-label="Próxima imagem" className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-surface/90 p-2 shadow sm:block"><ChevronRight className="h-5 w-5" /></button>
          <div className="mt-3 flex justify-center gap-1.5">
            {images.map((_, k) => <button key={k} onClick={() => go(k)} aria-label={`Imagem ${k + 1}`} className={`h-1.5 rounded-full transition-all ${k === i ? "w-8 bg-wine-900" : "w-3 bg-ink/20"}`} />)}
          </div>
        </>
      )}
    </div>
  );
}

/** Seção "Evento promocional" da página inicial (configurada no painel). */
export default function PromoEvent() {
  const { settings } = useSettings();
  const ev = settings.promoEvent;
  const { data: pkgs } = usePublicPackages();
  const { data: cats } = useCategories();
  const catName = useMemo(() => Object.fromEntries((cats || []).map((c) => [c.id, c.name])), [cats]);
  if (!ev?.enabled) return null;
  const list = (ev.packageIds || []).map((id) => (pkgs || []).find((p) => p.id === id)).filter(Boolean);
  return (
    <section id="evento" className="bg-paper py-20 sm:py-28">
      <div className="container-x">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow flex items-center justify-center gap-2"><Sparkle className="h-2.5 w-2.5" /> Evento especial</p>
          {ev.title && <h2 className="display-lg mt-3 text-balance">{ev.title}</h2>}
          {ev.subtitle && <p className="lead mt-4 text-pretty">{ev.subtitle}</p>}
        </Reveal>
        {ev.images?.length > 0 && <Reveal className="mx-auto mt-12 max-w-5xl"><Carousel images={ev.images} /></Reveal>}
        {list.length > 0 && (
          <div className={`mx-auto mt-14 grid gap-6 md:grid-cols-2 ${list.length === 1 ? "max-w-md md:grid-cols-1" : list.length === 2 ? "max-w-4xl" : "lg:grid-cols-3"}`}>
            {list.map((p, k) => <Reveal key={p.id} delay={k * 80}><PackageCard pkg={p} categoryName={catName[p.categoryId]} featured={p.featured} /></Reveal>)}
          </div>
        )}
      </div>
    </section>
  );
}
