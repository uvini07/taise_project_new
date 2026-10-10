import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Logo from "../common/Logo.jsx";
import WhatsAppLink from "../common/WhatsAppLink.jsx";
import { WhatsAppIcon } from "../common/Icons.jsx";
import { useSettings } from "../../contexts/SettingsContext.jsx";
import { useBodyLock } from "../../hooks/useBodyLock.js";
import { waMessages } from "../../utils/whatsapp.js";

export function useNavItems(hasVip) {
  const { settings } = useSettings();
  return [
    { to: "/", label: "Início", end: true },
    { to: "/sobre", label: "Sobre" },
    { to: "/pacotes", label: "Pacotes" },
    { to: "/galeria", label: "Galeria" },
    settings.display.showAgenda && { to: "/agenda", label: "Agenda" },
    hasVip && { to: "/vip", label: "VIP" },
    { to: "/contato", label: "Contato" },
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
  return (
    <header className={`${overlay ? "fixed" : "sticky"} inset-x-0 top-0 z-50 transition-all duration-500 ${
      transparent ? "bg-gradient-to-b from-black/35 to-transparent" : "border-b border-ink/5 bg-ivory/90 shadow-[0_1px_0_rgba(0,0,0,.02)] backdrop-blur-md"}`}>
      <div className={`container-x flex items-center justify-between transition-all duration-500 ${transparent ? "h-24" : "h-[72px]"}`}>
        <Link to="/" className="shrink-0" aria-label={`${settings.brandName} — página inicial`}>
          <Logo tone={transparent ? "light" : "dark"} eager className={`w-auto transition-all duration-500 ${transparent ? "h-14 sm:h-16" : "h-11"}`} />
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-7 lg:flex">
          {items.map((it) => (
            <NavLink key={it.to} to={it.to} end={it.end}
              className={`link-underline text-[13px] font-medium uppercase tracking-[0.18em] transition-colors ${
                transparent ? "text-cream/90 hover:text-white" : "text-ink-soft hover:text-wine-900"}`}>
              {it.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <WhatsAppLink message={waMessages.general(settings.brandName)} context="header"
            className={`hidden sm:inline-flex ${transparent ? "btn-light btn-sm" : "btn-primary btn-sm"}`}>
            <WhatsAppIcon className="h-4 w-4" /> Falar no WhatsApp
          </WhatsAppLink>
          <button
            className={`rounded-full p-2.5 lg:hidden ${transparent ? "text-cream hover:bg-surface/10" : "text-ink hover:bg-ink/5"}`}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

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
