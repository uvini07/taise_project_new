import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { SettingsProvider } from "./contexts/SettingsContext.jsx";
import { ToastProvider } from "./contexts/ToastContext.jsx";
import PublicLayout from "./components/layout/PublicLayout.jsx";
import PageLoader from "./components/common/PageLoader.jsx";
import ErrorBoundary from "./components/common/ErrorBoundary.jsx";
import Home from "./pages/public/Home.jsx";

// Páginas carregadas sob demanda: quem abre a página inicial não baixa o painel.
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

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <SettingsProvider>
          <Suspense fallback={<PageLoader full />}>
            <Routes>
              <Route path="/adm/*" element={<AdminApp />} />
              <Route element={<PublicLayout />}>
                <Route index element={<Home />} />
                <Route path="sobre" element={<About />} />
                <Route path="pacotes" element={<Packages />} />
                <Route path="pacotes/:id" element={<PackageDetail />} />
                <Route path="galeria" element={<Gallery />} />
                <Route path="galeria/:slug" element={<Gallery />} />
                <Route path="agenda" element={<Booking />} />
                <Route path="agendar" element={<Navigate to="/agenda" replace />} />
                <Route path="vip" element={<VIP />} />
                <Route path="vip/:slug" element={<VIP />} />
                <Route path="contato" element={<Contact />} />
                <Route path="politicas" element={<Policies />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Suspense>
        </SettingsProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
