import { useAsync } from "./useAsync.js";
import { listPublicPackages } from "../services/packageService.js";
import { listFeaturedPhotos, listVisibleCategories } from "../services/galleryService.js";
import { cached, getContentVersion } from "../services/cache.js";
import { useSettings } from "../contexts/SettingsContext.jsx";

// Leituras públicas com cache por versão de conteúdo (ver services/cache.js).
function useCached(name, fn) {
  const { settings, loading } = useSettings();
  const v = settings.contentVersion ?? "0";
  return useAsync(() => (loading ? new Promise(() => {}) : cached(name, fn)), [v, loading, name]);
}

export const usePublicPackages = () => useCached("packages", listPublicPackages);
export const useCategories = () => useCached("categories", listVisibleCategories);
export const useFeaturedPhotos = (n = 12) => useCached(`featured-${n}`, () => listFeaturedPhotos(n));
export { getContentVersion };
