// Recebimento do SINAL do agendamento, direto na conta da fotógrafa.
// Cada estúdio escolhe no painel (Recebimentos):
//   "pix"          → chave Pix própria; a cliente paga e a fotógrafa confirma.
//   "mercadopago"  → Pix pelo Mercado Pago dela (token guardado só no servidor);
//                    confirmação automática pelo aviso (webhook) do Mercado Pago.
//   "infinitepay"  → Checkout Integrado da InfinitePay com a InfiniteTag dela;
//                    confirmação automática pelo aviso da InfinitePay.
//
// O dinheiro nunca passa pela Revela. O valor do sinal vem do agendamento
// gravado no banco (preço validado pelas regras), nunca do navegador.
import { createHmac, timingSafeEqual } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { ConfigError, adminDb, studioOfUser, userFrom } from "../lib/admin.js";

const LEGACY = "tarufino";
const path = (slug, col, id) => (slug === LEGACY ? `${col}/${id}` : `studios/${slug}/${col}/${id}`);
const settingsPath = (slug) => path(slug, "siteSettings", "public");
const secretPath = (slug) => `paymentSecrets/${slug}`;
const okSlug = (s) => typeof s === "string" && /^[a-z0-9-]{2,60}$/.test(s);
const okId = (s) => typeof s === "string" && /^[A-Za-z0-9]{10,40}$/.test(s);
const site = () => String(process.env.SITE_URL || "https://studiorevela.vercel.app").replace(/\/$/, "");
const MP = "https://api.mercadopago.com";
const IP = "https://api.checkout.infinitepay.io";

function depositOf(appt, cfg) {
  const pct = Math.min(100, Math.max(1, Number(cfg.depositPercent) || 30));
  return Math.max(100, Math.round(((appt.priceCents || 0) * pct) / 100));
}

async function markPaid(ref, provider, extra = {}) {
  await ref.set({ deposit: { status: "paid", provider, paidAt: FieldValue.serverTimestamp(), ...extra } }, { merge: true });
}

// --- "Conectar com Mercado Pago" (OAuth): uma aplicação da Revela, a fotógrafa só autoriza.
const MP_ID = () => process.env.MP_CLIENT_ID || "";
const MP_SECRET = () => process.env.MP_CLIENT_SECRET || "";
const oauthOn = () => !!(MP_ID() && MP_SECRET());
const redirectUri = () => `${site()}/api/pagamentos?mpoauth=1`;
const sign = (v) => createHmac("sha256", MP_SECRET()).update(v).digest("base64url");
function makeState(slug) {
  const v = Buffer.from(JSON.stringify({ slug, exp: Date.now() + 15 * 60e3 })).toString("base64url");
  return `${v}.${sign(v)}`;
}
function readState(state) {
  const [v, sig] = String(state || "").split(".");
  if (!v || !sig) return null;
  const a = Buffer.from(sign(v)), b = Buffer.from(sig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try { const d = JSON.parse(Buffer.from(v, "base64url").toString()); return d.exp > Date.now() && okSlug(d.slug) ? d.slug : null; } catch { return null; }
}
async function mpOauthToken(body) {
  const r = await fetch(`${MP}/oauth/token`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ client_id: MP_ID(), client_secret: MP_SECRET(), ...body }) });
  return r.ok ? r.json() : null;
}
/** Token da fotógrafa; renova sozinho (OAuth) quando está perto de vencer. */
async function mpTokenOf(db, slug) {
  const ref = db.doc(secretPath(slug));
  const sec = (await ref.get()).data();
  if (!sec?.mpToken) return null;
  if (sec.mpRefresh && sec.mpExpiresAt && sec.mpExpiresAt - Date.now() < 7 * 86400e3 && oauthOn()) {
    const t = await mpOauthToken({ grant_type: "refresh_token", refresh_token: sec.mpRefresh });
    if (t?.access_token) {
      await ref.set({ mpToken: t.access_token, mpRefresh: t.refresh_token || sec.mpRefresh, mpExpiresAt: Date.now() + (t.expires_in || 15552000) * 1000 }, { merge: true });
      return t.access_token;
    }
  }
  return sec.mpToken;
}

// API de Orders (a nova; a de Payments será descontinuada).
const money = (c) => (c / 100).toFixed(2);
const orderPaid = (o) => o && (o.status === "processed" || o.status_detail === "accredited");
const orderPix = (o) => o?.transactions?.payments?.[0]?.payment_method || {};

