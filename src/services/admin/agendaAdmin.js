// Agenda (painel). Confirmar, cancelar, remarcar e encaixar são transações:
// relêem o agendamento, o lote e as travas de horário no momento da operação,
// então a disponibilidade é validada de novo na confirmação — não só quando a
// página carregou.
import {
  arrayUnion, collection, doc, getDoc, getDocs, orderBy, query, runTransaction, serverTimestamp,
  setDoc, Timestamp, updateDoc, where, writeBatch,
} from "firebase/firestore";
import { db } from "../firebase.js";
import { audit } from "../auditService.js";
import { historyEntry, withId } from "./common.js";
import { COUNTED_STATUSES, HOLDING_STATUSES, APPOINTMENT_STATUS } from "../../config/constants.js";
import { dayInfo, generateSlots, lockId, parseLockId, withAvailabilityDefaults } from "../../utils/slots.js";
import { dayTimeToDate, minutesToTime, timeToMinutes } from "../../utils/format.js";
import { countConfirmedByLot } from "../../utils/lots.js";

const apptCol = () => collection(db, "appointments");

export async function saveAvailability(cfg) {
  await setDoc(doc(db, "availability", "config"), { ...cfg, updatedAt: serverTimestamp() });
  audit("availability.update", "availability", "config");
}

export async function listAppointments({ from, to }) {
  const s = await getDocs(query(apptCol(), where("date", ">=", from), where("date", "<=", to), orderBy("date", "asc")));
  return s.docs.map(withId).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

export async function listOpenRequests() {
  const s = await getDocs(query(apptCol(), where("status", "in", ["requested", "awaiting"])));
  return s.docs.map(withId).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

export async function getAppointment(id) {
  const s = await getDoc(doc(db, "appointments", id));
  return s.exists() ? withId(s) : null;
}

export class ScheduleWarning extends Error {
  constructor(message) { super(message); this.code = "schedule-warning"; }
}
export class ConflictError extends Error {
  constructor(message) { super(message); this.code = "conflict"; }
}

/** Confere se o horário ainda está dentro das regras atuais da agenda. */
function scheduleProblem(cfg, a) {
  const info = dayInfo(cfg, a.date, { packageId: a.packageId });
  if (!info.open) return `A data ${a.date} está indisponível na agenda atual (${info.reason}).`;
  const start = timeToMinutes(a.time);
  if (start < timeToMinutes(info.start) || start + (a.durationMin || 0) > timeToMinutes(info.end)) {
    return `O horário ${a.time} está fora do expediente configurado (${info.start}–${info.end}).`;
  }
  return null;
}

/**
 * Muda o status de um agendamento.
 * - Para "confirmado": revalida vagas do lote, regras da agenda e as travas.
 * - Ao cancelar: libera o horário e devolve a vaga do lote.
 * opts.force: confirma mesmo com aviso de agenda/lote (decisão da fotógrafa).
 */
export async function changeAppointmentStatus(id, to, { note = "", force = false } = {}) {
  if (!APPOINTMENT_STATUS[to]) throw new Error("Status inválido.");
  const cfg = to === "confirmed" ? withAvailabilityDefaults((await getDoc(doc(db, "availability", "config"))).data()) : null;
  const apptRef = doc(db, "appointments", id);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(apptRef);
    if (!snap.exists()) throw new Error("Agendamento não encontrado.");
    const a = snap.data();
    const from = a.status;
    if (from === to) return;

    const lotRef = a.lotId ? doc(db, "packageLots", a.lotId) : null;
    const lotSnap = lotRef ? await tx.get(lotRef) : null;
    const lockRefs = (a.slotLockIds || []).map((x) => doc(db, "slotLocks", x));
    const lockSnaps = await Promise.all(lockRefs.map((r) => tx.get(r)));

    const wasCounted = COUNTED_STATUSES.includes(from);
    const willCount = COUNTED_STATUSES.includes(to);
    const wasHolding = HOLDING_STATUSES.includes(from);
    const willHold = HOLDING_STATUSES.includes(to);

    if (!wasCounted && willCount && lotSnap?.exists()) {
      const lot = lotSnap.data();
      if (lot.capacity != null && (lot.confirmedCount || 0) >= lot.capacity && !force) {
        throw new ScheduleWarning(`O ${lot.name} já está com todas as ${lot.capacity} vagas confirmadas.`);
      }
    }
    if (to === "confirmed" && !force) {
      const problem = scheduleProblem(cfg, a);
      if (problem) throw new ScheduleWarning(problem);
    }

    if (willHold) {
      lockSnaps.forEach((s, i) => {
        if (s.exists() && s.data().appointmentId !== id) {
          if (!force) throw new ConflictError(`O horário ${a.date} ${a.time} está ocupado por outro agendamento.`);
        } else if (!s.exists()) {
          tx.set(lockRefs[i], { appointmentId: id, date: a.date, createdAt: serverTimestamp() });
        }
      });
    } else if (wasHolding) {
      lockSnaps.forEach((s, i) => { if (s.exists() && s.data().appointmentId === id) tx.delete(lockRefs[i]); });
    }

    if (lotSnap?.exists() && wasCounted !== willCount) {
      const cur = lotSnap.data().confirmedCount || 0;
      tx.update(lotRef, { confirmedCount: Math.max(0, cur + (willCount ? 1 : -1)) });
    }

    tx.update(apptRef, {
      status: to,
      updatedAt: serverTimestamp(),
      history: arrayUnion(historyEntry("status", { from, to, note: note || "", forced: !!force })),
    });
  });
  audit("appointment.status", "appointments", id, { to, force });
}

