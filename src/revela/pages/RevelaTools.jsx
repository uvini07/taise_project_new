import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, CalendarDays, Check, Download, Globe, Images, LayoutDashboard, Megaphone, Package, Sparkles, Users } from "lucide-react";
import { ChatDemo } from "../sections/Polaroidy.jsx";
import RevelaLayout from "../components/RevelaLayout.jsx";
import { AgendaVisual, EntregaVisual, FinanceVisual, LOOP_CSS, PacotesVisual, SelectionVisual, SiteVisual, VipVisual } from "../sections/Features.jsx";
import { useOffscreenPause, useRevelaMeta } from "../hooks.js";
import { FROM_PRICE } from "../data.js";

const IMG = (n) => `/revela/img/${n}.webp`;

/** Galeria do portfólio (visual próprio desta página). */
function GalleryVisual() {
  const fotos = ["casal-arvore", "gestante-campo", "familia-brincando", "pezinho", "noiva-buque", "pai-bebe"];
  return (
    <div className="rounded-[20px] bg-white/60 p-3 ring-1 ring-white/70">
      <div className="mb-3 flex gap-2 px-1 text-[12px]">
        {["Todas", "Casamento", "Gestante", "Família"].map((c, i) => (
          <span key={c} className={`rounded-full px-3 py-1 ${i === 0 ? "bg-rv-ameixa text-rv-lavanda" : "bg-white text-rv-ink2"}`}>{c}</span>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {fotos.map((n) => <img key={n} src={IMG(n)} alt="" loading="lazy" decoding="async" className="aspect-square w-full rounded-xl object-cover" />)}
      </div>
    </div>
  );
}

function PromoVisual() {
  return (
    <div className="rounded-[20px] bg-rv-ameixa p-5 text-rv-lavanda">
      <p className="text-[12px] text-rv-lavanda/70">Evento promocional</p>
      <p className="mt-1 font-revela text-2xl">Minissessão de Natal</p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {["faiscas", "familia-brincando", "beijo-mae"].map((n) => <img key={n} src={IMG(n)} alt="" loading="lazy" decoding="async" className="aspect-[4/5] w-full rounded-xl object-cover" />)}
      </div>
      <p className="mt-4 inline-flex rounded-full bg-rv-rosa px-4 py-2 text-[13px] font-medium text-white">Garantir meu horário</p>
    </div>
  );
}

function PanelVisual() {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-[20px] bg-white/60 p-3 ring-1 ring-white/70">
      {[["Ensaios esta semana", "6"], ["Seleções abertas", "3"], ["Entregas no ar", "4"], ["A receber", "R$ 2.340"]].map(([k, v]) => (
        <div key={k} className="rounded-2xl bg-white p-3"><p className="text-[12px] text-rv-ink2">{k}</p><p className="font-revela text-2xl text-rv-ameixa">{v}</p></div>
      ))}
    </div>
  );
}

const TOOLS = [
  { id: "painel", icon: LayoutDashboard, name: "Painel", title: "Tudo do dia num lugar só", text: "Ao entrar, você vê os próximos ensaios, as seleções esperando o cliente, as entregas no ar e o que falta receber.",
    items: ["Resumo da semana", "Avisos do que precisa da sua ação", "Acesso pelo computador e pelo celular"], visual: PanelVisual },
  { id: "site", icon: Globe, name: "Site personalizado", title: "Seu site com a sua cara", text: "Escolha um dos 10 modelos e deixe com a sua cara: suas cores, fontes, logo e fotos, vendo tudo mudar na hora. Sem precisar programar.",
    items: ["10 modelos de site, cada um com uma estrutura diferente", "Editor com prévia ao vivo: logo, cores, fontes, textos e fotos", "Página inicial, sobre, pacotes, galeria e contato", "Botão de WhatsApp e imagem certa ao compartilhar o link"], visual: SiteVisual },
  { id: "polaroidy", icon: Sparkles, name: "Polaroidy IA", title: "Uma assistente com IA no seu painel", text: "Pergunte do seu jeito e a Polaroidy responde na hora: o que tem na agenda, quem ainda não pagou e onde fica cada coisa no painel.",
    items: ["Agenda do dia, da semana ou do mês", "Pagamentos em aberto, com a cobrança pronta no WhatsApp", "Atalhos para a tela certa do painel", "Só consulta e sugere: nada muda sem você"], visual: ChatDemo, still: true },
  { id: "agenda", icon: CalendarDays, name: "Agenda online", title: "O cliente marca, você só confirma", text: "Você define os dias e horários livres. O cliente escolhe o horário, informa os dados e paga o sinal pelo Pix.",
    items: ["Horários bloqueados assim que são reservados", "Sinal pago pelo Pix", "Lista de pedidos e confirmação no painel"], visual: AgendaVisual },
  { id: "pacotes", icon: Package, name: "Pacotes e lotes", title: "Venda pacotes com preço por lote", text: "Monte cada pacote com fotos, duração e preço. Abra lotes promocionais e o preço muda sozinho na data marcada.",
    items: ["1º, 2º e 3º lote com data de virada", "Selo do lote atual na página do pacote", "Botão de agendar já com o pacote escolhido"], visual: PacotesVisual },
  { id: "vip", icon: Users, name: "Lista VIP", title: "Quem é fã fica sabendo primeiro", text: "Clientes entram na lista VIP pelo site. Datas novas e lotes promocionais abrem antes para quem está na lista.",
    items: ["Página de inscrição com contagem regressiva", "Preço VIP exclusivo", "Lista de inscritos no painel"], visual: VipVisual },
  { id: "evento", icon: Megaphone, name: "Evento promocional", title: "Campanhas em destaque no site", text: "Crie um evento, como minissessão de Natal ou Dia das Mães, e ele aparece em destaque na página inicial.",
    items: ["Título, subtítulo e carrossel de fotos do evento", "Pacotes e modelos só do evento", "Liga e desliga com um clique"], visual: PromoVisual },
  { id: "galeria", icon: Images, name: "Galeria", title: "Portfólio organizado por tipo de ensaio", text: "Suba as fotos que mostram o seu trabalho e separe por categoria. O cliente filtra e vê só o que procura.",
    items: ["Categorias como casamento, gestante e família", "Fotos otimizadas para abrir rápido", "Links diretos para cada categoria"], visual: GalleryVisual },
  { id: "selecao", icon: Images, name: "Seleção de fotos", title: "O cliente escolhe, as prévias ficam protegidas", text: "Você sobe as prévias e manda o link. O cliente marca as favoritas com o coração e você recebe a lista pronta.",
    items: ["Marca d'água com o nome do cliente", "Bloqueio de print, de download e de clique direito", "Prazo para escolher, ajustável em cada ensaio", "Fotos extras pagas, se você quiser"], visual: SelectionVisual },
  { id: "entrega", icon: Download, name: "Entrega final", title: "As fotos em alta, num link só", text: "Depois de editar, você sobe as fotos e o cliente baixa todas de uma vez ou uma por uma, até o fim do prazo.",
    items: ["Download por 7, 14 ou 30 dias, conforme o plano", "Baixar todas de uma vez ou uma por uma", "Contagem de downloads no painel"], visual: EntregaVisual },
  { id: "financeiro", icon: BarChart3, name: "Financeiro e relatórios", title: "Quanto entrou e de onde vêm os clientes", text: "Sinais e pagamentos entram sozinhos a cada agendamento. Os relatórios mostram as visitas do site e de onde elas vieram.",
    items: ["Receitas, sinais e valores a receber", "Gráfico do mês", "Visitas por página e por origem (Instagram, Google, WhatsApp)"], visual: FinanceVisual },
];

function ToolSection({ t, i }) {
  const [run, setRun] = useState(0);
  const Visual = t.visual;
  const Icon = t.icon;
  const flip = i % 2 === 1;
  return (
    <section id={t.id} className="scroll-mt-24 py-14 sm:py-20" aria-labelledby={`rv-t-${t.id}`}>
      <div className="rv-wrap grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className={flip ? "lg:order-2" : ""}>
          <p className="inline-flex items-center gap-2 text-[15px] font-medium text-rv-rosa"><Icon className="h-4 w-4" aria-hidden />{t.name}</p>
          <h2 id={`rv-t-${t.id}`} className="mt-3 text-4xl leading-[1.06] sm:text-5xl">{t.title}</h2>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-rv-ink2">{t.text}</p>
          <ul className="mt-6 space-y-3">
            {t.items.map((it) => (
              <li key={it} className="flex items-start gap-3 text-[16px] text-rv-ameixa">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rv-ameixa text-rv-lavanda"><Check className="h-3 w-3" aria-hidden /></span>{it}
              </li>
            ))}
          </ul>
        </div>
        <div className={`lg rv-lift min-w-0 p-5 sm:p-7 ${flip ? "lg:order-1" : ""}`} style={{ "--lg-bg": "rgba(255,255,255,.5)" }} onPointerEnter={() => !t.still && setRun((r) => r + 1)}>
          <div key={run} data-loop aria-hidden>{Visual && <Visual />}</div>
        </div>
      </div>
    </section>
  );
}

export default function RevelaTools() {
  useRevelaMeta("Ferramentas", "Todas as ferramentas da Revela: site com 10 modelos, Polaroidy (assistente com IA), agenda, pacotes e lotes, lista VIP, evento promocional, galeria, seleção protegida, entrega e financeiro.");
  const root = useRef(null);
  useOffscreenPause(root, "0px");
  return (
    <RevelaLayout>
      <style>{LOOP_CSS}</style>
      <div ref={root} className="relative isolate overflow-hidden">
        <div className="rv-ground" aria-hidden>
          <span className="rv-blob" style={{ left: "55%", top: "-6%", width: "60vw", height: "60vw", background: "radial-gradient(closest-side, rgba(201,93,99,.28), rgba(201,93,99,0))" }} />
          <span className="rv-blob" style={{ left: "-20%", top: "20%", width: "60vw", height: "60vw", background: "radial-gradient(closest-side, rgba(142,134,166,.4), rgba(142,134,166,0))" }} />
          <span className="rv-blob" style={{ left: "30%", top: "60%", width: "60vw", height: "60vw", background: "radial-gradient(closest-side, rgba(230,225,240,1), rgba(230,225,240,0))" }} />
        </div>
        <section className="relative z-10 pb-6 pt-36 sm:pt-40" aria-labelledby="rv-tools-h1">
          <div className="rv-wrap">
            <h1 id="rv-tools-h1" className="max-w-3xl text-[2.4rem] leading-[1.04] min-[400px]:text-[2.75rem] sm:text-6xl">Todas as ferramentas da Revela</h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-rv-ink2 sm:text-xl">
              Onze ferramentas ligadas entre si, do primeiro contato do cliente à entrega das fotos. Todas estão em todos os planos, a partir de R$ {FROM_PRICE} por mês.
            </p>
            <nav aria-label="Ferramentas" className="mt-8 flex flex-wrap gap-2">
              {TOOLS.map((t) => (
                <a key={t.id} href={`#${t.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(t.id)?.scrollIntoView({ behavior: "smooth" }); }}
                  className="lg lg-pill rv-lift px-4 py-2 text-[14px] text-rv-ameixa" style={{ "--lg-bg": "rgba(255,255,255,.55)" }}>{t.name}</a>
              ))}
            </nav>
          </div>
        </section>
        <div className="relative z-10">
          {TOOLS.map((t, i) => <ToolSection key={t.id} t={t} i={i} />)}
        </div>
        <section className="relative z-10 pb-28 pt-10 text-center">
          <div className="rv-wrap flex flex-col items-center">
            <h2 className="max-w-2xl text-4xl leading-tight sm:text-5xl">Comece com todas as ferramentas</h2>
            <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link to="/cadastro" className="rv-btn rv-btn-primary"><span className="rv-btn-dot" aria-hidden />Usar teste de 30 dias</Link>
              <Link to="/planos" className="rv-btn lg lg-pill rv-btn-glass">Ver planos</Link>
            </div>
          </div>
        </section>
      </div>
    </RevelaLayout>
  );
}
