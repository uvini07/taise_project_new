import { Link } from "react-router-dom";
import { Wordmark } from "./Logo.jsx";
import { useSectionLink } from "./Nav.jsx";
import { sitePath } from "../../config/tenant.js";

export default function Footer() {
  const goSection = useSectionLink();
  const col = "space-y-3 text-[15px]";
  const a = "rv-link text-rv-lavanda/80 hover:text-white";
  return (
    <footer data-nav-theme="dark" className="relative overflow-hidden bg-rv-noite text-rv-lavanda">
      <div className="rv-wrap grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:py-20">
        <div>
          <Wordmark className="h-8 w-auto" ink="#E6E1F0" decorative />
          <p className="mt-5 max-w-xs text-[15px] leading-relaxed text-rv-lavanda/70">
            Site, agenda, seleção e entrega de fotos para fotógrafas, num painel só.
          </p>
        </div>
        <nav aria-label="Produto">
          <p className="mb-4 text-sm font-medium text-white">Produto</p>
          <ul className={col}>
            <li><a href="/#recursos" onClick={(e) => goSection(e, "/#recursos")} className={a}>Recursos</a></li>
            <li><a href="/#como-funciona" onClick={(e) => goSection(e, "/#como-funciona")} className={a}>Como funciona</a></li>
            <li><Link to="/planos" className={a}>Planos e preços</Link></li>
          </ul>
        </nav>
        <nav aria-label="Conta">
          <p className="mb-4 text-sm font-medium text-white">Conta</p>
          <ul className={col}>
            <li><Link to="/entrar" className={a}>Entrar</Link></li>
            <li><Link to="/cadastro" className={a}>Criar conta</Link></li>
          </ul>
        </nav>
        <nav aria-label="Estúdios">
          <p className="mb-4 text-sm font-medium text-white">Estúdios na Revela</p>
          <ul className={col}>
            <li><Link to={sitePath("/")} className={a}>Taíse Foto</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/10">
        <div className="rv-wrap flex flex-col gap-2 py-6 text-[13px] text-rv-lavanda/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Revela</p>
          <p>Fotografias: StockSnap (CC0)</p>
        </div>
      </div>
    </footer>
  );
}
