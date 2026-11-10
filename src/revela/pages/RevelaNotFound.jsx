import { Link } from "react-router-dom";
import RevelaLayout from "../components/RevelaLayout.jsx";
import AuthScene from "../components/AuthScene.jsx";
import { useRevelaMeta } from "../hooks.js";
import { SITE_BASE } from "../../config/tenant.js";

export default function RevelaNotFound() {
  useRevelaMeta("Página não encontrada");
  return (
    <RevelaLayout footer={false}>
      <section className="relative isolate flex min-h-[100svh] items-center bg-rv-lavanda pb-16 pt-28">
        <AuthScene />
        <div className="rv-wrap relative z-10">
          <div className="lg max-w-[520px] p-8 sm:p-10" style={{ "--lg-r": "32px", "--lg-bg": "rgba(255,255,255,.55)" }}>
            <p className="font-revela text-7xl leading-none text-rv-rosa">404</p>
            <h1 className="mt-4 text-4xl leading-tight">Esta página não existe</h1>
            <p className="mt-3 text-[16px] leading-relaxed text-rv-ink2">O endereço pode ter mudado. Procurando o site de um estúdio? Ele fica no endereço com o nome do estúdio.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/" className="rv-btn rv-btn-primary"><span className="rv-btn-dot" aria-hidden />Ir para o início</Link>
              <Link to={SITE_BASE} className="rv-btn lg lg-pill rv-btn-glass">Ver o site da Taíse</Link>
            </div>
          </div>
        </div>
      </section>
    </RevelaLayout>
  );
}
