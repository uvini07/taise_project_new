import { useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";

/** Tela de senha das páginas do cliente. */
export default function PasswordGate({ title, error, onSubmit }) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    if (!value.trim()) return;
    setBusy(true);
    try { await onSubmit(value.trim().toUpperCase()); } finally { setBusy(false); }
  }
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ivory px-6 text-center">
      <KeyRound className="h-10 w-10 text-gold" strokeWidth={1.3} aria-hidden />
      <h1 className="mt-3 font-display text-3xl">{title || "Acesso protegido"}</h1>
      <p className="mt-1 max-w-sm text-sm text-ink-muted">Digite a senha que veio junto com o link na mensagem da fotógrafa.</p>
      <form onSubmit={submit} className="mt-6 flex w-full max-w-xs flex-col gap-3">
        <input value={value} onChange={(e) => setValue(e.target.value)} autoFocus autoComplete="one-time-code" autoCapitalize="characters" spellCheck={false}
          maxLength={12} placeholder="Senha" aria-label="Senha"
          className="rounded-xl border border-ink/15 bg-white px-4 py-3 text-center font-mono text-xl uppercase tracking-[.3em] outline-none focus:border-wine-900" />
        {error && <p className="text-sm text-danger" role="alert">{error}</p>}
        <button type="submit" disabled={busy || !value.trim()} className="btn-primary justify-center disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Entrar
        </button>
      </form>
    </div>
  );
}
