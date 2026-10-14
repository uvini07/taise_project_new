import { useEffect, useState } from "react";
import { getCampaignStats, listPublicCampaigns } from "../services/vipService.js";
import { cached } from "../services/cache.js";

// Campanhas públicas carregadas uma vez por visita (compartilhadas entre o
// banner, o menu e a página VIP).
let cache = null;
export function loadCampaigns(force = false) {
  if (!cache || force) {
    // Campanhas: cache por versão; contagem de inscritos: cache de 10 min.
    cache = (force ? listPublicCampaigns() : cached("campaigns", listPublicCampaigns))
      .then(async (list) => {
        const counts = await Promise.all(list.map((c) => (force
          ? getCampaignStats(c.id)
          : cached(`campaign-count-${c.id}`, () => getCampaignStats(c.id), { ttl: 10 * 60 * 1000 })).catch(() => 0)));
        return list.map((c, i) => ({ ...c, count: counts[i] }));
      })
      .catch((e) => { cache = null; throw e; });
  }
  return cache;
}

export function useCampaigns() {
  const [state, setState] = useState({ campaigns: [], loading: true, error: null });
  useEffect(() => {
    let alive = true;
    loadCampaigns()
      .then((campaigns) => alive && setState({ campaigns, loading: false, error: null }))
      .catch((error) => alive && setState({ campaigns: [], loading: false, error }));
    return () => { alive = false; };
  }, []);
  return state;
}
