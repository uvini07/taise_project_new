import { useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { gsap, useGSAP, MQ } from "../gsap.js";
import { CreditsStrip, PlanCards } from "../components/PlanCards.jsx";

const BLADES = [0, 60, 120, 180, 240, 300];

/**
 * Diafragma de câmera: seis lâminas da cor da seção anterior fecham a tela e
 * se abrem em hexágono conforme a página rola, revelando os planos.
 * Só no tablet/computador com movimento; no resto, a seção aparece direto.
 */
function Iris() {
  return (
    <div data-iris aria-hidden className="pointer-events-none invisible absolute inset-0 z-30 overflow-hidden">
      {BLADES.map((a) => (
        <div key={a} data-iris-arm className="absolute left-1/2 top-[50svh] h-0 w-0" style={{ transform: `rotate(${a}deg)` }}>
          <div data-iris-blade className="absolute bottom-0 left-[-70vmax] h-[75vmax] w-[140vmax] bg-rv-lavanda"
            style={{ boxShadow: "0 1px 0 rgba(43,37,64,.18), 0 18px 40px -10px rgba(43,37,64,.35)", backgroundImage: "linear-gradient(0deg, rgba(43,37,64,.10), rgba(43,37,64,0) 18px)" }} />
        </div>
      ))}
    </div>
  );
}

export default function PlansSection() {
  const root = useRef(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MQ.mid, () => {
      const el = root.current;
      const iris = el.querySelector("[data-iris]");
      const arms = el.querySelectorAll("[data-iris-arm]");
      const blades = el.querySelectorAll("[data-iris-blade]");
      // Raio final: até o canto mais distante da seção a partir do centro do diafragma.
      const rEnd = () => Math.hypot(el.offsetWidth / 2, Math.max(el.offsetHeight - window.innerHeight / 2, window.innerHeight / 2)) + 60;
      gsap.set(iris, { autoAlpha: 1 });
      gsap.set(arms, { rotation: (i) => BLADES[i] });
      const tl = gsap.timeline({
        scrollTrigger: { trigger: el, start: "top bottom", end: "top top", scrub: 0.5, invalidateOnRefresh: true },
      });
      tl.fromTo(blades, { y: 0 }, { y: () => -rEnd(), ease: "power2.in", duration: 1 }, 0)
        .to(arms, { rotation: (i) => BLADES[i] + 34, ease: "none", duration: 1 }, 0)
        .set(iris, { autoAlpha: 0 }, 1);
      return () => gsap.set(iris, { autoAlpha: 0 });
    });
    return () => mm.revert();
  }, { scope: root });

  return (
    <section id="planos" ref={root} data-nav-theme="dark" className="rv-grain relative isolate overflow-hidden bg-rv-ameixa py-24 text-rv-lavanda sm:py-28" aria-labelledby="rv-planos">
      <div className="rv-ground" aria-hidden>
        <span className="rv-blob" style={{ left: "-16%", top: "-10%", width: "60vw", height: "60vw", background: "radial-gradient(closest-side, rgba(201,93,99,.45), rgba(201,93,99,0))" }} />
        <span className="rv-blob" style={{ left: "55%", top: "20%", width: "56vw", height: "56vw", background: "radial-gradient(closest-side, rgba(142,134,166,.55), rgba(142,134,166,0))" }} />
        <span className="rv-blob" style={{ left: "20%", top: "60%", width: "50vw", height: "50vw", background: "radial-gradient(closest-side, rgba(230,225,240,.22), rgba(230,225,240,0))" }} />
      </div>
      <Iris />
      <div className="rv-wrap relative z-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 id="rv-planos" className="max-w-2xl text-4xl leading-[1.05] text-white sm:text-5xl lg:text-6xl">Planos com todas as ferramentas</h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-rv-lavanda/75">
              Os três têm site, agenda, pacotes, lista VIP, financeiro, seleção e entrega. Muda o tamanho: seleções abertas, prévias, espaço e prazo de download.
            </p>
          </div>
          <Link to="/planos" className="rv-link inline-flex shrink-0 items-center gap-2 text-[16px] font-medium text-white">
            Comparar os planos <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <div className="mt-14"><PlanCards dark /></div>
        <CreditsStrip dark />
      </div>
    </section>
  );
}
