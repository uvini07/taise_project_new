import { Suspense, useEffect, useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import WhatsAppFab from "./WhatsAppFab.jsx";
import CookieBanner from "./CookieBanner.jsx";
import VipBar from "../vip/VipBar.jsx";
import PageLoader from "../common/PageLoader.jsx";
import { trackPageView } from "../../services/analyticsService.js";
import { useCampaigns } from "../../hooks/useCampaigns.js";
import { useSettings } from "../../contexts/SettingsContext.jsx";
import { campaignPhase } from "../../services/vipService.js";
import { stripSiteBase } from "../../config/tenant.js";
import { endPreview, layoutById, previewLayout } from "../../config/siteStyle.js";
import { useLayout } from "../../hooks/useLayout.js";
import { darkThemeVars } from "../../utils/theme.js";

export default function PublicLayout() {
  const { pathname: fullPath, search } = useLocation();
  // O site do estúdio vive em /tarufino; daqui para baixo vale o caminho sem o prefixo.
  const pathname = stripSiteBase(fullPath);
  const { settings } = useSettings();
  const { campaigns } = useCampaigns();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    trackPageView(pathname);
  }, [pathname]);

  // Campanha em destaque: publicada, marcada para o banner e ainda em andamento.
  const featured = useMemo(() => {
    const now = new Date();
    return campaigns
      .filter((c) => c.status === "published")
      .map((c) => ({ c, p: campaignPhase(c, now, c.count) }))
      .filter(({ p }) => p.phase !== "ended")
      .sort((a, b) => (a.p.countdownEnd?.getTime() || Infinity) - (b.p.countdownEnd?.getTime() || Infinity))[0] || null;
  }, [campaigns]);

  const hasVip = campaigns.some((c) => c.status === "published");
  // O cabeçalho só fica transparente sobre topos com foto escura (veja LAYOUTS.overlay).
  const layout = useLayout();
  // As formas (botões, cartões, fotos) seguem o modelo: veja index.css.
  useEffect(() => {
    document.documentElement.dataset.layout = layout;
    return () => { delete document.documentElement.dataset.layout; };
  }, [layout]);
  const preview = previewLayout(search);
  const dark = !!layoutById(layout).dark;
  const overlay = pathname === "/" && layoutById(layout).overlay;
  const showBar = featured && featured.c.showBanner !== false && settings.display.showVipBanner && !pathname.startsWith("/vip");
  // Altura do cabeçalho de cada modelo (para o topo da página caber na tela).
  const headerH = { dividido: 128, arco: 96, revista: 112 }[layout] || 72;
  const TOP_OFFSET = overlay && !showBar ? "0px" : `${(showBar ? 40 : 0) + headerH}px`;

  return (
    <div data-dark={dark || undefined} className={`flex min-h-screen flex-col ${dark ? "bg-ivory text-ink" : ""}`} style={{ ...(dark ? darkThemeVars(settings.theme) : null), "--top-offset": TOP_OFFSET }}>
      {showBar && <VipBar campaign={featured.c} phase={featured.p} />}
      <Header overlay={overlay && !showBar} hasVip={hasVip} />
      <main id="conteudo" className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Outlet context={{ featuredCampaign: featured }} />
        </Suspense>
      </main>
      <Footer hasVip={hasVip} />
      <WhatsAppFab />
      <CookieBanner />
      {preview && (
        <div className="fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-3 whitespace-nowrap rounded-full bg-black/85 py-2 pl-5 pr-2 text-sm text-white shadow-lift backdrop-blur">
          Prévia do modelo <b className="font-medium">{layoutById(preview).name}</b>
          <button type="button" onClick={() => { endPreview(); window.close(); window.location.search = ""; }}
            className="rounded-full bg-white/15 px-3 py-1.5 text-xs hover:bg-white/25">Fechar prévia</button>
        </div>
      )}
    </div>
  );
}
