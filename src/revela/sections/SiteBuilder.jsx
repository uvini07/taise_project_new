import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, LayoutTemplate, MousePointerClick, Palette, Rocket, Type } from "lucide-react";
import { siteHost, useOffscreenPause } from "../hooks.js";

const IMG = (n) => `/revela/img/${n}.webp`;

const MODELS = [
  { id: "classico", name: "Clássico" }, { id: "dividido", name: "Dividido" }, { id: "arco", name: "Arco" },
  { id: "cinema", name: "Cinema" }, { id: "polaroid", name: "Polaroid" }, { id: "revista", name: "Revista" },
  { id: "diagonal", name: "Diagonal" }, { id: "mosaico", name: "Mosaico" }, { id: "minimalista", name: "Minimalista" },
  { id: "imersivo", name: "Imersivo" },
];
const COLORS = [
  { c: "#C95D63", name: "Rosa" }, { c: "#3F7D6E", name: "Verde" }, { c: "#C9A44C", name: "Dourado" },
  { c: "#3B5B8C", name: "Azul" }, { c: "#B5653A", name: "Terracota" }, { c: "#2B2540", name: "Ameixa" },
];
const FONTS = [
  { f: "Cormorant Garamond", name: "Clássica" }, { f: "Playfair Display", name: "Revista" },
  { f: "DM Serif Display", name: "Forte" }, { f: "Italiana", name: "Romântica" },
];
// Roteiro da demonstração: o "cliente" vai mexendo sozinho até a pessoa tocar.
const SCRIPT = [
  { model: "dividido" }, { color: 1 }, { font: 1 }, { model: "arco" }, { color: 2 }, { model: "cinema" }, { font: 2 },
  { model: "polaroid" }, { color: 4 }, { model: "revista" }, { font: 3 }, { model: "mosaico" }, { color: 3 },
  { model: "imersivo" }, { model: "diagonal" }, { color: 0 }, { model: "minimalista" }, { font: 0 }, { model: "classico" },
];

const FONT_URL = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital@0;1&family=DM+Serif+Display&family=Italiana&display=swap";
function loadDemoFonts() {
  if (document.getElementById("rv-demo-fonts")) return;
  document.head.appendChild(Object.assign(document.createElement("link"), { id: "rv-demo-fonts", rel: "stylesheet", href: FONT_URL }));
}

/* ----------------------------- Prévia do site ----------------------------- */

function MiniNav({ c, f, dark, center }) {
  const t = dark ? "text-white/90" : "text-[#2B2540]";
  return (
    <div className={`flex items-center gap-3 px-[4%] py-[2.2%] ${center ? "justify-center" : ""}`}>
      <span className={`text-[clamp(11px,1.6vw,17px)] leading-none ${t}`} style={{ fontFamily: f }}>Ana Lima</span>
      {!center && <span className={`ml-auto hidden gap-3 text-[9px] sm:flex ${dark ? "text-white/70" : "text-[#4A4360]"}`}><span>Sobre</span><span>Pacotes</span><span>Galeria</span></span>}
      <span className={`${center ? "" : "ml-auto sm:ml-0"} rounded-full px-2.5 py-1 text-[9px] font-medium text-white transition-colors duration-500`} style={{ background: c }}>Agendar</span>
    </div>
  );
}

const Title = ({ f, className = "", children = "Fotografia de família" }) => (
  <p className={`leading-[1.02] ${className}`} style={{ fontFamily: f }}>{children}</p>
);
const Btn = ({ c, children = "Ver pacotes", ghost }) => (
  <span className="inline-block rounded-full px-3 py-1.5 text-[10px] font-medium transition-colors duration-500"
    style={ghost ? { boxShadow: `inset 0 0 0 1.5px ${c}`, color: c } : { background: c, color: "#fff" }}>{children}</span>
);
const Img = ({ n, className = "", style }) => <img src={IMG(n)} alt="" loading="lazy" decoding="async" draggable="false" className={`object-cover ${className}`} style={style} />;