async function mpGet(token, url) {
  const r = await fetch(`${MP}${url}`, { headers: { Authorization: `Bearer ${token}` } });
  return r.ok ? r.json() : null;
}

export default async function handler(req, res) {
  try {
    // ------------------------------------------------ volta do "Conectar com Mercado Pago"
    if (req.method === "GET" && req.query?.mpoauth) {
      const back = (q) => res.redirect(302, `${site()}/adm/recebimentos?mp=${q}`);
      const slug = oauthOn() ? readState(req.query.state) : null;
      if (!slug || !req.query.code) return back("erro");
      const t = await mpOauthToken({ grant_type: "authorization_code", code: String(req.query.code), redirect_uri: redirectUri() });
      if (!t?.access_token) return back("erro");
      const me = await mpGet(t.access_token, "/users/me");
      await adminDb().doc(secretPath(slug)).set({
        mpToken: t.access_token, mpRefresh: t.refresh_token || null, mpExpiresAt: Date.now() + (t.expires_in || 15552000) * 1000,
        mpUser: { id: me?.id || t.user_id || null, nickname: me?.nickname || "", email: me?.email || "" }, updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      return back("ok");
    }

    // ------------------------------------------------ avisos (webhooks)
    const { provider: hook, studio: hookStudio } = req.query || {};
    if (hook) {
      if (hookStudio && !okSlug(hookStudio)) return res.status(200).json({ ok: true });
      if (!hookStudio && hook !== "mp") return res.status(200).json({ ok: true });
      const db = adminDb();

      if (hook === "mp") {
        // O aviso só traz o id: buscamos o pedido NO Mercado Pago com o token da fotógrafa.
        const id = req.body?.data?.id || req.query["data.id"] || req.query.id;
        let slug = hookStudio;
        if (!slug) {
          // Aviso configurado no painel da aplicação (vale para todas as contas): acha a fotógrafa pelo user_id.
          const uid = Number(req.body?.user_id);
          const q = uid ? await db.collection("paymentSecrets").where("mpUser.id", "==", uid).limit(1).get() : null;
          slug = q?.docs[0]?.id || null;
        }
        const tok = id && slug ? await mpTokenOf(db, slug) : null;
        if (!tok) return res.status(200).json({ ok: true });
        const o = await mpGet(tok, `/v1/orders/${encodeURIComponent(id)}`);
        if (orderPaid(o) && okId(o.external_reference)) {
          const ref = db.doc(path(slug, "appointments", o.external_reference));
          if ((await ref.get()).exists) await markPaid(ref, "mercadopago", { ref: String(o.id), amountCents: Math.round(Number(o.total_amount) * 100) || null });
        }
        return res.status(200).json({ ok: true });
      }

      if (hook === "ip") {
        const b = req.body || {};
        const apptId = String(b.order_nsu || "");
        if (!okId(apptId)) return res.status(200).json({ ok: true });
        const cfg = (await db.doc(settingsPath(hookStudio)).get()).data()?.payments || {};
        const ref = db.doc(path(hookStudio, "appointments", apptId));
        if (!(await ref.get()).exists) return res.status(200).json({ ok: true });
        // Confere na InfinitePay antes de dar como pago.
        let paid = false;
        try {
          const r = await fetch(`${IP}/payment_check`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ handle: cfg.infiniteTag, order_nsu: apptId, transaction_nsu: b.transaction_nsu, slug: b.invoice_slug }),
          });
          const j = r.ok ? await r.json() : null;
          paid = !!(j && (j.paid === true || j.success === true && j.paid !== false));
        } catch { /* sem conferência */ }
        if (paid) await markPaid(ref, "infinitepay", { ref: String(b.transaction_nsu || ""), amountCents: Number(b.paid_amount || b.amount) || null });
        else await ref.set({ deposit: { status: "review", provider: "infinitepay", note: "Aviso de pagamento recebido, mas não foi possível conferir. Confira no app da InfinitePay.", ref: String(b.transaction_nsu || "") } }, { merge: true });
        return res.status(200).json({ ok: true });
      }
      return res.status(200).json({ ok: true });
    }

    if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });
    const { action } = req.body || {};

    // ------------------------------------------------ painel (logado)
    if (["mpsave", "mpinfo", "mpremove", "mpauthurl"].includes(action)) {
      const user = await userFrom(req);
      if (!user) return res.status(401).json({ error: "Entre na sua conta." });
      const slug = (await studioOfUser(user.uid, user.email))?.slug;
      if (!slug) return res.status(403).json({ error: "Conta sem estúdio." });
      const ref = adminDb().doc(secretPath(slug));
      if (action === "mpinfo") {
        const d = (await ref.get()).data();
        return res.status(200).json({ connected: !!d?.mpToken, account: d?.mpUser || null, oauth: oauthOn() });
      }
      if (action === "mpauthurl") {
        if (!oauthOn()) return res.status(409).json({ error: "Conexão automática ainda não configurada." });
        const u = new URL("https://auth.mercadopago.com.br/authorization");
        u.search = new URLSearchParams({ client_id: MP_ID(), response_type: "code", platform_id: "mp", state: makeState(slug), redirect_uri: redirectUri() }).toString();
        return res.status(200).json({ url: u.toString() });
      }
      if (action === "mpremove") { await ref.set({ mpToken: FieldValue.delete(), mpUser: FieldValue.delete(), mpRefresh: FieldValue.delete(), mpExpiresAt: FieldValue.delete() }, { merge: true }); return res.status(200).json({ ok: true }); }
      const token = String(req.body.token || "").trim();
      if (!/^APP_USR-[\w-]{20,}$/.test(token)) return res.status(400).json({ error: "Cole o Access Token de PRODUÇÃO (começa com APP_USR-)." });
      const me = await mpGet(token, "/users/me");
      if (!me?.id) return res.status(400).json({ error: "O Mercado Pago não aceitou esse token. Confira se copiou o Access Token de produção." });
      const mpUser = { id: me.id, nickname: me.nickname || "", email: me.email || "" };
      await ref.set({ mpToken: token, mpUser, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      return res.status(200).json({ connected: true, account: mpUser });
    }

    // ------------------------------------------------ cliente (sem login)
    const { studio, apptId } = req.body || {};
    if (!okSlug(studio) || !okId(apptId)) return res.status(400).json({ error: "Pedido inválido." });
    const db = adminDb();
    const ref = db.doc(path(studio, "appointments", apptId));
    const [apptSnap, setSnap] = await Promise.all([ref.get(), db.doc(settingsPath(studio)).get()]);
    if (!apptSnap.exists) return res.status(404).json({ error: "Agendamento não encontrado." });
    const appt = apptSnap.data();
    const cfg = setSnap.data()?.payments || {};
    // Sinal (obrigatório, % do pacote) ou "quitar": o valor total de uma vez.
    const totalCents = appt.priceCents || 0;
    // A fotógrafa pode desligar o pagamento em partes: aí é sempre o total.
    const partial = cfg.allowPartial !== false;
    const mode = (!partial || req.body.mode === "total") && totalCents > 0 ? "total" : "sinal";
    const amountCents = mode === "total" ? totalCents : depositOf(appt, cfg);
    const pending = (extra) => ({ deposit: { status: "pending", mode, amountCents, totalCents, ...extra } });

    if (action === "status") {
      let st = appt.deposit?.status || "none";
      // Mercado Pago: confere na hora, caso o aviso ainda não tenha chegado.
      if (st === "pending" && appt.deposit?.provider === "mercadopago" && appt.deposit?.mpId) {
        const tok = await mpTokenOf(db, studio);
        const o = tok ? await mpGet(tok, `/v1/orders/${appt.deposit.mpId}`) : null;
        if (orderPaid(o)) { await markPaid(ref, "mercadopago", { ref: String(o.id), amountCents: appt.deposit.amountCents }); st = "paid"; }
      }
      return res.status(200).json({ status: st, mode: appt.deposit?.mode || "sinal", amountCents: appt.deposit?.amountCents || null, totalCents });
    }

    if (action !== "start") return res.status(400).json({ error: "Ação inválida." });
    if (["cancelled", "canceled", "rejected"].includes(appt.status)) return res.status(409).json({ error: "Este agendamento foi cancelado." });
    if (appt.deposit?.status === "paid") return res.status(200).json({ status: "paid", mode: appt.deposit.mode || "sinal", amountCents: appt.deposit.amountCents || null, totalCents });
    const pct = Math.min(100, Math.max(1, Number(cfg.depositPercent) || 30));
    const desc = `${mode === "total" ? "Pagamento total" : `Sinal (${pct}%)`} · ${appt.packageName || "Ensaio"} · ${appt.date || ""} ${appt.time || ""}`.slice(0, 120);

    if (cfg.provider === "pix") {
      if (!cfg.pixKey) return res.status(409).json({ error: "Pagamento pelo site indisponível." });
      await ref.set(pending({ provider: "pix" }), { merge: true });
      return res.status(200).json({ provider: "pix", mode, amountCents, totalCents, pixKey: cfg.pixKey, pixName: cfg.pixName || "", pixCity: cfg.pixCity || "", txid: apptId.slice(0, 25) });
    }

    if (cfg.provider === "mercadopago") {
      const tok = await mpTokenOf(db, studio);
      if (!tok) return res.status(409).json({ error: "Pagamento pelo site indisponível." });
      const sec = { mpToken: tok };
      // Reaproveita o Pix já gerado (vale 24h) se o valor não mudou.
      const d = appt.deposit;
      if (d?.provider === "mercadopago" && d.mpId && d.amountCents === amountCents && d.qr) {
        const o = await mpGet(sec.mpToken, `/v1/orders/${d.mpId}`);
        if (orderPaid(o)) { await markPaid(ref, "mercadopago", { ref: String(o.id), amountCents }); return res.status(200).json({ status: "paid", mode, amountCents, totalCents }); }
        if (o && ["action_required", "created"].includes(o.status)) return res.status(200).json({ provider: "mercadopago", mode, amountCents, totalCents, qr: d.qr, qrBase64: orderPix(o).qr_code_base64 || null });
      }
      const r = await fetch(`${MP}/v1/orders`, {
        method: "POST",
        headers: { Authorization: `Bearer ${sec.mpToken}`, "Content-Type": "application/json", "X-Idempotency-Key": `${studio}-${apptId}-${amountCents}-${Date.now() >> 16}` },
        body: JSON.stringify({
          type: "online",
          processing_mode: "automatic",
          external_reference: apptId,
          description: desc,
          total_amount: money(amountCents),
          payer: { email: appt.email || `reserva-${apptId.slice(0, 10).toLowerCase()}@studiorevela.com`, first_name: String(appt.name || "").split(" ")[0] || "Cliente" },
          transactions: { payments: [{ amount: money(amountCents), payment_method: { id: "pix", type: "bank_transfer" }, expiration_time: "P1D" }] },
        }),
      });
      const o = await r.json().catch(() => null);
      const pm = orderPix(o);
      if (!r.ok || !pm.qr_code) {
        console.error("mp order", r.status, JSON.stringify(o?.errors || o?.message || o).slice(0, 500));
        return res.status(502).json({ error: "Não foi possível gerar o Pix agora. Tente de novo em instantes." });
      }
      await ref.set(pending({ provider: "mercadopago", mpId: String(o.id), qr: pm.qr_code }), { merge: true });
      return res.status(200).json({ provider: "mercadopago", mode, amountCents, totalCents, qr: pm.qr_code, qrBase64: pm.qr_code_base64 || null });
    }

    if (cfg.provider === "infinitepay") {
      if (!cfg.infiniteTag) return res.status(409).json({ error: "Pagamento pelo site indisponível." });
      const r = await fetch(`${IP}/links`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle: String(cfg.infiniteTag).replace(/^[@$]/, ""),
          order_nsu: apptId,
          items: [{ quantity: 1, price: amountCents, description: desc }],
          redirect_url: `${site()}/${studio}/agendar?pagamento=${apptId}`,
          webhook_url: `${site()}/api/pagamentos?provider=ip&studio=${studio}`,
          customer: { name: appt.name || undefined, email: appt.email || undefined, phone_number: appt.phone ? `+${appt.phone}` : undefined },
        }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.url) {
        console.error("ip link", r.status, j);
        return res.status(502).json({ error: "Não foi possível abrir o pagamento agora. Tente de novo em instantes." });
      }
      await ref.set(pending({ provider: "infinitepay" }), { merge: true });
      return res.status(200).json({ provider: "infinitepay", mode, amountCents, totalCents, url: j.url });
    }

    return res.status(409).json({ error: "Pagamento pelo site indisponível." });
  } catch (err) {
    if (err instanceof ConfigError) return res.status(503).json({ error: err.message });
    console.error("pagamentos", err);
    return res.status(500).json({ error: "Erro inesperado." });
  }
}
