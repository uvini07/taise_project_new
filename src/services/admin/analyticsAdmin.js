import {
  collection, documentId, getCountFromServer, getDocs, query, Timestamp, where,
} from "firebase/firestore";
import { db } from "../firebase.js";
import { dayTimeToDate, addDays } from "../../utils/format.js";

/** Contadores diários do período: { 'AAAA-MM-DD': { pv, visit, ... } }. */
export async function loadDailyCounters(from, to) {
  const s = await getDocs(query(collection(db, "analyticsDaily"), where(documentId(), ">=", from), where(documentId(), "<=", to)));
  const out = {};
  s.docs.forEach((d) => { const { _k, ...rest } = d.data(); out[d.id] = rest; });
  return out;
}

/** Totais REAIS do banco no período (não dependem do rastreamento). */
export async function countRecords(from, to) {
  const start = Timestamp.fromDate(dayTimeToDate(from, "00:00"));
  const end = Timestamp.fromDate(dayTimeToDate(addDays(to, 1), "00:00"));
  const range = (name) => query(collection(db, name), where("createdAt", ">=", start), where("createdAt", "<", end));
  const [appts, vips] = await Promise.all([
    getCountFromServer(range("appointments")),
    getCountFromServer(range("vipRegistrations")),
  ]);
  return { appointments: appts.data().count, vipRegistrations: vips.data().count };
}

/** Soma os contadores do período e separa por prefixo. */
export function aggregateCounters(daily) {
  const totals = {};
  const groups = { pkg: {}, gcat: {}, page: {}, src: {}, camp: {} };
  for (const counters of Object.values(daily)) {
    for (const [k, v] of Object.entries(counters)) {
      const n = Number(v) || 0;
      const m = k.match(/^(pkg|gcat|page|src|camp)__(.+)$/);
      if (m) groups[m[1]][m[2]] = (groups[m[1]][m[2]] || 0) + n;
      else totals[k] = (totals[k] || 0) + n;
    }
  }
  return { totals, groups };
}
