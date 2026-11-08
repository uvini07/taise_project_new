import { useRef } from "react";
import { CalendarDays, Check, Clock3, Send } from "lucide-react";
import { gsap, useGSAP, MQ } from "../gsap.js";
import { siteHost } from "../hooks.js";

const IMG = (n) => `/revela/img/${n}.webp`;

const STEPS = [
  { title: "Crie sua conta", text: "Escolha o plano e o endereço do seu site." },
  { title: "Monte o seu site", text: "Coloque suas fotos, cores e pacotes. Agenda e lista VIP já vêm prontas." },
  { title: "Receba os agendamentos", text: "O cliente escolhe o horário e paga o sinal pelo Pix. O horário sai da agenda na hora." },
  { title: "Selecione e entregue", text: "O cliente escolhe as fotos na galeria protegida e baixa as editadas pelo link de entrega." },
];

function Screen({ i }) {
  const box = "rounded-2xl bg-white p-3 ring-1 ring-rv-linha";
  if (i === 0) return (
    <div className="space-y-3">
      <p className="font-revela text-2xl text-rv-ameixa">Crie sua conta</p>
      <div className="grid grid-cols-3 gap-1.5 text-center text-[11px]">
        {["Essencial", "Profissional", "Eventos"].map((p, k) => (
          <span key={p} className={`rounded-xl px-1 py-2 ${k === 1 ? "bg-rv-ameixa text-rv-lavanda" : "bg-white text-rv-ink2 ring-1 ring-rv-linha"}`}>{p}</span>
        ))}
      </div>
      <div className={box}>
        <p className="text-[11px] text-rv-ink2">Endereço do seu site</p>
        <p className="mt-1 truncate text-[13px] text-rv-ameixa">{siteHost()}/<b className="font-medium">anafotografia</b></p>
        <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-[#2F6B5C]"><Check className="h-3 w-3" />Disponível</p>
      </div>
      <div className={box}><p className="text-[11px] text-rv-ink2">Nome do estúdio</p><p className="text-[13px] text-rv-ameixa">Ana Lima Fotografia</p></div>
      <span className="block rounded-full bg-rv-ameixa py-2.5 text-center text-[13px] font-medium text-rv-lavanda">Criar conta</span>
    </div>
  );
  if (i === 1) return (
    <div className="space-y-3">
      <p className="font-revela text-2xl text-rv-ameixa">Seu site</p>
      <div className="relative overflow-hidden rounded-2xl">
        <img src={IMG("noiva-buque")} alt="" loading="lazy" decoding="async" className="h-36 w-full object-cover" />
        <span className="absolute bottom-2 left-3 font-revela text-lg text-white drop-shadow">Ana Lima</span>
      </div>
      <div className={`${box} flex items-center justify-between`}>
        <span className="text-[12px] text-rv-ink2">Cor principal</span>
        <span className="flex gap-1.5">{["#C95D63", "#3F7D6E", "#C9A44C", "#2B2540"].map((c, k) => <i key={c} className={`h-5 w-5 rounded-full ${k === 0 ? "ring-2 ring-rv-ameixa ring-offset-2" : ""}`} style={{ background: c }} />)}</span>
      </div>
      {["Agenda online", "Lista VIP", "Pacotes"].map((t) => (
        <div key={t} className={`${box} flex items-center justify-between py-2.5`}>
          <span className="text-[12px] text-rv-ameixa">{t}</span>
          <span className="flex h-5 w-9 items-center justify-end rounded-full bg-rv-rosa px-0.5"><i className="h-4 w-4 rounded-full bg-white" /></span>
        </div>
      ))}
    </div>
  );
  if (i === 2) return (
    <div className="space-y-2.5">
      <p className="font-revela text-2xl text-rv-ameixa">Agenda</p>
      {[["Sáb 19", "16h", "Ensaio gestante", true], ["Dom 20", "9h", "Ensaio de família", false], ["Ter 22", "15h", "Newborn", true], ["Qui 24", "10h", "Aniversário", true]].map(([d, h, t, ok]) => (
        <div key={d} className={`${box} flex items-center gap-3`}>
          <span className="flex h-10 w-10 flex-col items-center justify-center rounded-xl bg-rv-lavanda text-[10px] leading-tight text-rv-ameixa"><CalendarDays className="mb-0.5 h-3.5 w-3.5" />{d.split(" ")[1]}</span>
          <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-medium text-rv-ameixa">{t}</p><p className="text-[11px] text-rv-ink2">{d} · {h}</p></div>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${ok ? "bg-[#2F6B5C]/10 text-[#2F6B5C]" : "bg-rv-rosa/10 text-rv-rosa"}`}>{ok ? "Sinal pago" : "Aguardando"}</span>
        </div>
      ))}
    </div>
  );
  return (
    <div className="space-y-3">
      <p className="font-revela text-2xl text-rv-ameixa">Entrega</p>
      <div className="grid grid-cols-3 gap-1.5">
        {["gestante-floral", "gestante-tijolo", "pezinho", "casal-ultrassom", "gestante-vestido", "gestante-campo"].map((n) => (
          <img key={n} src={IMG(n)} alt="" loading="lazy" decoding="async" className="aspect-square w-full rounded-lg object-cover" />
        ))}
      </div>
      <div className={box}>
        <p className="text-[13px] font-medium text-rv-ameixa">48 fotos em alta</p>
        <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-rv-ink2"><Clock3 className="h-3 w-3" />Disponível por 14 dias</p>
      </div>
      <span className="flex items-center justify-center gap-2 rounded-full bg-rv-ameixa py-2.5 text-[13px] font-medium text-rv-lavanda"><Send className="h-3.5 w-3.5" />Enviar link pelo WhatsApp</span>
    </div>
  );
}

function Phone({ children, className = "" }) {
  return (
    <div className={`lg relative mx-auto w-[300px] p-2.5 ${className}`} style={{ "--lg-r": "46px", "--lg-bg": "rgba(255,255,255,.4)" }} aria-hidden="true">
      <div className="relative h-[540px] overflow-hidden rounded-[38px] bg-rv-nevoa lg:h-[600px]">
        <span className="absolute left-1/2 top-2.5 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-rv-ameixa" aria-hidden />
        {children}
      </div>
    </div>
  );
}

export default function HowItWorks() {
  const root = useRef(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MQ.full, () => {
      const q = gsap.utils.selector(root);
      const steps = q("[data-step]");
      const screens = q("[data-screen]");
      const n = steps.length;
      gsap.set(steps.slice(1), { opacity: 0.32 });
      gsap.set(screens.slice(1), { autoAlpha: 0, y: 46, scale: 0.97 });
      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: { trigger: root.current, start: "top top", end: () => `+=${window.innerHeight * 2.6}`, pin: true, scrub: 0.6, invalidateOnRefresh: true },
      });
      // A câmera percorre o trilho do primeiro ao último passo, e o trilho vai se acendendo.
      tl.to(q("[data-cam]"), {
        motionPath: { path: q("[data-rail]")[0], align: q("[data-rail]")[0], alignOrigin: [0.5, 0.5] },
        duration: n - 1, ease: "none",
      }, 0)
        .fromTo(q("[data-rail-fill]"), { drawSVG: "0%" }, { drawSVG: "100%", duration: n - 1, ease: "none" }, 0);
      for (let k = 0; k < n - 1; k += 1) {
        const at = k + 0.3;
        tl.to(steps[k], { opacity: 0.32, duration: 0.4 }, at)
          .to(steps[k + 1], { opacity: 1, duration: 0.4 }, at)
          .to(screens[k], { autoAlpha: 0, y: -46, scale: 0.97, duration: 0.3, ease: "power2.in" }, at)
          .to(screens[k + 1], { autoAlpha: 1, y: 0, scale: 1, duration: 0.4, ease: "power3.out" }, at + 0.3);
      }
      tl.to({}, { duration: 0.3 });
      return undefined;
    });
    return () => mm.revert();
  }, { scope: root });

  return (
    <section id="como-funciona" ref={root} className="relative isolate overflow-hidden bg-rv-lavanda" aria-labelledby="rv-como">
      <div className="rv-ground" aria-hidden>
        <span className="rv-blob" style={{ left: "48%", top: "-10%", width: "56vw", height: "56vw", background: "radial-gradient(closest-side, rgba(255,255,255,.9), rgba(255,255,255,0))" }} />
        <span className="rv-blob" style={{ left: "70%", top: "40%", width: "40vw", height: "40vw", background: "radial-gradient(closest-side, rgba(201,93,99,.22), rgba(201,93,99,0))" }} />
      </div>
      <div className="rv-wrap relative z-10 grid gap-14 py-24 lg:h-[100svh] lg:min-h-[640px] lg:grid-cols-[1fr_auto] lg:items-center lg:gap-20 lg:pb-6 lg:pt-24">
        <div>
          <h2 id="rv-como" className="max-w-2xl text-4xl leading-[1.05] sm:text-5xl lg:text-[3.25rem]">Do cadastro à entrega em quatro passos</h2>
          <ol className="relative mt-10 space-y-6 lg:mt-9 lg:space-y-5 lg:pl-20">
            {/* Trilho com a câmera (só no computador). */}
            <svg className="pointer-events-none absolute left-0 top-2 hidden h-[calc(100%-1rem)] w-14 overflow-visible lg:block" viewBox="0 0 56 400" preserveAspectRatio="none" aria-hidden>
              <path d="M28 6 C 8 70, 48 110, 28 140 S 8 230, 28 270 S 48 350, 28 394" fill="none" stroke="rgba(43,37,64,.14)" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeDasharray="2 7" strokeLinecap="round" />
              <path data-rail data-rail-fill d="M28 6 C 8 70, 48 110, 28 140 S 8 230, 28 270 S 48 350, 28 394" fill="none" stroke="#C95D63" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span data-cam className="pointer-events-none absolute left-0 top-0 hidden h-11 w-11 items-center justify-center rounded-2xl bg-rv-ameixa text-rv-lavanda shadow-[0_10px_24px_-8px_rgba(43,37,64,.6)] lg:flex" aria-hidden>
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 8h3l1.5-2h7L17 8h3v11H4z" /><circle cx="12" cy="13.5" r="3.5" /><circle cx="17.5" cy="10.5" r=".6" fill="#C95D63" stroke="none" />
              </svg>
            </span>
            {STEPS.map((s, i) => (
              <li key={s.title} data-step className="relative">
                <p className="text-[15px] font-medium text-rv-rosa">Passo {i + 1}</p>
                <h3 className="mt-1 text-3xl leading-tight lg:text-[1.7rem]">{s.title}</h3>
                <p className="mt-1.5 max-w-md text-[17px] leading-relaxed text-rv-ink2 lg:text-[16px]">{s.text}</p>
                <div className="mt-6 lg:hidden"><Phone><div className="px-4 pb-4 pt-12"><Screen i={i} /></div></Phone></div>
              </li>
            ))}
          </ol>
        </div>
        <div className="hidden lg:block">
          <Phone>
            {STEPS.map((s, i) => (
              <div key={s.title} data-screen className="absolute inset-0 px-4 pb-4 pt-12">
                <Screen i={i} />
              </div>
            ))}
          </Phone>
        </div>
      </div>
    </section>
  );
}
