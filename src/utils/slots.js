// Geração de horários a partir das regras de disponibilidade. Funções puras:
// recebem a configuração e as travas já ocupadas e devolvem os horários — o
// mesmo cálculo serve para o site público e para revalidar no painel.
import {
  addDays, dayTimeToDate, minutesToTime, timeToMinutes, toDayKey, weekday,
} from "./format.js";

export const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export const DEFAULT_AVAILABILITY = {
  bookingEnabled: true,
  showPublicAgenda: true,
  weekly: {
    0: { enabled: false, start: "09:00", end: "18:00" },
    1: { enabled: false, start: "09:00", end: "18:00" },
    2: { enabled: true, start: "09:00", end: "18:00" },
    3: { enabled: true, start: "09:00", end: "18:00" },
    4: { enabled: true, start: "09:00", end: "18:00" },
    5: { enabled: true, start: "09:00", end: "18:00" },
    6: { enabled: true, start: "09:00", end: "14:00" },
  },
  sessionMinutes: 60,
  bufferMinutes: 15,
  capacityPerSlot: 1,
  maxPerDay: null,
  minAdvanceHours: 24,
  maxAdvanceDays: 90,
  openFrom: null,
  openUntil: null,
  blockedDates: [],
  blockedRanges: [],
  blockedSlots: [], // [{ date, start, end, reason }] horários fechados num dia
  specialDates: [],
  location: "",
  publicNote: "",
};

export function withAvailabilityDefaults(cfg) {
  const c = { ...DEFAULT_AVAILABILITY, ...(cfg || {}) };
  c.weekly = { ...DEFAULT_AVAILABILITY.weekly, ...(cfg?.weekly || {}) };
  return c;
}

export function lockId(dayKey, time, k) {
  return `${dayKey}_${time.replace(":", "")}_${k}`;
}

export function parseLockId(id) {
  const [date, hhmm, k] = String(id).split("_");
  return { date, time: `${hhmm.slice(0, 2)}:${hhmm.slice(2)}`, k: Number(k) };
}

/**
 * Situação de um dia: aberto ou não, e em qual horário.
 * opts.packageId: datas especiais podem ser exclusivas de alguns pacotes.
 * opts.window: { start, end } período em que o pacote pode ser realizado.
 */
export function dayInfo(rawCfg, dayKey, opts = {}) {
  const cfg = withAvailabilityDefaults(rawCfg);
  const now = opts.now || new Date();
  const today = toDayKey(now);
  const closed = (reason) => ({ open: false, reason });

  if (!cfg.bookingEnabled) return closed("Agenda fechada no momento");
  if (dayKey < today) return closed("Data passada");
  if (cfg.maxAdvanceDays && dayKey > addDays(today, cfg.maxAdvanceDays)) return closed("Fora do período de agendamento");
  if (cfg.openFrom && dayKey < cfg.openFrom) return closed("Agenda ainda não aberta para esta data");
  if (cfg.openUntil && dayKey > cfg.openUntil) return closed("Fora do período de agendamento");
  if (opts.window?.start && dayKey < opts.window.start) return closed("Fora do período deste pacote");
  if (opts.window?.end && dayKey > opts.window.end) return closed("Fora do período deste pacote");

  const blocked = (cfg.blockedDates || []).find((b) => b.date === dayKey);
  if (blocked) return closed(blocked.reason || "Data indisponível");
  const range = (cfg.blockedRanges || []).find((r) => r.start <= dayKey && dayKey <= r.end);
  if (range) return closed(range.reason || "Período indisponível");

  const special = (cfg.specialDates || []).find((s) => s.date === dayKey);
  if (special) {
    const only = special.packageIds || [];
    if (only.length && opts.packageId && !only.includes(opts.packageId)) {
      return closed(`Data reservada para ${special.label || "evento"}`);
    }
    return { open: true, start: special.start, end: special.end, label: special.label || "", special: true };
  }

  const w = cfg.weekly[weekday(dayKey)] || cfg.weekly[String(weekday(dayKey))];
  if (!w || !w.enabled) return closed("Sem atendimento neste dia");
  return { open: true, start: w.start, end: w.end, label: "" };
}

/**
 * Horários de um dia.
 * opts.durationMin: duração do ensaio (padrão: duração da sessão configurada).
 * opts.taken: Set com os ids das travas já ocupadas.
 * Retorna [{ time, available, lockIds, reason }].
 */
export function generateSlots(rawCfg, dayKey, opts = {}) {
  const cfg = withAvailabilityDefaults(rawCfg);
  const info = dayInfo(cfg, dayKey, opts);
  if (!info.open) return [];
  const now = opts.now || new Date();
  const taken = opts.taken || new Set();
  const session = Math.max(5, Number(cfg.sessionMinutes) || 60);
  const buffer = Math.max(0, Number(cfg.bufferMinutes) || 0);
  const step = session + buffer;
  const duration = Math.max(1, Number(opts.durationMin) || session);
  // Quantas "células" da grade o ensaio ocupa (no máximo 3), contando o intervalo depois dele.
  const cellsNeeded = Math.min(3, Math.max(1, Math.ceil((duration + buffer) / step)));
  const capacity = Math.max(1, Math.min(20, Number(cfg.capacityPerSlot) || 1));
  const earliest = now.getTime() + (Number(cfg.minAdvanceHours) || 0) * 3600000;
  const start = timeToMinutes(info.start);
  const end = timeToMinutes(info.end);

  const dayFull = cfg.maxPerDay
    ? countAppointmentsOnDay(taken, dayKey, opts.lockOwners) >= cfg.maxPerDay
    : false;

  const out = [];
  for (let t = start; t + duration <= end; t += step) {
    const time = minutesToTime(t);
    const startAt = dayTimeToDate(dayKey, time);
    let reason = null;
    const blockedSlot = (cfg.blockedSlots || []).find((b) => b.date === dayKey && b.start && b.end
      && t < timeToMinutes(b.end) && t + duration > timeToMinutes(b.start));
    if (blockedSlot) reason = blockedSlot.reason || "Horário bloqueado";
    else if (startAt.getTime() < earliest) reason = "Antecedência mínima";
    else if (dayFull) reason = "Dia lotado";

    const lockIds = [];
    if (!reason) {
      for (let c = 0; c < cellsNeeded; c++) {
        const cellTime = minutesToTime(t + c * step);
        let free = null;
        for (let k = 0; k < capacity; k++) {
          const id = lockId(dayKey, cellTime, k);
          if (!taken.has(id)) { free = id; break; }
        }
        if (!free) { reason = "Ocupado"; break; }
        lockIds.push(free);
      }
    }
    out.push({ time, startAt, available: !reason, lockIds: reason ? [] : lockIds, reason });
  }
  return out;
}

function countAppointmentsOnDay(taken, dayKey, owners) {
  if (owners) {
    const ids = new Set();
    for (const [lock, appt] of owners) if (lock.startsWith(dayKey)) ids.add(appt);
    return ids.size;
  }
  let n = 0;
  for (const id of taken) if (id.startsWith(dayKey) && id.endsWith("_0")) n++;
  return n;
}

/** Lista de dias (AAAA-MM-DD) de um mês, com a situação de cada um. */
export function monthDays(rawCfg, monthKey, opts = {}) {
  const first = `${monthKey}-01`;
  const out = [];
  for (let d = first; d.startsWith(monthKey); d = addDays(d, 1)) {
    const info = dayInfo(rawCfg, d, opts);
    let free = 0;
    if (info.open && opts.taken) free = generateSlots(rawCfg, d, opts).filter((s) => s.available).length;
    out.push({ day: d, ...info, free });
  }
  return out;
}
