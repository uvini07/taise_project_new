// Firebase Admin para as funções da Vercel (ignora as regras do banco; use só
// depois de conferir quem está pedindo). Credencial: FIREBASE_SERVICE_ACCOUNT
// (o JSON da conta de serviço do Firebase, inteiro, numa variável da Vercel).
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

export class ConfigError extends Error {}

export function adminApp() {
  if (getApps().length) return getApps()[0];
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new ConfigError("Falta a variável FIREBASE_SERVICE_ACCOUNT na Vercel.");
  return initializeApp({ credential: cert(JSON.parse(raw)) });
}
export const adminDb = () => getFirestore(adminApp());

/** Usuário do Firebase a partir do token "Bearer" (ou null). */
export async function userFrom(req) {
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  try { return await getAuth(adminApp()).verifyIdToken(token); } catch (e) { if (e instanceof ConfigError) throw e; return null; }
}

/** Estúdio da pessoa logada: { slug, studio } ou null (estúdio original não assina). */
export async function studioOfUser(uid) {
  const db = adminDb();
  const owner = await db.doc(`owners/${uid}`).get();
  const slug = owner.exists ? owner.data().slug : null;
  if (!slug) return null;
  const studio = await db.doc(`studios/${slug}`).get();
  return studio.exists && studio.data().ownerUid === uid ? { slug, studio: studio.data() } : null;
}
