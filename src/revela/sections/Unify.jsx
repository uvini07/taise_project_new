import { useRef } from "react";
import { Calculator, ClipboardList, FileSpreadsheet, Globe, HardDrive, MessageCircle, NotebookPen, Send } from "lucide-react";
import { gsap, useGSAP, MQ } from "../gsap.js";
import { AppIcon } from "../components/Logo.jsx";

const TOOLS = [
  { label: "Planilha de clientes", Icon: FileSpreadsheet },
  { label: "Agenda de papel", Icon: NotebookPen },
  { label: "Google Drive", Icon: HardDrive },
  { label: "WeTransfer", Icon: Send },
  { label: "Formulário de pedido", Icon: ClipboardList },
  { label: "Lista no WhatsApp", Icon: MessageCircle },
  { label: "Site separado", Icon: Globe },
  { label: "Caderno do financeiro", Icon: Calculator },
];
const OUT = ["Site", "Agenda", "Pacotes", "Lista VIP", "Seleção", "Entrega", "Financeiro", "Polaroidy IA"];
// Posição de cada ferramenta em volta do centro (porcentagem do palco).
const SPOTS = [[-34, -30], [6, -40], [36, -26], [44, 6], [30, 34], [-6, 40], [-38, 28], [-46, -2]];

/**
 * Oito ferramentas soltas são puxadas para o ícone da Revela conforme a
 * página rola (a cena fica parada no lugar com position: sticky).
 */
export default function Unify() {
  const root = useRef(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MQ.mid, () => {
      const el = root.current;
      const chips = gsap.utils.toArray("[data-chip]", el);
      const icon = el.querySelector("[data-icon]");
      const ring = el.querySelector("[data-ring]");
      const after = el.querySelector("[data-after]");
      const stage = el.querySelector("[data-stage]");
      const outs = el.querySelectorAll("[data-out]");
      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: { trigger: el, start: "top top", end: "bottom bottom", scrub: 0.6, invalidateOnRefresh: true },
      });
      tl.fromTo(icon, { scale: 0.62, autoAlpha: 0.55 }, { scale: 0.62, autoAlpha: 0.55, duration: 0.15 }, 0)
        .set(after, { autoAlpha: 0, y: 20 }, 0)
        .to(chips, {
          // Do lugar de cada ferramenta até o centro do palco.
          x: (i) => (-SPOTS[i][0] / 100) * stage.offsetWidth,
          y: (i) => (-SPOTS[i][1] / 100) * stage.offsetHeight,
          scale: 0.25, autoAlpha: 0, rotation: (i) => (i % 2 ? 14 : -14),
          duration: 1, ease: "power3.in", stagger: { each: 0.06, from: "random" },
        }, 0.2)
        .to(icon, { scale: 1, autoAlpha: 1, duration: 0.5, ease: "back.out(1.6)" }, ">-0.25")
        .fromTo(ring, { scale: 0.6, autoAlpha: 0.8 }, { scale: 2.4, autoAlpha: 0, duration: 0.7, ease: "power2.out" }, "<")
        .to(after, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out" }, "<+0.2")
        .fromTo(outs, { autoAlpha: 0, y: -50, scale: 0.4 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.5)", stagger: 0.05 }, "<+0.15")
        .to({}, { duration: 0.35 });
      return undefined;
    });
    return () => mm.revert();
  }, { scope: root });

  return (
    <section ref={root} className="relative bg-rv-nevoa md:h-[220vh]" aria-labelledby="rv-unify">
      <div className="relative flex min-h-[100svh] flex-col overflow-hidden md:sticky md:top-0 md:h-[100svh]">
        <div className="rv-ground" aria-hidden>
          <span className="rv-blob" style={{ left: "-12%", top: "-20%", width: "50vw", height: "50vw", background: "radial-gradient(closest-side, rgba(230,225,240,1), rgba(230,225,240,0))" }} />
          <span className="rv-blob" style={{ left: "60%", top: "40%", width: "46vw", height: "46vw", background: "radial-gradient(closest-side, rgba(201,93,99,.18), rgba(201,93,99,0))" }} />
        </div>
        <div className="rv-wrap relative z-10 pt-24 md:pt-28">
          <h2 id="rv-unify" className="max-w-2xl text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">Oito ferramentas viram um painel</h2>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-rv-ink2">
            Clientes, agenda, fotos, entrega e dinheiro deixam de ficar espalhados. Tudo fica na Revela, com o seu site na frente.
          </p>
        </div>
        <div className="rv-wrap relative z-10 flex flex-1 items-center justify-center py-12 md:py-0">
          <div data-stage className="relative grid w-full max-w-[1000px] grid-cols-2 gap-3 sm:grid-cols-3 md:block md:aspect-[2.3/1]">
            {TOOLS.map(({ label, Icon }, i) => (
              <span key={label} className="md:absolute md:-translate-x-1/2 md:-translate-y-1/2" style={{ left: `${50 + SPOTS[i][0]}%`, top: `${50 + SPOTS[i][1]}%` }}>
                <span data-chip className="lg lg-pill flex items-center gap-2.5 px-4 py-3 text-[15px] text-rv-ameixa md:whitespace-nowrap" style={{ "--lg-bg": "rgba(255,255,255,.55)" }}>
                  <Icon className="h-[18px] w-[18px] shrink-0 text-rv-lilas" aria-hidden />{label}
                </span>
              </span>
            ))}
            <div className="col-span-full mt-6 flex flex-col items-center md:absolute md:left-1/2 md:top-1/2 md:mt-0 md:-translate-x-1/2 md:-translate-y-1/2">
              <div className="relative">
                <span data-ring aria-hidden className="absolute inset-0 rounded-[28%] border-2 border-rv-rosa/60 opacity-0" />
                <div data-icon><AppIcon size={132} /></div>
              </div>
              <p data-after className="mt-5 font-revela text-2xl text-rv-ameixa">Painel da Revela</p>
              <ul className="mt-4 flex max-w-[620px] flex-wrap justify-center gap-2" aria-label="Ferramentas do painel">
                {OUT.map((t) => (
                  <li key={t} data-out className="rounded-full bg-rv-ameixa px-3.5 py-1.5 text-[14px] text-rv-lavanda shadow-[0_10px_22px_-12px_rgba(43,37,64,.7)]">{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
