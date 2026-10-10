import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { LockKeyhole } from "lucide-react";
import Logo from "../../components/common/Logo.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import { TextField } from "../../components/common/Fields.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { authErrorMessage, login, logout, resetPassword } from "../../services/authService.js";
import { isValidEmail } from "../../utils/validation.js";

export default function AdminLogin() {
  const { status } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  if (status === "admin") return <Navigate to={location.state?.from || "/adm/dashboard"} replace />;

  async function submit(e) {
    e.preventDefault();
    setMsg(null);
    if (!isValidEmail(email)) return setMsg({ type: "error", text: "Informe um e-mail válido." });
    setBusy(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await resetPassword(email);
        setMsg({ type: "success", text: "Se este e-mail tiver acesso, você vai receber um link para criar uma nova senha." });
      }
    } catch (err) {
      setMsg({ type: "error", text: mode === "login" ? authErrorMessage(err) : "Não foi possível enviar agora. Tente novamente." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center"><Logo className="h-20 w-auto" eager /></div>
        <form onSubmit={submit} className="card card-pad space-y-5" noValidate>
          <div className="text-center">
            <LockKeyhole className="mx-auto h-6 w-6 text-gold" strokeWidth={1.5} />
            <h1 className="mt-2 font-display text-3xl">{mode === "login" ? "Área restrita" : "Recuperar acesso"}</h1>
            <p className="mt-1 text-sm text-ink-muted">{mode === "login" ? "Entre com sua conta de administradora." : "Enviaremos um link para o seu e-mail."}</p>
          </div>
          <TextField label="E-mail" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required data-autofocus />
          {mode === "login" && (
            <TextField label="Senha" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          )}
          {status === "notAdmin" && (
            <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
              Esta conta entrou, mas não tem permissão de administradora. <button type="button" className="underline" onClick={logout}>Sair</button>
            </p>
          )}
          {msg && <p role="alert" className={`rounded-xl px-3 py-2 text-sm ${msg.type === "error" ? "bg-danger/10 text-danger" : "bg-success/10 text-success"}`}>{msg.text}</p>}
          <button className="btn-primary w-full" disabled={busy || status === "loading"}>
            {busy && <Spinner className="h-4 w-4" />} {mode === "login" ? "Entrar" : "Enviar link"}
          </button>
          <button type="button" className="w-full text-center text-sm text-ink-muted hover:text-ink" onClick={() => { setMode(mode === "login" ? "reset" : "login"); setMsg(null); }}>
            {mode === "login" ? "Esqueci minha senha" : "Voltar para o login"}
          </button>
        </form>
      </div>
    </div>
  );
}
