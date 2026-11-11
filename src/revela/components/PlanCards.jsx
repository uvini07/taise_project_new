import { Link } from "react-router-dom";
import { Check, Sparkles } from "lucide-react";
import { CREDITS, INCLUDED, PLANS } from "../data.js";

/** Os três planos em cartões de vidro. dark = sobre fundo ameixa. */
export function PlanCards({ dark = true, headingLevel = 3 }) {
  const H = `h${headingLevel}`;
  return (
    <div className="grid items-stretch gap-5 md:grid-cols-3 lg:gap-6">
      {PLANS.map((p) => {
        const rec = p.recommended;
        return (
          <article key={p.id}
            className={`lg rv-lift relative flex flex-col p-7 sm:p-8 ${dark ? "lg-dark" : ""} ${rec ? "md:-my-3" : ""}`}
            style={rec
              ? { "--lg-bg": dark ? "rgba(201,93,99,.16)" : "rgba(255,255,255,.62)", boxShadow: "inset 0 0 0 1.5px rgba(201,93,99,.85), 0 40px 70px -30px rgba(201,93,99,.55)" }
              : { "--lg-bg": dark ? "rgba(43,37,64,.34)" : "rgba(255,255,255,.5)" }}>
            {rec && (
              <span className="absolute -top-3.5 left-7 z-10 inline-flex items-center gap-1.5 rounded-full bg-rv-rosa px-3 py-1.5 text-[12px] font-medium text-white shadow-[0_8px_20px_-8px_rgba(201,93,99,.9)]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />Recomendado
              </span>
            )}
            <H className={`text-[2rem] leading-tight ${dark ? "text-white" : "text-rv-ameixa"}`}>{p.name}</H>
            <p className={`mt-2 min-h-[3em] text-[15px] leading-relaxed ${dark ? "text-rv-lavanda/75" : "text-rv-ink2"}`}>{p.forWho}</p>
            <p className={`mt-6 flex items-end gap-1.5 ${dark ? "text-white" : "text-rv-ameixa"}`}>
              <span className="pb-2 text-[17px]">R$</span>
              <span className="font-revela text-[4.25rem] leading-[.9] tabular-nums">{p.price}</span>
              <span className={`pb-2 text-[15px] ${dark ? "text-rv-lavanda/70" : "text-rv-ink2"}`}>por mês</span>
            </p>
            <ul className="mt-7 space-y-3">
              {p.limits.map((l) => (
                <li key={l.k} className={`flex items-start gap-3 text-[15px] ${dark ? "text-rv-lavanda" : "text-rv-ameixa"}`}>
                  <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${rec ? "bg-rv-rosa text-white" : dark ? "bg-white/15 text-white" : "bg-rv-ameixa text-rv-lavanda"}`}><Check className="h-3 w-3" aria-hidden /></span>
                  {l.label}
                </li>
              ))}
            </ul>
            <div className={`my-7 h-px ${dark ? "bg-white/15" : "bg-rv-ameixa/10"}`} />
            <p className={`text-[14px] leading-relaxed ${dark ? "text-rv-lavanda/70" : "text-rv-ink2"}`}>
              Também inclui: {INCLUDED.join(", ").toLowerCase().replace("vip", "VIP").replace("polaroidy", "Polaroidy").replace(" ia", " IA")}.
            </p>
            <div className="mt-auto pt-8">
              <Link to={`/cadastro?plano=${p.id}`}
                className={`rv-btn w-full ${rec ? "rv-btn-primary" : dark ? "rv-btn-light" : "lg lg-pill rv-btn-glass"}`}
                style={rec ? { background: "#C95D63", color: "#fff" } : undefined}>
                Começar no {p.name}
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}

/** Créditos avulsos para um mês mais cheio. */
export function CreditsStrip({ dark = true }) {
  return (
    <div className={`lg mt-8 flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-center ${dark ? "lg-dark" : ""}`} style={{ "--lg-bg": dark ? "rgba(43,37,64,.3)" : "rgba(255,255,255,.5)" }}>
      <div className="lg:w-[260px] lg:shrink-0">
        <p className={`font-revela text-2xl ${dark ? "text-white" : "text-rv-ameixa"}`}>Créditos avulsos</p>
        <p className={`text-[14px] ${dark ? "text-rv-lavanda/70" : "text-rv-ink2"}`}>Para um mês mais cheio, sem mudar de plano.</p>
      </div>
      <ul className="grid flex-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {CREDITS.map((c) => (
          <li key={c.label} className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-[14px] ${dark ? "bg-white/10 text-rv-lavanda" : "bg-white/70 text-rv-ameixa ring-1 ring-white"}`}>
            <span>{c.label}</span><b className="whitespace-nowrap font-medium">R$ {c.price}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}
