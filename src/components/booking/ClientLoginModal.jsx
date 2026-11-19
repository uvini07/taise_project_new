// "Antes de agendar, entre com a sua conta": login com Google + consentimento
// (LGPD) para a fotógrafa usar nome, WhatsApp e e-mail neste agendamento.
import { useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Loader2, ShieldCheck, X } from "lucide-react";
import { authErrorMessage } from "../../services/authService.js";
import { saveClientProfile, signInClient } from "../../services/clientAccount.js";
import { sitePath } from "../../config/tenant.js";
import { formatPhoneBR } from "../../utils/validation.js";

function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export default function ClientLoginModal({ name, phone, studioName, onDone, onClose }) {
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function go() {
    if (!agree) { setErr("Marque a autorização para continuar."); return; }
    setBusy(true); setErr("");
    try {
      const user = await signInClient();
      if (!user) return; // foi por redirecionamento: volta já logada
      await saveClientProfile(user, { name, phone }).catch(() => {}); // perfil não trava o agendamento
      onDone(user);
    } catch (e) {
      if (e?.code !== "auth/popup-closed-by-user" && e?.code !== "auth/cancelled-popup-request") setErr(authErrorMessage(e));
    } finally { setBusy(false); }
  }

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="cl-title" onClick={onClose}>
      <div className="w-full max-w-md animate-fade-up rounded-t-3xl bg-ivory p-6 shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <h2 id="cl-title" className="font-display text-2xl leading-tight">Antes de agendar, entre com a sua conta</h2>
          <button type="button" onClick={onClose} className="-mr-2 -mt-1 rounded-full p-2 hover:bg-ink/5" aria-label="Fechar"><X className="h-5 w-5" /></button>
        </div>
        <p className="mt-2 text-sm text-ink-muted">Assim você acompanha o seu agendamento, o pagamento e as suas fotos em “Minha conta”, sem precisar criar senha.</p>

        <dl className="mt-4 space-y-1.5 rounded-2xl bg-surface p-4 text-sm">
          <div className="flex justify-between gap-3"><dt className="text-ink-muted">Nome</dt><dd className="truncate font-medium">{name}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-ink-muted">WhatsApp</dt><dd className="font-medium">{formatPhoneBR(phone)}</dd></div>
        </dl>

        <label className="mt-4 flex items-start gap-3 text-sm leading-relaxed text-ink-soft">
          <input type="checkbox" checked={agree} onChange={(e) => { setAgree(e.target.checked); setErr(""); }} className="mt-1 h-4 w-4 shrink-0 accent-[rgb(var(--color-primary,62_6_10))]" />
          <span>Autorizo {studioName ? <strong>{studioName}</strong> : "a fotógrafa"} a usar meu nome, WhatsApp e e-mail para este agendamento e para falar comigo sobre o ensaio, conforme a <Link to={sitePath("/politicas")} target="_blank" className="underline">Política de privacidade</Link>. Posso apagar meus dados quando quiser em “Minha conta”.</span>
        </label>

        {err && <p role="alert" className="mt-3 text-sm text-danger">{err}</p>}

        <button type="button" onClick={go} disabled={busy}
          className="mt-5 flex w-full items-center justify-center gap-3 rounded-full border border-ink/15 bg-white px-5 py-3.5 text-sm font-medium text-ink shadow-soft transition hover:bg-ink/[0.02] disabled:opacity-60">
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleG />} Continuar com Google
        </button>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-muted"><ShieldCheck className="h-3.5 w-3.5" /> Não temos acesso à sua senha do Google.</p>
      </div>
    </div>,
    document.body,
  );
}