function Preview({ model, c, f }) {
  const title = "text-[clamp(20px,3.6vw,40px)]";
  switch (model) {
    case "dividido": return (
      <div className="flex h-full flex-col bg-[#FBF8F4]"><MiniNav c={c} f={f} />
        <div className="grid flex-1 grid-cols-2 gap-[4%] px-[4%] pb-[4%]">
          <div className="flex flex-col justify-center gap-3">
            <span className="text-[9px] uppercase tracking-[.2em]" style={{ color: c }}>São Paulo · SP</span>
            <Title f={f} className={`${title} text-[#2B2540]`} />
            <p className="text-[10px] leading-snug text-[#4A4360]">Ensaios leves, com luz natural e muito afeto.</p>
            <div><Btn c={c} /></div>
          </div>
          <Img n="familia-brincando" className="h-full w-full rounded-2xl" />
        </div>
      </div>
    );
    case "arco": return (
      <div className="flex h-full flex-col bg-[#F6F1EC]"><MiniNav c={c} f={f} center />
        <div className="flex flex-1 items-center justify-center gap-[6%] px-[6%] pb-[4%]">
          <Img n="gestante-campo" className="h-full w-[34%] rounded-t-[999px]" />
          <div className="max-w-[46%] space-y-3">
            <Title f={f} className={`${title} text-[#2B2540]`}>Memórias que ficam</Title>
            <span className="block h-[2px] w-10 transition-colors duration-500" style={{ background: c }} />
            <Btn c={c} ghost />
          </div>
        </div>
      </div>
    );
    case "cinema": return (
      <div className="flex h-full flex-col bg-[#16131D]"><MiniNav c={c} f={f} dark />
        <div className="relative mx-[4%] flex-1 overflow-hidden rounded-md">
          <Img n="casal-pb" className="h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
          <div className="absolute bottom-[8%] left-[5%] space-y-2">
            <Title f={f} className={`${title} text-white`}>Histórias em movimento</Title>
            <Btn c={c} />
          </div>
        </div>
        <div className="h-[5%]" />
      </div>
    );
    case "polaroid": return (
      <div className="flex h-full flex-col bg-[#F3EEE7]"><MiniNav c={c} f={f} />
        <div className="relative flex flex-1 items-center justify-center">
          {[["pai-filha", -9, "-105%"], ["beijo-mae", 3, "0%"], ["piquenique", 10, "105%"]].map(([n, r, x]) => (
            <span key={n} className="absolute top-[8%] w-[24%] bg-white p-[1%] pb-[4%] shadow-[0_10px_24px_-10px_rgba(0,0,0,.35)]" style={{ transform: `translateX(${x}) rotate(${r}deg)` }}>
              <Img n={n} className="aspect-square w-full" />
            </span>
          ))}
          <div className="absolute bottom-[7%] text-center">
            <Title f={f} className="text-[clamp(16px,2.6vw,28px)] text-[#2B2540]">Momentos de verdade</Title>
          </div>
        </div>
      </div>
    );
    case "revista": return (
      <div className="flex h-full flex-col bg-white"><MiniNav c={c} f={f} />
        <div className="px-[4%]"><Title f={f} className="border-b border-[#2B2540]/15 pb-[1.5%] text-[clamp(30px,6.4vw,70px)] uppercase tracking-tight text-[#2B2540]">Ana Lima</Title></div>
        <div className="grid min-h-0 flex-1 grid-cols-[1.5fr_1fr] gap-[4%] p-[4%]">
          <Img n="noiva-buque" className="h-full w-full" />
          <div className="flex min-h-0 flex-col justify-center gap-3">
            <p className="text-[10px] italic leading-snug text-[#4A4360]" style={{ fontFamily: f }}>“Cada ensaio é uma história contada com calma.”</p>
            <span className="h-[3px] w-8 transition-colors duration-500" style={{ background: c }} />
            <div><Btn c={c}>Agendar ensaio</Btn></div>
          </div>
        </div>
      </div>
    );
    case "diagonal": return (
      <div className="relative flex h-full flex-col bg-[#FAF7F2]"><MiniNav c={c} f={f} />
        <Img n="familia-bebe" className="absolute inset-y-0 right-0 h-full w-[60%]" style={{ clipPath: "polygon(28% 0, 100% 0, 100% 100%, 0 100%)" }} />
        <div className="relative flex flex-1 flex-col justify-center gap-3 px-[4%] pb-[6%]">
          <Title f={f} className={`${title} max-w-[44%] text-[#2B2540]`} />
          <div><Btn c={c} /></div>
        </div>
      </div>
    );
    case "mosaico": return (
      <div className="flex h-full flex-col bg-[#F7F5FA]"><MiniNav c={c} f={f} />
        <div className="grid flex-1 grid-cols-4 grid-rows-2 gap-[1.5%] px-[4%] pb-[4%]">
          <Img n="criancas-correndo" className="col-span-2 row-span-2 h-full w-full rounded-xl" />
          <div className="col-span-2 flex flex-col justify-center gap-2 rounded-xl p-[6%] text-white transition-colors duration-500" style={{ background: c }}>
            <Title f={f} className="text-[clamp(16px,2.6vw,28px)]">Fotografia de família</Title>
          </div>
          <Img n="mae-filha-livro" className="h-full w-full rounded-xl" />
          <Img n="familia-cachorro" className="h-full w-full rounded-xl" />
        </div>
      </div>
    );
    case "minimalista": return (
      <div className="flex h-full flex-col bg-white"><MiniNav c={c} f={f} center />
        <div className="flex flex-1 flex-col items-center justify-center gap-[4%] pb-[4%]">
          <Img n="pezinho" className="h-[46%] w-[30%]" />
          <Title f={f} className="text-[clamp(18px,3vw,32px)] text-[#2B2540]">Ana Lima</Title>
          <span className="text-[9px] uppercase tracking-[.3em]" style={{ color: c }}>Newborn · Família</span>
        </div>
      </div>
    );
    case "imersivo": return (
      <div className="relative h-full">
        <Img n="casamento-por-do-sol" className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/20 to-transparent" />
        <div className="relative flex h-full flex-col"><MiniNav c={c} f={f} dark />
          <div className="mt-auto space-y-3 p-[5%]">
            <Title f={f} className="text-[clamp(26px,5vw,56px)] text-white">O seu grande dia</Title>
            <Btn c={c}>Quero meu orçamento</Btn>
          </div>
        </div>
      </div>
    );
    default: return (
      <div className="relative h-full">
        <Img n="casal-arvore" className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-black/35" />
        <div className="relative flex h-full flex-col"><MiniNav c={c} f={f} dark />
          <div className="flex flex-1 flex-col items-center justify-center gap-3 pb-[6%] text-center">
            <span className="text-[9px] uppercase tracking-[.3em] text-white/80">Fotografia</span>
            <Title f={f} className="text-[clamp(26px,5vw,56px)] text-white">Ana Lima</Title>
            <Btn c={c}>Agendar ensaio</Btn>
          </div>
        </div>
      </div>
    );
  }
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
  const [model, setModel] = useState("classico");
  const [color, setColor] = useState(0);
  const [font, setFont] = useState(0);
  const [flash, setFlash] = useState(null); // controle que acabou de mudar
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { loadDemoFonts(); io.disconnect(); } }, { rootMargin: "600px" });
    if (box.current) io.observe(box.current);
    return () => io.disconnect();
  }, []);

  // Demonstração automática (pausa fora da tela e para de vez quando a pessoa mexe).
  useEffect(() => {
    if (!auto || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    let i = 0; let t;
    const tick = () => {
      if (box.current?.closest("[data-offscreen]")) { t = setTimeout(tick, 1000); return; }
      const s = SCRIPT[i % SCRIPT.length]; i += 1;
      if (s.model) { setModel(s.model); setFlash(`m-${s.model}`); }
      if (s.color != null) { setColor(s.color); setFlash(`c-${s.color}`); }
      if (s.font != null) { setFont(s.font); setFlash(`f-${s.font}`); }
      t = setTimeout(tick, 2300);
    };
    t = setTimeout(tick, 1800);
    return () => clearTimeout(t);
  }, [auto]);

  const take = () => { setAuto(false); setFlash(null); };
  const c = COLORS[color].c;
  const f = `"${FONTS[font].f}", Georgia, serif`;
  const ring = (k) => (flash === k ? "rv-pulse" : "");

  return (
    <div ref={box} className="lg overflow-hidden" style={{ "--lg-r": "26px", "--lg-bg": "rgba(255,255,255,.55)" }}>
      <div className="flex items-center gap-3 border-b border-white/60 px-4 py-3">
        <span className="flex gap-1.5" aria-hidden>{[0, 1, 2].map((i) => <i key={i} className="h-2.5 w-2.5 rounded-full bg-rv-ameixa/15" />)}</span>
        <span className="text-[13px] font-medium text-rv-ameixa">Editar meu site</span>
        <span className="ml-auto hidden items-center gap-1.5 text-[12px] text-rv-ink2 sm:inline-flex"><i className="h-1.5 w-1.5 rounded-full bg-[#2F6B5C]" />Prévia ao vivo</span>
        <span className="rounded-full bg-rv-ameixa px-3.5 py-1.5 text-[12px] font-medium text-rv-lavanda">Salvar</span>
      </div>
      <div className="grid lg:grid-cols-[290px_minmax(0,1fr)]">
        <div className="order-2 space-y-5 border-t border-white/60 p-4 sm:p-5 lg:order-1 lg:border-r lg:border-t-0" onPointerDown={take}>
          <Group icon={LayoutTemplate} label="Modelo do site">
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Modelo do site">
              {MODELS.map((m) => (
                <button key={m.id} type="button" role="radio" aria-checked={model === m.id} onClick={() => setModel(m.id)}
                  className={`rounded-full px-3 py-1.5 text-[13px] transition-colors ${ring(`m-${m.id}`)} ${model === m.id ? "bg-rv-ameixa text-rv-lavanda" : "bg-white/80 text-rv-ink2 hover:bg-white"}`}>{m.name}</button>
              ))}
            </div>
          </Group>
          <Group icon={Palette} label="Cor principal">
            <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Cor principal">
              {COLORS.map((k, i) => (
                <button key={k.c} type="button" role="radio" aria-checked={color === i} aria-label={k.name} title={k.name} onClick={() => setColor(i)}
                  className={`h-8 w-8 rounded-full transition-transform hover:scale-110 ${ring(`c-${i}`)} ${color === i ? "ring-2 ring-rv-ameixa ring-offset-2 ring-offset-white" : ""}`} style={{ background: k.c }} />
              ))}
            </div>
          </Group>
          <Group icon={Type} label="Fonte dos títulos">
            <div className="grid grid-cols-4 gap-1.5 lg:grid-cols-2" role="radiogroup" aria-label="Fonte dos títulos">
              {FONTS.map((k, i) => (
                <button key={k.f} type="button" role="radio" aria-checked={font === i} aria-label={`Fonte ${k.name}`} onClick={() => setFont(i)}
                  className={`rounded-xl px-2 py-2 text-center transition-colors ${ring(`f-${i}`)} ${font === i ? "bg-rv-ameixa text-rv-lavanda" : "bg-white/80 text-rv-ameixa hover:bg-white"}`}>
                  <span className="block text-[22px] leading-none" style={{ fontFamily: `"${k.f}", serif` }}>Aa</span>
                  <span className="mt-1 block text-[11px] opacity-75">{k.name}</span>
                </button>
              ))}
            </div>
          </Group>
          <p className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2 text-[12px] text-rv-ink2">
            <MousePointerClick className="h-4 w-4 shrink-0 text-rv-rosa" aria-hidden />{auto ? "Toque em qualquer opção para testar você mesma." : "Isso. É assim no painel de verdade."}
          </p>
        </div>
        <div className="order-1 p-3 sm:p-4 lg:order-2">
          <div className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_50px_-24px_rgba(43,37,64,.5)] ring-1 ring-rv-linha" aria-hidden>
            <div className="flex items-center gap-2 border-b border-rv-linha/70 bg-rv-nevoa px-3 py-1.5">
              <span className="flex gap-1">{[0, 1, 2].map((i) => <i key={i} className="h-1.5 w-1.5 rounded-full bg-rv-ameixa/15" />)}</span>
              <span className="truncate rounded-full bg-white px-2.5 py-0.5 text-[10px] text-rv-ink2">{siteHost()}/analima</span>
            </div>
            <div className="relative aspect-[16/10]">
              <div key={model} className="rv-swap absolute inset-0"><Preview model={model} c={c} f={f} /></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const STEPS = [
  { icon: LayoutTemplate, t: "Escolha um modelo", d: "São 10 estruturas de site diferentes. Troque quando quiser, sem perder nada." },
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
