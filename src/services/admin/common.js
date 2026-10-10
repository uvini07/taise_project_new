import { Timestamp } from "firebase/firestore";
import { actorLabel } from "../auditService.js";

export const withId = (d) => ({ id: d.id, ...d.data() });
export const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);

/** Entrada de histórico (arrays do Firestore não aceitam serverTimestamp). */
export function historyEntry(action, extra = {}) {
  return { at: Timestamp.now(), by: actorLabel(), action, ...extra };
}

/** Remove undefined (o Firestore recusa) mantendo null. */
export function clean(obj) {
  return JSON.parse(JSON.stringify(obj, (k, v) => (v === undefined ? null : v)), (k, v) => v);
}

export function cleanShallow(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) out[k] = v === undefined ? null : v;
  return out;
}
