// Pacotes e lotes (painel). Toda alteração de status passa por uma transação
// que atualiza meta/packages.publishedIds junto — é assim que as regras do
// Firestore garantem o máximo de 5 pacotes visíveis ao mesmo tempo.
import {
  collection, doc, getDocs, limit, query, runTransaction, serverTimestamp, updateDoc, where, writeBatch,
} from "firebase/firestore";
import { db } from "../firebase.js";
import { audit } from "../auditService.js";
import { byOrder, withId } from "./common.js";
import { MAX_PUBLISHED_PACKAGES, isPublicStatus } from "../../utils/lots.js";
import { deleteStoragePaths } from "../imageService.js";

const metaRef = () => doc(db, "meta", "packages");

export class PublishLimitError extends Error {
  constructor() {
    super(`Já existem ${MAX_PUBLISHED_PACKAGES} pacotes visíveis no site. Despublique ou encerre um antes de publicar outro.`);
    this.code = "publish-limit";
  }
}

export async function listAllPackages() {
  const [p, l] = await Promise.all([getDocs(collection(db, "packages")), getDocs(collection(db, "packageLots"))]);
  const lotsByPkg = {};
  l.docs.map(withId).forEach((x) => (lotsByPkg[x.packageId] ||= []).push(x));
  return p.docs.map(withId).sort(byOrder).map((x) => ({ ...x, lots: (lotsByPkg[x.id] || []).sort(byOrder) }));
}

async function lotsInUse(lotIds) {
  const used = new Set();
  await Promise.all(lotIds.map(async (id) => {
    const s = await getDocs(query(collection(db, "appointments"), where("lotId", "==", id), limit(1)));
    if (!s.empty) used.add(id);
  }));
  return used;
}

/**
 * Cria ou atualiza um pacote com seus lotes.
 * lots: [{ id?, name, priceCents, capacity|null, salesStart, salesEnd, status }]
 * O contador de confirmados de cada lote nunca é sobrescrito pelo formulário.
 */
