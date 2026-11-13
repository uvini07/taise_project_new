// Assinatura da Revela (Stripe). O servidor confere quem pede e devolve o
// endereço do Checkout ou do portal; aqui só redirecionamos.
import { auth } from "./firebaseAuth.js";

async function call(path, body) {
  const token = await auth.currentUser?.getIdToken();
  const r = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token || ""}` }, body: JSON.stringify(body || {}) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || !data.url) throw new Error(data.error || "Não foi possível abrir o pagamento agora.");
  return data.url;
}

/** Abre o Checkout do plano (ou o portal, se já assina). */
export async function startCheckout(plan) { window.location.assign(await call("/api/billing/checkout", { plan })); }
/** Abre o portal: trocar cartão, mudar de plano, cancelar, ver faturas. */
export async function openPortal() { window.location.assign(await call("/api/billing/portal")); }
