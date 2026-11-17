// Capa de galeria (seleção e entrega): foto em tela cheia, nome do estúdio,
// título do ensaio e uma seta chamando para rolar até as fotos.
// Abertura em sequência: tela escura → foto surge desfocada e afasta devagar →
// linha dourada → estúdio → título → subtítulo → botão e seta.
import { ChevronDown } from "lucide-react";

const CSS = `
@keyframes gc-curtain { 0% { opacity: 1 } 100% { opacity: 0; visibility: hidden } }
@keyframes gc-photo { 0% { opacity: 0; transform: scale(1.18); filter: blur(14px) } 60% { opacity: 1; filter: blur(0) } 100% { opacity: 1; transform: scale(1.06); filter: blur(0) } }
@keyframes gc-drift { 0% { transform: scale(1.06) } 100% { transform: scale(1.0) } }
@keyframes gc-shade { 0% { opacity: .85 } 100% { opacity: .45 } }
@keyframes gc-line { 0% { transform: scaleX(0); opacity: 0 } 100% { transform: scaleX(1); opacity: 1 } }
@keyframes gc-studio { 0% { opacity: 0; letter-spacing: .9em } 100% { opacity: 1; letter-spacing: .3em } }
@keyframes gc-rise { 0% { opacity: 0; transform: translateY(28px); filter: blur(8px) } 100% { opacity: 1; transform: none; filter: blur(0) } }
@keyframes gc-fade { 0% { opacity: 0; transform: translateY(-8px) } 100% { opacity: 1; transform: none } }
.gc-curtain { animation: gc-curtain .9s ease .35s both }
.gc-photo { animation: gc-photo 2.4s cubic-bezier(.2,.7,.2,1) .2s both, gc-drift 14s ease-out 2.6s both }
.gc-shade { animation: gc-shade 2.2s ease .4s both }
.gc-line { animation: gc-line 1s cubic-bezier(.2,.7,.2,1) 1.1s both; transform-origin: center }
.gc-studio { animation: gc-studio 1.4s cubic-bezier(.2,.7,.2,1) 1.3s both }
.gc-title > span { display: inline-block; animation: gc-rise 1.1s cubic-bezier(.2,.7,.2,1) both }
.gc-sub { animation: gc-rise 1s cubic-bezier(.2,.7,.2,1) 2.3s both }
.gc-action { animation: gc-fade .8s ease 2.6s both }
.gc-hint { animation: gc-fade .8s ease 2.9s both }
@media (prefers-reduced-motion: reduce) {
  .gc-curtain, .gc-photo, .gc-shade, .gc-line, .gc-studio, .gc-title > span, .gc-sub, .gc-action, .gc-hint { animation: none !important }
  .gc-curtain { display: none }
  .gc-shade { opacity: .45 }
}`;

export default function GalleryCover({ image, studioName, title, subtitle, hint, action, target = "fotos" }) {
  const go = () => document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const words = String(title || "").split(" ");
  return (
    <section className="relative isolate flex h-[100svh] min-h-[420px] w-full items-center justify-center overflow-hidden bg-black text-white">
      <style>{CSS}</style>
      <div className="gc-photo absolute inset-0 -z-10 [&>*]:h-full [&>*]:w-full">{image}</div>
      <div className="gc-shade absolute inset-0 -z-10 bg-black" style={{ opacity: 0.45 }} aria-hidden />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-gradient-to-t from-black/50 to-transparent" aria-hidden />
      {action && <div className="gc-action absolute right-4 top-4 z-10 sm:right-8 sm:top-6">{action}</div>}
      <div className="px-6 text-center">
        {studioName && <p className="gc-studio text-[11px] uppercase text-white/80">{studioName}</p>}
        <span className="gc-line mx-auto mt-3 block h-px w-14 bg-white/70" aria-hidden />
        <h1 className="gc-title mt-3 font-display text-4xl leading-tight !text-white sm:text-6xl" aria-label={title}>
          {words.map((w, i) => (
            <span key={i} aria-hidden style={{ animationDelay: `${1.6 + i * 0.14}s` }}>{w}{i < words.length - 1 ? " " : ""}</span>
          ))}
        </h1>
        {subtitle && <p className="gc-sub mt-2 text-sm text-white/80">{subtitle}</p>}
      </div>
      <button type="button" onClick={go} aria-label={hint}
        className="gc-hint absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-white/90">
        <span className="text-xs tracking-wide">{hint}</span>
        <ChevronDown className="h-7 w-7 animate-bounce" strokeWidth={1.5} />
      </button>
      <div className="gc-curtain pointer-events-none absolute inset-0 z-20 bg-black" aria-hidden />
    </section>
  );
}