export async function savePackage(id, data, lots = []) {
  const pkgRef = id ? doc(db, "packages", id) : doc(collection(db, "packages"));
  const existing = id ? await getDocs(query(collection(db, "packageLots"), where("packageId", "==", pkgRef.id))) : { docs: [] };
  const keepIds = new Set(lots.filter((l) => l.id).map((l) => l.id));
  const removed = existing.docs.filter((d) => !keepIds.has(d.id)).map((d) => d.id);
  const inUse = await lotsInUse(removed);

  await runTransaction(db, async (tx) => {
    const meta = await tx.get(metaRef());
    const pkgSnap = await tx.get(pkgRef);
    const lotSnaps = await Promise.all(lots.filter((l) => l.id).map((l) => tx.get(doc(db, "packageLots", l.id))));
    const removedSnaps = await Promise.all(removed.map((rid) => tx.get(doc(db, "packageLots", rid))));

    let published = (meta.exists() ? meta.data().publishedIds : []) || [];
    published = published.filter((x) => x !== pkgRef.id);
    const isPublic = isPublicStatus(data.status);
    if (isPublic) {
      if (published.length >= MAX_PUBLISHED_PACKAGES) throw new PublishLimitError();
      published.push(pkgRef.id);
    }

    tx.set(pkgRef, {
      ...data,
      updatedAt: serverTimestamp(),
      ...(pkgSnap.exists() ? {} : { createdAt: serverTimestamp() }),
    }, { merge: true });

    const confirmed = Object.fromEntries(lotSnaps.filter((s) => s.exists()).map((s) => [s.id, s.data().confirmedCount || 0]));
    lots.forEach((l, i) => {
      const ref = l.id ? doc(db, "packageLots", l.id) : doc(collection(db, "packageLots"));
      const { id: _ignore, confirmedCount: _c, ...rest } = l;
      tx.set(ref, {
        ...rest,
        packageId: pkgRef.id,
        order: i + 1,
        public: isPublic,
        confirmedCount: confirmed[ref.id] ?? 0,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    });

    removedSnaps.forEach((s) => {
      if (!s.exists()) return;
      const hasHistory = inUse.has(s.id) || (s.data().confirmedCount || 0) > 0;
      // Lote com reservas não é apagado: fica arquivado para preservar o histórico.
      if (hasHistory) tx.update(s.ref, { status: "closed", archived: true, public: false, updatedAt: serverTimestamp() });
      else tx.delete(s.ref);
    });

    tx.set(metaRef(), { publishedIds: published });
  });
  audit(id ? "package.update" : "package.create", "packages", pkgRef.id, { name: data.name, status: data.status, lots: lots.length });
  return pkgRef.id;
}

/** Muda só o status (publicar, despublicar, esgotar, encerrar). */
export async function setPackageStatus(id, status) {
  const lotDocs = await getDocs(query(collection(db, "packageLots"), where("packageId", "==", id)));
  await runTransaction(db, async (tx) => {
    const meta = await tx.get(metaRef());
    let published = ((meta.exists() ? meta.data().publishedIds : []) || []).filter((x) => x !== id);
    if (isPublicStatus(status)) {
      if (published.length >= MAX_PUBLISHED_PACKAGES) throw new PublishLimitError();
      published.push(id);
    }
    tx.update(doc(db, "packages", id), { status, updatedAt: serverTimestamp() });
    lotDocs.docs.forEach((d) => {
      if (!d.data().archived) tx.update(d.ref, { public: isPublicStatus(status) });
    });
    tx.set(metaRef(), { publishedIds: published });
  });
  audit("package.status", "packages", id, { status });
}

/** Salva a ordem de exibição. */
export async function reorderPackages(ids) {
  const batch = writeBatch(db);
  ids.forEach((id, i) => batch.update(doc(db, "packages", id), { order: i + 1 }));
  await batch.commit();
}

/**
 * Remove um pacote. Se já houver agendamentos ligados a ele, o pacote é
 * arquivado (status "Encerrado") em vez de apagado, para preservar o histórico.
 */
export async function deletePackage(pkg) {
  const used = await getDocs(query(collection(db, "appointments"), where("packageId", "==", pkg.id), limit(1)));
  const finance = await getDocs(query(collection(db, "financialTransactions"), where("packageId", "==", pkg.id), limit(1)));
  if (!used.empty || !finance.empty) {
    await setPackageStatus(pkg.id, "closed");
    await updateDoc(doc(db, "packages", pkg.id), { archived: true, updatedAt: serverTimestamp() });
    audit("package.archive", "packages", pkg.id, { name: pkg.name });
    return "archived";
  }
  const lotDocs = await getDocs(query(collection(db, "packageLots"), where("packageId", "==", pkg.id)));
  await runTransaction(db, async (tx) => {
    const meta = await tx.get(metaRef());
    const published = ((meta.exists() ? meta.data().publishedIds : []) || []).filter((x) => x !== pkg.id);
    tx.set(metaRef(), { publishedIds: published });
    lotDocs.docs.forEach((d) => tx.delete(d.ref));
    tx.delete(doc(db, "packages", pkg.id));
  });
  await deleteStoragePaths([pkg.coverPath, pkg.coverThumbPath]);
  audit("package.delete", "packages", pkg.id, { name: pkg.name });
  return "deleted";
}

/** Reconstrói meta/packages a partir dos status atuais (ferramenta de reparo). */
export async function rebuildPublishedIndex() {
  const all = await getDocs(collection(db, "packages"));
  const ids = all.docs.filter((d) => isPublicStatus(d.data().status)).map((d) => d.id);
  if (ids.length > MAX_PUBLISHED_PACKAGES) throw new PublishLimitError();
  await runTransaction(db, async (tx) => {
    await tx.get(metaRef());
    tx.set(metaRef(), { publishedIds: ids });
  });
  return ids;
}

