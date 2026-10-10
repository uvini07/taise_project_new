import {
  collection, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query, runTransaction, serverTimestamp,
  setDoc, updateDoc, where, writeBatch,
} from "firebase/firestore";
import { db } from "../firebase.js";
import { audit } from "../auditService.js";
import { withId } from "./common.js";
import { slugify } from "../../utils/text.js";
import { deleteStoragePaths } from "../imageService.js";
import { toDate } from "../../utils/format.js";

export async function listCampaigns() {
  const s = await getDocs(collection(db, "vipCampaigns"));
  const items = s.docs.map(withId);
  const stats = await Promise.all(items.map((c) => getDoc(doc(db, "vipCampaignStats", c.id))));
  return items
    .map((c, i) => ({ ...c, count: stats[i].exists() ? stats[i].data().count || 0 : 0 }))
    .sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0));
}

export async function saveCampaign(id, data) {
  const slug = slugify(data.slug || data.name);
  const dup = await getDocs(query(collection(db, "vipCampaigns"), where("slug", "==", slug), limit(2)));
  if (dup.docs.some((d) => d.id !== id)) throw new Error("Já existe uma campanha com esse endereço (slug). Escolha outro.");
  const ref = id ? doc(db, "vipCampaigns", id) : doc(collection(db, "vipCampaigns"));
  await setDoc(ref, {
    ...data,
    slug,
    vipPricing: data.vipPricing || {},
    updatedAt: serverTimestamp(),
    ...(id ? {} : { createdAt: serverTimestamp() }),
  }, { merge: true });
  audit(id ? "vip.campaign.update" : "vip.campaign.create", "vipCampaigns", ref.id, { name: data.name, status: data.status });
  return ref.id;
}

export async function setCampaignStatus(id, status) {
  await updateDoc(doc(db, "vipCampaigns", id), { status, updatedAt: serverTimestamp() });
  audit("vip.campaign.status", "vipCampaigns", id, { status });
}

/** Abre a janela de acesso VIP agora, com contador de N horas. */
export async function launchVipAccess(id, hours = 24) {
  const now = new Date();
  await updateDoc(doc(db, "vipCampaigns", id), {
    vipAccessStartsAt: now,
    countdownEndsAt: new Date(now.getTime() + hours * 3600000),
    status: "published",
    updatedAt: serverTimestamp(),
  });
  audit("vip.access.launch", "vipCampaigns", id, { hours });
}

export async function deleteCampaign(c) {
  const regs = await getDocs(query(collection(db, "vipRegistrations"), where("campaignId", "==", c.id), limit(1)));
  if (!regs.empty) throw new Error("Esta campanha tem inscritos. Encerre a campanha (ou exclua os inscritos) antes de apagá-la.");
  await deleteDoc(doc(db, "vipCampaigns", c.id));
  await deleteDoc(doc(db, "vipCampaignStats", c.id)).catch(() => {});
  await deleteStoragePaths([c.imagePath, c.imageThumbPath]);
  audit("vip.campaign.delete", "vipCampaigns", c.id, { name: c.name });
}

export async function listRegistrations(campaignId = null) {
  const q = campaignId
    ? query(collection(db, "vipRegistrations"), where("campaignId", "==", campaignId), orderBy("createdAt", "desc"))
    : query(collection(db, "vipRegistrations"), orderBy("createdAt", "desc"));
  const s = await getDocs(q);
  return s.docs.map(withId);
}

export async function updateRegistration(id, patch) {
  await updateDoc(doc(db, "vipRegistrations", id), { ...patch, updatedAt: serverTimestamp() });
  audit("vip.registration.update", "vipRegistrations", id, patch);
}

/**
 * Exclui inscrições (pedido do titular ou fim do prazo de retenção — LGPD).
 * Apaga também a marca de membro e devolve a vaga no contador.
 */
export async function deleteRegistrations(regs, reason = "manual") {
  for (const r of regs) {
    await runTransaction(db, async (tx) => {
      const statsRef = doc(db, "vipCampaignStats", r.campaignId);
      const stats = await tx.get(statsRef);
      tx.delete(doc(db, "vipRegistrations", r.id));
      tx.delete(doc(db, "vipMembers", `${r.campaignId}_${r.phone}`));
      if (stats.exists()) tx.update(statsRef, { count: Math.max(0, (stats.data().count || 0) - 1) });
    });
  }
  audit("vip.registration.delete", "vipRegistrations", "", { count: regs.length, reason });
}

/** Inscrições mais antigas que o prazo de retenção da campanha. */
export function expiredRegistrations(regs, campaigns, now = new Date()) {
  const byId = Object.fromEntries(campaigns.map((c) => [c.id, c]));
  return regs.filter((r) => {
    const days = Number(byId[r.campaignId]?.retentionDays);
    const created = toDate(r.createdAt);
    return days > 0 && created && now - created > days * 86400000;
  });
}

/** Mesma pessoa (WhatsApp ou e-mail) em mais de uma inscrição. */
export function findDuplicates(regs) {
  const groups = new Map();
  const add = (k, r) => { if (!k) return; const g = groups.get(k) || []; g.push(r); groups.set(k, g); };
  regs.forEach((r) => { add(`tel:${r.phone}`, r); if (r.email) add(`mail:${String(r.email).toLowerCase()}`, r); });
  const dupIds = new Set();
  for (const g of groups.values()) if (g.length > 1) g.forEach((r) => dupIds.add(r.id));
  return dupIds;
}

