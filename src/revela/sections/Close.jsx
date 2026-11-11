import { useRef } from "react";
import { Link } from "react-router-dom";
import { gsap, useGSAP, MQ } from "../gsap.js";
import { Wordmark } from "../components/Logo.jsx";
import { FROM_PRICE } from "../data.js";

/** Fechamento: a logo monta letra a letra e a luz acende quando a seção aparece. */
export default function Close() {
  const root = useRef(null);
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MQ.mid, () => {
      const q = gsap.utils.selector(root);
      const letters = q('[data-mark] [data-part]:not([data-part="dot"])');
      const dot = q('[data-mark] [data-part="dot"]');
      const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: "top 62%", toggleActions: "play none none reverse" } });
      tl.from(letters, { yPercent: 60, autoAlpha: 0, duration: 0.9, stagger: 0.07, ease: "expo.out", transformOrigin: "50% 100%" })
        .from(dot, { scale: 0, duration: 0.5, ease: "back.out(2.2)", transformOrigin: "50% 50%" }, "-=0.35")
        .fromTo(q("[data-halo]"), { autoAlpha: 0, scale: 0.3 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: "power2.out" }, "<")
        .to(q("[data-halo]"), { autoAlpha: 0.35, duration: 1.2, ease: "power2.out" });
      return undefined;
    });
    return () => mm.revert();
  }, { scope: root });

  return (
    <section ref={root} className="relative isolate overflow-hidden bg-rv-lavanda py-28 sm:py-36" aria-labelledby="rv-close">
      <div className="rv-ground" aria-hidden>
        <span className="rv-blob" style={{ left: "20%", top: "-30%", width: "60vw", height: "60vw", background: "radial-gradient(closest-side, rgba(255,255,255,.95), rgba(255,255,255,0))" }} />
        <span className="rv-blob" style={{ left: "-20%", top: "40%", width: "50vw", height: "50vw", background: "radial-gradient(closest-side, rgba(142,134,166,.45), rgba(142,134,166,0))" }} />
      </div>
      <div className="rv-wrap relative z-10 flex flex-col items-center text-center">
        <div className="relative w-full max-w-[720px]">
          <span data-halo aria-hidden className="pointer-events-none absolute left-[5.8%] top-[34%] h-[38%] w-[16%] rounded-full opacity-0"
            style={{ background: "radial-gradient(closest-side, rgba(201,93,99,.7), rgba(201,93,99,0))", filter: "blur(6px)" }} />
          <Wordmark data-mark className="relative h-auto w-full text-rv-ameixa" decorative />
        </div>
        <h2 id="rv-close" className="mt-14 max-w-2xl text-4xl leading-[1.05] sm:text-5xl">Seu estúdio inteiro num painel</h2>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-rv-ink2">
          Site, agenda, seleção, entrega e uma assistente com IA no mesmo lugar, a partir de R$ {FROM_PRICE} por mês.
        </p>
        <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link to="/cadastro" className="rv-btn rv-btn-primary"><span className="rv-btn-dot" aria-hidden />Usar teste de 30 dias</Link>
          <Link to="/entrar" className="rv-btn lg lg-pill rv-btn-glass">Entrar</Link>
        </div>
      </div>
    </section>
  );
}
