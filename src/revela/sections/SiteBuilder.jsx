import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, ImagePlus, LayoutTemplate, MousePointerClick, Palette, Rocket, Sparkles, Type } from "lucide-react";
import { siteHost, useOffscreenPause } from "../hooks.js";

const IMG = (n) => `/revela/img/${n}.webp`;

// Cor principal e o tom escuro dela (o modelo Clássico usa o escuro no degradê do topo e no rodapé).
const COLORS = [
  { c: "#C95D63", dark: "#3A1D22", name: "Rosa" }, { c: "#3F7D6E", dark: "#13302A", name: "Verde" },
  { c: "#C9A44C", dark: "#392D12", name: "Dourado" }, { c: "#3B5B8C", dark: "#141F33", name: "Azul" },
  { c: "#B5653A", dark: "#3A1F12", name: "Terracota" }, { c: "#2B2540", dark: "#16131F", name: "Ameixa" },
];
const FONTS = [
  { f: "Cormorant Garamond", name: "Clássica" }, { f: "Playfair Display", name: "Revista" },
  { f: "DM Serif Display", name: "Forte" }, { f: "Italiana", name: "Romântica" },
];
// Construção do site no modelo Clássico, um passo de cada vez.
const BUILD = [
  { k: "modelo", label: "Modelo Clássico" },
  { k: "logo", label: "Nome e logo" },
  { k: "fotos", label: "Fotos do topo" },
  { k: "textos", label: "Textos do topo" },
  { k: "cor", label: "Cor principal" },
  { k: "fonte", label: "Fonte dos títulos" },
  { k: "secoes", label: "Sobre e pacotes" },
  { k: "publicar", label: "Publicar" },
];
const ROUNDS = [{ color: 0, font: 1 }, { color: 1, font: 2 }, { color: 4, font: 3 }, { color: 3, font: 1 }];

const FONT_URL = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital@0;1&family=DM+Serif+Display&family=Italiana&display=swap";
function loadDemoFonts() {
  if (document.getElementById("rv-demo-fonts")) return;
  document.head.appendChild(Object.assign(document.createElement("link"), { id: "rv-demo-fonts", rel: "stylesheet", href: FONT_URL }));
}

/* ------------------------ Prévia: site no modelo Clássico ------------------------ */

const Ghost = ({ className = "", children }) => (
  <span className={`flex items-center justify-center gap-1 rounded-md border border-dashed border-white/60 text-white/80 ${className}`}>{children}</span>
);

