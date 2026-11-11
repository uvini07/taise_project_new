import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUp, CalendarDays, Compass, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import PolaroidyMascot, { PolaroidyWaving } from "../../components/admin/PolaroidyMascot.jsx";
import { WhatsAppIcon } from "../../components/common/Icons.jsx";
import { useOffscreenPause } from "../hooks.js";

/* Conversas de exemplo (dados fictícios), no mesmo formato do painel. */
const TALKS = [
  {
    q: "Quais são minhas agendas hoje?",
    a: (
      <>
        <p>Hoje, <b className="font-medium">sábado, 19/12</b>, você tem 2 ensaios:</p>
        <Item><b className="font-medium">10h</b> · Ensaio de família · Carla Souza</Item>
        <Item><b className="font-medium">16h</b> · Ensaio gestante · Júlia Ramos</Item>
        <p>Os dois já pagaram o sinal.</p>
      </>
    ),
  },
  {
    q: "Quem ainda não me pagou?",
    a: (
      <>
        <p><b className="font-medium">2 clientes</b> com pagamento em aberto:</p>
        <Item><b className="font-medium">Marina Alves</b> · R$ 350,00 · vence 20/12</Item>
        <Item><b className="font-medium">Paula Costa</b> · R$ 180,00 · venceu 15/12</Item>
      </>
    ),
    charges: ["Cobrar Marina (R$ 350,00)", "Cobrar Paula (R$ 180,00)"],
  },
  {
    q: "Onde eu troco a foto do topo do site?",
    a: (
      <>
        <p>É rapidinho! Abra <span className="font-medium text-[#C95D63] underline underline-offset-2">Topo da página</span> no editor e toque na foto para trocar.</p>
        <p>A prévia mostra o resultado na hora, antes de salvar.</p>
      </>
    ),
  },
];

function Item({ children }) {
  return <p className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-current opacity-60" />{<span>{children}</span>}</p>;
}

