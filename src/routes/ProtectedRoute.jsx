import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import PageLoader from "../components/common/PageLoader.jsx";
import { isAllowedEmail, activateOwnerAccess, logout } from "../services/authService.js";

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
    if (isAllowedEmail(user?.email)) return <ActivateOwner email={user.email} />;
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

function ActivateOwner({ email }) {
  const [state, setState] = useState({ busy: false, msg: "" });
  async function go() {
    setState({ busy: true, msg: "" });
    try {
      const r = await activateOwnerAccess();
      if (r === "activated") { window.location.reload(); return; }
      setState({ busy: false, msg: `Enviamos um link de confirmação para ${email}. Abra o e-mail, clique no link e depois volte aqui e clique em Ativar de novo.` });
    } catch (e) {
      setState({ busy: false, msg: e.code === "permission-denied" ? "As regras de segurança novas ainda não foram publicadas no Firebase." : (e.message || "Não foi possível ativar.") });
    }
  }
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="display-md">Ativar acesso ao painel</h1>
      <p className="max-w-md text-sm text-ink-muted">Primeiro acesso da conta {email}. Para segurança, é preciso confirmar o e-mail.</p>
      <button className="btn-primary" onClick={go} disabled={state.busy}>{state.busy ? "Aguarde…" : "Ativar acesso"}</button>
      {state.msg && <p role="status" className="max-w-md text-sm text-ink-soft">{state.msg}</p>}
      <button className="btn-ghost btn-sm" onClick={logout}>Sair</button>
    </div>
  );
}
