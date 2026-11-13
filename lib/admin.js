// Firebase Admin para as funções da Vercel (ignora as regras do banco; use só
// depois de conferir quem está pedindo). Credencial: FIREBASE_SERVICE_ACCOUNT
// (o JSON da conta de serviço do Firebase, inteiro, numa variável da Vercel).
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { getFirestore } from "firebase-admin/firestore";

export class ConfigError extends Error {}

export function adminApp() {
  if (getApps().length) return getApps()[0];
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new ConfigError("Falta a variável FIREBASE_SERVICE_ACCOUNT na Vercel.");
  return initializeApp({ credential: cert(JSON.parse(raw)) });
}
export const adminDb = () => getFirestore(adminApp());

/** Usuário do Firebase a partir do token "Bearer" (ou null). Mesmo método da Polaroidy. */
const PROJECT = process.env.VITE_FIREBASE_PROJECT_ID || "taisefoto";
const JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"));
export async function userFrom(req) {
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWKS, { issuer: `https://securetoken.google.com/${PROJECT}`, audience: PROJECT });
    return payload.sub ? { uid: payload.sub, email: payload.email || null } : null;
  } catch { return null; }
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
