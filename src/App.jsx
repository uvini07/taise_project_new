import { Suspense, lazy } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { ToastProvider } from "./contexts/ToastContext.jsx";
import PageLoader from "./components/common/PageLoader.jsx";
import ErrorBoundary from "./components/common/ErrorBoundary.jsx";
import RevelaLoader from "./revela/components/RevelaLoader.jsx";
import { SITE_BASE, legacyRedirect, sitePath } from "./config/tenant.js";

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
            <Route path={SITE_BASE} element={<StudioShell />}>
              <Route index element={<Home />} />
              <Route path="sobre" element={<About />} />
              <Route path="pacotes" element={<Packages />} />
              <Route path="pacotes/:id" element={<PackageDetail />} />
              <Route path="galeria" element={<Gallery />} />
              <Route path="galeria/:slug" element={<Gallery />} />
              <Route path="agenda" element={<Booking />} />
              <Route path="agendar" element={<Navigate to={sitePath("/agenda")} replace />} />
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
