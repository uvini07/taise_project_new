import { Link } from "react-router-dom";
import { ArrowUpRight, Lock } from "lucide-react";
import { siteHost } from "../hooks.js";
import { SITE_BASE, TENANT, sitePath } from "../../config/tenant.js";

/** O primeiro estúdio na Revela: o site da Taíse, em /tarufino. */
export default function Showcase() {
  return (
    <section className="relative isolate overflow-hidden bg-rv-nevoa py-24 sm:py-28" aria-labelledby="rv-showcase">
      <div className="rv-ground" aria-hidden>
        <span className="rv-blob" style={{ left: "-10%", top: "10%", width: "54vw", height: "54vw", background: "radial-gradient(closest-side, rgba(201,93,99,.2), rgba(201,93,99,0))" }} />
        <span className="rv-blob" style={{ left: "58%", top: "-14%", width: "50vw", height: "50vw", background: "radial-gradient(closest-side, rgba(142,134,166,.32), rgba(142,134,166,0))" }} />
      </div>
      <div className="rv-wrap relative z-10 grid items-center gap-12 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
        <Link to={sitePath("/")} className="lg rv-lift group block overflow-hidden" style={{ "--lg-r": "24px", "--lg-bg": "rgba(255,255,255,.5)" }} aria-label={`Abrir o site da ${TENANT.name}`}>
          <span className="flex items-center gap-3 border-b border-white/60 px-4 py-3">
            <span className="flex gap-1.5" aria-hidden>{[0, 1, 2].map((i) => <i key={i} className="h-2.5 w-2.5 rounded-full bg-rv-ameixa/15" />)}</span>
            <span className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-[12px] text-rv-ink2">
              <Lock className="h-3 w-3 shrink-0" aria-hidden /><span className="truncate">{siteHost()}{SITE_BASE}</span>
            </span>
          </span>
          <span className="rv-zoom block aspect-[16/10] bg-rv-lavanda">
            <img src="/revela/img/site-taise.webp" alt={`Página inicial do site da ${TENANT.name}`} loading="lazy" decoding="async" width="1280" height="800" className="h-full w-full object-cover object-top" />
          </span>
        </Link>
        <div>
          <h2 id="rv-showcase" className="text-4xl leading-[1.05] sm:text-5xl">O site da {TENANT.name} já roda na Revela</h2>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-rv-ink2">
            Pacotes com lotes, agenda com sinal, galeria e lista VIP da fotógrafa Taíse, no endereço {siteHost()}{SITE_BASE}.
          </p>
          <Link to={sitePath("/")} className="rv-btn lg lg-pill rv-btn-glass mt-8">
            Abrir o site da Taíse <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
