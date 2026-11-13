import { describe, expect, it } from "vitest";
import { accessFor } from "../../api/billing/webhook.js";
import { PLAN_KEYS, planOfLookupKey } from "../../lib/stripe.js";
import checkout from "../../api/billing/checkout.js";

const res = () => { const r = { code: 0, body: null }; r.status = (c) => { r.code = c; return r; }; r.json = (b) => { r.body = b; return r; }; return r; };

describe("Assinatura (Stripe)", () => {
  it("situação da assinatura vira acesso ao painel", () => {
    for (const s of ["active", "trialing", "past_due"]) expect(accessFor(s)).toBe("active");
    for (const s of ["canceled", "unpaid", "incomplete_expired", "paused"]) expect(accessFor(s)).toBe("canceled");
    expect(accessFor("incomplete")).toBeNull();
  });
  it("lookup_key ↔ plano", () => {
    for (const [plan, key] of Object.entries(PLAN_KEYS)) expect(planOfLookupKey(key)).toBe(plan);
    expect(planOfLookupKey("outra")).toBeNull();
  });
  it("checkout recusa GET e avisa quando falta configuração", async () => {
    let r = res(); await checkout({ method: "GET", headers: {} }, r); expect(r.code).toBe(405);
    const old = process.env.FIREBASE_SERVICE_ACCOUNT; delete process.env.FIREBASE_SERVICE_ACCOUNT;
    r = res(); await checkout({ method: "POST", headers: { authorization: "Bearer x" }, body: { plan: "essencial" } }, r);
    expect(r.code).toBe(401);
    if (old) process.env.FIREBASE_SERVICE_ACCOUNT = old;
  });
});
