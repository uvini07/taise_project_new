import {
  createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";
import { auth } from "./firebaseAuth.js";
import { db } from "./firebase.js";
import { TENANT, setCurrentStudio } from "../config/tenant.js";

export const TRIAL_DAYS = 30;

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
    // Conta criada pela Revela: o estúdio vem de owners/{uid}.
    let owner = null;
    try {
      const snap = await getDoc(doc(db, "owners", user.uid));
      if (snap.exists()) owner = snap.data();
    } catch { /* sem permissão ou sem rede: segue para a checagem abaixo */ }
    if (owner?.slug) {
      let studio = null;
      try { const s = await getDoc(doc(db, "studios", owner.slug)); studio = s.exists() ? s.data() : null; } catch { /* sem rede */ }
      const created = studio?.createdAt?.toDate?.() || new Date();
      const trialEndsAt = new Date(created.getTime() + TRIAL_DAYS * 86400000);
      const expired = studio?.status !== "active" && Date.now() > trialEndsAt.getTime();
      setCurrentStudio(owner.slug);
      return cb({
        user, status: expired ? "expired" : "admin",
        admin: { uid: user.uid, email: user.email, role: "owner", studio: owner.slug, studioName: studio?.name || owner.name, trialEndsAt, plan: studio?.status || "trial" },
      });
    }
    // Estúdio original (Taíse).
    if (!isAllowedEmail(user.email)) return cb({ user, admin: null, status: "notAdmin" });
    setCurrentStudio(TENANT.slug);
    cb({ user, admin: { uid: user.uid, email: user.email, role: "owner", studio: TENANT.slug, studioName: TENANT.name, plan: "active" }, status: "admin" });
  });
}

/** Endereço já usado por outro estúdio? (1 leitura) */
export async function isSlugTaken(slug) {
  try { return (await getDoc(doc(db, "studios", slug))).exists(); } catch { return false; }
}

/**
 * Cadastro com teste de 30 dias: cria a conta, o estúdio (studios/{slug}),
 * o vínculo owners/{uid} e as primeiras configurações do site.
 */
export async function signupStudio({ name, studio, email, phone, password, slug, plan }) {
  // Se a tentativa anterior criou a conta mas não o estúdio (endereço tomado),
  // reaproveita a mesma conta em vez de dar "e-mail já usado".
  const same = auth.currentUser && auth.currentUser.email?.toLowerCase() === email.trim().toLowerCase();
  const user = same ? auth.currentUser : (await createUserWithEmailAndPassword(auth, email.trim(), password)).user;
  try { await updateProfile(user, { displayName: name.trim() }); } catch { /* opcional */ }
  const uid = user.uid;
  const batch = writeBatch(db);
  batch.set(doc(db, "studios", slug), { ownerUid: uid, name: studio.trim(), plan, status: "trial", createdAt: serverTimestamp() });
  batch.set(doc(db, "owners", uid), { slug, name: name.trim(), email: email.trim().toLowerCase(), phone, createdAt: serverTimestamp() });
  await batch.commit();
  // Site "em branco" já com o nome e o contato da fotógrafa.
  await setDoc(doc(db, "studios", slug, "siteSettings", "public"), {
    brandName: studio.trim(),
    contact: { email: email.trim().toLowerCase(), whatsapp: phone, bookingWhatsapp: phone, phone: "" },
    seo: { title: studio.trim(), description: "", shareImageUrl: "" },
    contentVersion: 1,
    updatedAt: serverTimestamp(),
  });
  setCurrentStudio(slug);
  return { uid, slug };
}

const SIGNUP_ERRORS = {
  "auth/email-already-in-use": "Este e-mail já tem uma conta. Entre com ele ou use outro e-mail.",
  "auth/weak-password": "Senha fraca. Use pelo menos 8 caracteres.",
  "auth/invalid-email": "E-mail inválido.",
  "auth/network-request-failed": "Sem conexão com a internet.",
  "permission-denied": "Não foi possível reservar este endereço. Tente outro.",
};
export const signupErrorMessage = (e) => SIGNUP_ERRORS[e?.code] || "Não foi possível criar a conta agora. Tente de novo.";

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

