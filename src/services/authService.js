import {
  onAuthStateChanged, reload, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth } from "./firebaseAuth.js";
import { db } from "./firebase.js";

// Única conta com acesso ao painel (as regras do Firestore/Storage exigem o mesmo).
export const ADMIN_EMAILS = ["tarufino@gmail.com", "marcelinhojordao07@gmail.com"];
export const isAllowedEmail = (e) => ADMIN_EMAILS.includes((e || "").toLowerCase());

/**
 * Observa a sessão e diz se a pessoa logada é administradora (documento
 * adminUsers/{uid} ativo). A checagem aqui só decide o que mostrar: quem
 * realmente bloqueia o acesso aos dados são as regras do Firestore.
 */
export function watchAdminSession(cb) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) return cb({ user: null, admin: null, status: "signedOut" });
    if (!isAllowedEmail(user.email)) return cb({ user, admin: null, status: "notAdmin" });
    try {
      const snap = await getDoc(doc(db, "adminUsers", user.uid));
      const data = snap.exists() ? snap.data() : null;
      const ok = !!data && data.active === true && ["owner", "admin"].includes(data.role);
      cb({ user, admin: ok ? { uid: user.uid, ...data } : null, status: ok ? "admin" : "notAdmin" });
    } catch (e) {
      cb({ user, admin: null, status: "notAdmin", error: e });
    }
  });
}

const AUTH_ERRORS = {
  "auth/invalid-credential": "E-mail ou senha incorretos.",
  "auth/wrong-password": "E-mail ou senha incorretos.",
  "auth/user-not-found": "E-mail ou senha incorretos.",
  "auth/invalid-email": "E-mail inválido.",
  "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos e tente de novo.",
  "auth/network-request-failed": "Sem conexão com a internet.",
  "auth/user-disabled": "Este acesso foi desativado.",
};

export function authErrorMessage(e) {
  return AUTH_ERRORS[e?.code] || "Não foi possível entrar. Tente novamente.";
}

export const login = (email, password) => signInWithEmailAndPassword(auth, email.trim(), password);
export const logout = () => signOut(auth);
export const resetPassword = (email) => sendPasswordResetEmail(auth, email.trim());
export const currentUser = () => auth.currentUser;

/**
 * Ativa o acesso da conta autorizada sem precisar mexer no console:
 * exige e-mail verificado (as regras conferem o mesmo).
 */
export async function activateOwnerAccess() {
  const u = auth.currentUser;
  if (!u || !isAllowedEmail(u.email)) throw new Error("Conta não autorizada.");
  await reload(u);
  if (!u.emailVerified) {
    await sendEmailVerification(u);
    return "verification-sent";
  }
  await u.getIdToken(true);
  await setDoc(doc(db, "adminUsers", u.uid), { active: true, role: "owner", email: u.email });
  return "activated";
}
