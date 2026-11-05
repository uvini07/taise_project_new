// MODO DEMONSTRAÇÃO — seleção de fotos e entrega final.
// Ainda não há banco nem armazenamento (R2): tudo fica só na memória desta aba
// e some ao recarregar a página. As funções já têm o formato assíncrono do
// serviço definitivo, para que as telas não mudem quando o Firestore e o R2
// forem ligados — basta trocar este arquivo.
import { addDaysTo } from "../../utils/clientGallery.js";

export const DEMO_MODE = true;

const store = { selections: [], deliveries: [] };
let seq = 0;
const newId = (p) => `${p}${Date.now().toString(36)}${(++seq).toString(36)}`;
const clone = (x) => structuredClone(x);
const wait = () => new Promise((r) => setTimeout(r, 120));

function find(list, id) {
  const item = list.find((x) => x.id === id);
  if (!item) throw new Error("Página não encontrada (os dados de demonstração somem ao recarregar).");
  return item;
}

function revoke(urls) {
  urls.filter(Boolean).forEach((u) => { try { URL.revokeObjectURL(u); } catch { /* ignora */ } });
}

export function takenSlugs(kind, exceptId = null) {
  const list = kind === "delivery" ? store.deliveries : store.selections;
  return list.filter((x) => x.id !== exceptId).map((x) => x.slug);
}

/* ---------------------------- Seleção de fotos ---------------------------- */

export async function listSelections() {
  await wait();
  return clone(store.selections).sort((a, b) => b.createdAt - a.createdAt);
}

export async function getSelection(id) {
  await wait();
  return clone(find(store.selections, id));
}

export async function saveSelection(id, data) {
  await wait();
  if (id) {
    const s = find(store.selections, id);
    Object.assign(s, data, { updatedAt: new Date() });
    // Mudou o prazo de um link já enviado: recalcula a data final.
    if (s.sentAt && data.deadlineDays) s.expiresAt = addDaysTo(s.sentAt, Number(data.deadlineDays));
    return id;
  }
  const s = { ...data, id: newId("sel"), status: "draft", photos: [], selectedIds: [], createdAt: new Date(), sentAt: null, expiresAt: null, finishedAt: null };
  store.selections.push(s);
  return s.id;
}

export async function deleteSelection(id) {
  await wait();
  const s = find(store.selections, id);
  revoke(s.photos.flatMap((p) => [p.thumbUrl, p.previewUrl]));
  store.selections = store.selections.filter((x) => x.id !== id);
  store.deliveries.forEach((d) => { if (d.selectionId === id) d.selectionId = null; });
}

/** Adiciona fotos já convertidas (prévia + miniatura em URL local). */
export async function addSelectionPhotos(id, photos) {
  const s = find(store.selections, id);
  s.photos.push(...photos.map((p) => ({ ...p, id: newId("ph") })));
  return clone(s);
}

export async function removeSelectionPhotos(id, photoIds) {
  const s = find(store.selections, id);
  const ids = new Set(photoIds);
  revoke(s.photos.filter((p) => ids.has(p.id)).flatMap((p) => [p.thumbUrl, p.previewUrl]));
  s.photos = s.photos.filter((p) => !ids.has(p.id));
  s.selectedIds = s.selectedIds.filter((x) => !ids.has(x));
  return clone(s);
}

/** Libera o link para o cliente: o prazo começa a contar agora. */
export async function sendSelection(id) {
  await wait();
  const s = find(store.selections, id);
  const now = new Date();
  Object.assign(s, { status: "sent", sentAt: now, expiresAt: addDaysTo(now, Number(s.deadlineDays) || 7), finishedAt: null });
  return clone(s);
}

export async function extendSelection(id, days) {
  await wait();
  const s = find(store.selections, id);
  const base = s.expiresAt && new Date(s.expiresAt) > new Date() ? s.expiresAt : new Date();
  s.expiresAt = addDaysTo(base, days);
  if (s.status === "expired") s.status = s.selectedIds.length ? "selecting" : "sent";
  return clone(s);
}

export async function reopenSelection(id) {
  await wait();
  const s = find(store.selections, id);
  Object.assign(s, { status: s.selectedIds.length ? "selecting" : "sent", finishedAt: null });
  if (!s.expiresAt || new Date(s.expiresAt) <= new Date()) s.expiresAt = addDaysTo(new Date(), 2);
  return clone(s);
}

export async function finishSelection(id) {
  await wait();
  const s = find(store.selections, id);
  Object.assign(s, { status: "finished", finishedAt: new Date() });
  return clone(s);
}

/** Só para testar a tela: marca fotos aleatórias como se o cliente tivesse escolhido. */
export async function simulateClientChoice(id) {
  await wait();
  const s = find(store.selections, id);
  const n = Math.min(s.photos.length, Number(s.photoLimit) || s.photos.length);
  const shuffled = [...s.photos].sort(() => Math.random() - 0.5).slice(0, n);
  s.selectedIds = shuffled.map((p) => p.id);
  s.status = "finished";
  s.finishedAt = new Date();
  if (!s.sentAt) { s.sentAt = new Date(); s.expiresAt = addDaysTo(s.sentAt, Number(s.deadlineDays) || 7); }
  return clone(s);
}

/* ------------------------------ Entrega final ----------------------------- */

export async function listDeliveries() {
  await wait();
  return clone(store.deliveries).sort((a, b) => b.createdAt - a.createdAt);
}

export async function getDelivery(id) {
  await wait();
  return clone(find(store.deliveries, id));
}

export async function saveDelivery(id, data) {
  await wait();
  if (id) {
    const d = find(store.deliveries, id);
    Object.assign(d, data, { updatedAt: new Date() });
    if (d.sentAt && data.availableDays) d.expiresAt = addDaysTo(d.sentAt, Number(data.availableDays));
    return id;
  }
  const d = { ...data, id: newId("ent"), status: "draft", files: [], downloads: 0, createdAt: new Date(), sentAt: null, expiresAt: null };
  store.deliveries.push(d);
  return d.id;
}

export async function deleteDelivery(id) {
  await wait();
  const d = find(store.deliveries, id);
  revoke(d.files.map((f) => f.thumbUrl));
  store.deliveries = store.deliveries.filter((x) => x.id !== id);
}

export async function addDeliveryFiles(id, files) {
  const d = find(store.deliveries, id);
  d.files.push(...files.map((f) => ({ ...f, id: newId("f") })));
  return clone(d);
}

export async function removeDeliveryFiles(id, fileIds) {
  const d = find(store.deliveries, id);
  const ids = new Set(fileIds);
  revoke(d.files.filter((f) => ids.has(f.id)).map((f) => f.thumbUrl));
  d.files = d.files.filter((f) => !ids.has(f.id));
  return clone(d);
}

export async function publishDelivery(id) {
  await wait();
  const d = find(store.deliveries, id);
  const now = new Date();
  Object.assign(d, { status: "available", sentAt: now, expiresAt: addDaysTo(now, Number(d.availableDays) || 30) });
  return clone(d);
}

export async function extendDelivery(id, days) {
  await wait();
  const d = find(store.deliveries, id);
  const base = d.expiresAt && new Date(d.expiresAt) > new Date() ? d.expiresAt : new Date();
  d.expiresAt = addDaysTo(base, days);
  if (d.status === "expired") d.status = d.downloads ? "downloaded" : "available";
  return clone(d);
}
