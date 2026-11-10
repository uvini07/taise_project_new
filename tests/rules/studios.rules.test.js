// Testes das regras de estúdios (cadastro pela Revela com teste de 30 dias).
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { Timestamp, doc, getDoc, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";

let env;
beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-taisefoto-studios",
    firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 },
  });
});
afterAll(async () => { await env?.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "studios/anafoto"), { ownerUid: "ana", name: "Ana Foto", plan: "profissional", status: "trial", createdAt: Timestamp.now() });
    await setDoc(doc(db, "owners/ana"), { slug: "anafoto", name: "Ana", email: "ana@x.com", phone: "5511999990000", createdAt: Timestamp.now() });
    const old = Timestamp.fromDate(new Date(Date.now() - 31 * 86400000));
    await setDoc(doc(db, "studios/velho"), { ownerUid: "bia", name: "Bia", plan: "essencial", status: "trial", createdAt: old });
    await setDoc(doc(db, "owners/bia"), { slug: "velho", name: "Bia", email: "b@x.com", phone: "1", createdAt: old });
    await setDoc(doc(db, "packages/p1"), { name: "Pacote da Taíse", status: "published" });
  });
});

const as = (uid, email) => env.authenticatedContext(uid, { email: email || `${uid}@x.com` }).firestore();
const anon = () => env.unauthenticatedContext().firestore();

function signup(db, uid, slug) {
  const b = writeBatch(db);
  b.set(doc(db, "studios", slug), { ownerUid: uid, name: "Novo Estúdio", plan: "profissional", status: "trial", createdAt: serverTimestamp() });
  b.set(doc(db, "owners", uid), { slug, name: "Nova", email: "n@x.com", phone: "5511988887777", createdAt: serverTimestamp() });
  return b.commit();
}

describe("cadastro de estúdio", () => {
  it("cria estúdio e vínculo juntos num endereço livre", () => assertSucceeds(signup(as("nova"), "nova", "novafoto")));
  it("não pega endereço já usado", () => assertFails(signup(as("nova"), "nova", "anafoto")));
  it("não pega endereço reservado", () => assertFails(signup(as("nova"), "nova", "tarufino")));
  it("não cria um segundo estúdio", () => assertFails(signup(as("ana"), "ana", "outroana")));
  it("não cria estúdio para outra pessoa", async () => {
    const db = as("nova");
    const b = writeBatch(db);
    b.set(doc(db, "studios/xfoto"), { ownerUid: "outra", name: "X", plan: "profissional", status: "trial", createdAt: serverTimestamp() });
    b.set(doc(db, "owners/nova"), { slug: "xfoto", name: "N", email: "n@x.com", phone: "1", createdAt: serverTimestamp() });
    await assertFails(b.commit());
  });
  it("não se dá plano ativo sozinho", async () => {
    const db = as("nova");
    const b = writeBatch(db);
    b.set(doc(db, "studios/yfoto"), { ownerUid: "nova", name: "Y", plan: "profissional", status: "active", createdAt: serverTimestamp() });
    b.set(doc(db, "owners/nova"), { slug: "yfoto", name: "N", email: "n@x.com", phone: "1", createdAt: serverTimestamp() });
    await assertFails(b.commit());
  });
  it("dona não altera o próprio status", () => assertFails(setDoc(doc(as("ana"), "studios/anafoto"), { status: "active" }, { merge: true })));
  it("vínculo owners é privado", async () => {
    await assertSucceeds(getDoc(doc(as("ana"), "owners/ana")));
    await assertFails(getDoc(doc(as("nova"), "owners/ana")));
  });
});

describe("dados do estúdio", () => {
  const settings = (db, slug) => setDoc(doc(db, "studios", slug, "siteSettings", "public"), { brandName: "X" });
  it("dona edita o próprio site", () => assertSucceeds(settings(as("ana"), "anafoto")));
  it("outra conta não edita", () => assertFails(settings(as("nova"), "anafoto")));
  it("dona de estúdio não mexe na Taíse", () => assertFails(setDoc(doc(as("ana"), "packages/p1"), { name: "x", status: "draft" })));
  it("visitante lê o site", async () => {
    await env.withSecurityRulesDisabled((c) => settings(c.firestore(), "anafoto"));
    await assertSucceeds(getDoc(doc(anon(), "studios/anafoto/siteSettings/public")));
  });
  it("visitante não lê agendamentos", () => assertFails(getDoc(doc(anon(), "studios/anafoto/appointments/a1"))));
  it("teste vencido bloqueia o painel", () => assertFails(settings(as("bia"), "velho")));
  it("plataforma tem acesso", () => assertSucceeds(settings(as("mj", "marcelinhojordao07@gmail.com"), "anafoto")));
});

describe("imagens", () => {
  const blob = (db, owner) => setDoc(doc(db, "imageBlobs/img1"), { data: "abc", contentType: "image/webp", size: 3, folder: "x", createdAt: serverTimestamp(), owner });
  it("dona de estúdio envia imagem dela", () => assertSucceeds(blob(as("ana"), "ana")));
  it("não envia em nome de outra", () => assertFails(blob(as("ana"), "bia")));
  it("conta sem estúdio não envia", () => assertFails(blob(as("nova"), "nova")));
});
