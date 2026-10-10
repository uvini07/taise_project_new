import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase.js";
import { currentUser } from "./authService.js";

/** Registra uma operação administrativa relevante (falha silenciosa). */
export async function audit(action, entity, entityId, details = {}) {
  const u = currentUser();
  if (!u) return;
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