export async function addAppointmentNote(id, note) {
  await updateDoc(doc(db, "appointments", id), {
    updatedAt: serverTimestamp(),
    history: arrayUnion(historyEntry("note", { note })),
  });
}

export async function updateAppointmentDetails(id, patch) {
  const allowed = ["name", "phone", "email", "notes", "priceCents"];
  const data = Object.fromEntries(Object.entries(patch).filter(([k]) => allowed.includes(k)));
  await updateDoc(doc(db, "appointments", id), {
    ...data,
    updatedAt: serverTimestamp(),
    history: arrayUnion(historyEntry("edit", { fields: Object.keys(data) })),
  });
  audit("appointment.edit", "appointments", id, { fields: Object.keys(data) });
}

/** Travas para um horário escolhido livremente no painel (encaixe). */
function manualLockCandidates(cfg, date, time, durationMin) {
  const c = withAvailabilityDefaults(cfg);
  const session = Math.max(5, Number(c.sessionMinutes) || 60);
  const buffer = Math.max(0, Number(c.bufferMinutes) || 0);
  const step = session + buffer;
  const cells = Math.min(3, Math.max(1, Math.ceil((durationMin + buffer) / step)));
  const capacity = Math.max(1, Math.min(20, Number(c.capacityPerSlot) || 1));
  const start = timeToMinutes(time);
  return Array.from({ length: cells }, (_, i) => {
    const t = minutesToTime(start + i * step);
    return Array.from({ length: capacity }, (__, k) => lockId(date, t, k));
  });
}

async function acquireLocks(tx, cfg, date, time, durationMin, apptId) {
  const candidates = manualLockCandidates(cfg, date, time, durationMin);
  const chosen = [];
  for (const cell of candidates) {
    const snaps = await Promise.all(cell.map((x) => tx.get(doc(db, "slotLocks", x))));
    const free = snaps.find((s) => !s.exists() || s.data().appointmentId === apptId);
    if (!free) throw new ConflictError(`O horário ${date} ${parseLockId(cell[0]).time} já está ocupado.`);
    chosen.push(free.id);
  }
  return chosen;
}