/** Janela da Polaroidy, igual à do painel, rodando as conversas de exemplo. */
export function ChatDemo() {
  const box = useRef(null);
  const [talk, setTalk] = useState(0);
  const [stage, setStage] = useState(3); // 0 nada · 1 pergunta · 2 pensando · 3 resposta
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    let t; let k = 0; let s = 3;
    const wait = [0, 900, 1300, 5200]; // tempo em cada etapa (pergunta, pensando, resposta)
    const tick = () => {
      if (box.current?.closest("[data-offscreen]")) { t = setTimeout(tick, 1000); return; }
      s += 1;
      if (s > 3) { s = 1; k = (k + 1) % TALKS.length; setTalk(k); }
      setStage(s);
      t = setTimeout(tick, wait[s]);
    };
    t = setTimeout(tick, 3800);
    return () => clearTimeout(t);
  }, [auto]);

  const pick = (i) => { setAuto(false); setTalk(i); setStage(1); setTimeout(() => setStage(2), 350); setTimeout(() => setStage(3), 1300); };
  const cur = TALKS[talk];

  return (
    <div ref={box} className="relative overflow-hidden rounded-[28px] bg-[#F7F5FA] text-[#2B2540] shadow-[0_40px_80px_-30px_rgba(0,0,0,.6)] ring-1 ring-white/10">
      <div className="flex items-center gap-3 bg-[#2B2540] px-4 py-3 text-[#E6E1F0]">
        <PolaroidyMascot className="h-11 w-11 overflow-hidden rounded-full ring-2 ring-[#E6E1F0]/30" />
        <div className="flex-1">
          <p className="font-revela text-2xl leading-none text-white">Polaroidy</p>
          <p className="mt-1 text-xs text-[#E6E1F0]/70">Sua assistente da Revela. Ela só consulta e sugere.</p>
        </div>
      </div>
      <div className="h-[310px] space-y-3 overflow-hidden px-4 py-5 text-sm" aria-live="polite">
        {stage >= 1 && <p key={`q${talk}`} className="rv-msg ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-[#2B2540] px-4 py-2.5 text-[#F7F5FA]">{cur.q}</p>}
        {stage === 2 && (
          <p className="rv-msg flex items-center gap-2 text-[#8E86A6]"><PolaroidyMascot mood="pensando" className="h-8 w-8 animate-pulse overflow-hidden rounded-full" /> Polaroidy está olhando…</p>
        )}
        {stage === 3 && (
          <div key={`a${talk}`} className="rv-msg max-w-[92%] space-y-1.5 rounded-2xl rounded-bl-md bg-white px-4 py-3 leading-relaxed shadow-[0_8px_24px_-14px_rgba(43,37,64,.35)]">
            {cur.a}
            {cur.charges && (
              <div className="mt-3 flex flex-col gap-2 border-t border-[#2B2540]/10 pt-3">
                {cur.charges.map((c) => (
                  <span key={c} className="flex items-center gap-2 rounded-xl bg-[#25D366]/10 px-3 py-2 text-[13px] font-medium text-[#1d7a46]"><WhatsAppIcon className="h-4 w-4" />{c}</span>
                ))}
                <p className="text-[11px] text-[#4A4360]">A mensagem abre pronta no WhatsApp. Você revisa e envia.</p>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="border-t border-[#E6E1F0] bg-white p-3">
        <div className="mb-2.5 flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]">
          {TALKS.map((t, i) => (
            <button key={t.q} type="button" onClick={() => pick(i)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-[12px] transition-colors ${i === talk ? "border-[#C95D63]/60 bg-[#C95D63]/10 text-[#2B2540]" : "border-[#E6E1F0] text-[#4A4360] hover:border-[#C95D63]/40"}`}>{t.q}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="flex min-h-[44px] flex-1 items-center rounded-xl border border-[#E6E1F0] px-3 text-sm text-[#8E86A6]">Pergunte para a Polaroidy…</span>
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2B2540] text-white" aria-hidden><ArrowUp className="h-5 w-5" /></span>
        </div>
      </div>
    </div>
  );
}

const POINTS = [
  { icon: CalendarDays, t: "Sua agenda num piscar de olhos", d: "Hoje, amanhã ou o mês inteiro, com horário, cliente e pacote." },
  { icon: Wallet, t: "Quem falta pagar, com a cobrança pronta", d: "Ela lista os valores em aberto e prepara a mensagem de cobrança no WhatsApp." },
  { icon: Compass, t: "Onde fica cada coisa", d: "Pergunte como trocar uma foto, uma cor ou um preço e ela leva você direto à tela certa." },
  { icon: ShieldCheck, t: "Nada muda sem você", d: "A Polaroidy só consulta e sugere. Confirmar, cobrar e enviar continuam nas suas mãos." },
];

/** A assistente com IA da Revela. */
export default function Polaroidy() {
  const root = useRef(null);
  useOffscreenPause(root, "0px");
  return (
    <section id="polaroidy" ref={root} data-nav-theme="dark" className="rv-grain relative isolate overflow-hidden bg-rv-ameixa py-24 text-rv-lavanda sm:py-32" aria-labelledby="rv-polaroidy">
      <style>{`
        @keyframes rv-msg-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .rv-msg { animation: rv-msg-in .45s cubic-bezier(.16,1,.3,1) both; }
        @media (prefers-reduced-motion: reduce) { .rv-msg { animation: none; } }
      `}</style>
      <div className="rv-ground" aria-hidden>
        <span className="rv-blob" style={{ left: "50%", top: "-20%", width: "60vw", height: "60vw", background: "radial-gradient(closest-side, rgba(201,93,99,.34), rgba(201,93,99,0))" }} />
        <span className="rv-blob" style={{ left: "-20%", top: "40%", width: "55vw", height: "55vw", background: "radial-gradient(closest-side, rgba(142,134,166,.35), rgba(142,134,166,0))" }} />
      </div>
      <div className="rv-wrap relative z-10 grid items-center gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:gap-20">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-rv-rosa px-3.5 py-1.5 text-[13px] font-medium text-white shadow-[0_0_0_6px_rgba(201,93,99,.18)]">
            <Sparkles className="h-4 w-4" aria-hidden />Novo · Inteligência artificial
          </p>
          <h2 id="rv-polaroidy" className="mt-6 max-w-2xl text-[2.6rem] leading-[1.03] sm:text-6xl lg:text-[4.2rem]">
            Conheça a Polaroidy, sua assistente com IA
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-rv-lavanda/80 sm:text-xl">
            Ela mora no seu painel e responde na hora, do jeito que você pergunta. Menos tempo procurando informação, mais tempo fotografando.
          </p>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2">
            {POINTS.map((p) => (
              <li key={p.t} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-rv-lavanda ring-1 ring-white/15"><p.icon className="h-5 w-5" aria-hidden /></span>
                <div>
                  <h3 className="text-[1.35rem] leading-tight text-white">{p.t}</h3>
                  <p className="mt-1 text-[15px] leading-relaxed text-rv-lavanda/75">{p.d}</p>
                </div>
              </li>
            ))}
          </ul>
          <Link to="/cadastro" className="rv-btn rv-btn-light mt-10">Conhecer a Polaroidy no teste grátis</Link>
        </div>

        <div className="relative mx-auto w-full max-w-[460px] pt-[160px] sm:pt-[174px]">
          <span aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full"
            style={{ background: "radial-gradient(closest-side, rgba(230,225,240,.55), rgba(230,225,240,0))" }} />
          <div className="pointer-events-none absolute left-1/2 top-0 z-20 w-44 -translate-x-1/2 sm:w-48" aria-hidden>
            <div className="rv-float"><PolaroidyWaving className="!block aspect-[300/320] w-full" /></div>
          </div>
          <div className="relative z-10"><ChatDemo /></div>
          <p className="mt-4 text-center text-[13px] text-rv-lavanda/60">Exemplo com dados fictícios. No seu painel, ela lê só os dados do seu estúdio.</p>
        </div>
      </div>
    </section>
  );
}
