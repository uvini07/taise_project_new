import {
  collection, getDocs, limit, orderBy, query, startAfter, where,
} from "firebase/firestore";
import { db } from "./firebase.js";

const withId = (d) => ({ id: d.id, ...d.data() });
const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);

export async function listVisibleCategories() {
  const snap = await getDocs(query(collection(db, "galleryCategories"), where("visible", "==", true)));
  return snap.docs.map(withId).sort(byOrder);
}

/**
 * Fotos publicadas, paginadas (a galeria não baixa tudo de uma vez).
 * Retorna { items, cursor } — passe o cursor para buscar a próxima página.
 */
export async function listPublishedPhotos({ categoryId = null, pageSize = 24, cursor = null } = {}) {
  const parts = [collection(db, "galleryPhotos"), where("published", "==", true)];
  if (categoryId) parts.push(where("categoryId", "==", categoryId));
  parts.push(orderBy("order", "asc"), limit(pageSize));
  if (cursor) parts.push(startAfter(cursor));
  const snap = await getDocs(query(...parts));
  return {
    items: snap.docs.map(withId),
    cursor: snap.docs.length === pageSize ? snap.docs[snap.docs.length - 1] : null,
  };
}

export async function listFeaturedPhotos(max = 12) {
  const snap = await getDocs(query(collection(db, "galleryPhotos"),
    where("published", "==", true), where("featured", "==", true), orderBy("order", "asc"), limit(max)));
  return snap.docs.map(withId);
}