/** Remarca: libera as travas antigas e ocupa as novas na mesma transação. */
export async function rescheduleAppointment(id, { date, time }, { note = "" } = {}) {
  const cfg = (await getDoc(doc(db, "availability", "config"))).data();
  const apptRef = doc(db, "appointments", id);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(apptRef);
    if (!snap.exists()) throw new Error("Agendamento não encontrado.");
    const a = snap.data();
    const oldLocks = a.slotLockIds || [];
    const oldSnaps = await Promise.all(oldLocks.map((x) => tx.get(doc(db, "slotLocks", x))));
    const newLocks = await acquireLocks(tx, cfg, date, time, a.durationMin || 60, id);
    oldSnaps.forEach((s) => {
      if (s.exists() && s.data().appointmentId === id && !newLocks.includes(s.id)) tx.delete(s.ref);
    });
    if (HOLDING_STATUSES.includes(a.status)) {
      newLocks.forEach((x) => { if (!oldLocks.includes(x)) tx.set(doc(db, "slotLocks", x), { appointmentId: id, date, createdAt: serverTimestamp() }); });
    }
    tx.update(apptRef, {
      date, time,
      startAt: Timestamp.fromDate(dayTimeToDate(date, time)),
      slotLockIds: newLocks,
      updatedAt: serverTimestamp(),
      history: arrayUnion(historyEntry("reschedule", { from: `${a.date} ${a.time}`, to: `${date} ${time}`, note })),
    });
  });
  audit("appointment.reschedule", "appointments", id, { date, time });
}

/** Agendamento lançado pela fotógrafa (telefone, Instagram, presencial...). */
export async function createManualAppointment(input) {
  const cfg = (await getDoc(doc(db, "availability", "config"))).data();
  const ref = doc(apptCol());
  await runTransaction(db, async (tx) => {
    const lotRef = input.lotId ? doc(db, "packageLots", input.lotId) : null;
    const lotSnap = lotRef ? await tx.get(lotRef) : null;
    const locks = await acquireLocks(tx, cfg, input.date, input.time, input.durationMin || 60, ref.id);
    const counted = COUNTED_STATUSES.includes(input.status);
    if (counted && lotSnap?.exists()) {
      const lot = lotSnap.data();
      if (lot.capacity != null && (lot.confirmedCount || 0) >= lot.capacity && !input.force) {
        throw new ScheduleWarning(`O ${lot.name} já está com todas as vagas confirmadas.`);
      }
      tx.update(lotRef, { confirmedCount: (lot.confirmedCount || 0) + 1 });
    }
    locks.forEach((x) => tx.set(doc(db, "slotLocks", x), { appointmentId: ref.id, date: input.date, createdAt: serverTimestamp() }));
    tx.set(ref, {
      name: input.name,
      phone: input.phone,
      email: input.email || null,
      notes: input.notes || null,
      packageId: input.packageId || null,
      packageName: input.packageName || "",
      lotId: input.lotId || null,
      lotName: input.lotName || "",
      priceCents: input.priceCents ?? null,
      date: input.date,
      time: input.time,
      startAt: Timestamp.fromDate(dayTimeToDate(input.date, input.time)),
      durationMin: input.durationMin || 60,
      slotLockIds: locks,
      status: input.status,
      source: "admin",
      consent: true,
      createdAt: serverTimestamp(),
      history: [historyEntry("create", { to: input.status })],
    });
  });
  audit("appointment.create", "appointments", ref.id, { date: input.date, time: input.time });
  return ref.id;
}

/** Horários livres de um dia para remarcar (mesma regra do site, sem antecedência). */
export function freeSlotsForAdmin(cfg, date, taken, durationMin) {
  const relaxed = { ...cfg, minAdvanceHours: 0, maxAdvanceDays: 0, bookingEnabled: true, openFrom: null, openUntil: null };
  return generateSlots(relaxed, date, { taken, durationMin });
}

/**
 * Recalcula o contador de confirmados de todos os lotes a partir dos
 * agendamentos (corrige qualquer divergência).
 */
export async function recountLotCounters() {
  const [appts, lots] = await Promise.all([getDocs(apptCol()), getDocs(collection(db, "packageLots"))]);
  const counts = countConfirmedByLot(appts.docs.map((d) => d.data()));
  const batch = writeBatch(db);
  let changed = 0;
  lots.docs.forEach((d) => {
    const c = counts[d.id] || 0;
    if ((d.data().confirmedCount || 0) !== c) { batch.update(d.ref, { confirmedCount: c }); changed++; }
  });
  if (changed) await batch.commit();
  audit("lots.recount", "packageLots", "", { changed });
  return changed;
}
