import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  BarChart3, CalendarDays, CreditCard, Crown, Heart, PackageCheck, ExternalLink, ImagePlus, Images, LayoutDashboard, LifeBuoy, LogOut, Menu, Package, Settings, Sparkles, Wallet, Wand2, X,
} from "lucide-react";
import Logo from "../common/Logo.jsx";
import { useSettings } from "../../contexts/SettingsContext.jsx";
import { isLegacyStudio } from "../../config/tenant.js";
import OnboardingTour from "../admin/OnboardingTour.jsx";
import PolaroidChat from "../admin/PolaroidChat.jsx";
import { dailySummary } from "../../services/polaroid.js";
import PolaroidyMascot from "../admin/PolaroidyMascot.jsx";
import { confirmLeave } from "../../utils/unsaved.js";
import { supportLink } from "../../config/support.js";
import { WhatsAppIcon } from "../common/Icons.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { logout } from "../../services/authService.js";
import { useBodyLock } from "../../hooks/useBodyLock.js";
import { sitePath } from "../../config/tenant.js";

// Menu do painel em três grupos. "beta" marca ferramentas ainda em teste.
export const ADMIN_GROUPS = [
  { title: null, items: [
    { to: "/adm/dashboard", label: "Visão geral", icon: LayoutDashboard },
  ] },
  { title: "Meu site", items: [
    { to: "/adm/editor", label: "Editar meu site", icon: Wand2, hint: "Editor visual: veja o site mudando enquanto edita", highlight: true },
    { to: "/adm/configuracoes", label: "Conteúdo do site", icon: Settings, hint: "Textos, fotos e contato" },
    { to: "/adm/pacotes", label: "Pacotes", icon: Package },
    { to: "/adm/galeria", label: "Galeria", icon: Images },
    { to: "/adm/evento", label: "Evento promocional", icon: Sparkles },
    { to: "/adm/vip", label: "Lista VIP", icon: Crown },
  ] },
  { title: "Clientes", items: [
    { to: "/adm/agenda", label: "Agenda", icon: CalendarDays },
    { to: "/adm/selecao", label: "Seleção de fotos", icon: Heart, beta: true },
    { to: "/adm/entrega", label: "Entrega final", icon: PackageCheck, beta: true },
  ] },
  { title: "Gestão", items: [
    { to: "/adm/financeiro", label: "Financeiro", icon: Wallet },
    { to: "/adm/analytics", label: "Visitas do site", icon: BarChart3 },
    { to: "/adm/assinatura", label: "Minha assinatura", icon: CreditCard },
  ] },
];
export const ADMIN_NAV = ADMIN_GROUPS.flatMap((g) => g.items);

