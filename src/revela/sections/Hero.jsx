import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarCheck2, Check, Heart, Lock, ShieldCheck, Download, Sparkles } from "lucide-react";
import { gsap, useGSAP, MQ } from "../gsap.js";
import { LOGO } from "../logoPaths.js";
import { Aperture, Camera, Polaroid } from "../components/Objects.jsx";
import { useOffscreenPause, siteHost } from "../hooks.js";
import { FROM_PRICE } from "../data.js";
import { SITE_BASE } from "../../config/tenant.js";

const IMG = (n) => `/revela/img/${n}.webp`;
const GALLERY = ["familia-brincando", "pai-filha", "beijo-mae", "piquenique", "mae-filha-livro", "criancas-correndo", "familia-cachorro", "familia-bebe"];
const START = new Set([0, 3, 5]);
const ORDER = [1, 6, 2, 7];

/** A tela de seleção que o cliente vê, com os corações sendo marcados. */
function GalleryWindow() {
  const [picked, setPicked] = useState(START);
  const box = useRef(null);
  useEffect(() => {
    let step = 0;
    let t;
    const tick = () => {
      if (box.current?.closest("[data-offscreen]")) { t = setTimeout(tick, 1200); return; }
      step += 1;
      if (step <= ORDER.length) setPicked(new Set([...START, ...ORDER.slice(0, step)]));
      else if (step > ORDER.length + 2) { step = 0; setPicked(START); }
      t = setTimeout(tick, step === 0 ? 900 : 1150);
    };
    t = setTimeout(tick, 2600);
    return () => clearTimeout(t);
  }, []);
  const count = 9 + picked.size;
  return (
    <div ref={box} className="lg overflow-hidden" style={{ "--lg-r": "26px", "--lg-bg": "rgba(255,255,255,.5)" }}>
      <div className="flex items-center gap-3 border-b border-white/60 px-4 py-3">
        <span className="flex gap-1.5" aria-hidden>{[0, 1, 2].map((i) => <i key={i} className="h-2.5 w-2.5 rounded-full bg-rv-ameixa/15" />)}</span>
        <span className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-[12px] text-rv-ink2">
          <Lock className="h-3 w-3 shrink-0" aria-hidden />
          <span className="truncate">{siteHost()}{SITE_BASE}/selecao/familia-souza</span>
        </span>
      </div>
      <div className="p-4 sm:p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="font-revela text-[22px] leading-tight text-rv-ameixa sm:text-[26px]">Família Souza</p>
            <p className="text-[13px] text-rv-ink2">Escolha até 20 fotos · faltam 5 dias</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-rv-ameixa px-3 py-1.5 text-[13px] font-medium text-rv-lavanda">
            <Heart className="h-3.5 w-3.5 fill-rv-rosa text-rv-rosa" aria-hidden />
            <span className="tabular-nums">{count}</span> de 20
          </span>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {GALLERY.map((n, i) => {
            const on = picked.has(i);
            return (
              <div key={n} className="relative aspect-[4/5] overflow-hidden rounded-[10px] bg-rv-lavanda" style={{ boxShadow: on ? "0 0 0 2.5px #C95D63" : "none", transition: "box-shadow .3s" }}>
                <img data-develop src={IMG(n)} alt="" width="150" height="188" decoding="async" className="h-full w-full object-cover" draggable="false" />
                <span className="rv-wm" aria-hidden />
                <span className={`absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full transition-[transform,background-color] duration-300 ${on ? "scale-110 bg-rv-rosa text-white" : "bg-white/85 text-rv-lilas"}`} aria-hidden>
                  <Heart className={`h-3.5 w-3.5 ${on ? "fill-white" : ""}`} />
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-[12px] text-rv-ink2"><ShieldCheck className="h-4 w-4 text-rv-rosa" aria-hidden />Prévias protegidas contra print</span>
          <span className="rounded-full bg-rv-ameixa px-4 py-2 text-[13px] font-medium text-rv-lavanda">Finalizar seleção</span>
        </div>
      </div>
    </div>
  );
}

function BookingCard() {
  return (
    <div className="lg lg-tight w-[248px] p-3.5" style={{ "--lg-bg": "rgba(255,255,255,.55)" }}>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rv-ameixa text-rv-lavanda"><CalendarCheck2 className="h-5 w-5" aria-hidden /></span>
        <div className="min-w-0">
          <p className="text-[12px] text-rv-ink2">Novo agendamento</p>
          <p className="truncate text-[14px] font-medium text-rv-ameixa">Ensaio gestante · sáb, 16h</p>
        </div>
      </div>
      <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-[#2F6B5C]/10 px-2.5 py-1 text-[12px] font-medium text-[#2F6B5C]"><Check className="h-3.5 w-3.5" aria-hidden />Sinal pago pelo Pix</p>
    </div>
  );
}

function DeliveryCard() {
  return (
    <div className="lg lg-tight w-[236px] p-3.5" data-loop style={{ "--lg-bg": "rgba(255,255,255,.55)", "--loop": "4s" }}>
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-rv-ameixa">Entrega · 48 fotos</p>
        <Download className="h-4 w-4 text-rv-rosa" aria-hidden />
      </div>
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-rv-ameixa/10">
        <div className="h-full origin-left rounded-full bg-rv-rosa" style={{ animation: "rv-fill var(--loop) cubic-bezier(.65,0,.35,1) infinite" }} />
      </div>
      <p className="mt-2 text-[12px] text-rv-ink2">Link válido por 14 dias</p>
    </div>
  );
}

export default function Hero() {
  const root = useRef(null);
  useOffscreenPause(root);

  useGSAP(() => {
    const q = gsap.utils.selector(root);
    const mm = gsap.matchMedia();

    // Entrada: o "r" se desenha, a janela sobe, os objetos chegam e a luz dispara o flash que revela as fotos.
    mm.add(MQ.mid, () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(q("[data-r-line]"), { drawSVG: "0%", duration: 1.6, ease: "power2.inOut" }, 0)
        .from(q("[data-r-fill]"), { autoAlpha: 0, duration: 1 }, 0.9)
        .from(q("[data-window]"), { y: 70, autoAlpha: 0, scale: 0.95, duration: 1.1 }, 0.15)
        .from(q("[data-pop]"), { y: 40, autoAlpha: 0, scale: 0.9, duration: 0.9, stagger: 0.12 }, 0.5)
        .from(q("[data-obj]"), { autoAlpha: 0, scale: 0.6, rotation: (i) => [-24, 18, -12][i] || 0, duration: 1.2, stagger: 0.1, ease: "expo.out" }, 0.4)
        .from(q("[data-underline]"), { scaleX: 0, duration: 0.9, ease: "power3.inOut" }, 0.5)
        .addLabel("flash", 1.45)
        .to(q("[data-flash]"), { autoAlpha: 0.95, duration: 0.07, ease: "none" }, "flash")
        .to(q("[data-flash]"), { autoAlpha: 0, duration: 0.8, ease: "power2.out" }, "flash+=0.07")
        .fromTo(q("[data-r-dot]"), { scale: 1 }, { scale: 1.6, duration: 0.16, yoyo: true, repeat: 1, ease: "power2.out", transformOrigin: "50% 50%" }, "flash")
        .fromTo(q("[data-develop]"), { filter: "grayscale(1) brightness(1.45) contrast(.75)" },
          { filter: "grayscale(0) brightness(1) contrast(1)", duration: 1.4, stagger: 0.06, ease: "power2.out", clearProps: "filter" }, "flash");

      // Diafragma da lente abrindo e fechando (loop lento).
      const blades = q("[data-obj] [data-blade]");
      const inner = q("[data-obj] [data-blade-inner]");
      if (blades.length) {
        gsap.timeline({ repeat: -1, yoyo: true, repeatDelay: 0.6, delay: 1.8 })
          .to(inner, { y: 110 - 52, duration: 2.2, ease: "power2.inOut" }, 0)
          .to(blades, { rotation: "+=22", svgOrigin: "110 110", duration: 2.2, ease: "power2.inOut" }, 0);
      }
      return undefined;
    });

    // Paralaxe com o ponteiro: cada camada anda conforme a profundidade (só transform).
    mm.add(`${MQ.full} and ${MQ.pointer}`, () => {
      const layers = q("[data-depth]").map((el) => ({
        d: parseFloat(el.dataset.depth),
        x: gsap.quickTo(el, "x", { duration: 0.9, ease: "power3" }),
        y: gsap.quickTo(el, "y", { duration: 0.9, ease: "power3" }),
      }));
      const onMove = (e) => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        layers.forEach((l) => { l.x(nx * 36 * l.d); l.y(ny * 26 * l.d); });
      };
      window.addEventListener("pointermove", onMove, { passive: true });
      return () => window.removeEventListener("pointermove", onMove);
    });
    return () => mm.revert();
  }, { scope: root });

  return (
    <section ref={root} className="relative isolate overflow-hidden bg-rv-lavanda pt-28 sm:pt-32 lg:min-h-[100svh] lg:pt-0" aria-labelledby="rv-h1">
      <div className="rv-ground" aria-hidden>
        <span className="rv-blob" style={{ left: "52%", top: "-22%", width: "62vw", height: "62vw", background: "radial-gradient(closest-side, rgba(201,93,99,.42), rgba(201,93,99,0))" }} />
        <span className="rv-blob" style={{ left: "-18%", top: "20%", width: "58vw", height: "58vw", background: "radial-gradient(closest-side, rgba(142,134,166,.55), rgba(142,134,166,0))" }} />
        <span className="rv-blob" style={{ left: "26%", top: "42%", width: "46vw", height: "46vw", background: "radial-gradient(closest-side, rgba(255,255,255,.95), rgba(255,255,255,0))" }} />
        <span className="rv-blob" style={{ left: "70%", top: "48%", width: "40vw", height: "40vw", background: "radial-gradient(closest-side, rgba(43,37,64,.22), rgba(43,37,64,0))" }} />
      </div>

      <div className="rv-wrap relative z-10 grid items-center gap-14 pb-20 lg:min-h-[100svh] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-10 lg:pb-0 lg:pt-24">
        <div className="min-w-0 max-w-[620px]">
          <a href="/#polaroidy" onClick={(e) => { e.preventDefault(); document.getElementById("polaroidy")?.scrollIntoView({ behavior: "smooth" }); }}
            className="lg lg-pill rv-lift inline-flex max-w-full items-center gap-2.5 py-1.5 pl-1.5 pr-4 text-[14px] text-rv-ink2" style={{ "--lg-bg": "rgba(255,255,255,.45)" }}>
            <span className="inline-flex items-center gap-1 rounded-full bg-rv-rosa px-2.5 py-1 text-[12px] font-medium text-white"><Sparkles className="h-3.5 w-3.5" aria-hidden />Novo</span>
            <span className="min-w-0">Conheça a <b className="font-medium text-rv-ameixa">Polaroidy</b>, sua assistente com IA</span>
            <ArrowRight className="h-4 w-4 shrink-0 text-rv-rosa" aria-hidden />
          </a>
          <h1 id="rv-h1" className="mt-6 text-[2.3rem] leading-[1.04] min-[400px]:text-[2.75rem] sm:text-6xl lg:text-[4.35rem]">
            Site, agenda e entrega de fotos para{" "}
            <span className="relative inline-block whitespace-nowrap">
              fotógrafas.
              <span data-underline className="absolute -bottom-[0.2em] left-0 right-[0.35em] h-[0.075em] origin-left rounded-full bg-rv-rosa" aria-hidden />
            </span>
          </h1>
          <p className="mt-6 max-w-[540px] text-lg leading-relaxed text-rv-ink2 sm:text-xl">
            Monte seu site em minutos, receba agendamentos com sinal pago, deixe o cliente escolher as fotos com proteção contra print e entregue tudo em alta, num lugar só.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link to="/cadastro" className="rv-btn rv-btn-primary"><span className="rv-btn-dot" aria-hidden />Usar teste de 30 dias</Link>
            <Link to="/planos" className="rv-btn lg lg-pill rv-btn-glass">Ver planos</Link>
          </div>
          <p className="mt-4 text-[14px] text-rv-ink2">30 dias grátis · depois, a partir de <b className="font-medium text-rv-ameixa">R$ {FROM_PRICE} por mês</b></p>
        </div>

        {/* Cena: o "r" de vidro, a tela de seleção, os avisos e os objetos de fotografia. */}
        <div className="relative mx-auto w-full min-w-0 max-w-[600px] lg:mx-0 lg:max-w-none" aria-hidden="true">
          <div data-depth="0.5" className="relative z-10 mx-auto w-full max-w-[560px]">
            <div data-window><GalleryWindow /></div>
          </div>

          <div data-depth="0.8" className="absolute -left-4 -top-8 z-20 hidden sm:block lg:-left-24 lg:-top-20"><div data-pop className="rv-float b"><BookingCard /></div></div>
          <div data-depth="0.9" className="absolute -bottom-10 left-2 z-20 hidden sm:block lg:-left-10"><div data-pop className="rv-float c"><DeliveryCard /></div></div>

          <div data-depth="1.1" className="pointer-events-none absolute -bottom-24 -right-4 z-30 w-[150px] sm:w-[180px] lg:-bottom-28 lg:-right-20 lg:w-[196px]" aria-hidden>
            <div data-obj className="rv-float"><Camera className="h-auto w-full -rotate-6" /></div>
          </div>
          <div data-depth="1.0" className="pointer-events-none absolute -right-3 -top-12 z-30 w-[92px] sm:w-[112px] lg:-right-9 lg:w-[124px]" aria-hidden>
            <div data-obj className="rv-float c"><GlassIcon /></div>
          </div>
          <div data-depth="1.2" className="pointer-events-none absolute -bottom-14 left-[46%] z-30 hidden w-[96px] sm:block lg:w-[104px]" aria-hidden>
            <div data-obj className="rv-float b"><Aperture className="h-auto w-full" open={20} /></div>
          </div>
          <div data-depth="0.95" className="pointer-events-none absolute -right-20 top-[34%] z-20 hidden w-[118px] xl:block" aria-hidden>
            <div data-obj className="rv-float b"><Polaroid src={IMG("noiva-buque")} className="rotate-[8deg]" /></div>
          </div>

          <div data-flash className="pointer-events-none absolute inset-[-20%] z-40 opacity-0" aria-hidden
            style={{ background: "radial-gradient(circle at 78% 82%, rgba(255,255,255,1), rgba(255,240,242,.75) 28%, rgba(255,255,255,0) 62%)" }} />
        </div>
      </div>
    </section>
  );
}

/** Ícone da Revela em vidro: o "r" se desenha, preenche e a luz acende (dispara o flash). */
function GlassIcon() {
  return (
    <span className="relative block aspect-square w-full rotate-[9deg] rounded-[26%] p-[18%]"
      style={{ background: "linear-gradient(150deg, #4A4360 0%, #2B2540 55%, #1C1830 100%)", boxShadow: "inset 0 1.5px 0 rgba(255,255,255,.35), inset 0 -10px 24px rgba(201,93,99,.22), 0 26px 50px -20px rgba(43,37,64,.75)" }}>
      <span className="absolute inset-0 rounded-[26%] bg-gradient-to-br from-white/25 via-white/0 to-white/5" />
      <svg viewBox="-9 33 110 110" className="relative h-full w-full overflow-visible">
        <path data-r-fill d={LOGO.r} fill="#E6E1F0" />
        <path data-r-line d={LOGO.r} fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
        <path data-r-dot d={LOGO.dot} fill="#C95D63" style={{ filter: "drop-shadow(0 0 5px rgba(201,93,99,.9))" }} />
      </svg>
    </span>
  );
}
