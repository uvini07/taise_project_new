import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Wordmark } from "./Logo.jsx";

const LINKS = [
  { to: "/ferramentas", label: "Ferramentas" },
  { to: "/#editor", label: "Editor do site" },
  { to: "/#polaroidy", label: "Polaroidy IA" },
  { to: "/planos", label: "Planos" },
];

/** Leva para a seção da página inicial (rolando suave se já estiver nela). */
export function useSectionLink() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  return (e, to) => {
    if (!to.startsWith("/#")) return;
    const id = to.slice(2);
    if (pathname === "/") {
      e.preventDefault();
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", `/#${id}`);
    } else {
      e.preventDefault();
      navigate(`/#${id}`);
    }
  };
}

/** Há alguém logado neste navegador? (marca gravada pelo painel no login). */
function useSessionHint() {
  const read = () => { try { return JSON.parse(localStorage.getItem("revela:sessao") || "null"); } catch { return null; } };
  const [s, setS] = useState(read);
  useEffect(() => {
    const on = () => setS(read());
    window.addEventListener("storage", on); window.addEventListener("focus", on);
    return () => { window.removeEventListener("storage", on); window.removeEventListener("focus", on); };
  }, []);
  return s;
}

export default function Nav() {
  const session = useSessionHint();
  const [compact, setCompact] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const goSection = useSectionLink();
  const sentinel = useRef(null);

  // Encolhe o menu depois que a página começa a rolar (sem ouvir o scroll).
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !("IntersectionObserver" in window)) return undefined;
    const io = new IntersectionObserver(([e]) => setCompact(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  // Sobre seções escuras (data-nav-theme="dark") o vidro do menu escurece, como no iPhone.
  const [dark, setDark] = useState(false);
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return undefined;
    const seen = new Map();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => seen.set(e.target, e.isIntersecting));
      setDark([...seen].some(([el, on]) => on && el.dataset.navTheme === "dark"));
    }, { rootMargin: "-36px 0px -92% 0px" });
    const t = setTimeout(() => document.querySelectorAll("[data-nav-theme]").forEach((el) => io.observe(el)), 300);
    return () => { clearTimeout(t); io.disconnect(); };
  }, [pathname]);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open]);

  return (
    <>
      <div ref={sentinel} aria-hidden className="pointer-events-none absolute left-0 top-0 h-24 w-px" />
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:px-5 sm:pt-4">
        <nav aria-label="Principal"
          data-dark={dark || undefined}
          className={`lg lg-pill rv-lens rv-nav pointer-events-auto flex w-full items-center gap-2 py-2 pl-5 pr-2 transition-[max-width,background-color,color] duration-500 sm:gap-4 ${compact ? "max-w-[980px]" : "max-w-[1180px]"} ${dark ? "lg-dark" : ""}`}
          style={{ "--lg-bg": dark ? "rgba(28,24,48,.42)" : compact ? "rgba(255,255,255,.46)" : "rgba(255,255,255,.3)" }}>
          <Link to="/" className="mr-auto flex items-center py-2" aria-label="Revela — página inicial">
            <Wordmark className={`h-[22px] w-auto transition-colors duration-500 ${dark ? "text-rv-lavanda" : "text-rv-ameixa"}`} decorative />
          </Link>
          <ul className="hidden items-center gap-1 lg:flex">
            {LINKS.map((l) => (
              <li key={l.to}>
                {l.to.startsWith("/#") ? (
                  <a href={l.to} onClick={(e) => goSection(e, l.to)} className="rounded-full px-4 py-2.5 text-[15px] text-rv-ink2 transition-colors hover:bg-white/50 hover:text-rv-ameixa">{l.label}</a>
                ) : (
                  <NavLink to={l.to} className={({ isActive }) => `rounded-full px-4 py-2.5 text-[15px] transition-colors hover:bg-white/50 hover:text-rv-ameixa ${isActive ? "bg-white/50 text-rv-ameixa" : "text-rv-ink2"}`}>{l.label}</NavLink>
                )}
              </li>
            ))}
          </ul>
          {session ? (
            <Link to="/adm/dashboard" className="rv-btn rv-btn-primary rv-btn-sm" title={session.studio || undefined}>
              <span className="rv-btn-dot" aria-hidden />{session.name ? <>Meu painel<span className="hidden sm:inline">&nbsp;· {session.name}</span></> : "Meu painel"}
            </Link>
          ) : (
            <>
              <Link to="/entrar" className="hidden rounded-full px-4 py-2.5 text-[15px] font-medium text-rv-ameixa transition-colors hover:bg-white/50 sm:inline-flex">Entrar</Link>
              <Link to="/cadastro" className="rv-btn rv-btn-primary rv-btn-sm"><span className="rv-btn-dot" aria-hidden />Criar conta</Link>
            </>
          )}
          <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-full text-rv-ameixa hover:bg-white/50 lg:hidden"
            aria-expanded={open} aria-controls="rv-menu" aria-label={open ? "Fechar menu" : "Abrir menu"} onClick={() => setOpen((v) => !v)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>
      </header>

      {open && (
        <div id="rv-menu" className="fixed inset-0 z-40 flex flex-col bg-rv-lavanda/80 px-5 pb-8 pt-28 backdrop-blur-2xl lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <ul className="space-y-1">
            {LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} onClick={(e) => { goSection(e, l.to); setOpen(false); }} className="block rounded-2xl px-3 py-4 font-revela text-4xl text-rv-ameixa">{l.label}</Link>
              </li>
            ))}
          </ul>
          <div className="mt-auto grid gap-3">
            {session ? (
              <Link to="/adm/dashboard" className="rv-btn rv-btn-primary w-full"><span className="rv-btn-dot" aria-hidden />Ir para o meu painel</Link>
            ) : (
              <>
                <Link to="/cadastro" className="rv-btn rv-btn-primary w-full"><span className="rv-btn-dot" aria-hidden />Criar conta</Link>
                <Link to="/entrar" className="rv-btn lg lg-pill rv-btn-glass w-full">Entrar</Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
