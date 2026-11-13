// Diagnóstico temporário: mostra se os módulos de pagamento carregam (sem segredos).
export default async function handler(req, res) {
  const out = { node: process.version, steps: {} };
  for (const [k, p] of [["stripe", "stripe"], ["admin-app", "firebase-admin/app"], ["admin-fs", "firebase-admin/firestore"], ["lib-admin", "../_lib/admin.js"], ["lib-stripe", "../_lib/stripe.js"], ["checkout", "./checkout.js"]]) {
    try { await import(p); out.steps[k] = "ok"; } catch (e) { out.steps[k] = String(e?.message || e).slice(0, 300); }
  }
  res.status(200).json(out);
}
