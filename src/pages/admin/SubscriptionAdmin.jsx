// Minha assinatura: plano atual, assinar ou abrir o portal da Stripe.
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { CreditCard, Loader2 } from "lucide-react";
import { AdminHeader, Section } from "../../components/admin/AdminUI.jsx";
import PlanPicker from "../../components/admin/PlanPicker.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";
import { db } from "../../services/firebase.js";
import { openPortal } from "../../services/billing.js";
import { planById } from "../../revela/data.js";
import { isLegacyStudio } from "../../config/tenant.js";

export default function SubscriptionAdmin() {
  const { admin } = useAuth();
  const toast = useToast();
  const [params] = useSearchParams();
  const [studio, setStudio] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!admin?.studio || isLegacyStudio(admin.studio)) return;
    getDoc(doc(db, "studios", admin.studio)).then((s) => setStudio(s.data() || {})).catch(() => setStudio({}));
  }, [admin?.studio]);
  useEffect(() => {
    if (params.get("status") === "ok") toast.success("Assinatura confirmada! Obrigada por escolher a Revela.");
    if (params.get("status") === "cancelado") toast.info?.("Pagamento não concluído. Você pode assinar quando quiser.");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLegacyStudio(admin?.studio)) {
    return <><AdminHeader title="Minha assinatura" text="Este estúdio é parceiro da Revela e não tem cobrança." /></>;
  }
  const active = studio?.status === "active";
  const plan = planById(studio?.plan);
  const daysLeft = admin?.trialEndsAt ? Math.max(0, Math.ceil((admin.trialEndsAt.getTime() - Date.now()) / 86400000)) : null;

  async function portal() {
    setBusy(true);
    try { await openPortal(); } catch (e) { toast.error(e.message); setBusy(false); }
  }

  return (
    <>
      <AdminHeader title="Minha assinatura" text="Seu plano da Revela, pagamento e faturas." />
      <Section title={active ? `Plano ${plan?.name || ""}` : "Teste grátis"}
        text={active ? "Sua assinatura está ativa. Troque o cartão, mude de plano, baixe faturas ou cancele no portal seguro da Stripe."
          : `Faltam ${daysLeft ?? "alguns"} dia(s) de teste. Assine agora sem perder nenhum dia: a primeira cobrança só acontece quando o teste acabar.`}>
        {active ? (
          <button type="button" onClick={portal} disabled={busy} className="btn-primary inline-flex items-center gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />} Gerenciar assinatura
          </button>
        ) : (
          <PlanPicker current={studio?.plan} onError={(m) => toast.error(m)} />
        )}
      </Section>
      <p className="mt-4 text-xs text-ink-muted">Pagamento processado pela Stripe. A Revela não guarda os dados do seu cartão.</p>
    </>
  );
}
