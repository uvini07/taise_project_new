// Agenda — lado público: regras de disponibilidade, horários ocupados e o
// pedido de agendamento. A garantia contra dois pedidos no mesmo horário é a
// trava (slotLocks/{data_HHMM_vaga}): ela é criada junto com o pedido no mesmo
// lote de escrita e as regras do Firestore só permitem criá-la se ainda não
// existir. Se outra pessoa reservou antes, o lote inteiro é recusado.
import {
  Timestamp, collection, doc, getDoc, getDocs, query, serverTimestamp, where, writeBatch,
} from "firebase/firestore";
import { db } from "./firebase.js";
import { withAvailabilityDefaults } from "../utils/slots.js";

export async function getAvailability() {
  const snap = await getDoc(doc(db, "availability", "config"));
  return withAvailabilityDefaults(snap.exists() ? snap.data() : null);
}

/** Travas ocupadas entre duas datas: { taken:Set<lockId>, owners:Map<lockId, apptId> }. */
export async function fetchTakenLocks(fromDay, toDay) {
  const snap = await getDocs(query(collection(db, "slotLocks"),
    where("date", ">=", fromDay), where("date", "<=", toDay)));
  const taken = new Set();
  const owners = new Map();
  snap.docs.forEach((d) => { taken.add(d.id); owners.set(d.id, d.data().appointmentId); });
  return { taken, owners };
}

export class SlotTakenError extends Error {
  constructor() {
    super("Esse horário acabou de ser reservado por outra pessoa. Escolha outro, por favor.");
    this.code = "slot-taken";
  }
}

/**
 * Envia o pedido de agendamento.
 * input: { pkg, lot, slot:{date,time,startAt,lockIds}, durationMin, name, phone, email, notes, vip }
 */
export async function createBookingRequest(input) {
  const { pkg, lot, slot, durationMin, name, phone, email, notes, vip } = input;
  const apptRef = doc(collection(db, "appointments"));
  const batch = writeBatch(db);

  const data = {
    name, phone,
    email: email || null,
    notes: notes || null,
    packageId: pkg.id,
    packageName: pkg.name,
    lotId: lot.id,
    lotName: lot.name,
    priceCents: vip?.priceCents ?? lot.priceCents,
    date: slot.date,
    time: slot.time,
    startAt: Timestamp.fromDate(slot.startAt),
    durationMin,
    slotLockIds: slot.lockIds,
    status: "requested",
    source: "site",
    consent: true,
    createdAt: serverTimestamp(),
    history: [],
  };
  if (vip) {
    data.vipCampaignId = vip.campaignId;
    data.vipKey = `${vip.campaignId}_${phone}`;
  }

  batch.set(apptRef, data);
  for (const id of slot.lockIds) {
    batch.set(doc(db, "slotLocks", id), { appointmentId: apptRef.id, date: slot.date, createdAt: serverTimestamp() });
  }
  try {
    await batch.commit();
  } catch (e) {
    if (e?.code === "permission-denied") {
      // Ou o horário foi ocupado, ou o lote/pacote mudou entre o carregamento e o envio.
      const still = await Promise.all(slot.lockIds.map((id) => getDoc(doc(db, "slotLocks", id))));
      if (still.some((s) => s.exists())) throw new SlotTakenError();
      const err = new Error("Não foi possível enviar: a disponibilidade deste pacote mudou. Atualize a página e tente de novo.");
      err.code = "unavailable";
      throw err;
    }
    throw e;
  }
  return { id: apptRef.id, code: apptRef.id.slice(0, 6).toUpperCase(), ...data };
}
