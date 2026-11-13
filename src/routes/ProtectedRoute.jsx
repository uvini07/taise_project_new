import { Navigate, useLocation } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import PageLoader from "../components/common/PageLoader.jsx";
import { logout } from "../services/authService.js";
import PlanPicker from "../components/admin/PlanPicker.jsx";

/**
 * Só deixa entrar quem está logado E tem registro ativo em adminUsers.
 * Isto controla a interface; a proteção real dos dados está nas regras do
 * Firestore/Storage, que recusam leituras e escritas de quem não é admin.
 */
export default function ProtectedRoute({ children }) {
  const { status, user, admin } = useAuth();
  const location = useLocation();
  if (status === "loading") return <PageLoader full label="Verificando acesso…" />;
  if (status === "signedOut") return <Navigate to="/entrar" replace state={{ from: location.pathname }} />;
  if (status === "expired") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 py-12 text-center">
        <ShieldAlert className="h-10 w-10 text-danger" strokeWidth={1.4} />
        <h1 className="display-md">O teste grátis terminou</h1>
        <p className="max-w-md text-sm text-ink-muted">
          Os 30 dias de teste de <b>{admin?.studioName}</b> acabaram. Seus dados continuam guardados:
          escolha um plano para voltar a usar o painel na hora.
        </p>
        <div className="w-full max-w-5xl"><PlanPicker onError={(m) => window.alert(m)} /></div>
        <button className="btn-outline" onClick={logout}>Sair</button>
      </div>
    );
  }
  if (status === "notAdmin") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <ShieldAlert className="h-10 w-10 text-danger" strokeWidth={1.4} />
        <h1 className="display-md">Acesso não autorizado</h1>
        <p className="max-w-md text-sm text-ink-muted">
          A conta <b>{user?.email}</b> entrou, mas ainda não tem um estúdio.
          Crie o seu em <a className="underline" href="/cadastro">revela / cadastro</a>.
        </p>
        <button className="btn-outline" onClick={logout}>Sair</button>
      </div>
    );
  }
  return children;
}

