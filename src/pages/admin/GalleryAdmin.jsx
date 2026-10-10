import { useMemo, useRef, useState } from "react";
import {
  ArrowDown, ArrowUp, Check, Eye, EyeOff, FolderInput, ImagePlus, Pencil, Plus, Star, StarOff, Trash2, UploadCloud,
} from "lucide-react";
import { AdminHeader, ImageInput } from "../../components/admin/AdminUI.jsx";
import { SelectField, TextArea, TextField, Toggle } from "../../components/common/Fields.jsx";
import Badge from "../../components/common/Badge.jsx";
import Modal from "../../components/common/Modal.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import PageLoader from "../../components/common/PageLoader.jsx";
import { EmptyState, ErrorState } from "../../components/common/States.jsx";
import { useConfirm } from "../../components/common/useConfirm.jsx";
import Lightbox from "../../components/gallery/Lightbox.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";
import { useAsync } from "../../hooks/useAsync.js";
import {
  bulkUpdatePhotos, categoryLinks, deleteCategory, deletePhotos, listAllCategories, listAllPhotos, reorderPhotos,
  saveCategory, updatePhoto, uploadPhotos,
} from "../../services/admin/galleryAdmin.js";
import { deleteStoragePaths, uploadImage, validateImageFile } from "../../services/imageService.js";
import { SUGGESTED_CATEGORIES } from "../../config/defaults.js";
import { slugify } from "../../utils/text.js";

