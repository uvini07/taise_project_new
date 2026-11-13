// Começa (ou retoma) a assinatura: abre o Checkout da Stripe no plano escolhido.
// Se o estúdio já tem assinatura ativa, devolve o portal para trocar de plano.
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, studioOfUser, userFrom } from "../_lib/admin.js";
import { PLAN_KEYS, ensurePrice, fail, siteUrl, stripeClient } from "../_lib/stripe.js";

const TRIAL_DAYS = 30;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });
  try {
    const user = await userFrom(req);
    if (!user) return res.status(401).json({ error: "Entre no painel para assinar." });
    const plan = String(req.body?.plan || "");
    if (!PLAN_KEYS[plan]) return res.status(400).json({ error: "Plano inválido." });
    const mine = await studioOfUser(user.uid);
    if (!mine) return res.status(403).json({ error: "Esta conta não tem um estúdio para assinar." });

    const stripe = stripeClient();
    const base = siteUrl(req);
    const billingRef = adminDb().doc(`billing/${mine.slug}`);
    const billing = (await billingRef.get()).data() || {};

    if (billing.subscriptionId && ["active", "trialing", "past_due"].includes(billing.subStatus)) {
      const portal = await stripe.billingPortal.sessions.create({ ...(process.env.STRIPE_PORTAL_CONFIG ? { configuration: process.env.STRIPE_PORTAL_CONFIG } : {}), customer: billing.customerId, return_url: `${base}/adm/assinatura` });
      return res.status(200).json({ url: portal.url, portal: true });
    }

    let customerId = billing.customerId;
    if (!customerId) {
      const customer = await stripe.customers.create(
        { email: user.email || undefined, name: mine.studio.name, metadata: { slug: mine.slug, uid: user.uid } },
        { idempotencyKey: `customer-${mine.slug}` },
      );
      customerId = customer.id;
      await billingRef.set({ customerId, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    }

    const priceId = await ensurePrice(stripe, plan);

    // Quem assina durante o teste não perde os dias que faltam: a cobrança começa no fim do teste.
    const created = mine.studio.createdAt?.toDate?.() || new Date();
    const trialEnd = Math.floor((created.getTime() + TRIAL_DAYS * 86400000) / 1000);
    const keepTrial = trialEnd - Date.now() / 1000 > 2 * 86400; // a Stripe pede pelo menos 2 dias

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: mine.slug,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: { metadata: { slug: mine.slug, plan }, ...(keepTrial ? { trial_end: trialEnd } : {}) },
      metadata: { slug: mine.slug, plan },
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      locale: "pt-BR",
      ...(process.env.STRIPE_TAX === "on" ? { automatic_tax: { enabled: true }, customer_update: { address: "auto", name: "auto" } } : {}),
      success_url: `${base}/adm/assinatura?status=ok`,
      cancel_url: `${base}/adm/assinatura?status=cancelado`,
    });
    return res.status(200).json({ url: session.url });
  } catch (err) {
    return fail(res, err);
  }
}
