import { useEffect, useState } from "react";

// Diferença entre o relógio do aparelho e o do servidor (cabeçalho Date da
// hospedagem). Assim o contador mostra o mesmo tempo em qualquer aparelho,
// mesmo com o relógio do celular adiantado ou atrasado.
let offsetPromise = null;
function loadOffset() {
  if (!offsetPromise) {
    offsetPromise = (async () => {
      try {
        const t0 = Date.now();
        const res = await fetch(`/favicon-32.png?t=${t0}`, { method: "HEAD", cache: "no-store" });
        const t1 = Date.now();
        const header = res.headers.get("date");
        if (!header) return 0;
        const server = new Date(header).getTime() + 500; // Date tem precisão de 1s
        const offset = server - (t0 + t1) / 2;
        return Math.abs(offset) > 5000 ? offset : 0;
      } catch {
        return 0;
      }
    })();
  }
  return offsetPromise;
}

/** Hora atual corrigida pelo servidor, atualizada a cada `intervalMs`. */
export function useServerNow(intervalMs = 1000) {
  const [offset, setOffset] = useState(0);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { loadOffset().then(setOffset); }, []);
  useEffect(() => {
    const tick = () => setNow(new Date(Date.now() + offset));
    tick();
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [offset, intervalMs]);
  return now;
}

export function remainingParts(target, now) {
  const ms = Math.max(0, (target?.getTime?.() ?? 0) - now.getTime());
  const s = Math.floor(ms / 1000);
  return { done: ms <= 0, days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60, ms };
}
