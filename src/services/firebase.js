// Inicialização única do Firebase. O site público usa apenas o Firestore;
// Auth fica em módulo próprio (firebaseAuth.js), carregado só pelo painel.
import { getApp, getApps, initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { firebaseConfig, useEmulators } from "../config/firebaseConfig.js";

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// App Check (anti-robô): só liga quando a chave do reCAPTCHA está configurada
// (VITE_APPCHECK_KEY na Vercel). Sem a chave, nada muda — o site funciona igual.
const appCheckKey = import.meta.env.VITE_APPCHECK_KEY;
if (appCheckKey && !useEmulators && typeof window !== "undefined" && !globalThis.__TAISE_APPCHECK__) {
  try {
    initializeAppCheck(app, { provider: new ReCaptchaV3Provider(appCheckKey), isTokenAutoRefreshEnabled: true });
    globalThis.__TAISE_APPCHECK__ = true;
  } catch { /* chave inválida ou já iniciado: segue sem App Check */ }
}

export const db = getFirestore(app);

if (useEmulators && !globalThis.__TAISE_FS_EMU__) {
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  globalThis.__TAISE_FS_EMU__ = true;
}

export { useEmulators };
