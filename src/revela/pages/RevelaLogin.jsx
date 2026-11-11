import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import RevelaLayout from "../components/RevelaLayout.jsx";
import AuthScene from "../components/AuthScene.jsx";
import { PasswordInput, TextInput } from "../components/Field.jsx";
import { AuthProvider, useAuth } from "../../contexts/AuthContext.jsx";
import { authErrorMessage, login, logout, resetPassword } from "../../services/authService.js";
import { isValidEmail } from "../../utils/validation.js";
import { useRevelaMeta } from "../hooks.js";
import { supportLink } from "../../config/support.js";

function LoginForm() {
  const { status, user } = useAuth();
  const location = useLocation();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  // Conta com estúdio ativo: vai direto para o painel (ou para onde ia antes do login).
  if (status === "admin" || status === "expired") return <Navigate to={location.state?.from || "/adm/dashboard"} replace />;

  async function submit(e) {
    e.preventDefault();
    setMsg(null);
    if (!isValidEmail(email)) return setMsg({ type: "error", text: "Informe um e-mail válido." });
    if (mode === "login" && !password) return setMsg({ type: "error", text: "Informe a senha." });
    setBusy(true);
    try {
      if (mode === "login") await login(email, password);
      else {
        await resetPassword(email);
        setMsg({ type: "ok", text: "Se este e-mail tiver uma conta, você vai receber um link para criar uma nova senha." });
      }
    } catch (err) {
      setMsg({ type: "error", text: mode === "login" ? authErrorMessage(err) : "Não foi possível enviar agora. Tente de novo." });
    } finally {
      setBusy(false);
    }
  }

  const isLogin = mode === "login";
  return (
    <form onSubmit={submit} noValidate className="lg w-full min-w-0 max-w-[440px] p-5 sm:p-9" style={{ "--lg-r": "32px", "--lg-bg": "rgba(255,255,255,.55)" }}>
      <h1 className="text-[2.6rem] leading-[1.05]">{isLogin ? "Entrar na Revela" : "Criar uma nova senha"}</h1>
      <p className="mt-3 text-[16px] leading-relaxed text-rv-ink2">
        {isLogin ? "Acesse o painel do seu estúdio: agenda, seleções, entregas e financeiro." : "Enviamos um link para o seu e-mail. A senha antiga deixa de valer."}
      </p>
      <div className="mt-8 space-y-5">
        <TextInput label="E-mail" type="email" autoComplete="username" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@seuestudio.com.br" required />
        {isLogin && <PasswordInput autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />}
      </div>

      {status === "notAdmin" && (
        <div role="alert" className="mt-5 rounded-2xl bg-rv-rosa/10 px-4 py-3 text-[14px] leading-relaxed text-rv-ameixa">
          A conta <b className="font-medium">{user?.email}</b> entrou, mas ainda não tem um estúdio ativo na Revela.{" "}
          <button type="button" className="font-medium text-rv-rosa underline underline-offset-2" onClick={logout}>Sair</button>
        </div>
      )}
      {msg && (
        <p role="alert" className={`mt-5 rounded-2xl px-4 py-3 text-[14px] leading-relaxed ${msg.type === "error" ? "bg-rv-rosa/10 text-rv-ameixa" : "bg-[#2F6B5C]/10 text-[#2F6B5C]"}`}>{msg.text}</p>
      )}

      <button type="submit" className="rv-btn rv-btn-primary mt-7 w-full" disabled={busy || status === "loading"}>
        <span className="rv-btn-dot" aria-hidden />{busy ? "Aguarde…" : isLogin ? "Entrar" : "Enviar o link"}
      </button>
      <div className="mt-6 flex flex-col items-center gap-3 text-[15px] sm:flex-row sm:justify-between">
        <button type="button" className="rv-link text-rv-ink2 hover:text-rv-ameixa" onClick={() => { setMode(isLogin ? "reset" : "login"); setMsg(null); }}>
          {isLogin ? "Esqueci minha senha" : "Voltar para o login"}
        </button>
        <Link to="/cadastro" className="rv-link font-medium text-rv-ameixa">Criar conta</Link>
        <a href={supportLink()} target="_blank" rel="noopener noreferrer" className="rv-link text-rv-ink2 hover:text-rv-ameixa">Precisa de ajuda?</a>
      </div>
    </form>
  );
}

export default function RevelaLogin() {
  useRevelaMeta("Entrar", "Entre no painel do seu estúdio na Revela.");
  return (
    <RevelaLayout footer={false}>
      <section className="relative isolate flex min-h-[100svh] items-center bg-rv-lavanda pb-16 pt-28">
        <AuthScene />
        <div className="rv-wrap relative z-10">
          <AuthProvider><LoginForm /></AuthProvider>
        </div>
      </section>
    </RevelaLayout>
  );
}
