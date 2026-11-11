import { useRef, useState } from "react";
import { BarChart3, Bell, CalendarDays, Check, Download, Globe, Heart, Images, Lock, Package, ShieldCheck, Users } from "lucide-react";
import { useOffscreenPause } from "../hooks.js";

const IMG = (n) => `/revela/img/${n}.webp`;

/* Os loops são CSS (só transform/opacity, e cor em pontos pequenos).
   Passar o ponteiro reinicia o loop do cartão; fora da tela, pausa. */
export const LOOP_CSS = `
@keyframes rvh0{0%,14%{background:rgba(255,255,255,.9);color:#8E86A6}16%,90%{background:#C95D63;color:#fff}92%,100%{background:rgba(255,255,255,.9);color:#8E86A6}}
@keyframes rvh1{0%,31%{background:rgba(255,255,255,.9);color:#8E86A6}33%,90%{background:#C95D63;color:#fff}92%,100%{background:rgba(255,255,255,.9);color:#8E86A6}}
@keyframes rvh2{0%,48%{background:rgba(255,255,255,.9);color:#8E86A6}50%,90%{background:#C95D63;color:#fff}92%,100%{background:rgba(255,255,255,.9);color:#8E86A6}}
@keyframes rvh3{0%,65%{background:rgba(255,255,255,.9);color:#8E86A6}67%,90%{background:#C95D63;color:#fff}92%,100%{background:rgba(255,255,255,.9);color:#8E86A6}}
@keyframes rvo0{0%,14%{box-shadow:0 0 0 0 #C95D63}16%,90%{box-shadow:0 0 0 2.5px #C95D63}92%,100%{box-shadow:0 0 0 0 #C95D63}}
@keyframes rvo1{0%,31%{box-shadow:0 0 0 0 #C95D63}33%,90%{box-shadow:0 0 0 2.5px #C95D63}92%,100%{box-shadow:0 0 0 0 #C95D63}}
@keyframes rvo2{0%,48%{box-shadow:0 0 0 0 #C95D63}50%,90%{box-shadow:0 0 0 2.5px #C95D63}92%,100%{box-shadow:0 0 0 0 #C95D63}}
@keyframes rvo3{0%,65%{box-shadow:0 0 0 0 #C95D63}67%,90%{box-shadow:0 0 0 2.5px #C95D63}92%,100%{box-shadow:0 0 0 0 #C95D63}}
@keyframes rvcount{0%,14%{transform:translateY(0)}16%,31%{transform:translateY(-20%)}33%,48%{transform:translateY(-40%)}50%,65%{transform:translateY(-60%)}67%,90%{transform:translateY(-80%)}92%,100%{transform:translateY(0)}}
@keyframes rvday{0%,26%{background:#F7F5FA;color:#2B2540}30%,92%{background:#2B2540;color:#E6E1F0}96%,100%{background:#F7F5FA;color:#2B2540}}
@keyframes rvbar{0%{transform:scaleY(.08)}28%,93%{transform:scaleY(1)}100%{transform:scaleY(.08)}}
@keyframes rvtotal{0%,22%{transform:translateY(0)}30%,93%{transform:translateY(-50%)}100%{transform:translateY(0)}}
`;

function useLoopRestart() {
  const [run, setRun] = useState(0);
  return [run, () => setRun((r) => r + 1)];
}

function Card({ className = "", icon: Icon, title, children, visual, style, wide = false }) {
  const [run, restart] = useLoopRestart();
  return (
    <article className={`lg rv-lift flex flex-col overflow-hidden p-6 sm:p-7 ${wide ? "lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.9fr)] lg:items-center lg:gap-x-10" : ""} ${className}`}
      style={{ "--lg-bg": "rgba(255,255,255,.5)", ...style }} onPointerEnter={restart}>
      <div>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rv-ameixa text-rv-lavanda"><Icon className="h-5 w-5" aria-hidden /></span>
          <h3 className="text-[1.6rem] leading-tight">{title}</h3>
        </div>
        <p className="mt-3 max-w-md text-[16px] leading-relaxed text-rv-ink2">{children}</p>
      </div>
      <div key={run} data-loop className={`relative mt-6 flex-1 ${wide ? "lg:mt-0" : ""}`} aria-hidden>{visual}</div>
    </article>
  );
}

const loop = (dur, name, extra = "") => ({ animation: `${name} ${dur} ${extra || "cubic-bezier(.65,0,.35,1)"} infinite` });

