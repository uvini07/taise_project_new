// Seleção e entrega REAIS: registros no Firestore (studios/{slug}/...) e as
// fotos no Cloudflare R2. O navegador processa a foto (WebP + marca d'água +
// embaralhamento), pede um link de upload ao servidor e envia direto ao R2 —
// as fotos nunca passam pela Vercel. Mantém as mesmas funções do modo demo.
import { arrayRemove, arrayUnion, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { auth } from "../firebaseAuth.js";
import { sCol, sDoc } from "../studioDb.js";
import { draw, loadBitmap, toBlob } from "../imageService.js";
import { addDaysTo } from "../../utils/clientGallery.js";

export const DEMO_MODE = false;

const randId = () => Array.from(crypto.getRandomValues(new Uint8Array(15))).map((b) => "0123456789abcdefghijklmnopqrstuvwxyz"[b % 36]).join("");
const toDate = (v) => (v?.toDate ? v.toDate() : v ? new Date(v) : null);

async function api(body) {
  const token = await auth.currentUser?.getIdToken();
  const r = await fetch("/api/fotos/studio", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token || ""}` }, body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "Não foi possível falar com o servidor de fotos.");
  return d;
}
async function putBlob(url, blob) {
  // Rede do celular oscila: tenta de novo algumas vezes antes de desistir.
  let last;
  for (let i = 0; i < 3; i += 1) {
    try {
      const r = await fetch(url, { method: "PUT", headers: { "Content-Type": blob.type || "application/octet-stream" }, body: blob });
      if (r.ok) return;
      last = new Error(`Falha ao enviar uma foto (${r.status}).`);
      if (r.status === 403) break;
    } catch { last = new Error("A conexão caiu durante o envio. Confira a internet e tente de novo."); }
    await new Promise((res) => setTimeout(res, 800 * (i + 1)));
  }
  throw last;
}

/* ------------------------------- Seleção --------------------------------- */

function normSel(id, d) {
  return {
    id, ...d,
    photos: d.photos || [], selectedIds: d.selectedIds || [],
    createdAt: toDate(d.createdAt), updatedAt: toDate(d.updatedAt),
    sentAt: toDate(d.sentAt), expiresAt: toDate(d.expiresAt), finishedAt: toDate(d.finishedAt),
  };
}

/** Anexa links temporários de visualização às fotos (para a fotógrafa ver). */
async function withViewUrls(kind, item) {
  const arr = kind === "entrega" ? item.files : item.photos;
  if (!arr?.length) return item;
  const keys = kind === "entrega" ? arr.map((f) => f.key) : arr.flatMap((p) => [p.key, p.tkey]);
  const { urls } = await api({ action: "viewurls", kind, keys });
  if (kind === "entrega") item.files = arr.map((f) => ({ ...f, url: urls[f.key] }));
  else item.photos = arr.map((p) => ({ ...p, previewUrl: urls[p.key], thumbUrl: urls[p.tkey] }));
  return item;
}

export async function listSelections() {
  const snap = await getDocs(sCol("selections"));
  return snap.docs.map((x) => normSel(x.id, x.data())).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function getSelection(id) {
  const snap = await getDoc(sDoc("selections", id));
  if (!snap.exists()) throw new Error("Seleção não encontrada.");
  return withViewUrls("selecao", normSel(id, snap.data()));
}

export async function saveSelection(id, data) {
  if (id) {
    const cur = (await getDoc(sDoc("selections", id))).data() || {};
    const patch = { ...data, updatedAt: serverTimestamp() };
    if (cur.sentAt && data.deadlineDays) patch.expiresAt = addDaysTo(toDate(cur.sentAt), Number(data.deadlineDays));
    await updateDoc(sDoc("selections", id), patch);
    return id;
  }
  const newId = randId();
  await setDoc(sDoc("selections", newId), { ...data, status: "draft", photos: [], selectedIds: [], createdAt: serverTimestamp(), updatedAt: serverTimestamp(), sentAt: null, expiresAt: null, finishedAt: null });
  return newId;
}

export async function deleteSelection(id) {
  await api({ action: "delete", kind: "selecao", parentId: id }).catch(() => {}); // apaga as fotos no R2
  await deleteDoc(sDoc("selections", id));
}

/** Processadas no navegador (com blobs); sobe ao R2 e grava as referências. */
export async function addSelectionPhotos(id, photos) {
  const items = photos.map((p) => ({ id: randId(), name: p.name, contentType: p.preview.type, thumbType: p.thumb.type }));
  const { items: signed } = await api({ action: "upload", kind: "selecao", parentId: id, items });
  const refs = [];
  for (let i = 0; i < photos.length; i += 1) {
    const p = photos[i]; const s = signed.find((x) => x.id === items[i].id);
    await Promise.all([putBlob(s.url, p.preview), putBlob(s.turl, p.thumb)]);
    refs.push({ id: s.id, name: p.name, originalSize: p.originalSize, previewSize: p.preview.size, thumbSize: p.thumb.size, width: p.width, height: p.height, key: s.key, tkey: s.tkey, previewScramble: p.previewScramble ?? null, thumbScramble: p.thumbScramble ?? null });
  }
  await updateDoc(sDoc("selections", id), { photos: arrayUnion(...refs), updatedAt: serverTimestamp() });
  return getSelection(id);
}

export async function removeSelectionPhotos(id, photoIds) {
  const snap = await getDoc(sDoc("selections", id));
  const d = snap.data();
  const ids = new Set(photoIds);
  const gone = (d.photos || []).filter((p) => ids.has(p.id));
  await api({ action: "delete", kind: "selecao", keys: gone.flatMap((p) => [p.key, p.tkey]) }).catch(() => {});
  await updateDoc(sDoc("selections", id), {
    photos: (d.photos || []).filter((p) => !ids.has(p.id)),
    selectedIds: (d.selectedIds || []).filter((x) => !ids.has(x)),
    updatedAt: serverTimestamp(),
  });
  return getSelection(id);
}

export async function sendSelection(id) {
  const cur = (await getDoc(sDoc("selections", id))).data() || {};
  const now = new Date();
  await updateDoc(sDoc("selections", id), { status: "sent", sentAt: now, expiresAt: addDaysTo(now, Number(cur.deadlineDays) || 7), finishedAt: null, updatedAt: serverTimestamp() });
  return getSelection(id);
}
export async function extendSelection(id, days) {
  const cur = normSel(id, (await getDoc(sDoc("selections", id))).data() || {});
  const base = cur.expiresAt && cur.expiresAt > new Date() ? cur.expiresAt : new Date();
  const patch = { expiresAt: addDaysTo(base, days), updatedAt: serverTimestamp() };
  if (cur.status === "expired") patch.status = cur.selectedIds.length ? "selecting" : "sent";
  await updateDoc(sDoc("selections", id), patch);
  return getSelection(id);
}
export async function reopenSelection(id) {
  const cur = normSel(id, (await getDoc(sDoc("selections", id))).data() || {});
  const patch = { status: cur.selectedIds.length ? "selecting" : "sent", finishedAt: null, updatedAt: serverTimestamp() };
  if (!cur.expiresAt || cur.expiresAt <= new Date()) patch.expiresAt = addDaysTo(new Date(), 2);
  await updateDoc(sDoc("selections", id), patch);
  return getSelection(id);
}
export async function finishSelection(id) {
  await updateDoc(sDoc("selections", id), { status: "finished", finishedAt: new Date(), updatedAt: serverTimestamp() });
  return getSelection(id);
}

/** Atalho da fotógrafa para simular a escolha do cliente (teste do fluxo). */
export async function simulateClientChoice(id) {
  const cur = normSel(id, (await getDoc(sDoc("selections", id))).data() || {});
  const n = Math.min(cur.photos.length, Number(cur.photoLimit) || cur.photos.length);
  const chosen = [...cur.photos].sort(() => Math.random() - 0.5).slice(0, n).map((p) => p.id);
  const patch = { selectedIds: chosen, status: "finished", finishedAt: new Date(), updatedAt: serverTimestamp() };
  if (!cur.sentAt) { patch.sentAt = new Date(); patch.expiresAt = addDaysTo(patch.sentAt, Number(cur.deadlineDays) || 7); }
  await updateDoc(sDoc("selections", id), patch);
  return getSelection(id);
}

/* ------------------------------- Entrega --------------------------------- */

function normEnt(id, d) {
  return { id, ...d, files: d.files || [], downloads: d.downloads || 0, createdAt: toDate(d.createdAt), updatedAt: toDate(d.updatedAt), sentAt: toDate(d.sentAt), expiresAt: toDate(d.expiresAt) };
}
export async function listDeliveries() {
  const snap = await getDocs(sCol("deliveries"));
  return snap.docs.map((x) => normEnt(x.id, x.data())).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}
export async function getDelivery(id) {
  const snap = await getDoc(sDoc("deliveries", id));
  if (!snap.exists()) throw new Error("Entrega não encontrada.");
  return withViewUrls("entrega", normEnt(id, snap.data()));
}
export async function saveDelivery(id, data) {
  if (id) {
    const cur = (await getDoc(sDoc("deliveries", id))).data() || {};
    const patch = { ...data, updatedAt: serverTimestamp() };
    if (cur.sentAt && data.availableDays) patch.expiresAt = addDaysTo(toDate(cur.sentAt), Number(data.availableDays));
    await updateDoc(sDoc("deliveries", id), patch);
    return id;
  }
  const newId = randId();
  await setDoc(sDoc("deliveries", newId), { ...data, status: "draft", files: [], downloads: 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp(), sentAt: null, expiresAt: null });
  return newId;
}
export async function deleteDelivery(id) {
  await api({ action: "delete", kind: "entrega", parentId: id }).catch(() => {});
  await deleteDoc(sDoc("deliveries", id));
}
/** Miniatura WebP leve (lado maior 900px) para a galeria do cliente. Falha → sem miniatura. */
async function galleryThumb(file, edge = 900, q = 0.78) {
  if (!(file?.type || "").startsWith("image/")) return null;
  try {
    const bmp = await loadBitmap(file);
    const width = bmp.width, height = bmp.height;
    // WebP quando o navegador sabe gerar; senão (Safari do iPhone) JPEG.
    const blob = await toBlob(draw(bmp, edge), q);
    bmp.close?.();
    return blob ? { blob, width, height } : null;
  } catch { return null; }
}
/** Sobe os arquivos ORIGINAIS (alta) direto ao R2; grava as referências. */
export async function addDeliveryFiles(id, files, onEach) {
  const refs = [];
  for (const f of files) {
    const raw = f.file || f;
    const th = await galleryThumb(raw);
    const it = { id: randId(), name: f.name, contentType: f.type || "application/octet-stream", thumb: !!th, thumbType: th?.blob.type };
    const { items: [s] } = await api({ action: "upload", kind: "entrega", parentId: id, items: [it] });
    await putBlob(s.url, raw);
    const ref = { id: s.id, name: f.name, size: f.size, key: s.key, type: f.type || "" };
    if (th && s.turl) { await putBlob(s.turl, th.blob); Object.assign(ref, { tkey: s.tkey, width: th.width, height: th.height }); }
    await updateDoc(sDoc("deliveries", id), { files: arrayUnion(ref), updatedAt: serverTimestamp() });
    refs.push(ref); onEach?.(ref);
  }
  return getDelivery(id);
}
export async function removeDeliveryFiles(id, fileIds) {
  const d = (await getDoc(sDoc("deliveries", id))).data();
  const ids = new Set(fileIds);
  const gone = (d.files || []).filter((f) => ids.has(f.id));
  await api({ action: "delete", kind: "entrega", keys: gone.flatMap((f) => [f.key, f.tkey].filter(Boolean)) }).catch(() => {});
  await updateDoc(sDoc("deliveries", id), { files: (d.files || []).filter((f) => !ids.has(f.id)), updatedAt: serverTimestamp() });
  return getDelivery(id);
}
export async function publishDelivery(id) {
  const cur = (await getDoc(sDoc("deliveries", id))).data() || {};
  const now = new Date();
  await updateDoc(sDoc("deliveries", id), { status: "available", sentAt: now, expiresAt: addDaysTo(now, Number(cur.availableDays) || 30), updatedAt: serverTimestamp() });
  return getDelivery(id);
}
export async function extendDelivery(id, days) {
  const cur = normEnt(id, (await getDoc(sDoc("deliveries", id))).data() || {});
  const base = cur.expiresAt && cur.expiresAt > new Date() ? cur.expiresAt : new Date();
  const patch = { expiresAt: addDaysTo(base, days), updatedAt: serverTimestamp() };
  if (cur.status === "expired") patch.status = cur.downloads ? "downloaded" : "available";
  await updateDoc(sDoc("deliveries", id), patch);
  return getDelivery(id);
}

export async function takenSlugs(kind, exceptId = null) {
  const snap = await getDocs(sCol(kind === "delivery" ? "deliveries" : "selections"));
  return snap.docs.filter((x) => x.id !== exceptId).map((x) => x.data().slug).filter(Boolean);
}

/** Gera (ou reseta) a senha do cliente. Devolve a senha em texto UMA vez. */
export async function setClientPassword(kind, id) {
  const { password } = await api({ action: "setpass", kind: kind === "delivery" || kind === "entrega" ? "entrega" : "selecao", parentId: id });
  return password;
}

/** Foto de capa da galeria do cliente: versão limpa (sem marca d'água), 2000px. */
export async function setGalleryCover(kind, id, file) {
  const th = await galleryThumb(file, 2000, 0.84);
  if (!th) throw new Error("Não foi possível ler essa foto. Use JPG, PNG ou WebP.");
  const k = kind === "delivery" || kind === "entrega" ? "entrega" : "selecao";
  const { items: [s] } = await api({ action: "upload", kind: k, parentId: id, items: [{ id: "cover", cover: true, contentType: th.blob.type }] });
  await putBlob(s.url, th.blob);
  await updateDoc(sDoc(k === "entrega" ? "deliveries" : "selections", id), { cover: { key: s.key, width: th.width, height: th.height, at: new Date() }, updatedAt: serverTimestamp() });
  return URL.createObjectURL(th.blob);
}
