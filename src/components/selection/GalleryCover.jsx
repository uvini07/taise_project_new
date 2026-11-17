// Capa de galeria (seleção e entrega): foto em tela cheia, nome do estúdio,
// título do ensaio e uma seta chamando para rolar até as fotos.
import { ChevronDown } from "lucide-react";

export default function GalleryCover({ image, studioName, title, subtitle, hint, action, target = "fotos" }) {
  const go = () => document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
  return (
    <section className="relative isolate flex h-[100svh] min-h-[420px] w-full items-center justify-center overflow-hidden bg-ink text-white">
      <div className="absolute inset-0 -z-10 [&>*]:h-full [&>*]:w-full">{image}</div>
      <div className="absolute inset-0 -z-10 bg-black/45" aria-hidden />
      {action && <div className="absolute right-4 top-4 z-10 sm:right-8 sm:top-6">{action}</div>}
      <div className="px-6 text-center">
        {studioName && <p className="text-[11px] uppercase tracking-[.3em] text-white/75">{studioName}</p>}
        <h1 className="mt-2 font-display text-4xl leading-tight !text-white sm:text-6xl">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-white/80">{subtitle}</p>}
      </div>
      <button type="button" onClick={go} aria-label={hint}
        className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-white/90">
        <span className="text-xs tracking-wide">{hint}</span>
        <ChevronDown className="h-7 w-7 animate-bounce" strokeWidth={1.5} />
      </button>
    </section>
  );
}
