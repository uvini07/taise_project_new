import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  BarChart3, CalendarDays, Crown, Heart, PackageCheck, ExternalLink, ImagePlus, Images, LayoutDashboard, LogOut, Menu, Package, Palette, Settings, Sparkles, Wallet, X,
} from "lucide-react";
import Logo from "../common/Logo.jsx";
import { useSettings } from "../../contexts/SettingsContext.jsx";
import { isLegacyStudio } from "../../config/tenant.js";
import OnboardingTour from "../admin/OnboardingTour.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { logout } from "../../services/authService.js";
import { useBodyLock } from "../../hooks/useBodyLock.js";
import { sitePath } from "../../config/tenant.js";

export const ADMIN_NAV = [
  { to: "/adm/dashboard", label: "Visão geral", icon: LayoutDashboard },
  { to: "/adm/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/adm/selecao", label: "Seleção de fotos", icon: Heart },
  { to: "/adm/entrega", label: "Entrega final", icon: PackageCheck },
  { to: "/adm/pacotes", label: "Pacotes", icon: Package },
  { to: "/adm/galeria", label: "Galeria", icon: Images },
  { to: "/adm/evento", label: "Evento promocional", icon: Sparkles },
  { to: "/adm/vip", label: "VIP", icon: Crown },
  { to: "/adm/financeiro", label: "Financeiro", icon: Wallet },
  { to: "/adm/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/adm/estilo", label: "Estilo", icon: Palette },
  { to: "/adm/configuracoes", label: "Configurações", icon: Settings },
];

function NavList({ onNavigate }) {
  return (
    <nav aria-label="Painel" className="flex flex-col gap-1">
      {ADMIN_NAV.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} onClick={onNavigate}
          className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition ${
            isActive ? "bg-wine-900 text-cream shadow-soft" : "text-ink-soft hover:bg-ink/5 hover:text-ink"}`}>
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} aria-hidden /> {label}
        </NavLink>
      ))}
    </nav>
  );
}

/**
 * Logo no topo do painel. Estúdio novo sem logo: no lugar do nome aparece um
 * convite para enviar a logo, que leva direto ao campo em Configurações.
 */
function AdminBrand({ compact = false }) {
  const { settings } = useSettings();
  if (isLegacyStudio() || settings.logoUrl) {
    return <Link to="/adm/dashboard" className={compact ? "" : "mb-8 block px-2"}><Logo className={compact ? "h-10 w-auto" : "h-14 w-auto"} eager /></Link>;
  }
  return (
    <Link to="/adm/configuracoes?aba=identidade#logo"
      className={`group flex items-center gap-2.5 rounded-2xl border-2 border-dashed border-wine-900/25 text-wine-900 transition hover:border-wine-900/60 hover:bg-wine-900/5 ${compact ? "px-3 py-1.5" : "mb-8 px-3 py-3"}`}>
      <span className={`flex shrink-0 items-center justify-center rounded-xl bg-wine-900/10 ${compact ? "h-7 w-7" : "h-9 w-9"}`}>
        <ImagePlus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
      </span>
      <span className={`leading-tight ${compact ? "text-xs" : "text-sm"}`}>
        <b className="block font-medium">Clique para adicionar sua logo</b>
        {!compact && <span className="text-xs text-ink-muted">Ela aparece no seu site e aqui</span>}
      </span>
    </Link>
  );
}

export default function AdminLayout() {
  const { admin, user } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useBodyLock(open);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const meta = document.querySelector('meta[name="robots"]') || Object.assign(document.createElement("meta"), { name: "robots" });
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    const current = ADMIN_NAV.find((n) => pathname.startsWith(n.to));
    document.title = `${current?.label || "Painel"} · ${admin?.studioName || "Painel"}`;
  }, [pathname, admin?.studioName]);

  const footer = (
    <div className="space-y-1 border-t border-ink/5 pt-4">
      <Link to={sitePath("/")} target="_blank" className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-ink-soft hover:bg-ink/5">
        <ExternalLink className="h-[18px] w-[18px]" strokeWidth={1.6} aria-hidden /> Ver o site
      </Link>
      <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-ink-soft hover:bg-ink/5">
        <LogOut className="h-[18px] w-[18px]" strokeWidth={1.6} aria-hidden /> Sair
      </button>
      {admin?.plan === "trial" && admin?.trialEndsAt && (
        <p className="mx-2 mt-2 rounded-xl bg-wine-900/5 px-3 py-2 text-xs text-ink-soft">
          Teste grátis até <b>{admin.trialEndsAt.toLocaleDateString("pt-BR")}</b>
        </p>
      )}
      <p className="truncate px-3.5 pt-2 text-xs text-ink-muted" title={user?.email}>{admin?.name || user?.email}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-paper">
      <OnboardingTour />
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-ink/5 bg-ivory p-5 lg:flex">
        <AdminBrand />
        <div className="flex-1 overflow-y-auto"><NavList /></div>
        {footer}
      </aside>

      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-ink/5 bg-ivory/90 px-4 backdrop-blur lg:hidden">
        <AdminBrand compact />
        <button onClick={() => setOpen(true)} className="rounded-full p-2.5 hover:bg-ink/5" aria-label="Abrir menu" aria-expanded={open}>
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-ink/40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute inset-y-0 right-0 flex w-72 max-w-[85vw] animate-fade-in flex-col bg-ivory p-5 shadow-lift" role="dialog" aria-label="Menu do painel">
            <div className="mb-6 flex justify-end">
              <button onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-ink/5" aria-label="Fechar menu"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto"><NavList onNavigate={() => setOpen(false)} /></div>
            {footer}
          </div>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
