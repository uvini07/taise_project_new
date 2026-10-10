import {
  collection, doc, getDoc, getDocs, query, runTransaction, serverTimestamp, where,
} from "firebase/firestore";
import { db } from "./firebase.js";
import { toDate } from "../utils/format.js";

const withId = (d) => ({ id: d.id, ...d.data() });

/** Campanhas publicadas (e encerradas, para exibir a mensagem de fim). */
export async function listPublicCampaigns() {
  const snap = await getDocs(query(collection(db, "vipCampaigns"), where("status", "in", ["published", "closed"])));
  return snap.docs.map(withId);
}

export async function getCampaignStats(campaignId) {
  const s = await getDoc(doc(db, "vipCampaignStats", campaignId));
  return s.exists() ? s.data().count || 0 : 0;
}

/**
 * Situação da campanha num instante.
 *  phase:
 *   - "upcoming":           inscrições ainda não abriram
 *   - "open":               inscrições abertas
 *   - "full":               limite de inscritos atingido
 *   - "registrationClosed": inscrições encerradas, campanha ainda em andamento
 *   - "ended":              contador chegou ao fim (aplica a ação configurada)
 *  vipAccess: true durante a janela de acesso antecipado VIP.
 * O contador usa sempre a data final gravada (countdownEndsAt): é o mesmo em
 * qualquer aparelho e não reinicia ao recarregar a página.
 */
export function campaignPhase(c, now = new Date(), count = 0) {
  if (!c) return { phase: "ended" };
  const regStart = toDate(c.registrationStart);
  const regEnd = toDate(c.registrationEnd);
  const countdownEnd = toDate(c.countdownEndsAt);
  const accessStart = toDate(c.vipAccessStartsAt);
  let phase;
  if (c.status === "closed" || (countdownEnd && countdownEnd < now)) phase = "ended";
  else if (regStart && regStart > now) phase = "upcoming";
  else if (regEnd && regEnd < now) phase = "registrationClosed";
  else if (c.maxRegistrations && count >= c.maxRegistrations) phase = "full";
  else phase = "open";
  const vipAccess = phase !== "ended" && c.status === "published"
    && !!accessStart && accessStart <= now && !!countdownEnd;
  return { phase, vipAccess, countdownEnd, regEnd, regStart, accessStart };
}

export class DuplicateRegistrationError extends Error {
  constructor() { super("Este WhatsApp já está inscrito nesta campanha."); this.code = "duplicate"; }
}
export class CampaignFullError extends Error {
  constructor() { super("As vagas da lista VIP se esgotaram."); this.code = "full"; }
}

/**
 * Inscrição VIP. Numa transação: verifica duplicidade (vipMembers), respeita
 * o limite de inscritos e incrementa o contador público — as regras do
 * Firestore conferem que os três documentos andam juntos.
 */
export async function registerVip(campaign, form) {
  const memberRef = doc(db, "vipMembers", `${campaign.id}_${form.phone}`);
  const statsRef = doc(db, "vipCampaignStats", campaign.id);
  const regRef = doc(collection(db, "vipRegistrations"));
  await runTransaction(db, async (tx) => {
    const [member, stats] = await Promise.all([tx.get(memberRef), tx.get(statsRef)]);
    if (member.exists()) throw new DuplicateRegistrationError();
    const count = stats.exists() ? stats.data().count || 0 : 0;
    if (campaign.maxRegistrations && count >= campaign.maxRegistrations) throw new CampaignFullError();
    tx.set(regRef, {
      campaignId: campaign.id,
      campaignName: campaign.name,
      name: form.name,
      phone: form.phone,
      email: form.email || null,
      preferences: form.preferences || null,
      consent: true,
      consentText: form.consentText,
      status: "new",
      createdAt: serverTimestamp(),
    });
    tx.set(memberRef, { campaignId: campaign.id, registrationId: regRef.id, createdAt: serverTimestamp() });
    tx.set(statsRef, { count: count + 1, lastRegId: regRef.id });
  });
  return regRef.id;
}

/** Confere se um WhatsApp está na lista VIP da campanha (consulta pontual). */
export async function isVipMember(campaignId, phone) {
  const s = await getDoc(doc(db, "vipMembers", `${campaignId}_${phone}`));
  return s.exists();
}
