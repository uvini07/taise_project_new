import { auth } from "./firebaseAuth.js";

export async function pagamentosApi(body, { authed = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (authed) { const t = await auth.currentUser?.getIdToken(); if (t) headers.Authorization = `Bearer ${t}`; }
  const r = await fetch("/api/pagamentos", { method: "POST", headers, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "Não foi possível falar com o pagamento.");
  return j;
}
