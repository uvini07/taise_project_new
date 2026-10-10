import { addDays, todayKey } from "./format.js";

export const PERIODS = [
  { id: "today", label: "Hoje" },
  { id: "7d", label: "7 dias" },
  { id: "30d", label: "30 dias" },
  { id: "month", label: "Mês atual" },
  { id: "custom", label: "Personalizado" },
];

/** Converte a escolha de período em { from, to } ("AAAA-MM-DD", inclusivos). */
export function resolvePeriod(id, custom = {}, now = new Date()) {
  const t = todayKey(now);
  switch (id) {
    case "today": return { from: t, to: t };
    case "7d": return { from: addDays(t, -6), to: t };
    case "30d": return { from: addDays(t, -29), to: t };
    case "month": return { from: `${t.slice(0, 7)}-01`, to: addDays(`${addDays(`${t.slice(0, 7)}-01`, 32).slice(0, 7)}-01`, -1) };
    case "custom": {
      const from = custom.from || t;
      const to = custom.to && custom.to >= from ? custom.to : from;
      return { from, to };
    }
    default: return { from: addDays(t, -29), to: t };
  }
}

export function eachDay(from, to, max = 400) {
  const out = [];
  for (let d = from, i = 0; d <= to && i < max; d = addDays(d, 1), i++) out.push(d);
  return out;
}
