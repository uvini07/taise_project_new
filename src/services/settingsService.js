import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase.js";
import { mergeSettings } from "../config/defaults.js";

export const settingsRef = () => doc(db, "siteSettings", "public");

/** Configurações do site em tempo real (alterações no painel aparecem na hora). */
export function subscribeSettings(cb, onError) {
  return onSnapshot(settingsRef(),
    (snap) => cb(mergeSettings(snap.exists() ? snap.data() : null)),
    (e) => { onError?.(e); cb(mergeSettings(null)); });
}

const LS = "tf-settings";
/** Último valor salvo no aparelho (mostra o site na hora, sem esperar o banco). */
export function cachedSettings() {
  try { const v = JSON.parse(localStorage.getItem(LS) || "null"); return v ? mergeSettings(v) : null; } catch { return null; }
}

/** Site público: 1 leitura por visita (sem conexão em tempo real aberta). */
export async function loadSettingsOnce() {
  const snap = await getDoc(settingsRef());
  const raw = snap.exists() ? snap.data() : null;
  try {
    if (raw) {
      const { updatedAt, ...rest } = raw;
      localStorage.setItem(LS, JSON.stringify({ ...rest, contentVersion: raw.contentVersion ?? 0 }));
    }
  } catch { /* sem armazenamento */ }
  return mergeSettings(raw);
}
