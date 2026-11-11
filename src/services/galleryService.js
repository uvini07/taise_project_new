import { getDocs, query, where } from "firebase/firestore";
import { cached } from "./cache.js";
import { sCol } from "./studioDb.js";

const withId = (d) => ({ id: d.id, ...d.data() });
const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);

export async function listVisibleCategories() {
  const snap = await getDocs(query(sCol("galleryCategories"), where("visible", "==", true)));
  return snap.docs.map(withId).sort(byOrder);
}

// As buscas abaixo usam só filtros de igualdade, que o Firestore atende sem
// índice composto (nada para publicar no console a cada estúdio novo). A
// ordem escolhida no painel ("order") é aplicada aqui, no navegador.

/** Todas as fotos publicadas (de uma categoria ou todas), já em ordem. Fica na memória durante a visita. */
function allPublished(categoryId) {
  return cached(`photos-all-${categoryId || "todas"}`, async () => {
    const parts = [sCol("galleryPhotos"), where("published", "==", true)];
    if (categoryId) parts.push(where("categoryId", "==", categoryId));
    const snap = await getDocs(query(...parts));
    return snap.docs.map(withId).sort(byOrder);
  }, { persist: false });
}

/**
 * Fotos publicadas, paginadas (a tela mostra aos poucos).
 * Retorna { items, cursor } — passe o cursor para buscar a próxima página.
 */
export async function listPublishedPhotos({ categoryId = null, pageSize = 24, cursor = null } = {}) {
  const all = await allPublished(categoryId);
  const start = typeof cursor === "number" ? cursor : 0;
  const items = all.slice(start, start + pageSize);
  return { items, cursor: start + pageSize < all.length ? start + pageSize : null };
}

export async function listFeaturedPhotos(max = 12) {
  const snap = await getDocs(query(sCol("galleryPhotos"), where("published", "==", true), where("featured", "==", true)));
  return snap.docs.map(withId).sort(byOrder).slice(0, max);
}
