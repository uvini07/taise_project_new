import { useRef } from "react";
import { gsap, useGSAP, MQ } from "../gsap.js";

const WORDS = ["Do", "agendamento", "à", "entrega"];

/**
 * A luz da logo cai na página e a frase cresce para a esquerda, uma palavra
 * de cada vez; a cada palavra a luz anda e diminui até virar o ponto final.
 * Celular e "reduzir movimento": a frase pronta, parada.
 */
export default function DotStatement() {
  const root = useRef(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MQ.mid, () => {
      const el = root.current;
      const words = gsap.utils.toArray("[data-word]", el);
      const dot = el.querySelector("[data-stop]");
      const line = el.querySelector("[data-line]");
      const glow = el.querySelector("[data-glow]");
      const n = words.length;
      const S0 = 7;
      // Posições medidas no layout (offsetLeft/Top ignoram os transforms da animação).
      const last = words[n - 1];
      const endRight = () => last.offsetLeft + last.offsetWidth;
      const endBottom = () => last.offsetTop + last.offsetHeight;
      const dx = (k) => words[k].offsetLeft + words[k].offsetWidth - endRight();
      const dy = (k) => words[k].offsetTop + words[k].offsetHeight - endBottom();
      const sc = (k) => 1 + ((n - 1 - k) * (S0 - 1)) / n;

      // A luz cresce a partir do canto de baixo à esquerda: nunca cobre a palavra ao lado.
      gsap.set(dot, { transformOrigin: "0% 100%" });
      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: { trigger: el, start: "top top", end: "+=170%", scrub: 0.7, pin: true, invalidateOnRefresh: true },
      });
      tl.set(words, { autoAlpha: 0 }, 0)
        .set(line, { autoAlpha: 0, y: 24 }, 0)
        .fromTo(dot, { x: () => dx(0), y: () => -window.innerHeight * 0.36, scale: S0 },
          { x: () => dx(0), y: () => dy(0), scale: () => sc(0), duration: 1, ease: "power3.in" }, 0)
        .fromTo(glow, { autoAlpha: 0.35, scale: 0.55 }, { autoAlpha: 1, scale: 1, duration: 1, ease: "power2.in" }, 0)
        .fromTo(words[0], { autoAlpha: 0, x: 70 }, { autoAlpha: 1, x: 0, duration: 0.55, ease: "power3.out" }, 0.92);
      for (let k = 1; k < n; k += 1) {
        tl.to(dot, { x: () => dx(k), y: () => dy(k), scale: () => sc(k), duration: 0.7 })
          .fromTo(words[k], { autoAlpha: 0, x: 70 }, { autoAlpha: 1, x: 0, duration: 0.55, ease: "power3.out" }, "<+0.15");
      }
      tl.to(dot, { scale: 1, duration: 0.45, ease: "power3.out" })
        .to(glow, { autoAlpha: 0.35, scale: 0.6, duration: 0.6 }, "<")
        .to(line, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power3.out" })
        .to({}, { duration: 0.5 });
      return undefined;
    });
    return () => mm.revert();
  }, { scope: root });

  return (
    <section ref={root} data-nav-theme="dark" className="rv-grain relative isolate flex min-h-[100svh] items-center overflow-hidden bg-rv-ameixa text-rv-lavanda" aria-label="Do agendamento à entrega">
      <div data-glow aria-hidden className="pointer-events-none absolute inset-0 -z-10 m-auto h-[70vmin] w-[70vmin] rounded-full"
        style={{ background: "radial-gradient(closest-side, rgba(201,93,99,.35), rgba(201,93,99,0))" }} />
      <div className="rv-wrap py-24 text-center">
        <h2 className="relative mx-auto max-w-[13ch] text-[3.25rem] leading-[1.02] sm:text-7xl lg:text-[7.5rem]">
          {WORDS.map((w, i) => (
            <span key={w}>
              <span data-word className="inline-block">{w}</span>
              {i < WORDS.length - 1 ? " " : null}
            </span>
          ))}
          <span data-stop aria-hidden className="ml-[0.03em] inline-block h-[0.12em] w-[0.12em] rounded-full bg-rv-rosa align-baseline"
            style={{ boxShadow: "0 0 .35em rgba(201,93,99,.75)" }} />
          <span className="sr-only">.</span>
        </h2>
        <p data-line className="mx-auto mt-10 max-w-xl text-lg leading-relaxed text-rv-lavanda/75 sm:text-xl">
          Site, agenda, pacotes, lista VIP, seleção, entrega e financeiro no mesmo painel.
        </p>
      </div>
    </section>
  );
}
