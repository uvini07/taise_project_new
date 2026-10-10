// Formatação e datas. Todas as datas de agenda são tratadas no fuso do
// estúdio (Brasília), independentemente do fuso do aparelho do visitante.

export const BUSINESS_TZ = "America/Sao_Paulo";
export const BUSINESS_UTC_OFFSET = "-03:00";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** 12345 -> "R$ 123,45". Valores em centavos evitam erros de arredondamento. */
export function formatBRL(cents) {
  if (cents == null || Number.isNaN(Number(cents))) return "—";
  return brl.format(Number(cents) / 100);
}

/** "1.234,56" | "1234.56" | "R$ 99" -> centavos (int) ou null se inválido. */
export function parseBRLToCents(input) {
  if (input == null) return null;
  if (typeof input === "number") return Number.isFinite(input) ? Math.round(input * 100) : null;
  let s = String(input).replace(/[^\d,.-]/g, "").trim();
  if (!s) return null;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
}

/** Valor em centavos -> texto para campo de formulário ("1234,50"). */
export function centsToInput(cents) {
  if (cents == null) return "";
  return (Number(cents) / 100).toFixed(2).replace(".", ",");
}

const pad = (n) => String(n).padStart(2, "0");

/** Data (Date) -> "AAAA-MM-DD" no fuso do estúdio. */
export function toDayKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TZ, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const get = (t) => parts.find((p) => p.type === t).value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Minutos desde a meia-noite no fuso do estúdio. */
export function minutesOfDay(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: BUSINESS_TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const h = Number(parts.find((p) => p.type === "hour").value);
  const m = Number(parts.find((p) => p.type === "minute").value);
  return h * 60 + m;
}

export function todayKey(now = new Date()) {
  return toDayKey(now);
}

/** "AAAA-MM-DD" + "HH:MM" -> Date absoluto (fuso do estúdio). */
export function dayTimeToDate(dayKey, time = "00:00") {
  return new Date(`${dayKey}T${time}:00${BUSINESS_UTC_OFFSET}`);
}

export function addDays(dayKey, n) {
  const d = new Date(`${dayKey}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function diffDays(a, b) {
  return Math.round((new Date(`${b}T12:00:00Z`) - new Date(`${a}T12:00:00Z`)) / 86400000);
}

/** Dia da semana (0 = domingo) de uma data "AAAA-MM-DD". */
export function weekday(dayKey) {
  return new Date(`${dayKey}T12:00:00Z`).getUTCDay();
}

export function timeToMinutes(t) {
  const [h, m] = String(t).split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(min) {
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
}

export function formatDayBR(dayKey) {
  if (!dayKey) return "—";
  const [y, m, d] = dayKey.split("-");
  return `${d}/${m}/${y}`;
}

const longFmt = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
export function formatDayLong(dayKey) {
  if (!dayKey) return "";
  const s = longFmt.format(new Date(`${dayKey}T12:00:00Z`));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const monthFmt = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
export function formatMonth(dayKey) {
  const s = monthFmt.format(new Date(`${dayKey}T12:00:00Z`));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Timestamp do Firestore | Date | string -> Date (ou null). */
export function toDate(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v.toDate === "function") return v.toDate();
  if (typeof v.seconds === "number") return new Date(v.seconds * 1000);
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

const dtFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: BUSINESS_TZ,
});
export function formatDateTime(v) {
  const d = toDate(v);
  return d ? dtFmt.format(d) : "—";
}

/** Date -> valor para <input type="datetime-local"> no fuso do estúdio. */
export function toDateTimeInput(v) {
  const d = toDate(v);
  if (!d) return "";
  return `${toDayKey(d)}T${minutesToTime(minutesOfDay(d))}`;
}

/** Valor de <input type="datetime-local"> -> Date (fuso do estúdio). */
export function fromDateTimeInput(s) {
  if (!s) return null;
  const [day, time] = s.split("T");
  return dayTimeToDate(day, time || "00:00");
}

export function plural(n, one, many) {
  return `${n} ${n === 1 ? one : many}`;
}
