import Stripe from "stripe";
import { ConfigError } from "./admin.js";
import { PLANS } from "../src/revela/data.js";

export const PLAN_KEYS = { essencial: "revela_essencial_mensal", profissional: "revela_profissional_mensal", eventos: "revela_eventos_mensal" };
export const planOfLookupKey = (k) => Object.keys(PLAN_KEYS).find((p) => PLAN_KEYS[p] === k) || null;

export function stripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) throw new ConfigError("Falta a variável STRIPE_SECRET_KEY na Vercel.");
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

/** Endereço do site para os retornos do Checkout e do portal. */
export const siteUrl = (req) => (process.env.SITE_URL || `https://${req.headers["x-forwarded-host"] || req.headers.host}`).replace(/\/$/, "");

export function fail(res, err) {
  if (err instanceof ConfigError) return res.status(503).json({ error: `Pagamento ainda não configurado: ${err.message}` });
  if (err?.type?.startsWith?.("Stripe")) { console.error(JSON.stringify({ stripe: "erro", type: err.type, code: err.code, message: err.message })); return res.status(502).json({ error: "A Stripe não respondeu agora. Tente de novo em instantes." }); }
  console.error(err);
  return res.status(500).json({ error: "Erro inesperado no pagamento." });
}

/** Preço mensal do plano; cria o produto e o preço na Stripe se ainda não existirem. */
export async function ensurePrice(stripe, plan) {
  const lookup = PLAN_KEYS[plan];
  const info = PLANS.find((p) => p.id === plan);
  const found = await stripe.prices.list({ lookup_keys: [lookup], active: true, limit: 1 });
  if (found.data[0] && found.data[0].unit_amount === info.price * 100) return found.data[0].id;
  const products = await stripe.products.search({ query: `metadata['revela_plan']:'${plan}'` });
  const product = products.data[0] || await stripe.products.create(
    { name: `Revela ${info.name}`, description: info.forWho, metadata: { revela_plan: plan } },
    { idempotencyKey: `product-${plan}` },
  );
  const price = await stripe.prices.create({
    product: product.id, currency: "brl", unit_amount: info.price * 100, recurring: { interval: "month" },
    lookup_key: lookup, transfer_lookup_key: true, tax_behavior: "inclusive", metadata: { revela_plan: plan },
  }, { idempotencyKey: `price-${plan}-${info.price}` });
  return price.id;
}
