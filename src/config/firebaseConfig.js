// Configuração web do Firebase. Não é segredo — só identifica o projeto; quem
// protege os dados são as regras (firestore.rules / storage.rules).
// Pode ser sobrescrita por variáveis de ambiente (veja .env.example).
const env = import.meta.env || {};
export const useEmulators = env.VITE_USE_EMULATORS === "true";

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyDDZ8kMFY507yZLkMH1RtTJYC4QImCtifw",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "taisefoto.firebaseapp.com",
  // Nos emuladores locais usamos um projeto "demo-": nada chega ao projeto real.
  projectId: env.VITE_FIREBASE_PROJECT_ID || (useEmulators ? "demo-taisefoto" : "taisefoto"),
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "taisefoto.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1092698350184",
  appId: env.VITE_FIREBASE_APP_ID || "1:1092698350184:web:774f96873bcd7c17ad51dd",
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || "G-JJR8QMEL1E",
};

