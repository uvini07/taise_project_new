// Testes das regras do Storage (emulador). Upload só para admin, só imagem, até 12 MB.
//
// As regras do Storage consultam o Firestore (adminUsers) — "regras entre
// serviços". Em alguns ambientes o emulador não consegue fazer essa consulta e
// nega tudo; por isso os testes que dependem dela (upload do admin dar certo)
// só rodam com STORAGE_XSERVICE=1. Os testes de bloqueio rodam sempre.
const XSERVICE = process.env.STORAGE_XSERVICE === "1";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, it } from "vitest";
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, setDoc } from "firebase/firestore";
import { getBytes, ref, uploadBytes } from "firebase/storage";

let env;
const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-taisefoto",
    firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 },
    storage: { rules: readFileSync("storage.rules", "utf8"), host: "127.0.0.1", port: 9199 },
  });
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "adminUsers/admin1"), { active: true, role: "owner" });
  });
});
afterAll(async () => { await env?.cleanup(); });

describe("storage", () => {
  it.skipIf(!XSERVICE)("admin envia imagem e qualquer um consegue ver", async () => {
    const adminSt = env.authenticatedContext("admin1", { email: "tarufino@gmail.com" }).storage();
    await assertSucceeds(uploadBytes(ref(adminSt, "public/gallery/a/full.webp"), png, { contentType: "image/webp" }));
    await assertSucceeds(getBytes(ref(env.unauthenticatedContext().storage(), "public/gallery/a/full.webp")));
  });

  it("visitante e usuário comum não enviam", async () => {
    await assertFails(uploadBytes(ref(env.unauthenticatedContext().storage(), "public/gallery/b.webp"), png, { contentType: "image/webp" }));
    await assertFails(uploadBytes(ref(env.authenticatedContext("x").storage(), "public/gallery/c.webp"), png, { contentType: "image/webp" }));
  });

  it("recusa arquivo que não é imagem e arquivo grande demais", async () => {
    const adminSt = env.authenticatedContext("admin1", { email: "tarufino@gmail.com" }).storage();
    await assertFails(uploadBytes(ref(adminSt, "public/x.html"), png, { contentType: "text/html" }));
    const big = new Uint8Array(13 * 1024 * 1024);
    await assertFails(uploadBytes(ref(adminSt, "public/big.jpg"), big, { contentType: "image/jpeg" }));
  });

  it("nada fora de public/", async () => {
    await assertFails(uploadBytes(ref(env.authenticatedContext("admin1", { email: "tarufino@gmail.com" }).storage(), "private/a.webp"), png, { contentType: "image/webp" }));
  });
});
