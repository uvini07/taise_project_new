// Testes das regras do Firestore (rodam no emulador: npm run test:rules).
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
  assertFails, assertSucceeds, initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  Timestamp, collection, deleteDoc, doc, getDoc, getDocs, increment, query, runTransaction, serverTimestamp, setDoc,
  updateDoc, where, writeBatch,
} from "firebase/firestore";

let env;
const HOUR = 3600 * 1000;
const future = (h) => Timestamp.fromDate(new Date(Date.now() + h * HOUR));
const past = (h) => Timestamp.fromDate(new Date(Date.now() - h * HOUR));
const dayOf = (ts) => ts.toDate().toISOString().slice(0, 10);

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-taisefoto",
    firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 },
  });
});
afterAll(async () => { await env?.cleanup(); });

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "adminUsers/admin1"), { active: true, role: "owner", email: "adm@x.com" });
    await setDoc(doc(db, "adminUsers/off1"), { active: false, role: "owner" });
    await setDoc(doc(db, "meta/packages"), { publishedIds: ["p1"] });
    await setDoc(doc(db, "packages/p1"), { name: "Família", status: "published", order: 1 });
    await setDoc(doc(db, "packages/draft1"), { name: "Rascunho", status: "draft", order: 2 });
    await setDoc(doc(db, "packageLots/l1"), { packageId: "p1", public: true, status: "active", name: "1º lote", priceCents: 38000, capacity: 2, confirmedCount: 0, salesStart: null, salesEnd: null, order: 1 });
    await setDoc(doc(db, "packageLots/lfull"), { packageId: "p1", public: true, status: "active", name: "lote cheio", priceCents: 38000, capacity: 1, confirmedCount: 1, salesStart: null, salesEnd: null, order: 2 });
    await setDoc(doc(db, "packageLots/ldraft"), { packageId: "draft1", public: false, status: "active", name: "x", priceCents: 1000, capacity: null, confirmedCount: 0, salesStart: null, salesEnd: null, order: 1 });
    await setDoc(doc(db, "vipCampaigns/c1"), {
      name: "VIP", slug: "vip", status: "published", registrationEnd: future(48), countdownEndsAt: future(24), vipAccessStartsAt: past(1),
      vipPricing: { p1: 30000 }, maxRegistrations: 2,
    });
    await setDoc(doc(db, "vipCampaigns/cold"), { name: "Antiga", slug: "antiga", status: "published", registrationEnd: past(1), countdownEndsAt: past(1), vipPricing: {} });
    await setDoc(doc(db, "vipCampaigns/cdraft"), { name: "Rascunho", slug: "r", status: "draft", vipPricing: {} });
    await setDoc(doc(db, "vipMembers/c1_5511999990000"), { campaignId: "c1", registrationId: "r0", createdAt: Timestamp.now() });
    await setDoc(doc(db, "appointments/a0"), { name: "Ana", phone: "5511988887777", status: "confirmed" });
    await setDoc(doc(db, "financialTransactions/t0"), { type: "income", amountCents: 100, payments: [] });
  });
});

const anon = () => env.unauthenticatedContext().firestore();
const admin = () => env.authenticatedContext("admin1", { email: "tarufino@gmail.com" }).firestore();
const stranger = () => env.authenticatedContext("someone").firestore();

function booking(db, overrides = {}, lockOverride) {
  const startAt = future(72);
  const date = dayOf(startAt);
  const ref = doc(collection(db, "appointments"));
  const lock = lockOverride ?? `${date}_1000_0`;
  const data = {
    name: "Cliente Teste", phone: "5511912345678", email: null, notes: null,
    packageId: "p1", packageName: "Família", lotId: "l1", lotName: "1º lote", priceCents: 38000,
    date, time: "10:00", startAt, durationMin: 60, slotLockIds: [lock],
    status: "requested", source: "site", consent: true, createdAt: serverTimestamp(), history: [],
    ...overrides,
  };
  const b = writeBatch(db);
  b.set(ref, data);
  for (const id of data.slotLockIds) b.set(doc(db, "slotLocks", id), { appointmentId: ref.id, date: id.split("_")[0], createdAt: serverTimestamp() });
  return { commit: () => b.commit(), ref, lock, date };
}

