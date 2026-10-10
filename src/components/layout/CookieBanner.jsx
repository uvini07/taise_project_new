import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getConsent, initGoogleAnalytics, setConsent } from "../../services/analyticsService.js";

/**
 * Consentimento (LGPD). O Google Analytics só é carregado depois do "aceitar".
 * Os contadores próprios do site são anônimos (sem cookies de rastreamento nem
 * dados pessoais) e funcionam em qualquer caso.
 */
export default function CookieBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const c = getConsent();
    if (!c) setShow(true);
    else if (c === "accepted") initGoogleAnalytics();
  }, []);
  if (!show) return null;
  const choose = (v) => { setConsent(v); setShow(false); };
  return (
    <div role="dialog" aria-label="Aviso de cookies" className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-xl animate-fade-up rounded-2xl border border-ink/10 bg-surface/95 p-4 text-sm shadow-lift backdrop-blur sm:bottom-6 sm:p-5">
      <p className="text-ink-soft">
        Usamos cookies do Google Analytics para entender como o site é usado, só se você permitir.{" "}
        <Link to="/politicas#privacidade" className="text-wine-900 underline underline-offset-2">Saiba mais</Link>.
      </p>
      <div className="mt-3 flex justify-end gap-2">
        <button className="btn-ghost btn-sm" onClick={() => choose("declined")}>Recusar</button>
        <button className="btn-primary btn-sm" onClick={() => choose("accepted")}>Aceitar</button>
      </div>
    </div>
  );
}
