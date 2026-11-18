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

async function mpGet(token, url) {
  const r = await fetch(`${MP}${url}`, { headers: { Authorization: `Bearer ${token}` } });
  return r.ok ? r.json() : null;
}

export default async function handler(req, res) {
  try {
    // ------------------------------------------------ avisos (webhooks)
    const { provider: hook, studio: hookStudio } = req.query || {};
    if (hook) {
      if (!okSlug(hookStudio)) return res.status(200).json({ ok: true });
      const db = adminDb();

      if (hook === "mp") {
        // O aviso só traz o id: buscamos o pagamento NO Mercado Pago com o token da fotógrafa.
        const id = req.body?.data?.id || req.query["data.id"] || req.query.id;
        const sec = (await db.doc(secretPath(hookStudio)).get()).data();
        if (!id || !sec?.mpToken) return res.status(200).json({ ok: true });
        const p = await mpGet(sec.mpToken, `/v1/payments/${encodeURIComponent(id)}`);
        if (p?.status === "approved" && okId(p.external_reference)) {
          const ref = db.doc(path(hookStudio, "appointments", p.external_reference));
          if ((await ref.get()).exists) await markPaid(ref, "mercadopago", { ref: String(p.id), amountCents: Math.round(p.transaction_amount * 100) });
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
    if (["mpsave", "mpinfo", "mpremove"].includes(action)) {
      const user = await userFrom(req);
      if (!user) return res.status(401).json({ error: "Entre na sua conta." });
      const slug = (await studioOfUser(user.uid, user.email))?.slug;
      if (!slug) return res.status(403).json({ error: "Conta sem estúdio." });
      const ref = adminDb().doc(secretPath(slug));
      if (action === "mpinfo") {
        const d = (await ref.get()).data();
        return res.status(200).json({ connected: !!d?.mpToken, account: d?.mpUser || null });
      }
      if (action === "mpremove") { await ref.set({ mpToken: FieldValue.delete(), mpUser: FieldValue.delete() }, { merge: true }); return res.status(200).json({ ok: true }); }
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
    const amountCents = depositOf(appt, cfg);

    if (action === "status") {
      let st = appt.deposit?.status || "none";
      // Mercado Pago: confere na hora, caso o aviso ainda não tenha chegado.
      if (st === "pending" && appt.deposit?.provider === "mercadopago" && appt.deposit?.mpId) {
        const sec = (await db.doc(secretPath(studio)).get()).data();
        const p = sec?.mpToken ? await mpGet(sec.mpToken, `/v1/payments/${appt.deposit.mpId}`) : null;
        if (p?.status === "approved") { await markPaid(ref, "mercadopago", { ref: String(p.id), amountCents }); st = "paid"; }
      }
      return res.status(200).json({ status: st });
    }

    if (action !== "start") return res.status(400).json({ error: "Ação inválida." });
    if (["cancelled", "canceled", "rejected"].includes(appt.status)) return res.status(409).json({ error: "Este agendamento foi cancelado." });
    if (appt.deposit?.status === "paid") return res.status(200).json({ status: "paid", amountCents });
    const desc = `Sinal · ${appt.packageName || "Ensaio"} · ${appt.date || ""} ${appt.time || ""}`.slice(0, 120);

    if (cfg.provider === "pix") {
      if (!cfg.pixKey) return res.status(409).json({ error: "Pagamento pelo site indisponível." });
      await ref.set({ deposit: { status: "pending", provider: "pix", amountCents } }, { merge: true });
      return res.status(200).json({ provider: "pix", amountCents, pixKey: cfg.pixKey, pixName: cfg.pixName || "", pixCity: cfg.pixCity || "", txid: apptId.slice(0, 25) });
    }

    if (cfg.provider === "mercadopago") {
      const sec = (await db.doc(secretPath(studio)).get()).data();
      if (!sec?.mpToken) return res.status(409).json({ error: "Pagamento pelo site indisponível." });
      // Reaproveita o Pix já gerado (vale 24h) se o valor não mudou.
      const d = appt.deposit;
      if (d?.provider === "mercadopago" && d.mpId && d.amountCents === amountCents && d.qr) {
        const p = await mpGet(sec.mpToken, `/v1/payments/${d.mpId}`);
        if (p?.status === "approved") { await markPaid(ref, "mercadopago", { ref: String(p.id), amountCents }); return res.status(200).json({ status: "paid", amountCents }); }
        if (p?.status === "pending") return res.status(200).json({ provider: "mercadopago", amountCents, qr: d.qr, qrBase64: p.point_of_interaction?.transaction_data?.qr_code_base64 || null });
      }
      const r = await fetch(`${MP}/v1/payments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${sec.mpToken}`, "Content-Type": "application/json", "X-Idempotency-Key": `${studio}-${apptId}-${amountCents}-${Date.now() >> 16}` },
        body: JSON.stringify({
          transaction_amount: amountCents / 100,
          description: desc,
          payment_method_id: "pix",
          external_reference: apptId,
          notification_url: `${site()}/api/pagamentos?provider=mp&studio=${studio}`,
          date_of_expiration: new Date(Date.now() + 24 * 3600e3).toISOString().replace("Z", "-00:00"),
          payer: { email: appt.email || `reserva-${apptId.slice(0, 10).toLowerCase()}@studiorevela.com`, first_name: String(appt.name || "").split(" ")[0] || "Cliente" },
        }),
      });
      const p = await r.json().catch(() => null);
      const qr = p?.point_of_interaction?.transaction_data?.qr_code;
      if (!r.ok || !qr) {
        console.error("mp create", r.status, p?.message);
        return res.status(502).json({ error: "Não foi possível gerar o Pix agora. Tente de novo em instantes." });
      }
      await ref.set({ deposit: { status: "pending", provider: "mercadopago", amountCents, mpId: String(p.id), qr } }, { merge: true });
      return res.status(200).json({ provider: "mercadopago", amountCents, qr, qrBase64: p.point_of_interaction.transaction_data.qr_code_base64 || null });
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
      await ref.set({ deposit: { status: "pending", provider: "infinitepay", amountCents } }, { merge: true });
      return res.status(200).json({ provider: "infinitepay", amountCents, url: j.url });
    }

    return res.status(409).json({ error: "Pagamento pelo site indisponível." });
  } catch (err) {
    if (err instanceof ConfigError) return res.status(503).json({ error: err.message });
    console.error("pagamentos", err);
    return res.status(500).json({ error: "Erro inesperado." });
  }
}
