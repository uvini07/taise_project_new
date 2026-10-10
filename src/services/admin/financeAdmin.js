import {
  addDoc, arrayUnion, collection, doc, getDocs, query, serverTimestamp, setDoc, Timestamp, updateDoc, where,
} from "firebase/firestore";
import { db } from "../firebase.js";
import { audit, actorLabel } from "../auditService.js";
import { withId } from "./common.js";
import { addDays } from "../../utils/format.js";

const col = () => collection(db, "financialTransactions");

/**
 * Lançamentos com vencimento até 1 ano antes/depois do período — cobre os
 * pagamentos recebidos no período de cobranças antigas e os valores vencidos.
 */
export async function listTransactions({ from, to }) {
  const s = await getDocs(query(col(), where("dueDate", ">=", addDays(from, -366)), where("dueDate", "<=", addDays(to, 366))));
  return s.docs.map(withId).filter((t) => !t.archived);
}

export async function saveTransaction(id, data) {
  const payload = {
    ...data,
    payments: data.payments || [],
    refunds: data.refunds || [],
    updatedAt: serverTimestamp(),
  };
  if (id) {
    await setDoc(doc(db, "financialTransactions", id), payload, { merge: true });
    audit("finance.update", "financialTransactions", id, { type: data.type, amountCents: data.amountCents });
    return id;
  }
  const ref = await addDoc(col(), { ...payload, status: data.status || "open", archived: false, createdAt: serverTimestamp(), createdBy: actorLabel() });
  audit("finance.create", "financialTransactions", ref.id, { type: data.type, amountCents: data.amountCents });
  return ref.id;
}

export async function addPayment(id, payment) {
  await updateDoc(doc(db, "financialTransactions", id), {
    payments: arrayUnion({ ...payment, recordedAt: Timestamp.now(), by: actorLabel() }),
    updatedAt: serverTimestamp(),
  });
  audit("finance.payment", "financialTransactions", id, { amountCents: payment.amountCents, date: payment.date });
}

export async function replacePayments(id, payments) {
  await updateDoc(doc(db, "financialTransactions", id), { payments, updatedAt: serverTimestamp() });
  audit("finance.payments.edit", "financialTransactions", id, { count: payments.length });
}

export async function addRefund(id, refund) {
  await updateDoc(doc(db, "financialTransactions", id), {
    refunds: arrayUnion({ ...refund, recordedAt: Timestamp.now(), by: actorLabel() }),
    updatedAt: serverTimestamp(),
  });
  audit("finance.refund", "financialTransactions", id, { amountCents: refund.amountCents });
}

export async function setTransactionStatus(id, status, note = "") {
  await updateDoc(doc(db, "financialTransactions", id), { status, statusNote: note, updatedAt: serverTimestamp() });
  audit("finance.status", "financialTransactions", id, { status });
}

/** Arquivamento lógico: some dos relatórios, mas continua no banco. */
export async function archiveTransaction(id) {
  await updateDoc(doc(db, "financialTransactions", id), { archived: true, archivedAt: serverTimestamp(), archivedBy: actorLabel() });
  audit("finance.archive", "financialTransactions", id);
}

/** Lança a receita de um agendamento (a reserva não vira pagamento sozinha). */
export async function createIncomeFromAppointment(a) {
  const existing = await getDocs(query(col(), where("appointmentId", "==", a.id)));
  if (existing.docs.some((d) => !d.data().archived)) throw new Error("Este agendamento já tem uma receita lançada no financeiro.");
  return saveTransaction(null, {
    type: "income",
    description: `${a.packageName || "Ensaio"} — ${a.name}`,
    category: "Ensaio",
    amountCents: a.priceCents || 0,
    dueDate: a.date,
    clientName: a.name,
    appointmentId: a.id,
    packageId: a.packageId || null,
    campaignId: a.vipCampaignId || null,
    method: "",
    notes: "",
  });
}