function ClassicSite({ step, color, font }) {
  const { c, dark } = color;
  const f = `"${font.f}", Georgia, serif`;
  const has = (k) => step >= BUILD.findIndex((b) => b.k === k);
  const accent = has("cor") ? c : "#9A93AE";
  const deep = has("cor") ? dark : "#2B2540";
  const ff = has("fonte") ? f : "\"Cormorant Garamond\", Georgia, serif";
  return (
    <div className="absolute inset-x-0 top-0 h-[200%] transition-transform duration-1000 ease-[cubic-bezier(.65,0,.35,1)]"
      style={{ transform: has("secoes") ? "translateY(-50%)" : "none" }}>
      {/* Topo: foto em tela cheia, degradê escuro e texto embaixo à esquerda. */}
      <div className="relative h-1/2 overflow-hidden transition-colors duration-700" style={{ background: deep }}>
        {has("fotos") ? (
          <img key="foto" src={IMG("familia-brincando")} alt="" draggable="false" className="rv-swap absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#8E86A6] to-[#4A4360]">
            <Ghost className="px-3 py-2 text-[11px]"><ImagePlus className="h-3.5 w-3.5" />Suas fotos aqui</Ghost>
          </div>
        )}
        <div className="absolute inset-0 transition-[background] duration-700" style={{ background: `linear-gradient(to top, ${deep}E6, ${deep}59 55%, ${deep}4D)` }} />
        <div className="relative flex items-center gap-3 px-[4%] py-[2.4%]">
          {has("logo")
            ? <span key="nome" className="rv-swap text-[clamp(12px,1.7vw,19px)] leading-none text-white" style={{ fontFamily: ff }}>Ana Lima</span>
            : <Ghost className="px-2 py-1 text-[9px]">Sua logo</Ghost>}
          <span className="ml-auto hidden gap-3 text-[9px] text-white/75 sm:flex"><span>Sobre</span><span>Pacotes</span><span>Galeria</span><span>Contato</span></span>
          <span className="rounded-full px-2.5 py-1 text-[9px] font-medium text-white transition-colors duration-700" style={{ background: accent }}>Agendar</span>
        </div>
        <div className="absolute inset-x-[4%] bottom-[9%]">
          {has("textos") ? (
            <div key="txt" className="rv-swap max-w-[70%]">
              <p className="flex items-center gap-1.5 text-[9px] uppercase tracking-[.25em] text-white/85"><Sparkles className="h-2.5 w-2.5" />Fotografia de família</p>
              <p className="mt-2 text-[clamp(22px,4vw,46px)] leading-[1.02] text-white transition-[font-family]" style={{ fontFamily: ff }}>Histórias que viram memória</p>
              <p className="mt-2 max-w-[80%] text-[10px] leading-snug text-white/80">Ensaios leves, com luz natural, para guardar o que passa rápido demais.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Ghost className="w-28 py-1 text-[9px]">Seu título aqui</Ghost>
              <span className="block h-3 w-[46%] rounded bg-white/25" /><span className="block h-2 w-[34%] rounded bg-white/20" />
            </div>
          )}
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[10px] font-medium text-white transition-colors duration-700" style={{ background: accent }}>Conhecer os pacotes <ArrowRight className="h-2.5 w-2.5" /></span>
            <span className="rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-medium text-[#2B2540]">Ver a galeria</span>
          </div>
        </div>
        <span className="absolute bottom-[9%] right-[4%] hidden gap-1 sm:flex">{[0, 1, 2].map((i) => <i key={i} className={`h-1.5 rounded-full ${i ? "w-1.5 bg-white/50" : "w-4 bg-white"}`} />)}</span>
      </div>

      {/* Seções em cartões arredondados e rodapé escuro. */}
      <div className="flex h-1/2 flex-col bg-[#FBF8F4]">
        <div className="grid min-h-0 flex-1 gap-[3%] p-[4%] pb-[3%] sm:grid-cols-[1fr_1.45fr]">
          <div className="flex gap-3 rounded-2xl bg-white p-3 shadow-[0_10px_30px_-18px_rgba(0,0,0,.35)]">
            <img src={IMG("fotografo")} alt="" loading="lazy" draggable="false" className="h-full w-[42%] rounded-xl object-cover" />
            <div className="min-w-0 self-center">
              <p className="text-[8px] uppercase tracking-[.2em]" style={{ color: accent }}>Sobre mim</p>
              <p className="mt-1 text-[clamp(13px,1.9vw,20px)] leading-tight text-[#2B2540]" style={{ fontFamily: ff }}>Oi, eu sou a Ana</p>
              <p className="mt-1 text-[9px] leading-snug text-[#4A4360]">Fotografo famílias há 8 anos, sempre com calma e carinho.</p>
            </div>
          </div>
          <div className="grid min-h-0 grid-cols-3 gap-2">
            {[["gestante-campo", "Gestante", "R$ 450"], ["familia-cachorro", "Família", "R$ 520"], ["pezinho", "Newborn", "R$ 680"]].map(([n, t, p]) => (
              <div key={n} className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_-18px_rgba(0,0,0,.35)]">
                <img src={IMG(n)} alt="" loading="lazy" draggable="false" className="min-h-0 w-full flex-1 object-cover" />
                <div className="p-2">
                  <p className="text-[clamp(11px,1.5vw,16px)] leading-tight text-[#2B2540]" style={{ fontFamily: ff }}>{t}</p>
                  <p className="text-[9px] font-medium transition-colors duration-700" style={{ color: accent }}>{p}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between px-[4%] py-[2.5%] text-white transition-colors duration-700" style={{ background: deep }}>
          <span className="text-[clamp(12px,1.6vw,18px)]" style={{ fontFamily: ff }}>Ana Lima</span>
          <span className="text-[9px] text-white/70">Instagram · WhatsApp · Políticas</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Editor (demo) ----------------------------- */

const Group = ({ icon: Icon, label, children }) => (
  <div>
    <p className="mb-2 flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-wider text-rv-lilas"><Icon className="h-3.5 w-3.5" aria-hidden />{label}</p>
    {children}
  </div>
);

function EditorDemo() {
  const box = useRef(null);
  const [step, setStep] = useState(0);
  const [color, setColor] = useState(0);
  const [font, setFont] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { loadDemoFonts(); io.disconnect(); } }, { rootMargin: "600px" });
    if (box.current) io.observe(box.current);
    return () => io.disconnect();
  }, []);

  // Constrói o site sozinho, passo a passo; a cada volta usa outra cor e fonte.
  useEffect(() => {
    if (!auto) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setStep(BUILD.length - 2); return undefined; }
    let s = 0; let round = 0; let t;
    const tick = () => {
      if (box.current?.closest("[data-offscreen]")) { t = setTimeout(tick, 1000); return; }
      s += 1;
      if (s >= BUILD.length) { s = 0; round = (round + 1) % ROUNDS.length; setColor(0); setFont(0); }
      const k = BUILD[s].k;
      if (k === "cor") setColor(ROUNDS[round].color);
      if (k === "fonte") setFont(ROUNDS[round].font);
      setStep(s);
      t = setTimeout(tick, k === "publicar" ? 3400 : k === "secoes" ? 2600 : 1700);
    };
    t = setTimeout(tick, 1600);
    return () => clearTimeout(t);
  }, [auto]);

  const take = () => setAuto(false);
  const pickColor = (i) => { setColor(i); setStep((s) => Math.max(s, 4)); };
  const pickFont = (i) => { setFont(i); setStep((s) => Math.max(s, 5)); };
  const published = step === BUILD.length - 1;

  return (
    <div ref={box} className="lg overflow-hidden" style={{ "--lg-r": "26px", "--lg-bg": "rgba(255,255,255,.55)" }}>
      <div className="flex items-center gap-3 border-b border-white/60 px-4 py-3">
        <span className="flex gap-1.5" aria-hidden>{[0, 1, 2].map((i) => <i key={i} className="h-2.5 w-2.5 rounded-full bg-rv-ameixa/15" />)}</span>
        <span className="text-[13px] font-medium text-rv-ameixa">Editar meu site</span>
        <span className="ml-auto hidden items-center gap-1.5 text-[12px] text-rv-ink2 sm:inline-flex"><i className="h-1.5 w-1.5 rounded-full bg-[#2F6B5C]" />Prévia ao vivo</span>
        <span className={`rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-colors ${published ? "bg-[#2F6B5C] text-white" : "bg-rv-ameixa text-rv-lavanda"}`}>{published ? "Publicado" : "Salvar"}</span>
      </div>
      <div className="grid lg:grid-cols-[290px_minmax(0,1fr)]">
        <div className="order-2 space-y-5 border-t border-white/60 p-4 sm:p-5 lg:order-1 lg:border-r lg:border-t-0" onPointerDown={take}>
          <Group icon={LayoutTemplate} label="Montando o site">
            <ol className="grid grid-cols-2 gap-1.5 lg:grid-cols-1">
              {BUILD.map((b, i) => {
                const done = i < step || (published && i === step);
                const now = i === step && !published;
                return (
                  <li key={b.k}>
                    <button type="button" onClick={() => setStep(i)} aria-current={now ? "step" : undefined}
                      className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-[13px] transition-colors ${now ? "rv-pulse bg-rv-ameixa text-rv-lavanda" : done ? "bg-white/80 text-rv-ameixa" : "text-rv-ink2/70 hover:bg-white/60"}`}>
                      <span className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[10px] ${done ? "bg-[#2F6B5C] text-white" : now ? "bg-rv-rosa text-white" : "ring-1 ring-rv-lilas/50"}`}>
                        {done ? <Check className="h-3 w-3" aria-hidden /> : i + 1}
                      </span>
                      {b.label}
                    </button>
                  </li>
                );
              })}
            </ol>
          </Group>
          <Group icon={Palette} label="Cor principal">
            <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Cor principal">
              {COLORS.map((k, i) => (
                <button key={k.c} type="button" role="radio" aria-checked={color === i && step >= 4} aria-label={k.name} title={k.name} onClick={() => pickColor(i)}
                  className={`h-8 w-8 rounded-full transition-transform hover:scale-110 ${color === i && step >= 4 ? "ring-2 ring-rv-ameixa ring-offset-2 ring-offset-white" : ""}`} style={{ background: k.c }} />
              ))}
            </div>
          </Group>
          <Group icon={Type} label="Fonte dos títulos">
            <div className="grid grid-cols-4 gap-1.5 lg:grid-cols-2" role="radiogroup" aria-label="Fonte dos títulos">
              {FONTS.map((k, i) => (
                <button key={k.f} type="button" role="radio" aria-checked={font === i && step >= 5} aria-label={`Fonte ${k.name}`} onClick={() => pickFont(i)}
                  className={`rounded-xl px-2 py-2 text-center transition-colors ${font === i && step >= 5 ? "bg-rv-ameixa text-rv-lavanda" : "bg-white/80 text-rv-ameixa hover:bg-white"}`}>
                  <span className="block text-[22px] leading-none" style={{ fontFamily: `"${k.f}", serif` }}>Aa</span>
                  <span className="mt-1 block text-[11px] opacity-75">{k.name}</span>
                </button>
              ))}
            </div>
          </Group>
          <p className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2 text-[12px] text-rv-ink2">
            <MousePointerClick className="h-4 w-4 shrink-0 text-rv-rosa" aria-hidden />{auto ? "Toque nos passos, cores e fontes para testar você mesma." : "Isso. É assim no painel de verdade."}
          </p>
        </div>
        <div className="order-1 p-3 sm:p-4 lg:order-2">
          <div className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_50px_-24px_rgba(43,37,64,.5)] ring-1 ring-rv-linha" aria-hidden>
            <div className="flex items-center gap-2 border-b border-rv-linha/70 bg-rv-nevoa px-3 py-1.5">
              <span className="flex gap-1">{[0, 1, 2].map((i) => <i key={i} className="h-1.5 w-1.5 rounded-full bg-rv-ameixa/15" />)}</span>
              <span className="truncate rounded-full bg-white px-2.5 py-0.5 text-[10px] text-rv-ink2">{siteHost()}/analima</span>
              <span className="ml-auto text-[10px] text-rv-lilas">Modelo Clássico</span>
            </div>
            <div className="relative aspect-[4/5] overflow-hidden sm:aspect-[16/10]">
              <ClassicSite step={step} color={COLORS[color]} font={FONTS[font]} />
              {published && (
                <div className="absolute inset-x-0 top-[6%] flex justify-center">
                  <div className="rv-swap flex items-center gap-2 whitespace-nowrap rounded-full bg-white px-4 py-2 text-[12px] font-medium text-[#2F6B5C] shadow-[0_16px_36px_-14px_rgba(0,0,0,.5)]">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2F6B5C] text-white"><Check className="h-3 w-3" /></span>
                    Seu site está no ar!
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const STEPS = [
  { icon: LayoutTemplate, t: "Escolha um modelo", d: "Comece pelo Clássico, como no exemplo, ou escolha outro dos 10 modelos. Troque quando quiser, sem perder nada." },
  { icon: Palette, t: "Deixe com a sua cara", d: "Logo, cores, fontes, textos e fotos. Você toca no que quer mudar e vê na hora." },
  { icon: Rocket, t: "Salve e está no ar", d: "Seu site fica no seu endereço, pronto para mandar no Instagram e no WhatsApp." },
];
const EDITABLE = ["Nome e logo", "Fotos do topo", "Sobre você", "Pacotes e preços", "Galeria", "Depoimentos", "Contato e WhatsApp", "Rodapé"];

/** Mostra como é fácil montar o próprio site: editor com prévia ao vivo. */
export default function SiteBuilder() {
  const root = useRef(null);
  useOffscreenPause(root, "0px");
  return (
    <section id="editor" ref={root} className="relative isolate overflow-hidden bg-rv-lavanda py-24 sm:py-28" aria-labelledby="rv-editor">
      <style>{`
        @keyframes rv-swap-in { from { opacity: 0; transform: scale(1.025); } to { opacity: 1; transform: none; } }
        .rv-swap { animation: rv-swap-in .55s cubic-bezier(.16,1,.3,1) both; }
        @keyframes rv-pulse-k { 0% { box-shadow: 0 0 0 0 rgba(201,93,99,.55); } 100% { box-shadow: 0 0 0 10px rgba(201,93,99,0); } }
        .rv-pulse { animation: rv-pulse-k .9s ease-out 1; }
        @media (prefers-reduced-motion: reduce) { .rv-swap, .rv-pulse { animation: none; } }
      `}</style>
      <div className="rv-ground" aria-hidden>
        <span className="rv-blob" style={{ left: "-16%", top: "-10%", width: "56vw", height: "56vw", background: "radial-gradient(closest-side, rgba(255,255,255,.95), rgba(255,255,255,0))" }} />
        <span className="rv-blob" style={{ left: "64%", top: "30%", width: "48vw", height: "48vw", background: "radial-gradient(closest-side, rgba(201,93,99,.24), rgba(201,93,99,0))" }} />
      </div>
      <div className="rv-wrap relative z-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-end">
          <div>
            <p className="text-[15px] font-medium text-rv-rosa">Editor do site</p>
            <h2 id="rv-editor" className="mt-2 max-w-2xl text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">Seu site pronto em minutos, do seu jeito</h2>
          </div>
          <p className="max-w-lg text-lg leading-relaxed text-rv-ink2">
            Sem programar e sem contratar ninguém. Você escolhe o modelo, muda o que quiser e vê o site mudar na mesma hora. Um site assim, feito sob encomenda, custaria centenas de reais.
          </p>
        </div>

        <div className="mt-12"><EditorDemo /></div>

        <ol className="mt-12 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.t} className="lg flex gap-4 p-5" style={{ "--lg-r": "22px", "--lg-bg": "rgba(255,255,255,.5)" }}>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rv-ameixa text-rv-lavanda"><s.icon className="h-5 w-5" aria-hidden /></span>
              <div>
                <p className="text-[13px] font-medium text-rv-rosa">Passo {i + 1}</p>
                <h3 className="text-2xl leading-tight">{s.t}</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-rv-ink2">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <ul className="flex flex-wrap gap-2" aria-label="O que dá para editar">
            {EDITABLE.map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[14px] text-rv-ameixa"><Check className="h-3.5 w-3.5 text-rv-rosa" aria-hidden />{t}</li>
            ))}
          </ul>
          <Link to="/cadastro" className="rv-btn rv-btn-primary shrink-0"><span className="rv-btn-dot" aria-hidden />Testar 30 dias grátis</Link>
        </div>
      </div>
    </section>
  );
}