function CategoryEditor({ initial, categories, photos, onClose, onSaved }) {
  const toast = useToast();
  const [f, setF] = useState({ name: "", description: "", visible: true, coverUrl: "", coverThumbUrl: "", coverPath: "", coverThumbPath: "", ...initial });
  const [saving, setSaving] = useState(false);
  const own = photos.filter((p) => p.categoryId === initial?.id);

  async function save() {
    if (!f.name.trim()) return toast.error("Informe o nome da categoria.");
    const slug = slugify(f.slug || f.name);
    if (categories.some((c) => c.slug === slug && c.id !== initial?.id)) return toast.error("Já existe uma categoria com esse nome.");
    setSaving(true);
    try {
      await saveCategory(initial?.id || null, {
        name: f.name.trim(), slug, description: f.description.trim(), visible: !!f.visible,
        coverUrl: f.coverUrl || "", coverThumbUrl: f.coverThumbUrl || "", coverPath: f.coverPath || "", coverThumbPath: f.coverThumbPath || "",
        coverPlaceholder: f.coverPlaceholder || "", coverFromPhoto: f.coverFromPhoto || null,
        order: initial?.order ?? categories.length + 1,
      });
      toast.success("Categoria salva.");
      onSaved();
    } catch (e) {
      toast.error(e.message || "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={initial?.id ? "Editar categoria" : "Nova categoria"} size="lg"
      footer={<><button className="btn-ghost" onClick={onClose}>Cancelar</button><button className="btn-primary" onClick={save} disabled={saving}>{saving && <Spinner className="h-4 w-4" />} Salvar</button></>}>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-5">
          <TextField label="Nome *" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={60} data-autofocus />
          <TextArea label="Descrição" rows={4} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} maxLength={400} />
          <Toggle label="Visível no site" hint="Categorias ocultas não aparecem na galeria pública." checked={f.visible} onChange={(v) => setF({ ...f, visible: v })} />
        </div>
        <div className="space-y-3">
          <ImageInput label="Capa" aspect="aspect-[3/4]" value={f.coverThumbUrl || f.coverUrl}
            onUpload={async (file, p) => {
              const img = await uploadImage(file, `categories/${slugify(f.name) || "categoria"}`, { onProgress: p });
              setF((x) => ({ ...x, coverUrl: img.url, coverThumbUrl: img.thumbUrl, coverPath: img.path, coverThumbPath: img.thumbPath, coverPlaceholder: img.placeholder, coverFromPhoto: null }));
            }}
            onRemove={() => setF((x) => ({ ...x, coverUrl: "", coverThumbUrl: "", coverPath: "", coverThumbPath: "", coverFromPhoto: null }))} />
          {own.length > 0 && (
            <div>
              <p className="field-label">Ou escolha uma foto da categoria</p>
              <div className="grid max-h-40 grid-cols-5 gap-1.5 overflow-y-auto">
                {own.map((p) => (
                  <button key={p.id} type="button" onClick={() => setF((x) => ({ ...x, coverUrl: p.url, coverThumbUrl: p.thumbUrl, coverPath: "", coverThumbPath: "", coverPlaceholder: p.placeholder, coverFromPhoto: p.id }))}
                    className={`aspect-square overflow-hidden rounded-lg ${f.coverFromPhoto === p.id ? "ring-2 ring-wine-900" : ""}`} aria-label="Usar como capa">
                    <img src={p.thumbUrl} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function PhotoEditor({ photo, categories, onClose, onSaved }) {
  const toast = useToast();
  const [f, setF] = useState({ title: photo.title || "", alt: photo.alt || "", categoryId: photo.categoryId });
  const [saving, setSaving] = useState(false);
  async function save() {
    setSaving(true);
    try { await updatePhoto(photo.id, { title: f.title.trim(), alt: f.alt.trim(), categoryId: f.categoryId }); toast.success("Foto atualizada."); onSaved(); }
    catch { toast.error("Não foi possível salvar."); } finally { setSaving(false); }
  }
  return (
    <Modal open onClose={onClose} title="Detalhes da foto"
      footer={<><button className="btn-ghost" onClick={onClose}>Cancelar</button><button className="btn-primary" onClick={save} disabled={saving}>Salvar</button></>}>
      <div className="grid gap-5 sm:grid-cols-[160px_1fr]">
        <img src={photo.thumbUrl} alt="" className="w-full rounded-xl object-cover" />
        <div className="space-y-4">
          <TextField label="Título (opcional)" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} maxLength={80} />
          <TextField label="Descrição para acessibilidade" value={f.alt} onChange={(e) => setF({ ...f, alt: e.target.value })} maxLength={160}
            hint="Descreva a foto para quem usa leitor de tela. Ex.: “Mãe e filha rindo no sofá do estúdio”." />
          <SelectField label="Categoria" value={f.categoryId} onChange={(e) => setF({ ...f, categoryId: e.target.value })}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </SelectField>
        </div>
      </div>
    </Modal>
  );
}

export default function GalleryAdmin() {
  const toast = useToast();
  const [confirmUI, confirm] = useConfirm();
  const { data, loading, error, reload, setData } = useAsync(async () => {
    const [cats, photos] = await Promise.all([listAllCategories(), listAllPhotos()]);
    return { cats, photos };
  }, []);
  const [catId, setCatId] = useState(null);
  const [editingCat, setEditingCat] = useState(null);
  const [editingPhoto, setEditingPhoto] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [uploads, setUploads] = useState([]);
  const [publishOnUpload, setPublishOnUpload] = useState(false);
  const [preview, setPreview] = useState(null);
  const [deletingCat, setDeletingCat] = useState(null);
  const fileInput = useRef(null);

  const cats = data?.cats || [];
  const photos = data?.photos || [];
  const current = cats.find((c) => c.id === catId) || null;
  const list = useMemo(() => photos.filter((p) => !catId || p.categoryId === catId), [photos, catId]);
  const countBy = useMemo(() => photos.reduce((m, p) => ({ ...m, [p.categoryId]: (m[p.categoryId] || 0) + 1 }), {}), [photos]);

  const toggleSel = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  async function handleFiles(files) {
    if (!catId) return toast.error("Escolha uma categoria antes de enviar fotos.");
    const arr = [...files];
    const valid = [];
    for (const f of arr) {
      const err = validateImageFile(f);
      if (err) toast.error(err); else valid.push(f);
    }
    if (!valid.length) return;
    setUploads(valid.map((f) => ({ name: f.name, progress: 0, error: null })));
    const maxOrder = Math.max(0, ...photos.filter((p) => p.categoryId === catId).map((p) => p.order || 0));
    const created = await uploadPhotos(valid, { categoryId: catId, publish: publishOnUpload, startOrder: maxOrder }, (i, progress, err) => {
      setUploads((u) => u.map((x, j) => (j === i ? { ...x, progress, error: err || null } : x)));
    });
    toast.success(`${created.length} de ${valid.length} foto(s) enviada(s)${publishOnUpload ? " e publicadas" : " como prévia (ocultas)"}.`);
    setTimeout(() => setUploads((u) => u.filter((x) => x.error)), 2500);
    reload();
  }

  async function bulk(patch, msg) {
    try { await bulkUpdatePhotos([...selected], patch); toast.success(msg); setSelected(new Set()); reload(); }
    catch { toast.error("Não foi possível atualizar as fotos."); }
  }

  async function move(i, d) {
    const arr = [...list];
    const j = i + d;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    const orderMap = Object.fromEntries(arr.map((p, k) => [p.id, k + 1]));
    setData((x) => ({ ...x, photos: x.photos.map((p) => (orderMap[p.id] ? { ...p, order: orderMap[p.id] } : p)).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) }));
    try { await reorderPhotos(arr.map((p) => p.id)); } catch { toast.error("Não foi possível salvar a ordem."); reload(); }
  }

  async function moveCategory(i, d) {
    const arr = [...cats];
    const j = i + d;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setData((x) => ({ ...x, cats: arr }));
    await Promise.all(arr.map((c, k) => saveCategory(c.id, { ...c, order: k + 1 }))).catch(() => { toast.error("Não foi possível salvar a ordem."); reload(); });
  }

  async function quickAdd(name) {
    try { await saveCategory(null, { name, slug: slugify(name), description: "", visible: false, order: cats.length + 1 }); toast.success(`Categoria “${name}” criada (oculta até ter fotos).`); reload(); }
    catch { toast.error("Não foi possível criar a categoria."); }
  }

  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const suggestions = SUGGESTED_CATEGORIES.filter((n) => !cats.some((c) => c.slug === slugify(n)));

  return (
    <>
      {confirmUI}
      <AdminHeader title="Galeria" text="Organize as fotos por categoria. Fotos novas entram ocultas (prévia) até você publicar."
        actions={<button className="btn-outline" onClick={() => setEditingCat({})}><Plus className="h-4 w-4" /> Nova categoria</button>} />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-3">
          <button onClick={() => { setCatId(null); setSelected(new Set()); }}
            className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm ${!catId ? "bg-wine-900 text-cream" : "bg-white hover:bg-ink/5"}`}>
            Todas as fotos <span className="tabular-nums opacity-70">{photos.length}</span>
          </button>
          {cats.map((c, i) => (
            <div key={c.id} className={`group flex items-center gap-2 rounded-xl px-2 py-1.5 ${catId === c.id ? "bg-wine-900 text-cream" : "bg-white"}`}>
              <button onClick={() => { setCatId(c.id); setSelected(new Set()); }} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm">
                <span className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-paper">{c.coverThumbUrl && <img src={c.coverThumbUrl} alt="" className="h-full w-full object-cover" />}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{c.name}</span>
                  <span className="text-xs opacity-70">{countBy[c.id] || 0} foto(s){!c.visible && " · oculta"}</span>
                </span>
              </button>
              <div className="flex flex-col opacity-60 group-hover:opacity-100">
                <button onClick={() => moveCategory(i, -1)} disabled={i === 0} className="p-0.5 disabled:opacity-20" aria-label={`Subir ${c.name}`}><ArrowUp className="h-3.5 w-3.5" /></button>
                <button onClick={() => moveCategory(i, 1)} disabled={i === cats.length - 1} className="p-0.5 disabled:opacity-20" aria-label={`Descer ${c.name}`}><ArrowDown className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
          {suggestions.length > 0 && (
            <div className="pt-3">
              <p className="mb-2 text-xs uppercase tracking-wider text-ink-muted">Sugestões</p>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((n) => (
                  <button key={n} onClick={() => quickAdd(n)} className="chip border-ink/15 bg-white hover:border-wine-900"><Plus className="h-3 w-3" /> {n}</button>
                ))}
              </div>
            </div>
          )}
        </aside>

        <section className="min-w-0">
          {current && (
            <div className="card mb-5 flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2"><h2 className="font-display text-2xl">{current.name}</h2>
                  <Badge tone={current.visible ? "success" : "muted"}>{current.visible ? "Visível" : "Oculta"}</Badge></div>
                {current.description && <p className="mt-1 line-clamp-1 text-sm text-ink-muted">{current.description}</p>}
              </div>
              <button className="btn-ghost btn-sm" onClick={() => setEditingCat(current)}><Pencil className="h-4 w-4" /> Editar</button>
              <button className="btn-ghost btn-sm text-danger" onClick={async () => {
                const links = await categoryLinks(current.id);
                setDeletingCat({ cat: current, links, moveTo: cats.find((c) => c.id !== current.id)?.id || "" });
              }}><Trash2 className="h-4 w-4" /> Excluir</button>
            </div>
          )}

          {catId ? (
            <div
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.dataset.over = "1"; }}
              onDragLeave={(e) => { delete e.currentTarget.dataset.over; }}
              onDrop={(e) => { e.preventDefault(); delete e.currentTarget.dataset.over; handleFiles(e.dataTransfer.files); }}
              className="mb-6 rounded-2xl border-2 border-dashed border-ink/15 bg-white p-6 text-center transition data-[over]:border-wine-900 data-[over]:bg-wine-50">
              <UploadCloud className="mx-auto h-8 w-8 text-gold" strokeWidth={1.4} />
              <p className="mt-2 text-sm">Arraste fotos aqui ou</p>
              <button className="btn-primary btn-sm mt-3" onClick={() => fileInput.current?.click()}><ImagePlus className="h-4 w-4" /> Escolher fotos</button>
              <input ref={fileInput} type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" className="hidden"
                onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
              <label className="mt-3 flex items-center justify-center gap-2 text-xs text-ink-muted">
                <input type="checkbox" className="accent-wine-900" checked={publishOnUpload} onChange={(e) => setPublishOnUpload(e.target.checked)} />
                Publicar imediatamente (senão ficam como prévia)
              </label>
              <p className="mt-1 text-xs text-ink-muted">JPG, PNG, WebP ou AVIF. As fotos são otimizadas antes do envio (WebP, até 2048px).</p>
              {uploads.length > 0 && (
                <ul className="mx-auto mt-4 max-w-md space-y-1.5 text-left text-xs">
                  {uploads.map((u, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="flex-1 truncate">{u.name}</span>
                      {u.error ? <span className="text-danger">{u.error}</span>
                        : u.progress >= 1 ? <Check className="h-4 w-4 text-success" />
                          : <span className="h-1.5 w-24 overflow-hidden rounded-full bg-ink/10"><span className="block h-full bg-wine-900 transition-all" style={{ width: `${Math.round(u.progress * 100)}%` }} /></span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            !cats.length ? null : <p className="mb-5 text-sm text-ink-muted">Selecione uma categoria para enviar fotos.</p>
          )}

          {selected.size > 0 && (
            <div className="sticky top-20 z-10 mb-4 flex flex-wrap items-center gap-2 rounded-2xl bg-ink px-4 py-3 text-sm text-cream shadow-lift lg:top-4">
              <span className="mr-2">{selected.size} selecionada(s)</span>
              <button className="btn-sm rounded-full bg-white/10 px-3 py-1.5 hover:bg-white/20" onClick={() => bulk({ published: true }, "Fotos publicadas.")}><Eye className="mr-1 inline h-3.5 w-3.5" />Publicar</button>
              <button className="btn-sm rounded-full bg-white/10 px-3 py-1.5 hover:bg-white/20" onClick={() => bulk({ published: false }, "Fotos ocultadas.")}><EyeOff className="mr-1 inline h-3.5 w-3.5" />Ocultar</button>
              <button className="btn-sm rounded-full bg-white/10 px-3 py-1.5 hover:bg-white/20" onClick={() => bulk({ featured: true }, "Marcadas como destaque.")}><Star className="mr-1 inline h-3.5 w-3.5" />Destaque</button>
              <select className="rounded-full bg-white/10 px-3 py-1.5 text-cream" defaultValue="" aria-label="Mover para categoria"
                onChange={(e) => { if (e.target.value) bulk({ categoryId: e.target.value }, "Fotos movidas."); e.target.value = ""; }}>
                <option value="" disabled>Mover para…</option>
                {cats.map((c) => <option key={c.id} value={c.id} className="text-ink">{c.name}</option>)}
              </select>
              <button className="rounded-full bg-danger px-3 py-1.5 hover:brightness-110" onClick={async () => {
                if (!(await confirm({ title: "Excluir fotos?", danger: true, confirmLabel: "Excluir", text: `As ${selected.size} foto(s) serão apagadas do site e do armazenamento. Não dá para desfazer.` }))) return;
                try { await deletePhotos(photos.filter((p) => selected.has(p.id))); toast.success("Fotos excluídas."); setSelected(new Set()); reload(); } catch { toast.error("Falha ao excluir."); }
              }}><Trash2 className="mr-1 inline h-3.5 w-3.5" />Excluir</button>
              <button className="ml-auto text-cream/70 hover:text-cream" onClick={() => setSelected(new Set())}>Limpar</button>
            </div>
          )}

          {!cats.length ? (
            <EmptyState title="Crie a primeira categoria" text="Use as sugestões ao lado ou crie uma categoria do seu jeito."
              action={<button className="btn-primary" onClick={() => setEditingCat({})}><Plus className="h-4 w-4" /> Nova categoria</button>} />
          ) : !list.length ? (
            <EmptyState title="Nenhuma foto aqui" text={catId ? "Envie as fotos desta categoria." : "Escolha uma categoria e envie as fotos."} />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {list.map((p, i) => (
                <div key={p.id} className={`group relative overflow-hidden rounded-2xl bg-white shadow-soft ${selected.has(p.id) ? "ring-2 ring-wine-900" : ""}`}>
                  <button className="block aspect-square w-full" onClick={() => setPreview(i)} aria-label="Visualizar">
                    <img src={p.thumbUrl} alt={p.alt || ""} loading="lazy" className={`h-full w-full object-cover ${p.published ? "" : "opacity-60 grayscale-[40%]"}`} />
                  </button>
                  <label className="absolute left-2 top-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white/90 shadow">
                    <input type="checkbox" className="accent-wine-900" checked={selected.has(p.id)} onChange={() => toggleSel(p.id)} aria-label="Selecionar foto" />
                  </label>
                  <div className="absolute right-2 top-2 flex gap-1">
                    {!p.published && <Badge tone="muted" className="bg-white/90">Prévia</Badge>}
                    {p.featured && <span className="rounded-full bg-gold p-1 text-white shadow" title="Destaque"><Star className="h-3.5 w-3.5" /></span>}
                  </div>
                  <div className="flex items-center justify-between gap-1 px-2 py-1.5">
                    {catId ? (
                      <div className="flex">
                        <button className="rounded p-1 text-ink-muted hover:bg-ink/5 disabled:opacity-20" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Mover para antes"><ArrowUp className="h-4 w-4 -rotate-90" /></button>
                        <button className="rounded p-1 text-ink-muted hover:bg-ink/5 disabled:opacity-20" disabled={i === list.length - 1} onClick={() => move(i, 1)} aria-label="Mover para depois"><ArrowDown className="h-4 w-4 -rotate-90" /></button>
                      </div>
                    ) : <span className="truncate text-[11px] text-ink-muted">{cats.find((c) => c.id === p.categoryId)?.name}</span>}
                    <div className="flex">
                      <button className="rounded p-1 text-ink-muted hover:bg-ink/5" title={p.published ? "Ocultar" : "Publicar"} aria-label={p.published ? "Ocultar" : "Publicar"}
                        onClick={async () => { await updatePhoto(p.id, { published: !p.published }); reload(); }}>{p.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                      <button className="rounded p-1 text-ink-muted hover:bg-ink/5" title={p.featured ? "Tirar destaque" : "Destacar na página inicial"} aria-label="Destaque"
                        onClick={async () => { await updatePhoto(p.id, { featured: !p.featured }); reload(); }}>{p.featured ? <StarOff className="h-4 w-4" /> : <Star className="h-4 w-4" />}</button>
                      <button className="rounded p-1 text-ink-muted hover:bg-ink/5" title="Usar como capa da categoria" aria-label="Usar como capa"
                        onClick={async () => {
                          const cat = cats.find((c) => c.id === p.categoryId);
                          if (!cat) return;
                          await saveCategory(cat.id, { ...cat, coverUrl: p.url, coverThumbUrl: p.thumbUrl, coverPlaceholder: p.placeholder || "", coverPath: "", coverThumbPath: "", coverFromPhoto: p.id });
                          if (cat.coverPath) deleteStoragePaths([cat.coverPath, cat.coverThumbPath]);
                          toast.success("Capa da categoria atualizada."); reload();
                        }}><FolderInput className="h-4 w-4" /></button>
                      <button className="rounded p-1 text-ink-muted hover:bg-ink/5" title="Editar" aria-label="Editar" onClick={() => setEditingPhoto(p)}><Pencil className="h-4 w-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <Lightbox photos={list} index={preview} onClose={() => setPreview(null)} onIndex={setPreview} />
      {editingCat && <CategoryEditor initial={editingCat.id ? editingCat : null} categories={cats} photos={photos} onClose={() => setEditingCat(null)} onSaved={() => { setEditingCat(null); reload(); }} />}
      {editingPhoto && <PhotoEditor photo={editingPhoto} categories={cats} onClose={() => setEditingPhoto(null)} onSaved={() => { setEditingPhoto(null); reload(); }} />}
      {deletingCat && (
        <Modal open onClose={() => setDeletingCat(null)} title={`Excluir “${deletingCat.cat.name}”?`} size="sm"
          footer={<>
            <button className="btn-ghost" onClick={() => setDeletingCat(null)}>Cancelar</button>
            <button className="btn-danger" disabled={deletingCat.links.packages.length > 0 || (deletingCat.links.photos > 0 && !deletingCat.moveTo)}
              onClick={async () => {
                try { await deleteCategory(deletingCat.cat, deletingCat.moveTo || null); toast.success("Categoria excluída."); setDeletingCat(null); setCatId(null); reload(); }
                catch (e) { toast.error(e.message); }
              }}>Excluir</button>
          </>}>
          <div className="space-y-4 text-sm text-ink-soft">
            {deletingCat.links.packages.length > 0 && (
              <p className="rounded-xl bg-danger/5 p-3 text-danger">Ligada aos pacotes: {deletingCat.links.packages.join(", ")}. Troque a categoria deles antes de excluir.</p>
            )}
            {deletingCat.links.photos > 0 ? (
              <SelectField label={`Mover as ${deletingCat.links.photos} foto(s) para`} value={deletingCat.moveTo} onChange={(e) => setDeletingCat({ ...deletingCat, moveTo: e.target.value })}>
                <option value="">Escolha…</option>
                {cats.filter((c) => c.id !== deletingCat.cat.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </SelectField>
            ) : <p>A categoria não tem fotos.</p>}
          </div>
        </Modal>
      )}
    </>
  );
}
