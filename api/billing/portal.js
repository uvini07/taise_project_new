// Portal da Stripe: trocar cartão, mudar de plano, cancelar e ver as faturas.
import { adminDb, studioOfUser, userFrom } from "../../lib/admin.js";
import { fail, siteUrl, stripeClient } from "../../lib/stripe.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });
  try {
    const user = await userFrom(req);
    if (!user) return res.status(401).json({ error: "Entre no painel." });
    const mine = await studioOfUser(user.uid);
    if (!mine) return res.status(403).json({ error: "Esta conta não tem um estúdio." });
    const billing = (await adminDb().doc(`billing/${mine.slug}`).get()).data();
    if (!billing?.customerId) return res.status(404).json({ error: "Você ainda não tem assinatura. Escolha um plano." });
    const portal = await stripeClient().billingPortal.sessions.create({ ...(process.env.STRIPE_PORTAL_CONFIG ? { configuration: process.env.STRIPE_PORTAL_CONFIG } : {}), customer: billing.customerId, return_url: `${siteUrl(req)}/adm/assinatura` });
    return res.status(200).json({ url: portal.url });
  } catch (err) {
    return fail(res, err);
  }
}
