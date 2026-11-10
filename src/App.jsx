import { Suspense, lazy } from "react";
import { Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import { ToastProvider } from "./contexts/ToastContext.jsx";
import PageLoader from "./components/common/PageLoader.jsx";
import ErrorBoundary from "./components/common/ErrorBoundary.jsx";
import RevelaLoader from "./revela/components/RevelaLoader.jsx";
import { LEGACY_SITE_ROOTS, RESERVED_SLUGS, legacyRedirect, setCurrentStudio } from "./config/tenant.js";

// Revela (raiz do domínio): página inicial, planos, entrar e cadastro.
const RevelaHome = lazy(() => import("./revela/pages/RevelaHome.jsx"));
const RevelaPlans = lazy(() => import("./revela/pages/RevelaPlans.jsx"));
const RevelaTools = lazy(() => import("./revela/pages/RevelaTools.jsx"));
const RevelaLogin = lazy(() => import("./revela/pages/RevelaLogin.jsx"));
const RevelaSignup = lazy(() => import("./revela/pages/RevelaSignup.jsx"));
const RevelaNotFound = lazy(() => import("./revela/pages/RevelaNotFound.jsx"));

// Site do estúdio (/tarufino) e painel (/adm): carregados sob demanda.
const Home = lazy(() => import("./pages/public/Home.jsx"));
const About = lazy(() => import("./pages/public/About.jsx"));
const Packages = lazy(() => import("./pages/public/Packages.jsx"));
const PackageDetail = lazy(() => import("./pages/public/PackageDetail.jsx"));
const Gallery = lazy(() => import("./pages/public/Gallery.jsx"));
const Booking = lazy(() => import("./pages/public/Booking.jsx"));
const VIP = lazy(() => import("./pages/public/VIP.jsx"));
const Contact = lazy(() => import("./pages/public/Contact.jsx"));
const Policies = lazy(() => import("./pages/public/Policies.jsx"));
const NotFound = lazy(() => import("./pages/public/NotFound.jsx"));
const AdminApp = lazy(() => import("./routes/AdminApp.jsx"));
const StudioShell = lazy(() => import("./routes/StudioShell.jsx"));

const revela = (Page) => (
  <Suspense fallback={<RevelaLoader />}>
    <Page />
  </Suspense>
);

/** Endereço que não existe: se for um link antigo do site da Taíse, leva para /tarufino. */
function RootFallback() {
  const { pathname, search, hash } = useLocation();
  const to = legacyRedirect(pathname, search, hash);
  return to ? <Navigate to={to} replace /> : revela(RevelaNotFound);
}

/**
 * revela.com.br/{endereço}: o site de cada estúdio. Endereços antigos do site
 * da Taíse (/vip/natal, /pacotes/x…) continuam levando para /tarufino.
 */
function StudioGate() {
  const { studio = "" } = useParams();
  const { pathname, search, hash } = useLocation();
  if (LEGACY_SITE_ROOTS.includes(studio)) {
    const to = legacyRedirect(pathname, search, hash);
    if (to) return <Navigate to={to} replace />;
  }
  if (!/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(studio) || RESERVED_SLUGS.includes(studio)) return revela(RevelaNotFound);
  setCurrentStudio(studio);
  return <StudioShell key={studio} studio={studio} />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <Suspense fallback={<PageLoader full />}>
          <Routes>
            <Route path="/" element={revela(RevelaHome)} />
            <Route path="/planos" element={revela(RevelaPlans)} />
            <Route path="/ferramentas" element={revela(RevelaTools)} />
            <Route path="/entrar" element={revela(RevelaLogin)} />
            <Route path="/cadastro" element={revela(RevelaSignup)} />
            <Route path="/adm/*" element={<AdminApp />} />
            <Route path="/:studio" element={<StudioGate />}>
              <Route index element={<Home />} />
              <Route path="sobre" element={<About />} />
              <Route path="pacotes" element={<Packages />} />
              <Route path="pacotes/:id" element={<PackageDetail />} />
              <Route path="galeria" element={<Gallery />} />
              <Route path="galeria/:slug" element={<Gallery />} />
              <Route path="agenda" element={<Booking />} />
              <Route path="agendar" element={<Navigate to="../agenda" replace />} />
              <Route path="vip" element={<VIP />} />
              <Route path="vip/:slug" element={<VIP />} />
              <Route path="contato" element={<Contact />} />
              <Route path="politicas" element={<Policies />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route path="*" element={<RootFallback />} />
          </Routes>
        </Suspense>
      </ToastProvider>
    </ErrorBoundary>
  );
}