describe("leitura pública", () => {
  it("vê pacotes publicados, nunca rascunhos", async () => {
    await assertSucceeds(getDoc(doc(anon(), "packages/p1")));
    await assertFails(getDoc(doc(anon(), "packages/draft1")));
    await assertSucceeds(getDocs(query(collection(anon(), "packages"), where("status", "in", ["published", "soldout"]))));
    await assertFails(getDocs(collection(anon(), "packages")));
  });

  it("vê lotes públicos, não os de rascunho", async () => {
    await assertSucceeds(getDocs(query(collection(anon(), "packageLots"), where("public", "==", true))));
    await assertFails(getDoc(doc(anon(), "packageLots/ldraft")));
  });

  it("nunca lê dados pessoais, financeiros ou administrativos", async () => {
    for (const path of ["appointments/a0", "financialTransactions/t0", "adminUsers/admin1"]) {
      await assertFails(getDoc(doc(anon(), path)));
      await assertFails(getDoc(doc(stranger(), path)));
    }
    await assertFails(getDocs(collection(anon(), "vipRegistrations")));
    await assertFails(getDocs(collection(anon(), "vipMembers")));
    await assertFails(getDocs(collection(anon(), "analyticsDaily")));
    await assertFails(getDocs(collection(anon(), "auditLogs")));
  });

  it("pode consultar um membro VIP pontualmente (get), mas não listar", async () => {
    await assertSucceeds(getDoc(doc(anon(), "vipMembers/c1_5511999990000")));
    await assertFails(getDocs(query(collection(anon(), "vipMembers"))));
  });
});

describe("pedido de agendamento", () => {
  it("aceita pedido válido com trava de horário", async () => {
    await assertSucceeds(booking(anon()).commit());
  });

  it("bloqueia dois pedidos no mesmo horário (concorrência)", async () => {
    const first = booking(anon());
    const second = booking(anon(), {}, first.lock);
    await assertSucceeds(first.commit());
    await assertFails(second.commit());
  });

  it("pedidos simultâneos: só um vence", async () => {
    const a = booking(anon());
    const b = booking(anon(), {}, a.lock);
    const c = booking(anon(), {}, a.lock);
    const results = await Promise.allSettled([a.commit(), b.commit(), c.commit()]);
    const ok = results.filter((r) => r.status === "fulfilled").length;
    if (ok !== 1) throw new Error(`esperado 1 sucesso, veio ${ok}`);
  });

  it("recusa preço adulterado, status forçado, pacote em rascunho e lote cheio", async () => {
    await assertFails(booking(anon(), { priceCents: 100 }).commit());
    await assertFails(booking(anon(), { status: "confirmed" }).commit());
    await assertFails(booking(anon(), { packageId: "draft1", lotId: "ldraft", priceCents: 1000 }).commit());
    await assertFails(booking(anon(), { lotId: "lfull" }).commit());
  });

  it("recusa pedido sem trava, com trava de outro horário ou data passada", async () => {
    const db = anon();
    const noLock = booking(db, { slotLockIds: [] });
    await assertFails(noLock.commit());
    const startAt = future(72);
    await assertFails(booking(db, {}, `${dayOf(startAt)}_1500_0`).commit());
    await assertFails(booking(db, { startAt: past(2) }).commit());
  });

  it("recusa campos extras e consentimento ausente", async () => {
    await assertFails(booking(anon(), { isAdmin: true }).commit());
    await assertFails(booking(anon(), { consent: false }).commit());
  });

  it("não deixa o público apagar travas nem editar pedidos", async () => {
    const b = booking(anon());
    await b.commit();
    await assertFails(deleteDoc(doc(anon(), "slotLocks", b.lock)));
    await assertFails(updateDoc(doc(anon(), "appointments", b.ref.id), { status: "confirmed" }));
    await assertFails(setDoc(doc(anon(), "slotLocks/2030-01-01_1000_0"), { appointmentId: "x", date: "2030-01-01", createdAt: serverTimestamp() }));
  });

  it("preço VIP só vale para membro da lista durante o acesso", async () => {
    const vip = { vipCampaignId: "c1", vipKey: "c1_5511999990000", phone: "5511999990000", priceCents: 30000 };
    await assertSucceeds(booking(anon(), vip).commit());
    await assertFails(booking(anon(), { ...vip, phone: "5511912345678", vipKey: "c1_5511912345678" }).commit());
    await assertFails(booking(anon(), { ...vip, priceCents: 1 }).commit());
    await assertFails(booking(anon(), { ...vip, vipCampaignId: "cold", vipKey: "cold_5511999990000" }).commit());
  });
});

