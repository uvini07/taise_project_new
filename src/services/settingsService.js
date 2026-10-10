import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase.js";
import { mergeSettings } from "../config/defaults.js";

export const settingsRef = () => doc(db, "siteSettings", "public");

/** Configurações do site em tempo real (alterações no painel aparecem na hora). */
export function subscribeSettings(cb, onError) {
  return onSnapshot(settingsRef(),
    (snap) => cb(mergeSettings(snap.exists() ? snap.data() : null)),
    (e) => { onError?.(e); cb(mergeSettings(null)); });
}
