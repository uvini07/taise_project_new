import { addDoc, collection, doc, increment, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebase.js";
import { currentUser } from "./authService.js";

/** Registra uma operação administrativa relevante (falha silenciosa). */
export async function audit(action, entity, entityId, details = {}) {
  const u = currentUser();
  if (!u) return;
  if (PUBLIC_ENTITIES.has(entity)) bumpContentVersion();
  try {
    await addDoc(collection(db, "auditLogs"), {
      at: serverTimestamp(),
      uid: u.uid,
      email: u.email || "",
      action,
      entity,
      entityId: entityId || "",
      details: JSON.parse(JSON.stringify(details || {})),
    });
  } catch (e) {
    console.warn("audit log falhou", e);
  }
}

export function actorLabel() {
  const u = currentUser();
  return u?.email || "admin";
}

// Coleções cujo conteúdo aparece no site: mudar qualquer uma invalida o cache
// dos visitantes (ver services/cache.js).
const PUBLIC_ENTITIES = new Set(["packages", "packageLots", "galleryCategories", "galleryPhotos", "vipCampaigns", "availability", "appointments"]);

let bumpTimer = null;
/** Incrementa siteSettings.contentVersion (agrupa várias alterações seguidas). */
export function bumpContentVersion() {
  clearTimeout(bumpTimer);
  bumpTimer = setTimeout(() => {
    setDoc(doc(db, "siteSettings", "public"), { contentVersion: increment(1) }, { merge: true })
      .catch((e) => console.warn("contentVersion", e));
  }, 800);
}
