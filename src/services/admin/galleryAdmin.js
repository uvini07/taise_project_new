import {
  collection, deleteDoc, doc, getDocs, limit, query, serverTimestamp, setDoc, updateDoc, where, writeBatch,
} from "firebase/firestore";
import { db } from "../firebase.js";
import { audit } from "../auditService.js";
import { deleteStoragePaths, uploadImage } from "../imageService.js";
import { byOrder, withId } from "./common.js";
import { slugify } from "../../utils/text.js";

export async function listAllCategories() {
  const s = await getDocs(collection(db, "galleryCategories"));
  return s.docs.map(withId).sort(byOrder);
}

export async function listAllPhotos() {
  const s = await getDocs(collection(db, "galleryPhotos"));
  return s.docs.map(withId).sort(byOrder);
}

export async function saveCategory(id, input) {
  const { id: _ignore, createdAt: _c, updatedAt: _u, ...data } = input;
  const ref = id ? doc(db, "galleryCategories", id) : doc(collection(db, "galleryCategories"));
  await setDoc(ref, {
    ...data,
    slug: data.slug || slugify(data.name),
    updatedAt: serverTimestamp(),
    ...(id ? {} : { createdAt: serverTimestamp() }),
  }, { merge: true });
  audit(id ? "category.update" : "category.create", "galleryCategories", ref.id, { name: data.name });
  return ref.id;
}

/** Quantos vínculos uma categoria tem (fotos e pacotes). */
export async function categoryLinks(id) {
  const [photos, pkgs] = await Promise.all([
    getDocs(query(collection(db, "galleryPhotos"), where("categoryId", "==", id))),
    getDocs(query(collection(db, "packages"), where("categoryId", "==", id), limit(20))),
  ]);
  return { photos: photos.size, packages: pkgs.docs.map((d) => d.data().name) };
}

/**
 * Exclui a categoria. Se tiver fotos, é preciso escolher para qual categoria
 * movê-las (moveTo) — fotos nunca ficam órfãs. Pacotes ligados a ela impedem
 * a exclusão até serem trocados de categoria.
 */
export async function deleteCategory(cat, moveTo = null) {
  const links = await categoryLinks(cat.id);
  if (links.packages.length) {
    throw new Error(`Esta categoria está ligada aos pacotes: ${links.packages.join(", ")}. Troque a categoria deles antes.`);
  }
  if (links.photos && !moveTo) throw new Error("Escolha para qual categoria mover as fotos.");
  if (links.photos) {
    const photos = await getDocs(query(collection(db, "galleryPhotos"), where("categoryId", "==", cat.id)));
    for (let i = 0; i < photos.docs.length; i += 400) {
      const batch = writeBatch(db);
      photos.docs.slice(i, i + 400).forEach((d) => batch.update(d.ref, { categoryId: moveTo }));
      await batch.commit();
    }
  }
  await deleteDoc(doc(db, "galleryCategories", cat.id));
  await deleteStoragePaths([cat.coverPath, cat.coverThumbPath]);
  audit("category.delete", "galleryCategories", cat.id, { name: cat.name, movedTo: moveTo, photos: links.photos });
}

/**
 * Envia várias fotos. onFile(index, progress 0..1, error?) informa o andamento.
 * Fotos novas entram no fim da categoria; publish=false deixa como prévia.
 */
export async function uploadPhotos(files, { categoryId, publish, startOrder }, onFile) {
  const created = [];
  let order = startOrder;
  for (let i = 0; i < files.length; i++) {
    const ref = doc(collection(db, "galleryPhotos"));
    try {
      const img = await uploadImage(files[i], `gallery/${ref.id}`, { onProgress: (p) => onFile?.(i, p) });
      order += 1;
      const data = {
        categoryId,
        title: "",
        alt: "",
        url: img.url,
        path: img.path,
        thumbUrl: img.thumbUrl,
        thumbPath: img.thumbPath,
        width: img.width,
        height: img.height,
        placeholder: img.placeholder,
        order,
        featured: false,
        published: !!publish,
        createdAt: serverTimestamp(),
      };
      await setDoc(ref, data);
      created.push({ id: ref.id, ...data });
      onFile?.(i, 1);
    } catch (e) {
      onFile?.(i, 0, e.message || "Falha no envio");
    }
  }
  if (created.length) audit("photos.upload", "galleryPhotos", "", { count: created.length, categoryId });
  return created;
}

export async function updatePhoto(id, patch) {
  await updateDoc(doc(db, "galleryPhotos", id), { ...patch, updatedAt: serverTimestamp() });
}

export async function bulkUpdatePhotos(ids, patch) {
  for (let i = 0; i < ids.length; i += 400) {
    const batch = writeBatch(db);
    ids.slice(i, i + 400).forEach((id) => batch.update(doc(db, "galleryPhotos", id), patch));
    await batch.commit();
  }
  audit("photos.bulkUpdate", "galleryPhotos", "", { count: ids.length, patch });
}

export async function reorderPhotos(ids) {
  for (let i = 0; i < ids.length; i += 400) {
    const batch = writeBatch(db);
    ids.slice(i, i + 400).forEach((id, j) => batch.update(doc(db, "galleryPhotos", id), { order: i + j + 1 }));
    await batch.commit();
  }
}

export async function deletePhotos(photos) {
  const ids = new Set(photos.map((p) => p.id));
  for (const p of photos) {
    await deleteDoc(doc(db, "galleryPhotos", p.id));
    await deleteStoragePaths([p.path, p.thumbPath]);
  }
  // Categoria que usava uma dessas fotos como capa fica sem capa (não com link quebrado).
  const cats = await getDocs(collection(db, "galleryCategories"));
  await Promise.all(cats.docs.filter((d) => ids.has(d.data().coverFromPhoto)).map((d) =>
    updateDoc(d.ref, { coverUrl: "", coverThumbUrl: "", coverPlaceholder: "", coverFromPhoto: null })));
  audit("photos.delete", "galleryPhotos", "", { count: photos.length });
}
