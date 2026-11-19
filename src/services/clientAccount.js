// Conta da CLIENTE no site da fotógrafa (login com Google).
// LGPD: guardamos só o necessário (nome, WhatsApp, e-mail e o registro do
// consentimento), em clients/{uid} do estúdio. A cliente pode ver, sair e
// apagar os próprios dados em "Minha conta". Cada estúdio só vê as suas clientes.
import { arrayUnion, deleteDoc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebaseAuth.js";
import { loginWithGoogle } from "./authService.js";
import { sDoc } from "./studioDb.js";

export const CONSENT_VERSION = "2026-11-agendamento-v1";

export const watchClient = (cb) => onAuthStateChanged(auth, (u) => cb(u && !u.isAnonymous ? u : null));
export const currentClient = () => auth.currentUser;

export async function signInClient() {
  return loginWithGoogle(); // null = foi por redirecionamento (volta logada)
}
export const signOutClient = () => signOut(auth);

export async function getClientProfile(uid) {
  const s = await getDoc(sDoc("clients", uid));
  return s.exists() ? s.data() : null;
}

/** Salva/atualiza o perfil com o consentimento dado agora. */
export async function saveClientProfile(user, { name, phone }) {
  const ref = sDoc("clients", user.uid);
  const had = await getDoc(ref).then((s) => s.exists()).catch(() => false);
  await setDoc(ref, {
    name: String(name || user.displayName || "").slice(0, 120),
    phone: String(phone || "").replace(/\D/g, "").slice(0, 15),
    email: user.email || null,
    consent: { version: CONSENT_VERSION, at: serverTimestamp(), purpose: "agendamento e contato sobre o ensaio" },
    updatedAt: serverTimestamp(),
    ...(had ? {} : { createdAt: serverTimestamp() }),
  }, { merge: true });
}

/** Guarda um resumo do agendamento na conta da cliente (para "Minha conta"). */
export async function addClientBooking(uid, b) {
  await setDoc(sDoc("clients", uid), {
    bookings: arrayUnion({ id: b.id, packageName: b.packageName || "", date: b.date, time: b.time, priceCents: b.priceCents || 0, at: new Date().toISOString() }),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/** Apaga os dados da cliente neste estúdio e encerra a sessão. */
export async function deleteClientData(uid) {
  await deleteDoc(sDoc("clients", uid));
  await signOut(auth);
}
