import { Navigate, useLocation } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import PageLoader from "../components/common/PageLoader.jsx";
import { logout } from "../services/authService.js";

/**
 * Só deixa entrar quem está logado E tem registro ativo em adminUsers.
 * Isto controla a interface; a proteção real dos dados está nas regras do
 * Firestore/Storage, que recusam leituras e escritas de quem não é admin.
 */
export default function ProtectedRoute({ children }) {
  const { status, user } = useAuth();
  const location = useLocation();
  if (status === "loading") return <PageLoader full label="Verificando acesso…" />;
  if (status === "signedOut") return <Navigate to="/adm/login" replace state={{ from: location.pathname }} />;
  if (status === "notAdmin") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <ShieldAlert className="h-10 w-10 text-danger" strokeWidth={1.4} />
        <h1 className="display-md">Acesso não autorizado</h1>
        <p className="max-w-md text-sm text-ink-muted">
          A conta <b>{user?.email}</b> entrou, mas não está cadastrada como administradora.
          Peça para incluir o identificador <code className="rounded bg-paper px-1.5 py-0.5 text-xs">{user?.uid}</code> em <i>adminUsers</i> no Firebase.
        </p>
        <button className="btn-outline" onClick={logout}>Sair</button>
      </div>
    );
  }
  return children;
}