describe("pacotes (limite de 5 publicados)", () => {
  it("só admin altera pacotes", async () => {
    await assertFails(setDoc(doc(stranger(), "packages/x"), { name: "x", status: "draft" }));
    await assertFails(setDoc(doc(env.authenticatedContext("off1").firestore(), "packages/x"), { name: "x", status: "draft" }));
  });

  it("publicar exige constar em meta/packages, que aceita no máximo 5", async () => {
    const db = admin();
    await assertFails(setDoc(doc(db, "packages/p2"), { name: "P2", status: "published" }));
    const ok = writeBatch(db);
    ok.set(doc(db, "packages/p2"), { name: "P2", status: "published" });
    ok.set(doc(db, "meta/packages"), { publishedIds: ["p1", "p2"] });
    await assertSucceeds(ok.commit());

    const six = writeBatch(db);
    six.set(doc(db, "packages/p6"), { name: "P6", status: "published" });
    six.set(doc(db, "meta/packages"), { publishedIds: ["p1", "p2", "p3", "p4", "p5", "p6"] });
    await assertFails(six.commit());
  });

  it("rascunho não pode constar como publicado", async () => {
    const db = admin();
    const b = writeBatch(db);
    b.set(doc(db, "packages/p3"), { name: "P3", status: "draft" });
    b.set(doc(db, "meta/packages"), { publishedIds: ["p1", "p3"] });
    await assertFails(b.commit());
  });
});

describe("lista VIP", () => {
  async function register(db, campaignId, phone) {
    const memberRef = doc(db, "vipMembers", `${campaignId}_${phone}`);
    const statsRef = doc(db, "vipCampaignStats", campaignId);
    const regRef = doc(collection(db, "vipRegistrations"));
    return runTransaction(db, async (tx) => {
      const stats = await tx.get(statsRef);
      const count = stats.exists() ? stats.data().count : 0;
      tx.set(regRef, {
        campaignId, campaignName: "VIP", name: "Fulana", phone, email: null, preferences: null,
        consent: true, consentText: "Autorizo o uso dos meus dados.", status: "new", createdAt: serverTimestamp(),
      });
      tx.set(memberRef, { campaignId, registrationId: regRef.id, createdAt: serverTimestamp() });
      tx.set(statsRef, { count: count + 1, lastRegId: regRef.id });
    });
  }

  it("aceita inscrição válida e recusa duplicada", async () => {
    await assertSucceeds(register(anon(), "c1", "5511911112222"));
    await assertFails(register(anon(), "c1", "5511911112222"));
  });

  it("respeita o limite de inscritos", async () => {
    await assertSucceeds(register(anon(), "c1", "5511911110001"));
    await assertSucceeds(register(anon(), "c1", "5511911110002"));
    await assertFails(register(anon(), "c1", "5511911110003"));
  });

  it("recusa campanha encerrada ou em rascunho", async () => {
    await assertFails(register(anon(), "cold", "5511911112222"));
    await assertFails(register(anon(), "cdraft", "5511911112222"));
  });

  it("não deixa inflar o contador sem inscrição", async () => {
    await assertFails(setDoc(doc(anon(), "vipCampaignStats/c1"), { count: 1, lastRegId: "fake" }));
  });
});

