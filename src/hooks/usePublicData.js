import { useAsync } from "./useAsync.js";
import { listPublicPackages } from "../services/packageService.js";
import { listFeaturedPhotos, listVisibleCategories } from "../services/galleryService.js";

// Cache simples por visita: navegar entre páginas não refaz as mesmas leituras.
const cache = new Map();
function cached(key, fn) {
  if (!cache.has(key)) cache.set(key, fn().catch((e) => { cache.delete(key); throw e; }));
  return cache.get(key);
}

export const usePublicPackages = () => useAsync(() => cached("packages", listPublicPackages), []);
export const useCategories = () => useAsync(() => cached("categories", listVisibleCategories), []);
export const useFeaturedPhotos = (n = 12) => useAsync(() => cached(`featured-${n}`, () => listFeaturedPhotos(n)), [n]);
