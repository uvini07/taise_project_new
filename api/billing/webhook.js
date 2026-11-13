// Avisos da Stripe. Cada evento só diz "algo mudou": a assinatura é sempre lida
// de novo na Stripe (estado atual), então eventos repetidos ou fora de ordem
// não estragam nada. Libera ou bloqueia o estúdio em studios/{slug}.status.
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "../../lib/admin.js";
import { fail, planOfLookupKey, stripeClient } from "../../lib/stripe.js";

export const config = { api: { bodyParser: false } };

const rawBody = (req) => new Promise((resolve, reject) => {
  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", () => resolve(Buffer.concat(chunks)));
  req.on("error", reject);
});

/** Situação da assinatura na Stripe → acesso ao painel. */
export function accessFor(status) {
  if (["active", "trialing", "past_due"].includes(status)) return "active"; // past_due: a Stripe ainda está tentando cobrar
  if (["canceled", "unpaid", "incomplete_expired", "paused"].includes(status)) return "canceled";
  return null; // incomplete: ainda não pagou o primeiro; não mexe no teste
}

const subscriptionIdOf = (obj) => (typeof obj?.subscription === "string" ? obj.subscription
  : obj?.subscription?.id || obj?.parent?.subscription_details?.subscription || null);

async function sync(stripe, subscriptionId) {
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const slug = sub.metadata?.slug;
  if (!slug) return;
  const item = sub.items?.data?.[0];
  const plan = planOfLookupKey(item?.price?.lookup_key) || sub.metadata?.plan || null;
  const db = adminDb();
  const access = accessFor(sub.status);
  const studioPatch = { ...(access ? { status: access } : {}), ...(plan ? { plan } : {}) };
  if (Object.keys(studioPatch).length) await db.doc(`studios/${slug}`).set(studioPatch, { merge: true });
  await db.doc(`billing/${slug}`).set({
    customerId: typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
    subscriptionId: sub.id,
    subStatus: sub.status,
    plan,
    currentPeriodEnd: item?.current_period_end ?? sub.current_period_end ?? null,
    cancelAtPeriodEnd: !!sub.cancel_at_period_end,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  console.log(JSON.stringify({ stripe: "sync", slug, status: sub.status, plan }));
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  let event;
  try {
    const stripe = stripeClient();
    if (!process.env.STRIPE_WEBHOOK_SECRET) return res.status(503).json({ error: "Falta STRIPE_WEBHOOK_SECRET." });
    event = stripe.webhooks.constructEvent(await rawBody(req), req.headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET);
    const obj = event.data.object;
    switch (event.type) {
      case "checkout.session.completed":
        if (obj.mode === "subscription" && obj.subscription) await sync(stripe, subscriptionIdOf(obj));
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "customer.subscription.paused":
      case "customer.subscription.resumed":
        await sync(stripe, obj.id);
        break;
      case "invoice.paid":
      case "invoice.payment_failed": {
        const id = subscriptionIdOf(obj);
        if (id) await sync(stripe, id);
        break;
      }
      default:
        break;
    }
    return res.status(200).json({ received: true });
  } catch (err) {
    if (err?.type === "StripeSignatureVerificationError") return res.status(400).json({ error: "Assinatura do aviso inválida." });
    return fail(res, err);
  }
}
