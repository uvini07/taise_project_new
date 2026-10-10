// Inicialização única do Firebase. O site público usa apenas o Firestore;
// Auth e Storage ficam em módulos próprios (firebaseAuth.js /
// firebaseStorage.js), carregados só pelo painel administrativo.
import { getApp, getApps, initializeApp } from "firebase/app";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { firebaseConfig, useEmulators } from "../config/firebaseConfig.js";

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);

if (useEmulators && !globalThis.__TAISE_FS_EMU__) {
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  globalThis.__TAISE_FS_EMU__ = true;
}

export { useEmulators };