describe("contadores de analytics", () => {
  it("aceita +1 em um contador permitido", async () => {
    const ref = doc(anon(), "analyticsDaily/2026-10-10");
    await assertSucceeds(setDoc(ref, { pv: increment(1), _k: "pv" }, { merge: true }));
    await assertSucceeds(setDoc(ref, { pv: increment(1), _k: "pv" }, { merge: true }));
    await assertSucceeds(setDoc(ref, { "pkg__p1": increment(1), _k: "pkg__p1" }, { merge: true }));
  });

  it("recusa saltos, chaves inventadas e várias chaves de uma vez", async () => {
    const ref = doc(anon(), "analyticsDaily/2026-10-10");
    await assertFails(setDoc(ref, { pv: increment(5), _k: "pv" }, { merge: true }));
    await assertFails(setDoc(ref, { hack: increment(1), _k: "hack" }, { merge: true }));
    await assertFails(setDoc(ref, { pv: increment(1), wa: increment(1), _k: "pv" }, { merge: true }));
  });
});

describe("configurações e financeiro", () => {
  it("site é público para leitura e só admin escreve", async () => {
    await assertSucceeds(getDoc(doc(anon(), "siteSettings/public")));
    await assertFails(setDoc(doc(anon(), "siteSettings/public"), { brandName: "x" }));
    await assertFails(setDoc(doc(stranger(), "siteSettings/public"), { brandName: "x" }));
    await assertSucceeds(setDoc(doc(admin(), "siteSettings/public"), { brandName: "Taíse Foto" }));
  });

  it("financeiro só para admin e sem exclusão física", async () => {
    await assertSucceeds(getDoc(doc(admin(), "financialTransactions/t0")));
    await assertFails(deleteDoc(doc(admin(), "financialTransactions/t0")));
    await assertSucceeds(updateDoc(doc(admin(), "financialTransactions/t0"), { archived: true }));
  });

  it("só tarufino@gmail.com é admin, mesmo com registro em adminUsers", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "adminUsers/other"), { active: true, role: "owner" });
    });
    const other = env.authenticatedContext("other", { email: "outra@gmail.com" }).firestore();
    await assertFails(getDoc(doc(other, "financialTransactions/t0")));
    await assertFails(setDoc(doc(other, "siteSettings/public"), { brandName: "x" }));
  });

  it("tarufino@gmail.com verificada ativa o próprio acesso; outros não", async () => {
    const ok = env.authenticatedContext("tr", { email: "tarufino@gmail.com", email_verified: true }).firestore();
    await assertSucceeds(setDoc(doc(ok, "adminUsers/tr"), { active: true, role: "owner", email: "tarufino@gmail.com" }));
    const unverified = env.authenticatedContext("tr2", { email: "tarufino@gmail.com", email_verified: false }).firestore();
    await assertFails(setDoc(doc(unverified, "adminUsers/tr2"), { active: true, role: "owner" }));
    const other = env.authenticatedContext("x2", { email: "x@gmail.com", email_verified: true }).firestore();
    await assertFails(setDoc(doc(other, "adminUsers/x2"), { active: true, role: "owner" }));
  });

  it("ninguém se promove a admin pelo site", async () => {
    await assertFails(setDoc(doc(stranger(), "adminUsers/someone"), { active: true, role: "owner" }));
    await assertFails(setDoc(doc(admin(), "adminUsers/someone"), { active: true, role: "owner" }));
  });
});
