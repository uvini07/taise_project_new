import { Sparkle } from "../common/SectionHeading.jsx";
import { useLayout } from "../../hooks/useLayout.js";
import { useSettings } from "../../contexts/SettingsContext.jsx";
import { FALLBACK_IMAGES } from "../../config/defaults.js";

// Topo das páginas internas (Sobre, Pacotes, Galeria…), no desenho do modelo
// escolhido na aba Estilo.
export default function PageHeader({ eyebrow, title, text, children }) {
  const layout = useLayout();
  const { settings } = useSettings();

  if (layout === "cinema" || layout === "imersivo") {
    // Faixa de foto (a primeira do topo da página inicial) com o título por cima.
    const img = settings.hero?.images?.[0]?.url || FALLBACK_IMAGES.hero[0].url;
    return (
      <section className="relative flex min-h-[46svh] items-end overflow-hidden bg-black text-white">
        <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/10" aria-hidden />
        <div className={`container-x relative pb-12 pt-32 ${layout === "cinema" ? "text-center" : ""}`}>
          {eyebrow && <p className="eyebrow animate-fade-up !text-gold-light">{eyebrow}</p>}
          <h1 className={`display-lg mt-3 max-w-3xl animate-fade-up text-balance !text-white [animation-delay:80ms] ${layout === "cinema" ? "mx-auto" : ""}`}>{title}</h1>
          {text && <p className={`mt-4 max-w-2xl animate-fade-up text-lg text-white/80 [animation-delay:160ms] ${layout === "cinema" ? "mx-auto" : ""}`}>{text}</p>}
          {children}
        </div>
      </section>
    );
  }

  if (layout === "revista") {
    return (
      <section className="container-x pt-10">
        <div className="flex items-center justify-between border-y-2 border-ink py-2 text-[11px] uppercase tracking-[0.24em] text-ink-soft">
          <span>{eyebrow || "Seção"}</span><span>{settings.brandName}</span>
        </div>
        <h1 className="mt-8 font-display text-5xl leading-[0.95] text-balance sm:text-7xl">{title}</h1>
        {text && <p className="mt-5 max-w-2xl border-l-2 border-wine-900 pl-4 text-lg italic text-ink-soft">{text}</p>}
        {children}
        <div className="mt-10 border-b border-ink/15" />
      </section>
    );
  }

  if (layout === "polaroid") {
    return (
      <section className="relative overflow-hidden bg-paper">
        <span className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(rgb(var(--ink)/.08)_1px,transparent_1px)] [background-size:22px_22px]" aria-hidden />
        <div className="container-x relative py-16 text-center sm:py-20">
          {eyebrow && <p className="mx-auto inline-block -rotate-2 bg-gold/30 px-4 py-1 font-display text-lg italic text-ink">{eyebrow}</p>}
          <h1 className="display-lg mx-auto mt-5 max-w-3xl animate-fade-up text-balance">{title}</h1>
          {text && <p className="lead mx-auto mt-4 max-w-2xl text-pretty">{text}</p>}
          {children}
        </div>
      </section>
    );
  }

  if (layout === "minimalista") {
    return (
      <section className="container-x pb-10 pt-20 text-center sm:pt-28">
        {eyebrow && <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">{eyebrow}</p>}
        <h1 className="mx-auto mt-5 max-w-2xl font-display text-4xl leading-tight text-balance sm:text-5xl">{title}</h1>
        {text && <p className="mx-auto mt-4 max-w-lg text-ink-soft">{text}</p>}
        {children}
      </section>
    );
  }

  if (layout === "diagonal") {
    return (
      <section className="relative overflow-hidden bg-wine-950 pb-24 pt-16 text-cream [clip-path:polygon(0_0,100%_0,100%_78%,0_100%)] sm:pt-20">
        <div className="container-x relative">
          {eyebrow && <p className="eyebrow animate-fade-up !text-gold-light">{eyebrow}</p>}
          <h1 className="display-lg mt-3 max-w-3xl animate-fade-up text-balance !text-cream [animation-delay:80ms]">{title}</h1>
          {text && <p className="mt-4 max-w-2xl animate-fade-up text-lg text-cream/75 [animation-delay:160ms]">{text}</p>}
          {children}
        </div>
      </section>
    );
  }

  if (layout === "dividido" || layout === "arco") {
    const arco = layout === "arco";
    return (
      <section className={`relative overflow-hidden ${arco ? "bg-paper" : "border-b border-ink/10 bg-ivory"}`}>
        {arco && <span className="pointer-events-none absolute -bottom-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-t-full border border-gold/30" aria-hidden />}
        <div className="container-x relative py-16 text-center sm:py-20">
          {eyebrow && (
            <p className="eyebrow flex animate-fade-up items-center justify-center gap-3">
              {arco ? <Sparkle className="h-2.5 w-2.5" /> : <span className="h-px w-8 bg-current" />}
              {eyebrow}
              {!arco && <span className="h-px w-8 bg-current" />}
            </p>
          )}
          <h1 className="display-lg mx-auto mt-3 max-w-3xl animate-fade-up text-balance [animation-delay:80ms]">{title}</h1>
          {text && <p className="lead mx-auto mt-4 max-w-2xl animate-fade-up text-pretty [animation-delay:160ms]">{text}</p>}
          {children}
        </div>
      </section>
    );
  }

  if (layout === "mosaico") {
    return (
      <section className="container-x pt-6">
        <div className="relative overflow-hidden r-box bg-paper px-6 py-14 sm:px-12 sm:py-16">
          <span className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 r-card bg-wine-900/[.06]" aria-hidden />
          {eyebrow && <p className="eyebrow animate-fade-up">{eyebrow}</p>}
          <h1 className="display-lg mt-3 max-w-3xl animate-fade-up text-balance [animation-delay:80ms]">{title}</h1>
          {text && <p className="lead mt-4 max-w-2xl animate-fade-up text-pretty [animation-delay:160ms]">{text}</p>}
          {children}
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden border-b border-ink/5 bg-paper">
      <div className="pointer-events-none absolute -bottom-24 right-[7%] hidden h-[360px] w-[250px] rounded-t-full border border-gold/30 md:block" aria-hidden />
      <div className="pointer-events-none absolute -bottom-24 right-[calc(7%+18px)] hidden h-[340px] w-[214px] rounded-t-full border border-gold/15 md:block" aria-hidden />
      <div className="container-x relative py-16 sm:py-20">
        {eyebrow && <p className="eyebrow flex animate-fade-up items-center gap-2"><Sparkle className="h-2.5 w-2.5" /> {eyebrow}</p>}
        <h1 className="display-lg mt-3 max-w-3xl animate-fade-up text-balance [animation-delay:80ms]">{title}</h1>
        {text && <p className="lead mt-4 max-w-2xl animate-fade-up text-pretty [animation-delay:160ms]">{text}</p>}
        {children}
      </div>
    </section>
  );
}
