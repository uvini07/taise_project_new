import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import AdminLayout from "../components/layout/AdminLayout.jsx";
import PageLoader from "../components/common/PageLoader.jsx";
import AdminLogin from "../pages/admin/AdminLogin.jsx";

const Dashboard = lazy(() => import("../pages/admin/Dashboard.jsx"));
const PackagesAdmin = lazy(() => import("../pages/admin/PackagesAdmin.jsx"));
const GalleryAdmin = lazy(() => import("../pages/admin/GalleryAdmin.jsx"));
const AgendaAdmin = lazy(() => import("../pages/admin/AgendaAdmin.jsx"));
const AnalyticsAdmin = lazy(() => import("../pages/admin/AnalyticsAdmin.jsx"));
const FinanceAdmin = lazy(() => import("../pages/admin/FinanceAdmin.jsx"));
const VIPAdmin = lazy(() => import("../pages/admin/VIPAdmin.jsx"));
const SettingsAdmin = lazy(() => import("../pages/admin/SettingsAdmin.jsx"));

export default function AdminApp() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<AdminLogin />} />
        <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
          <Route path="pacotes" element={<Suspense fallback={<PageLoader />}><PackagesAdmin /></Suspense>} />
          <Route path="galeria" element={<Suspense fallback={<PageLoader />}><GalleryAdmin /></Suspense>} />
          <Route path="agenda" element={<Suspense fallback={<PageLoader />}><AgendaAdmin /></Suspense>} />
          <Route path="analytics" element={<Suspense fallback={<PageLoader />}><AnalyticsAdmin /></Suspense>} />
          <Route path="financeiro" element={<Suspense fallback={<PageLoader />}><FinanceAdmin /></Suspense>} />
          <Route path="vip" element={<Suspense fallback={<PageLoader />}><VIPAdmin /></Suspense>} />
          <Route path="configuracoes" element={<Suspense fallback={<PageLoader />}><SettingsAdmin /></Suspense>} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