export function SelectionVisual() {
  const photos = ["gestante-vestido", "gestante-floral", "casal-ultrassom", "gestante-campo", "pezinho", "gestante-tijolo"];
  const picks = { 1: 0, 2: 1, 4: 2, 5: 3 };
  return (
    <div className="rounded-[20px] bg-white/60 p-3 ring-1 ring-white/70">
      <div className="mb-3 flex items-center justify-between px-1">
        <span className="font-revela text-lg text-rv-ameixa">Ensaio gestante</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rv-ameixa px-3 py-1 text-[13px] text-rv-lavanda">
          <Heart className="h-3.5 w-3.5 fill-rv-rosa text-rv-rosa" />
          <span className="inline-block h-[1.2em] overflow-hidden leading-[1.2em]">
            <span className="block tabular-nums" style={loop("4s", "rvcount", "steps(1,end)")}>
              {[8, 9, 10, 11, 12].map((v) => <span key={v} className="block h-[1.2em]">{v}</span>)}
            </span>
          </span>
          de 20
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((n, i) => (
          <div key={n} className="relative aspect-[4/5] overflow-hidden rounded-xl bg-rv-lavanda" style={picks[i] !== undefined ? loop("4s", `rvo${picks[i]}`, "steps(1,end)") : undefined}>
            <img src={IMG(n)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" draggable="false" />
            <span className="rv-wm" />
            <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-rv-lilas"
              style={picks[i] !== undefined ? loop("4s", `rvh${picks[i]}`, "steps(1,end)") : undefined}>
              <Heart className="h-3.5 w-3.5" />
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 px-1 text-[13px] text-rv-ink2">
        <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-rv-rosa" />Marca d'água com o nome do cliente</span>
        <span className="inline-flex items-center gap-1.5"><Lock className="h-4 w-4 text-rv-rosa" />Sem download e sem print</span>
      </div>
    </div>
  );
}

export function AgendaVisual() {
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const busy = [3, 8, 12, 17, 22, 26];
  return (
    <div className="relative rounded-[20px] bg-white/60 p-4 ring-1 ring-white/70">
      <div className="mb-2 flex justify-between text-[13px] text-rv-ink2"><span className="font-medium text-rv-ameixa">Dezembro</span><span>2026</span></div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px]">
        {"DSTQQSS".split("").map((d, i) => <span key={i} className="pb-1 text-rv-lilas">{d}</span>)}
        {[...Array(2)].map((_, i) => <span key={`e${i}`} />)}
        {days.map((d) => (
          <span key={d} className={`rounded-md py-1 tabular-nums ${busy.includes(d) ? "bg-rv-ameixa/10 text-rv-lilas line-through" : "bg-rv-nevoa text-rv-ameixa"}`}
            style={d === 19 ? loop("3.6s", "rvday", "steps(1,end)") : undefined}>{d}</span>
        ))}
      </div>
      <div className="absolute -bottom-3 right-3 w-[220px] rounded-2xl bg-white p-3 shadow-[0_18px_40px_-18px_rgba(43,37,64,.45)] ring-1 ring-rv-linha"
        style={{ animation: "rv-slide-in 3.6s var(--ease-out) infinite" }}>
        <p className="text-[12px] text-rv-ink2">Sáb, 19 dez · 16h</p>
        <p className="text-[14px] font-medium text-rv-ameixa">Ensaio de família</p>
        <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#2F6B5C]/10 px-2 py-0.5 text-[12px] font-medium text-[#2F6B5C]"><Check className="h-3 w-3" />Sinal pago pelo Pix</p>
      </div>
    </div>
  );
}

export function VipVisual() {
  const faces = ["beijo-mae", "pai-filha", "mae-filha-livro", "fotografo", "familia-cachorro"];
  return (
    <div className="relative rounded-[20px] bg-white/60 p-4 ring-1 ring-white/70">
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2.5">
          {faces.map((f) => <img key={f} src={IMG(f)} alt="" loading="lazy" decoding="async" className="h-9 w-9 rounded-full object-cover ring-2 ring-white" />)}
        </div>
        <p className="text-[14px] text-rv-ink2"><b className="font-revela text-xl font-normal text-rv-ameixa">248</b> na lista VIP</p>
      </div>
      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white p-3 shadow-[0_18px_40px_-18px_rgba(43,37,64,.45)] ring-1 ring-rv-linha"
        style={{ animation: "rv-slide-in 3.4s var(--ease-out) infinite" }}>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rv-rosa text-white"><Bell className="h-[18px] w-[18px]" /></span>
        <div>
          <p className="text-[14px] font-medium text-rv-ameixa">Agenda de janeiro aberta</p>
          <p className="text-[12px] text-rv-ink2">Enviado para 248 pessoas</p>
        </div>
      </div>
    </div>
  );
}

export function SiteVisual() {
  return (
    <div className="overflow-hidden rounded-[20px] bg-white/70 ring-1 ring-white/70">
      <div className="flex items-center gap-1.5 border-b border-rv-linha/70 px-3 py-2">
        {[0, 1, 2].map((i) => <i key={i} className="h-2 w-2 rounded-full bg-rv-ameixa/15" />)}
      </div>
      <div className="relative">
        <img src={IMG("casal-arvore")} alt="" loading="lazy" decoding="async" className="h-[130px] w-full object-cover" />
        <span className="absolute bottom-3 left-3 font-revela text-xl text-white drop-shadow">Ana Lima fotografia</span>
        <span className="absolute bottom-3 right-3 rounded-full px-3 py-1 text-[12px] font-medium text-white" style={loop("4.2s", "rv-accent", "steps(1,end)")}>Agendar</span>
      </div>
      <div className="flex items-center gap-2 p-3">
        <span className="text-[12px] text-rv-ink2">Cor do site</span>
        <span className="relative ml-auto flex flex-col gap-[16px]">
          {["#C95D63", "#3F7D6E", "#C9A44C"].map((c) => <i key={c} className="h-5 w-5 rounded-full" style={{ background: c }} />)}
          <i className="absolute -left-[3px] -top-[3px] h-[26px] w-[26px] rounded-full ring-2 ring-rv-ameixa" style={loop("4.2s", "rv-ring-accent", "steps(1,end)")} />
        </span>
      </div>
    </div>
  );
}

export function PacotesVisual() {
  return (
    <div className="flex items-center gap-4 rounded-[20px] bg-white/60 p-4 ring-1 ring-white/70" style={{ perspective: 600 }}>
      <img src={IMG("gestante-campo")} alt="" loading="lazy" decoding="async" className="h-24 w-20 rounded-xl object-cover" />
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium text-rv-ameixa">Ensaio gestante</p>
        <p className="text-[12px] text-rv-ink2">2 horas · 40 fotos</p>
        <div className="relative mt-2 h-[52px]" style={{ transformStyle: "preserve-3d", animation: "rv-flip 4s cubic-bezier(.65,0,.35,1) infinite" }}>
          <div className="absolute inset-0 rounded-xl bg-rv-ameixa px-3 py-1.5 text-rv-lavanda [backface-visibility:hidden]">
            <p className="text-[11px] opacity-75">1º lote</p><p className="font-revela text-lg leading-tight">R$ 450</p>
          </div>
          <div className="absolute inset-0 rounded-xl bg-rv-rosa px-3 py-1.5 text-white [backface-visibility:hidden] [transform:rotateX(180deg)]">
            <p className="text-[11px] opacity-85">2º lote</p><p className="font-revela text-lg leading-tight">R$ 520</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EntregaVisual() {
  return (
    <div className="rounded-[20px] bg-white/60 p-4 ring-1 ring-white/70">
      <div className="flex -space-x-6">
        {["casal-folhas", "noiva-buque", "casamento-por-do-sol"].map((n, i) => (
          <img key={n} src={IMG(n)} alt="" loading="lazy" decoding="async" className="h-16 w-16 rounded-xl object-cover ring-2 ring-white" style={{ transform: `rotate(${(i - 1) * 6}deg)` }} />
        ))}
      </div>
      <p className="mt-3 text-[14px] font-medium text-rv-ameixa">Casamento · 320 fotos</p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-rv-ameixa/10">
        <div className="h-full origin-left rounded-full bg-rv-rosa" style={{ animation: "rv-fill 3.6s cubic-bezier(.65,0,.35,1) infinite" }} />
      </div>
      <div className="mt-2 flex items-center justify-between text-[12px] text-rv-ink2">
        <span>Link válido por 30 dias</span>
        <span className="inline-flex items-center gap-1 font-medium text-[#2F6B5C]" style={{ animation: "rv-appear 3.6s var(--ease-out) infinite" }}><Check className="h-3.5 w-3.5" />Baixadas</span>
      </div>
    </div>
  );
}

export function FinanceVisual() {
  const bars = [34, 48, 41, 60, 55, 74, 92];
  return (
    <div className="flex flex-col gap-4 rounded-[20px] bg-white/60 p-4 ring-1 ring-white/70 sm:flex-row sm:items-end">
      <div className="flex h-[120px] flex-1 items-end gap-2">
        {bars.map((h, i) => (
          <span key={i} className={`flex-1 origin-bottom rounded-t-lg ${i === bars.length - 1 ? "bg-rv-rosa" : "bg-rv-lilas/45"}`}
            style={{ height: `${h}%`, animation: `rvbar 3.8s cubic-bezier(.65,0,.35,1) ${i * 0.06}s infinite` }} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3 sm:w-[210px] sm:grid-cols-1">
        <div>
          <p className="text-[12px] text-rv-ink2">Faturamento</p>
          <p className="h-8 overflow-hidden font-revela text-2xl leading-8 text-rv-ameixa">
            <span className="block" style={{ animation: "rvtotal 3.8s cubic-bezier(.65,0,.35,1) infinite" }}><span className="block">R$ 9.870</span><span className="block">R$ 12.480</span></span>
          </p>
        </div>
        <div><p className="text-[12px] text-rv-ink2">Sinais recebidos</p><p className="font-revela text-xl text-rv-ameixa">18</p></div>
        <div><p className="text-[12px] text-rv-ink2">A receber</p><p className="font-revela text-xl text-rv-ameixa">R$ 2.340</p></div>
      </div>
    </div>
  );
}

export default function Features() {
  const root = useRef(null);
  useOffscreenPause(root, "0px");
  return (
    <section id="recursos" ref={root} className="relative isolate overflow-hidden bg-rv-nevoa py-24 sm:py-28" aria-labelledby="rv-recursos">
      <style>{LOOP_CSS}</style>
      <div className="rv-ground" aria-hidden>
        <span className="rv-blob" style={{ left: "-20%", top: "6%", width: "60vw", height: "60vw", background: "radial-gradient(closest-side, rgba(142,134,166,.38), rgba(142,134,166,0))" }} />
        <span className="rv-blob" style={{ left: "62%", top: "-8%", width: "52vw", height: "52vw", background: "radial-gradient(closest-side, rgba(201,93,99,.26), rgba(201,93,99,0))" }} />
        <span className="rv-blob" style={{ left: "40%", top: "58%", width: "56vw", height: "56vw", background: "radial-gradient(closest-side, rgba(230,225,240,1), rgba(230,225,240,0))" }} />
      </div>
      <div className="rv-wrap relative z-10">
        <h2 id="rv-recursos" className="max-w-4xl text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">Sete ferramentas num painel só</h2>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-rv-ink2">
          Do primeiro contato à entrega das fotos, cada parte conversa com a outra: o agendamento vira ensaio, o ensaio vira seleção e a seleção vira entrega.
        </p>

        <div className="mt-14 grid gap-5 md:grid-cols-6 lg:grid-cols-12">
          <Card className="md:col-span-6 lg:col-span-7 lg:row-span-2" icon={Images} title="Protege as prévias da seleção" visual={<SelectionVisual />}>
            O cliente marca as favoritas numa galeria com marca d'água e bloqueio de print. Você recebe a lista pronta.
          </Card>
          <Card className="md:col-span-3 lg:col-span-5" icon={CalendarDays} title="Recebe agendamentos com sinal" visual={<AgendaVisual />}>
            O cliente escolhe um horário livre e paga o sinal pelo Pix. Você só confirma.
          </Card>
          <Card className="md:col-span-3 lg:col-span-5" icon={Users} title="Avisa a sua lista VIP primeiro" visual={<VipVisual />}>
            Datas novas e lotes promocionais chegam antes para quem entrou na lista.
          </Card>
          <Card className="md:col-span-3 lg:col-span-4" icon={Globe} title="Monta o seu site" visual={<SiteVisual />}>
            10 modelos prontos. Troque cores, fontes, textos e fotos vendo a prévia ao vivo, sem programar.
          </Card>
          <Card className="md:col-span-3 lg:col-span-4" icon={Package} title="Vende pacotes por lote" visual={<PacotesVisual />}>
            O preço muda sozinho na data marcada, do 1º para o 2º lote.
          </Card>
          <Card className="md:col-span-6 lg:col-span-4" icon={Download} title="Entrega as fotos em alta" visual={<EntregaVisual />}>
            Um link para baixar todas as fotos, com prazo de 7, 14 ou 30 dias.
          </Card>
          <Card wide className="md:col-span-6 lg:col-span-12" icon={BarChart3} title="Mostra quanto você faturou" visual={<FinanceVisual />}>
            Sinais, pagamentos e de onde vêm os clientes, atualizados sozinhos a cada agendamento.
          </Card>
        </div>
      </div>
    </section>
  );
}
