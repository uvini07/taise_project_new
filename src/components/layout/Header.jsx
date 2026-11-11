import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Logo from "../common/Logo.jsx";
import WhatsAppLink from "../common/WhatsAppLink.jsx";
import { WhatsAppIcon } from "../common/Icons.jsx";
import { useSettings } from "../../contexts/SettingsContext.jsx";
import { useBodyLock } from "../../hooks/useBodyLock.js";
import { waMessages } from "../../utils/whatsapp.js";
import { sitePath } from "../../config/tenant.js";
import { useLayout } from "../../hooks/useLayout.js";
import { layoutById } from "../../config/siteStyle.js";

export function useNavItems(hasVip) {
  const { settings } = useSettings();
  return [
    { to: sitePath("/"), label: "Início", end: true },
    { to: sitePath("/sobre"), label: "Sobre" },
    { to: sitePath("/pacotes"), label: "Pacotes" },
    { to: sitePath("/galeria"), label: "Galeria" },
    settings.display.showAgenda && { to: sitePath("/agenda"), label: "Agenda" },
    hasVip && { to: sitePath("/vip"), label: "VIP" },
    { to: sitePath("/contato"), label: "Contato" },
  ].filter(Boolean);
}

export default function Header({ overlay = false, hasVip = false }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { settings } = useSettings();
  const items = useNavItems(hasVip);
  useBodyLock(open);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  const transparent = overlay && !scrolled && !open;
  const layout = useLayout();
  const dark = !!layoutById(layout).dark; // modelo de fundo escuro (Cinema)
  const navLink = (it, extra = "") => (
    <NavLink key={it.to} to={it.to} end={it.end}
      className={`link-underline text-[13px] font-medium uppercase tracking-[0.18em] transition-colors ${
        transparent ? "text-cream/90 hover:text-white" : "text-ink-soft hover:text-wine-900"} ${extra}`}>
      {it.label}
    </NavLink>
  );
  const logo = (cls) => (
    <Link to={sitePath("/")} data-edit="identidade.logo" className="shrink-0" aria-label={`${settings.brandName} — página inicial`}>
      <Logo tone={transparent || dark ? "light" : "dark"} eager className={`w-auto transition-all duration-500 ${cls}`} />
    </Link>
  );
  const waButton = (
    <WhatsAppLink message={waMessages.general(settings.brandName)} context="header"
      className={`hidden sm:inline-flex ${transparent ? "btn-light btn-sm" : "btn-primary btn-sm"}`}>
      <WhatsAppIcon className="h-4 w-4" /> Falar no WhatsApp
    </WhatsAppLink>
  );
  const burger = (
    <button
      className={`rounded-full p-2.5 lg:hidden ${transparent ? "text-cream hover:bg-surface/10" : "text-ink hover:bg-ink/5"}`}
      onClick={() => setOpen((v) => !v)}
      aria-expanded={open}
      aria-controls="menu-mobile"
      aria-label={open ? "Fechar menu" : "Abrir menu"}
    >
      {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
    </button>
  );
  const shell = `${overlay ? "fixed" : "sticky"} inset-x-0 top-0 z-50 transition-all duration-500 ${
    transparent ? "bg-gradient-to-b from-black/35 to-transparent" : "border-b border-ink/5 bg-ivory/90 shadow-[0_1px_0_rgba(0,0,0,.02)] backdrop-blur-md"}`;

  // Cabeçalho de cada modelo (no celular, todos ficam com logo + menu).
  let bar;
  if (layout === "revista") {
    // Fio com o menu em cima, como o topo de uma revista; logo e WhatsApp embaixo.
    bar = (
      <>
        <nav aria-label="Principal" className="hidden border-b border-ink/15 lg:block">
          <div className="container-x flex h-10 items-center justify-center gap-8">
            {items.map((it) => (
              <NavLink key={it.to} to={it.to} end={it.end}
                className={({ isActive }) => `text-[11px] uppercase tracking-[0.24em] transition ${isActive ? "text-wine-900" : "text-ink-soft hover:text-ink"}`}>{it.label}</NavLink>
            ))}
          </div>
        </nav>
        <div className="container-x flex h-[72px] items-center justify-between border-b-2 border-ink">
          {logo("h-11")}
          <div className="flex items-center gap-2">{waButton}{burger}</div>
        </div>
      </>
    );
  } else if (layout === "polaroid") {
    // Menu com sublinhado ondulado, como escrito à mão.
    bar = (
      <div className="container-x flex h-[72px] items-center justify-between gap-6">
        {logo("h-11")}
        <nav aria-label="Principal" className="hidden items-center gap-7 lg:flex">
          {items.map((it) => (
            <NavLink key={it.to} to={it.to} end={it.end}
              className={({ isActive }) => `font-display text-lg italic underline-offset-8 transition ${isActive ? "text-wine-900 underline decoration-gold decoration-wavy decoration-2" : "text-ink-soft hover:text-wine-900"}`}>{it.label}</NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">{waButton}{burger}</div>
      </div>
    );
  } else if (layout === "minimalista") {
    // Só a logo e os links, pequenos. Sem botão.
    bar = (
      <div className="container-x flex h-[72px] items-center justify-between">
        {logo("h-10")}
        <nav aria-label="Principal" className="hidden items-center gap-7 lg:flex">
          {items.map((it) => (
            <NavLink key={it.to} to={it.to} end={it.end}
              className={({ isActive }) => `text-[13px] lowercase transition ${isActive ? "text-ink" : "text-ink-muted hover:text-ink"}`}>{it.label}</NavLink>
          ))}
        </nav>
        {burger}
      </div>
    );
  } else if (layout === "imersivo") {
    // Menu à esquerda, logo no centro, WhatsApp à direita, sobre a foto.
    bar = (
      <div className={`container-x grid grid-cols-[1fr_auto_1fr] items-center transition-all duration-500 ${transparent ? "h-24" : "h-[72px]"}`}>
        <nav aria-label="Principal" className="hidden items-center gap-6 lg:flex">{items.map((it) => navLink(it, "!text-[12px]"))}</nav>
        <span className="lg:hidden" />
        {logo(transparent ? "h-12 sm:h-14" : "h-11")}
        <div className="flex items-center justify-end gap-2">{waButton}{burger}</div>
      </div>
    );
  } else if (layout === "cinema") {
    // Menu em letras pequenas douradas, separadas por pontos.
    bar = (
      <div className={`container-x flex items-center justify-between transition-all duration-500 ${transparent ? "h-24" : "h-[72px]"}`}>
        {logo(transparent ? "h-12 sm:h-14" : "h-11")}
        <nav aria-label="Principal" className="hidden items-center gap-5 lg:flex">
          {items.map((it, i) => (
            <span key={it.to} className="flex items-center gap-5">
              {i > 0 && <span className="h-1 w-1 rounded-full bg-gold/60" aria-hidden />}
              <NavLink to={it.to} end={it.end}
                className={({ isActive }) => `text-[12px] uppercase tracking-[0.22em] transition ${isActive ? "text-gold" : transparent ? "text-cream/85 hover:text-gold-light" : "text-ink-soft hover:text-gold"}`}>{it.label}</NavLink>
            </span>
          ))}
        </nav>
        <div className="flex items-center gap-2">{waButton}{burger}</div>
      </div>
    );
  } else if (layout === "dividido") {
    // Logo centralizada em cima, menu centralizado embaixo entre linhas finas.
    bar = (
      <>
        <div className="container-x grid h-[72px] grid-cols-[1fr_auto_1fr] items-center lg:h-20">
          <span className="hidden text-[11px] uppercase tracking-[0.24em] text-ink-muted lg:block">{settings.hero?.eyebrow}</span>
          <span className="lg:hidden" />
          {logo("h-11 lg:h-12")}
          <div className="flex items-center justify-end gap-2">{waButton}{burger}</div>
        </div>
        <nav aria-label="Principal" className="hidden border-t border-ink/10 lg:block">
          <div className="container-x flex h-12 items-center justify-center gap-10">{items.map((it) => navLink(it))}</div>
        </nav>
      </>
    );
  } else if (layout === "arco") {
    // Menu dividido dos dois lados da logo, que fica no centro.
    const half = Math.ceil(items.length / 2);
    bar = (
      <div className="container-x flex h-[76px] items-center justify-between lg:grid lg:h-24 lg:grid-cols-[1fr_auto_1fr] lg:gap-10">
        <nav aria-label="Principal" className="hidden items-center justify-end gap-8 lg:flex">{items.slice(0, half).map((it) => navLink(it))}</nav>
        {logo("h-12 lg:h-14")}
        <div className="flex items-center gap-2 lg:hidden">{burger}</div>
        <nav aria-label="Principal (continuação)" className="hidden items-center gap-8 lg:flex">{items.slice(half).map((it) => navLink(it))}</nav>
      </div>
    );
  } else if (layout === "mosaico") {
    // Menu numa cápsula no meio, logo à esquerda, WhatsApp à direita.
    bar = (
      <div className="container-x flex h-[76px] items-center justify-between gap-4">
        {logo("h-11")}
        <nav aria-label="Principal" className="hidden items-center gap-1 rounded-[18px] border border-ink/[.06] bg-surface p-1.5 shadow-soft lg:flex">
          {items.map((it) => (
            <NavLink key={it.to} to={it.to} end={it.end}
              className={({ isActive }) => `rounded-xl px-4 py-2 text-[13px] font-medium transition ${isActive ? "bg-wine-900 text-cream" : "text-ink-soft hover:bg-ink/5 hover:text-ink"}`}>
              {it.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">{waButton}{burger}</div>
      </div>
    );
  } else {
    bar = (
      <div className={`container-x flex items-center justify-between transition-all duration-500 ${transparent ? "h-24" : "h-[72px]"}`}>
        {logo(transparent ? "h-14 sm:h-16" : "h-11")}
        <nav aria-label="Principal" className={`hidden items-center gap-7 lg:flex ${layout === "diagonal" ? "ml-auto mr-8" : ""}`}>
          {items.map((it) => navLink(it))}
        </nav>
        <div className="flex items-center gap-2">{waButton}{burger}</div>
      </div>
    );
  }

  return (
    <header className={shell}>
      {bar}

      {open && (
        <div id="menu-mobile" className="absolute inset-x-0 top-full z-40 h-[calc(100dvh-72px)] animate-fade-in overflow-y-auto bg-ivory lg:hidden">
          <nav aria-label="Menu" className="container-x flex flex-col py-6">
            {items.map((it, i) => (
              <NavLink key={it.to} to={it.to} end={it.end}
                className={({ isActive }) => `animate-fade-up border-b border-ink/5 py-4 font-display text-3xl ${isActive ? "text-wine-900" : "text-ink"}`}
                style={{ animationDelay: `${i * 40}ms` }}>
                {it.label}
              </NavLink>
            ))}
            <WhatsAppLink message={waMessages.general(settings.brandName)} context="menu" className="btn-primary mt-8 w-full">
              <WhatsAppIcon className="h-4 w-4" /> Falar no WhatsApp
            </WhatsAppLink>
          </nav>
        </div>
      )}
    </header>
  );
}
