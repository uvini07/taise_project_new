import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase.js";

const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);
const withId = (d) => ({ id: d.id, ...d.data() });

/** Pacotes visíveis no site (publicados ou esgotados), já com seus lotes. */
export async function listPublicPackages() {
  const [pkgs, lots] = await Promise.all([
    getDocs(query(collection(db, "packages"), where("status", "in", ["published", "soldout"]))),
    getDocs(query(collection(db, "packageLots"), where("public", "==", true))),
  ]);
  const lotsByPkg = {};
  lots.docs.map(withId).forEach((l) => (lotsByPkg[l.packageId] ||= []).push(l));
  return pkgs.docs.map(withId).sort(byOrder).map((p) => ({ ...p, lots: (lotsByPkg[p.id] || []).sort(byOrder) }));
}

/** Um pacote público pelo id ou slug. Rascunhos não são encontrados. */
export async function getPublicPackage(idOrSlug) {
  try {
    const snap = await getDoc(doc(db, "packages", idOrSlug));
    if (snap.exists()) {
      const lots = await getDocs(query(collection(db, "packageLots"),
        where("public", "==", true), where("packageId", "==", snap.id)));
      return { ...withId(snap), lots: lots.docs.map(withId).sort(byOrder) };
    }
  } catch (e) {
    if (e?.code !== "permission-denied") throw e;
  }
  const all = await listPublicPackages();
  return all.find((p) => p.slug === idOrSlug) || null;
}
