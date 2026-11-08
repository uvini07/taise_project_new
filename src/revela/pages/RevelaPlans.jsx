import { Link } from "react-router-dom";
import { Check, Plus } from "lucide-react";
import RevelaLayout from "../components/RevelaLayout.jsx";
import { CreditsStrip, PlanCards } from "../components/PlanCards.jsx";
import { COMPARE, FROM_PRICE, PLANS } from "../data.js";
import { useRevelaMeta } from "../hooks.js";

const FAQ = [
  { q: "Todos os planos têm seleção e entrega de fotos?", a: "Sim. Os três têm site, agenda, pacotes, lista VIP, financeiro, seleção protegida e entrega. Muda o limite de cada ferramenta." },
  { q: "O que conta como seleção aberta?", a: "Um ensaio em que o cliente ainda está escolhendo as fotos. Quando ele finaliza a seleção, a vaga fica livre para o próximo ensaio." },
  { q: "Quanto tempo o cliente tem para escolher as fotos?", a: "7 dias por padrão, em todos os planos. Você pode mudar esse prazo em cada ensaio." },
  { q: "E se eu passar do limite num mês cheio?", a: "Você compra créditos avulsos, como mais espaço de entrega ou mais seleções, ou muda de plano. Se os créditos do mês passarem do valor do plano de cima, o painel sugere a troca." },
  { q: "Como o cliente baixa as fotos editadas?", a: "Pelo link de entrega: ele baixa todas de uma vez ou uma por uma, até o fim do prazo do seu plano (7, 14 ou 30 dias)." },
];

function Cell({ v }) {
  if (v === true) return <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-rv-ameixa text-rv-lavanda"><Check className="h-3.5 w-3.5" aria-label="Incluído" /></span>;
  return <span className="font-medium text-rv-ameixa">{v}</span>;
}

export default function RevelaPlans() {
  useRevelaMeta("Planos e preços", `Três planos com todas as ferramentas da Revela, a partir de R$ ${FROM_PRICE} por mês. Compare seleções, prévias, espaço de entrega e prazo de download.`);
  return (
    <RevelaLayout>
      <section className="relative isolate overflow-hidden bg-rv-lavanda pb-24 pt-36 sm:pt-40" aria-labelledby="rv-planos-h1">
        <div className="rv-ground" aria-hidden>
          <span className="rv-blob" style={{ left: "56%", top: "-24%", width: "60vw", height: "60vw", background: "radial-gradient(closest-side, rgba(201,93,99,.35), rgba(201,93,99,0))" }} />
          <span className="rv-blob" style={{ left: "-20%", top: "14%", width: "56vw", height: "56vw", background: "radial-gradient(closest-side, rgba(142,134,166,.5), rgba(142,134,166,0))" }} />
          <span className="rv-blob" style={{ left: "30%", top: "50%", width: "50vw", height: "50vw", background: "radial-gradient(closest-side, rgba(255,255,255,.95), rgba(255,255,255,0))" }} />
        </div>
        <div className="rv-wrap relative z-10">
          <h1 id="rv-planos-h1" className="max-w-3xl text-[2.75rem] leading-[1.03] sm:text-6xl">Planos da Revela para fotógrafas</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-rv-ink2 sm:text-xl">
            Todos os planos têm todas as ferramentas. Escolha pelo tamanho do seu estúdio: a partir de R$ {FROM_PRICE} por mês, com Pix ou cartão.
          </p>
          <div className="mt-14"><PlanCards dark={false} headingLevel={2} /></div>
          <CreditsStrip dark={false} />
        </div>
      </section>

      <section className="bg-rv-nevoa py-24" aria-labelledby="rv-compare">
        <div className="rv-wrap">
          <h2 id="rv-compare" className="text-4xl leading-tight sm:text-5xl">Compare os planos</h2>
          <div className="lg mt-10 overflow-x-auto" style={{ "--lg-bg": "rgba(255,255,255,.7)" }}>
            <table className="w-full min-w-[640px] text-left text-[15px]">
              <thead>
                <tr className="border-b border-rv-ameixa/10">
                  <th scope="col" className="px-5 py-5 font-medium text-rv-ink2 sm:px-7">Recurso</th>
                  {PLANS.map((p) => (
                    <th key={p.id} scope="col" className="px-4 py-5 text-center">
                      <span className="block font-revela text-2xl font-normal text-rv-ameixa">{p.name}</span>
                      <span className="text-[14px] font-normal text-rv-ink2">R$ {p.price} por mês</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((row) => (
                  <tr key={row.label} className="border-b border-rv-ameixa/[.06] last:border-0">
                    <th scope="row" className="px-5 py-4 font-normal text-rv-ink2 sm:px-7">{row.label}</th>
                    {row.values.map((v, i) => <td key={i} className="px-4 py-4 text-center"><Cell v={v} /></td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="bg-rv-nevoa pb-28" aria-labelledby="rv-faq">
        <div className="rv-wrap grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 id="rv-faq" className="text-4xl leading-tight sm:text-5xl">Perguntas sobre os planos</h2>
            <Link to="/cadastro" className="rv-btn rv-btn-primary mt-8"><span className="rv-btn-dot" aria-hidden />Criar conta</Link>
          </div>
          <div className="space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="lg group p-0" style={{ "--lg-r": "20px", "--lg-bg": "rgba(255,255,255,.6)" }}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-[17px] font-medium text-rv-ameixa [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <Plus className="h-5 w-5 shrink-0 text-rv-rosa transition-transform duration-300 group-open:rotate-45" aria-hidden />
                </summary>
                <p className="px-6 pb-6 text-[16px] leading-relaxed text-rv-ink2">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </RevelaLayout>
  );
}
