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

export default function PublicLayout() {
  const { pathname } = useLocation();
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
  const overlay = pathname === "/";
  const showBar = featured && featured.c.showBanner !== false && settings.display.showVipBanner && !pathname.startsWith("/vip");

  return (
    <div className="flex min-h-screen flex-col" style={{ "--top-offset": overlay && !showBar ? "0px" : showBar ? "112px" : "72px" }}>
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
    </div>
  );
}
