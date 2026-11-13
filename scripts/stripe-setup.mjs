// Cria na Stripe os 3 planos da Revela (mensais, em reais) e o portal do cliente.
// Pode rodar quantas vezes quiser: o que já existe é reaproveitado.
// Uso: STRIPE_SECRET_KEY=sk_test_... node scripts/stripe-setup.mjs
import Stripe from "stripe";
import { PLANS } from "../src/revela/data.js";

const KEYS = { essencial: "revela_essencial_mensal", profissional: "revela_profissional_mensal", eventos: "revela_eventos_mensal" };
if (!process.env.STRIPE_SECRET_KEY) { console.error("Defina STRIPE_SECRET_KEY."); process.exit(1); }
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const priceIds = [];
for (const plan of PLANS) {
  const lookup = KEYS[plan.id];
  const found = await stripe.prices.list({ lookup_keys: [lookup], active: true, limit: 1 });
  if (found.data.length && found.data[0].unit_amount === plan.price * 100) {
    console.log(`✓ ${plan.name}: já existe (${found.data[0].id})`);
    priceIds.push({ product: found.data[0].product, prices: [found.data[0].id] });
    continue;
  }
  const products = await stripe.products.search({ query: `metadata['revela_plan']:'${plan.id}'` });
  const product = products.data[0] || await stripe.products.create({
    name: `Revela ${plan.name}`, description: plan.forWho, metadata: { revela_plan: plan.id },
  });
  // Preço novo (ou valor mudou): cria e transfere a lookup_key para ele.
  const price = await stripe.prices.create({
    product: product.id, currency: "brl", unit_amount: plan.price * 100,
    recurring: { interval: "month" }, lookup_key: lookup, transfer_lookup_key: true,
    tax_behavior: "inclusive", metadata: { revela_plan: plan.id },
  });
  console.log(`+ ${plan.name}: R$ ${plan.price}/mês (${price.id})`);
  priceIds.push({ product: product.id, prices: [price.id] });
}

const portal = await stripe.billingPortal.configurations.create({
  business_profile: { headline: "Revela: gerencie sua assinatura" },
  features: {
    customer_update: { enabled: true, allowed_updates: ["email", "address", "tax_id"] },
    invoice_history: { enabled: true },
    payment_method_update: { enabled: true },
    subscription_cancel: { enabled: true, mode: "at_period_end", cancellation_reason: { enabled: true, options: ["too_expensive", "missing_features", "switched_service", "unused", "other"] } },
    subscription_update: { enabled: true, default_allowed_updates: ["price"], proration_behavior: "create_prorations", products: priceIds },
  },
  default_return_url: process.env.SITE_URL ? `${process.env.SITE_URL}/adm/assinatura` : undefined,
});
await stripe.billingPortal.configurations.update(portal.id, { active: true });
console.log(`✓ Portal do cliente: ${portal.id}  → coloque na Vercel: STRIPE_PORTAL_CONFIG=${portal.id}`);
console.log("\nPronto. Agora crie o webhook (veja docs/STRIPE.md).");