function NavList({ onNavigate }) {
  return (
    <nav aria-label="Painel" className="flex flex-col gap-3">
      {ADMIN_GROUPS.map((g) => (
        <div key={g.title || "inicio"} className="flex flex-col gap-0.5">
          {g.title && <p className="px-3.5 pb-1 text-[10px] font-medium uppercase tracking-[0.2em] text-ink-muted">{g.title}</p>}
          {g.items.map(({ to, label, icon: Icon, beta, hint }) => (
            <NavLink key={to} to={to} title={hint}
              onClick={(e) => { if (!confirmLeave()) { e.preventDefault(); return; } onNavigate?.(); }}
              className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3.5 py-[7px] text-sm transition ${
                isActive ? "bg-wine-900 text-cream shadow-soft" : "text-ink-soft hover:bg-ink/5 hover:text-ink"}`}>
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.6} aria-hidden />
              <span className="flex-1">{label}</span>
              {beta && <span className="rounded-full bg-gold/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-gold-dark" title="Em teste: as fotos ainda não ficam salvas">teste</span>}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );
}

/** Aviso no topo do painel quando faltam 7 dias ou menos para o teste acabar. */
function TrialBanner() {
  const { admin } = useAuth();
  if (admin?.plan !== "trial" || !admin?.trialEndsAt) return null;
  const days = Math.ceil((admin.trialEndsAt.getTime() - Date.now()) / 86400000);
  if (days > 7) return null;
  return (
    <div className="sticky top-0 z-50 bg-wine-900 px-4 py-2.5 text-center text-sm text-cream lg:pl-64">
      {days <= 0 ? "Seu teste grátis termina hoje." : `Seu teste grátis termina em ${days} ${days === 1 ? "dia" : "dias"}.`}{" "}
      Para continuar sem perder nada, <Link to="/adm/assinatura" className="font-medium underline underline-offset-2">assine agora</Link>.
    </div>
  );
}

/**
 * Logo no topo do painel. Estúdio novo sem logo: no lugar do nome aparece um
 * convite para enviar a logo, que leva direto ao campo em Configurações.
 */
function AdminBrand({ compact = false }) {
  const { settings } = useSettings();
  if (isLegacyStudio() || settings.logoUrl) {
    return <Link to="/adm/dashboard" className={compact ? "" : "mb-5 block px-2"}><Logo className={compact ? "h-10 w-auto" : "h-14 w-auto"} eager /></Link>;
  }
  return (
    <Link to="/adm/editor?painel=identidade"
      className={`group flex items-center gap-2.5 rounded-2xl border-2 border-dashed border-wine-900/25 text-wine-900 transition hover:border-wine-900/60 hover:bg-wine-900/5 ${compact ? "px-3 py-1.5" : "mb-5 px-3 py-3"}`}>
      <span className={`flex shrink-0 items-center justify-center rounded-xl bg-wine-900/10 ${compact ? "h-7 w-7" : "h-9 w-9"}`}>
        <ImagePlus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
      </span>
      <span className={`leading-tight ${compact ? "text-xs" : "text-sm"}`}>
        <b className="block font-medium">{compact ? "Adicionar logo" : "Clique para adicionar sua logo"}</b>
        {!compact && <span className="text-xs text-ink-muted">Ela aparece no seu site e aqui</span>}
      </span>
    </Link>
  );
}

export default function AdminLayout() {
  const { admin, user } = useAuth();
  const { settings } = useSettings();
  const [open, setOpen] = useState(false);
  const [polaroid, setPolaroid] = useState(false);
  // Resumo do dia (sem IA): número na bolinha e mensagem ao abrir a Polaroidy.
  const [summary, setSummary] = useState(null);
  useEffect(() => {
    let alive = true;
    dailySummary().then((s) => alive && setSummary(s)).catch(() => {});
    return () => { alive = false; };
  }, [polaroid]);
  const badge = summary ? summary.requests + summary.overdueCount : 0;
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

  const help = supportLink(admin?.studioName || settings.brandName);
  const footer = (
    <div className="space-y-1 border-t border-ink/5 pt-4">
      <a href={help} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-wine-900 hover:bg-wine-900/5">
        <LifeBuoy className="h-[18px] w-[18px]" strokeWidth={1.6} aria-hidden /> Ajuda pelo WhatsApp
      </a>
      <Link to={sitePath("/")} target="_blank" className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-ink-soft hover:bg-ink/5">
        <ExternalLink className="h-[18px] w-[18px]" strokeWidth={1.6} aria-hidden /> Ver o site
      </Link>
      <button onClick={() => confirmLeave() && logout()} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-ink-soft hover:bg-ink/5">
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
      <PolaroidChat open={polaroid} onClose={() => setPolaroid(false)} summary={summary} />
      {/* Bolinha da Polaroidy (identidade da Revela). Sobe um pouco onde há o
          botão "Salvar" fixo no rodapé da página. */}
      {!polaroid && (
        <button type="button" onClick={() => setPolaroid(true)} aria-label="Abrir a Polaroidy, sua assistente"
          className={`group fixed right-4 z-40 flex items-center sm:right-6 ${pathname.startsWith("/adm/configuracoes") ? "bottom-24" : "bottom-5 sm:bottom-6"}`}>
          <span className="pointer-events-none mr-3 hidden translate-x-2 rounded-full bg-[#2B2540] px-3 py-1.5 font-revela text-sm text-white opacity-0 shadow-lift transition group-hover:translate-x-0 group-hover:opacity-100 sm:block">Polaroidy</span>
          <span className="relative flex h-14 w-14 items-center justify-center rounded-full shadow-[0_12px_30px_-10px_rgba(43,37,64,.7)] ring-4 ring-[#E6E1F0] transition group-hover:scale-105">
            <PolaroidyMascot className="h-14 w-14 overflow-hidden rounded-full" />
            {badge > 0 && <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#C95D63] px-1.5 text-[12px] font-semibold text-white ring-2 ring-white" aria-label={`${badge} coisas precisam de você`}>{badge}</span>}
          </span>
        </button>
      )}
      {/* Ajuda sempre à mão (some no Editor do site, que cobre a tela). */}
      <a href={help} target="_blank" rel="noopener noreferrer" aria-label="Ajuda pelo WhatsApp"
        className="fixed bottom-5 left-4 z-40 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-medium text-white shadow-lift transition hover:brightness-105 lg:hidden">
        <WhatsAppIcon className="h-5 w-5" /> Ajuda
      </a>
      <TrialBanner />
      {/* O menu inteiro rola junto em telas baixas (nada fica escondido atrás do rodapé). */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col overflow-y-auto overscroll-contain border-r border-ink/5 bg-ivory p-5 lg:flex">
        <AdminBrand />
        <div className="flex-1"><NavList /></div>
        <div className="mt-5">{footer}</div>
      </aside>

      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-ink/5 bg-ivory/90 px-4 backdrop-blur lg:hidden">
        <AdminBrand compact />
        <div className="flex items-center gap-1">
          <button onClick={() => setOpen(true)} className="rounded-full p-2.5 hover:bg-ink/5" aria-label="Abrir menu" aria-expanded={open}>
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-ink/40" onClick={() => setOpen(false)} aria-hidden />
          {/* No celular o menu inteiro rola junto (itens + Ver o site/Sair), sem área escondida. */}
          <div className="absolute inset-y-0 right-0 w-72 max-w-[85vw] animate-fade-in overflow-y-auto overscroll-contain bg-ivory p-5 pb-safe shadow-lift" role="dialog" aria-label="Menu do painel">
            <div className="mb-4 flex justify-end">
              <button onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-ink/5" aria-label="Fechar menu"><X className="h-5 w-5" /></button>
            </div>
            <NavList onNavigate={() => setOpen(false)} />
            <div className="mt-5">{footer}</div>
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
