import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Copy, Eye, EyeOff, Pencil, Plus, Trash2, Wrench } from "lucide-react";
import { AdminHeader, ImageInput, ListEditor } from "../../components/admin/AdminUI.jsx";
import { Checkbox, SelectField, TextArea, TextField, Toggle } from "../../components/common/Fields.jsx";
import Badge from "../../components/common/Badge.jsx";
import Modal from "../../components/common/Modal.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import PageLoader from "../../components/common/PageLoader.jsx";
import { EmptyState, ErrorState } from "../../components/common/States.jsx";
import { useConfirm } from "../../components/common/useConfirm.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";
import { useAsync } from "../../hooks/useAsync.js";
import {
  deletePackage, listAllPackages, rebuildPublishedIndex, reorderPackages, savePackage, setPackageStatus,
} from "../../services/admin/packagesAdmin.js";
import { listAllCategories } from "../../services/admin/galleryAdmin.js";
import { recountLotCounters } from "../../services/admin/agendaAdmin.js";
import { deleteStoragePaths, uploadImage } from "../../services/imageService.js";
import { centsToInput, formatBRL, fromDateTimeInput, parseBRLToCents, toDateTimeInput } from "../../utils/format.js";
import { MAX_PUBLISHED_PACKAGES, PACKAGE_STATUS, isPublicStatus, lotRemaining, packageAvailability, validateLots } from "../../utils/lots.js";
import { slugify } from "../../utils/text.js";

const EMPTY = {
  name: "", slug: "", categoryId: "", description: "", highlights: [], coverUrl: "", coverThumbUrl: "", coverPath: "", coverThumbPath: "",
  priceCents: null, promoPriceCents: null, durationMin: 60, photosDelivered: "", deliveryInfo: "", location: "",
  sessionStart: "", sessionEnd: "", salesStart: null, salesEnd: null, rules: "", ctaMode: "booking", ctaLabel: "",
  status: "draft", featured: false, showRemaining: false,
};

const newLot = (n) => ({ name: `${n}º lote`, priceText: "", capacityText: "", salesStart: "", salesEnd: "", status: "active", confirmedCount: 0 });

function toForm(pkg) {
  return {
    ...EMPTY,
    ...pkg,
    priceText: centsToInput(pkg.priceCents),
    promoText: centsToInput(pkg.promoPriceCents),
    salesStartText: toDateTimeInput(pkg.salesStart),
    salesEndText: toDateTimeInput(pkg.salesEnd),
    lots: (pkg.lots || []).filter((l) => !l.archived).map((l) => ({
      ...l,
      priceText: centsToInput(l.priceCents),
      capacityText: l.capacity == null ? "" : String(l.capacity),
      salesStart: toDateTimeInput(l.salesStart),
      salesEnd: toDateTimeInput(l.salesEnd),
    })),
  };
}

function PackageEditor({ initial, categories, onClose, onSaved }) {
  const toast = useToast();
  const [f, setF] = useState(() => toForm(initial || {}));
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);
  const [removedPaths, setRemovedPaths] = useState([]);
  const up = (k) => (e) => setF((x) => ({ ...x, [k]: e?.target ? (e.target.type === "checkbox" ? e.target.checked : e.target.value) : e }));
  const setLot = (i, k, val) => setF((x) => ({ ...x, lots: x.lots.map((l, j) => (j === i ? { ...l, [k]: val } : l)) }));

  async function save() {
    const errs = [];
    if (!f.name.trim()) errs.push("Informe o nome do pacote.");
    const priceCents = f.priceText ? parseBRLToCents(f.priceText) : null;
    const promoPriceCents = f.promoText ? parseBRLToCents(f.promoText) : null;
    if (f.priceText && priceCents == null) errs.push("Preço inválido.");
    if (f.promoText && promoPriceCents == null) errs.push("Preço promocional inválido.");
    if (promoPriceCents != null && priceCents != null && promoPriceCents >= priceCents) errs.push("O preço promocional deve ser menor que o preço normal.");
    const lots = f.lots.map((l) => ({
      id: l.id,
      name: l.name.trim(),
      priceCents: parseBRLToCents(l.priceText),
      capacity: l.capacityText === "" ? null : Number(l.capacityText),
      salesStart: fromDateTimeInput(l.salesStart),
      salesEnd: fromDateTimeInput(l.salesEnd),
      status: l.status,
      confirmedCount: l.confirmedCount || 0,
    }));
    errs.push(...validateLots(lots));
    if (isPublicStatus(f.status) && priceCents == null && !lots.length) errs.push("Para publicar, informe um preço ou cadastre lotes.");
    if (f.ctaMode === "booking" && isPublicStatus(f.status) && !lots.length) errs.push("A agenda on-line precisa de pelo menos um lote (com preço e vagas).");
    if (f.sessionStart && f.sessionEnd && f.sessionStart > f.sessionEnd) errs.push("O período dos ensaios termina antes de começar.");
    const salesStart = fromDateTimeInput(f.salesStartText);
    const salesEnd = fromDateTimeInput(f.salesEndText);
    if (salesStart && salesEnd && salesStart > salesEnd) errs.push("O fim das vendas é antes do início.");
    setErrors(errs);
    if (errs.length) return;

    setSaving(true);
    try {
      const data = {
        name: f.name.trim(),
        slug: slugify(f.slug || f.name),
        categoryId: f.categoryId || null,
        description: f.description.trim(),
        highlights: f.highlights.map((h) => h.trim()).filter(Boolean),
        coverUrl: f.coverUrl || "", coverThumbUrl: f.coverThumbUrl || "", coverPath: f.coverPath || "", coverThumbPath: f.coverThumbPath || "",
        coverPlaceholder: f.coverPlaceholder || "", coverAlt: f.coverAlt || "",
        priceCents, promoPriceCents,
        durationMin: Number(f.durationMin) || null,
        photosDelivered: f.photosDelivered.trim(),
        deliveryInfo: f.deliveryInfo.trim(),
        location: f.location.trim(),
        sessionStart: f.sessionStart || null,
        sessionEnd: f.sessionEnd || null,
        salesStart, salesEnd,
        rules: f.rules.trim(),
        ctaMode: f.ctaMode,
        ctaLabel: f.ctaLabel.trim(),
        status: f.status,
        featured: !!f.featured,
        showRemaining: !!f.showRemaining,
        order: f.order ?? 999,
      };
      await savePackage(initial?.id || null, data, lots);
      if (removedPaths.length) deleteStoragePaths(removedPaths);
      toast.success("Pacote salvo.");
      onSaved();
    } catch (e) {
      setErrors([e.message || "Não foi possível salvar."]);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={initial?.id ? `Editar: ${initial.name}` : "Novo pacote"} size="xl"
      footer={<>
        <button className="btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn-primary" onClick={save} disabled={saving}>{saving && <Spinner className="h-4 w-4" />} Salvar pacote</button>
      </>}>
      <div className="space-y-8">
        {errors.length > 0 && (
          <ul role="alert" className="list-disc space-y-1 rounded-2xl bg-danger/5 p-4 pl-8 text-sm text-danger">{errors.map((e) => <li key={e}>{e}</li>)}</ul>
        )}

        <section className="grid gap-5 md:grid-cols-3">
          <div className="space-y-5 md:col-span-2">
            <TextField label="Nome do pacote *" value={f.name} onChange={up("name")} maxLength={120} />
            <div className="grid gap-5 sm:grid-cols-2">
              <SelectField label="Categoria" value={f.categoryId || ""} onChange={up("categoryId")} hint="As categorias são criadas em Galeria.">
                <option value="">Sem categoria</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </SelectField>
              <SelectField label="Status" value={f.status} onChange={up("status")}>
                {Object.entries(PACKAGE_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </SelectField>
            </div>
            <TextArea label="Descrição" rows={5} value={f.description} onChange={up("description")} maxLength={3000} />
          </div>
          <div className="space-y-3">
            <ImageInput label="Imagem de capa" value={f.coverThumbUrl || f.coverUrl}
              onUpload={async (file, p) => {
                const img = await uploadImage(file, `packages/${slugify(f.name) || "pacote"}`, { onProgress: p });
                setRemovedPaths((r) => [...r, f.coverPath, f.coverThumbPath].filter(Boolean));
                setF((x) => ({ ...x, coverUrl: img.url, coverThumbUrl: img.thumbUrl, coverPath: img.path, coverThumbPath: img.thumbPath, coverPlaceholder: img.placeholder }));
              }}
              onRemove={() => { setRemovedPaths((r) => [...r, f.coverPath, f.coverThumbPath].filter(Boolean)); setF((x) => ({ ...x, coverUrl: "", coverThumbUrl: "", coverPath: "", coverThumbPath: "" })); }} />
            <TextField label="Descrição da imagem" value={f.coverAlt || ""} onChange={up("coverAlt")} />
          </div>
        </section>

        <section>
          <h3 className="mb-4 font-display text-2xl">Valores e lotes</h3>
          <div className="grid gap-5 sm:grid-cols-3">
            <TextField label="Preço base (R$)" inputMode="decimal" placeholder="0,00" value={f.priceText} onChange={up("priceText")} hint="Usado quando não há lotes." />
            <TextField label="Preço promocional (opcional)" inputMode="decimal" placeholder="0,00" value={f.promoText} onChange={up("promoText")} />
            <div className="space-y-3 pt-6">
              <Toggle label="Mostrar vagas restantes" checked={f.showRemaining} onChange={up("showRemaining")} />
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {f.lots.map((l, i) => {
              const remaining = l.capacityText === "" ? null : lotRemaining({ capacity: Number(l.capacityText), confirmedCount: l.confirmedCount });
              return (
                <div key={l.id || `new-${i}`} className="rounded-2xl border border-ink/10 bg-paper/40 p-4">
                  <div className="grid gap-3 sm:grid-cols-12">
                    <TextField className="sm:col-span-3" label="Nome do lote" value={l.name} onChange={(e) => setLot(i, "name", e.target.value)} />
                    <TextField className="sm:col-span-2" label="Preço (R$)" inputMode="decimal" value={l.priceText} onChange={(e) => setLot(i, "priceText", e.target.value)} />
                    <TextField className="sm:col-span-2" label="Vagas" type="number" min="0" placeholder="Sem limite" value={l.capacityText} onChange={(e) => setLot(i, "capacityText", e.target.value)} />
                    <TextField className="sm:col-span-5 lg:col-span-2" label="Vendas de" type="datetime-local" value={l.salesStart} onChange={(e) => setLot(i, "salesStart", e.target.value)} />
                    <TextField className="sm:col-span-6 lg:col-span-2" label="até" type="datetime-local" value={l.salesEnd} onChange={(e) => setLot(i, "salesEnd", e.target.value)} />
                    <SelectField className="sm:col-span-4 lg:col-span-1" label="Status" value={l.status} onChange={(e) => setLot(i, "status", e.target.value)}>
                      <option value="active">Ativo</option>
                      <option value="closed">Fechado</option>
                    </SelectField>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted">
                    <span>
                      {l.confirmedCount || 0} confirmado(s){remaining != null && ` · ${remaining} vaga(s) restante(s)`}
                    </span>
                    <button type="button" className="inline-flex items-center gap-1 text-danger hover:underline"
                      onClick={() => setF((x) => ({ ...x, lots: x.lots.filter((_, j) => j !== i) }))}>
                      <Trash2 className="h-3.5 w-3.5" /> {l.confirmedCount ? "Arquivar lote" : "Remover lote"}
                    </button>
                  </div>
                </div>
              );
            })}
            {f.lots.length < 10 && (
              <button type="button" className="btn-outline btn-sm" onClick={() => setF((x) => ({ ...x, lots: [...x.lots, newLot(x.lots.length + 1)] }))}>
                <Plus className="h-4 w-4" /> Adicionar lote
              </button>
            )}
            <p className="text-xs text-ink-muted">O site usa automaticamente o primeiro lote ativo, dentro do período de vendas e com vaga. Vagas restantes = vagas − reservas confirmadas. Lotes com reservas são arquivados (não apagados) para preservar o histórico.</p>
          </div>
        </section>

        <section>
          <h3 className="mb-4 font-display text-2xl">O ensaio</h3>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <TextField label="Duração (minutos)" type="number" min="5" value={f.durationMin ?? ""} onChange={up("durationMin")} />
            <TextField label="Fotos entregues" placeholder="Ex.: 20 fotos editadas" value={f.photosDelivered} onChange={up("photosDelivered")} />
            <TextField label="Local" value={f.location} onChange={up("location")} />
            <TextField label="Ensaios a partir de" type="date" value={f.sessionStart || ""} onChange={up("sessionStart")} hint="Opcional: limita as datas da agenda." />
            <TextField label="Ensaios até" type="date" value={f.sessionEnd || ""} onChange={up("sessionEnd")} />
            <TextField label="Entrega e edição" value={f.deliveryInfo} onChange={up("deliveryInfo")} placeholder="Ex.: galeria on-line em até 15 dias" />
            <TextField label="Abertura das vendas" type="datetime-local" value={f.salesStartText} onChange={up("salesStartText")} />
            <TextField label="Encerramento das vendas" type="datetime-local" value={f.salesEndText} onChange={up("salesEndText")} />
          </div>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <ListEditor label="O que está incluso" items={f.highlights} onChange={up("highlights")} placeholder="Ex.: 1 troca de look" />
            <TextArea label="Regras e condições (uma por linha)" rows={6} value={f.rules} onChange={up("rules")} />
          </div>
        </section>

        <section>
          <h3 className="mb-4 font-display text-2xl">Contratação</h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField label="Botão principal" value={f.ctaMode} onChange={up("ctaMode")}>
              <option value="booking">Agenda on-line (escolher data e horário)</option>
              <option value="whatsapp">Contratar pelo WhatsApp</option>
            </SelectField>
            <TextField label="Texto do botão (opcional)" value={f.ctaLabel} onChange={up("ctaLabel")} maxLength={40} />
          </div>
          <div className="mt-4"><Checkbox label="Destacar como “Mais escolhido”" checked={f.featured} onChange={up("featured")} /></div>
        </section>
      </div>
    </Modal>
  );
}

export default function PackagesAdmin() {
  const toast = useToast();
  const [confirmUI, confirm] = useConfirm();
  const { data, loading, error, reload, setData } = useAsync(async () => {
    const [pkgs, cats] = await Promise.all([listAllPackages(), listAllCategories()]);
    return { pkgs, cats };
  }, []);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(null);
  const [showArchived, setShowArchived] = useState(false);

  const pkgs = data?.pkgs || [];
  const cats = data?.cats || [];
  const catName = useMemo(() => Object.fromEntries(cats.map((c) => [c.id, c.name])), [cats]);
  const publishedCount = pkgs.filter((p) => isPublicStatus(p.status)).length;
  const visible = pkgs.filter((p) => showArchived || !p.archived);

  async function act(id, fn, ok) {
    setBusy(id);
    try { await fn(); toast.success(ok); await reload(); } catch (e) { toast.error(e.message || "Não foi possível concluir."); } finally { setBusy(null); }
  }

  async function move(i, d) {
    const list = [...visible];
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    setData((x) => ({ ...x, pkgs: list }));
    try { await reorderPackages(list.map((p) => p.id)); } catch (e) { toast.error("Não foi possível salvar a ordem."); reload(); }
  }

  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <>
      {confirmUI}
      <AdminHeader title="Pacotes" text={`Crie e publique até ${MAX_PUBLISHED_PACKAGES} pacotes ao mesmo tempo. Rascunhos e encerrados não aparecem no site.`}
        actions={<button className="btn-primary" onClick={() => setEditing({})}><Plus className="h-4 w-4" /> Novo pacote</button>} />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Badge tone={publishedCount >= MAX_PUBLISHED_PACKAGES ? "warning" : "success"}>{publishedCount} de {MAX_PUBLISHED_PACKAGES} publicados</Badge>
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input type="checkbox" className="accent-wine-900" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} /> Mostrar arquivados
        </label>
        <div className="ml-auto flex gap-2">
          <button className="btn-ghost btn-sm" title="Recalcula as reservas confirmadas de cada lote a partir dos agendamentos"
            onClick={() => act("recount", async () => { const n = await recountLotCounters(); toast.info(n ? `${n} lote(s) corrigido(s).` : "Contadores já estavam corretos."); }, "Vagas conferidas.")}>
            <Wrench className="h-4 w-4" /> Conferir vagas
          </button>
          <button className="btn-ghost btn-sm" title="Reconstrói o índice de pacotes publicados" onClick={() => act("rebuild", rebuildPublishedIndex, "Índice de publicação reconstruído.")}>
            <Wrench className="h-4 w-4" /> Reparar publicação
          </button>
        </div>
      </div>

      {!visible.length ? (
        <EmptyState title="Nenhum pacote ainda" text="Crie o primeiro pacote com preços, lotes e o que está incluso."
          action={<button className="btn-primary" onClick={() => setEditing({})}><Plus className="h-4 w-4" /> Criar pacote</button>} />
      ) : (
        <div className="space-y-3">
          {visible.map((p, i) => {
            const av = packageAvailability(p, p.lots);
            const st = PACKAGE_STATUS[p.status];
            const totalCap = p.lots.reduce((s, l) => (l.capacity == null || s == null ? null : s + l.capacity), 0);
            const totalConf = p.lots.reduce((s, l) => s + (l.confirmedCount || 0), 0);
            return (
              <div key={p.id} className={`card flex flex-col gap-4 p-4 sm:flex-row sm:items-center ${p.archived ? "opacity-60" : ""}`}>
                <div className="flex items-center gap-4 sm:flex-1">
                  <div className="flex flex-col">
                    <button className="rounded p-1 text-ink-muted hover:bg-ink/5 disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Subir"><ArrowUp className="h-4 w-4" /></button>
                    <button className="rounded p-1 text-ink-muted hover:bg-ink/5 disabled:opacity-30" disabled={i === visible.length - 1} onClick={() => move(i, 1)} aria-label="Descer"><ArrowDown className="h-4 w-4" /></button>
                  </div>
                  <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-paper">{p.coverThumbUrl && <img src={p.coverThumbUrl} alt="" className="h-full w-full object-cover" />}</div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium">{p.name}</p>
                      <Badge tone={st.tone}>{st.label}</Badge>
                      {p.archived && <Badge tone="muted">Arquivado</Badge>}
                      {isPublicStatus(p.status) && av.state === "soldout" && p.status !== "soldout" && <Badge tone="danger">Sem vagas</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-ink-muted">
                      {catName[p.categoryId] || "Sem categoria"} · {av.lot ? `${av.lot.name}: ${formatBRL(av.lot.priceCents)}` : p.priceCents != null ? formatBRL(p.promoPriceCents ?? p.priceCents) : "sem preço"}
                      {" · "}{p.lots.length} lote(s) · {totalConf} confirmado(s){totalCap != null && p.lots.length ? ` de ${totalCap}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {busy === p.id ? <Spinner /> : (
                    <>
                      {isPublicStatus(p.status) ? (
                        <button className="btn-ghost btn-sm" onClick={() => act(p.id, () => setPackageStatus(p.id, "draft"), "Pacote despublicado.")}><EyeOff className="h-4 w-4" /> Despublicar</button>
                      ) : (
                        <button className="btn-outline btn-sm" disabled={p.archived} onClick={() => act(p.id, () => setPackageStatus(p.id, "published"), "Pacote publicado.")}><Eye className="h-4 w-4" /> Publicar</button>
                      )}
                      {p.status === "published" && <button className="btn-ghost btn-sm" onClick={() => act(p.id, () => setPackageStatus(p.id, "soldout"), "Marcado como esgotado.")}>Esgotado</button>}
                      {p.status !== "closed" && <button className="btn-ghost btn-sm" onClick={() => act(p.id, () => setPackageStatus(p.id, "closed"), "Pacote encerrado.")}>Encerrar</button>}
                      <button className="btn-ghost btn-sm" onClick={() => setEditing(p)} aria-label={`Editar ${p.name}`}><Pencil className="h-4 w-4" /></button>
                      <button className="btn-ghost btn-sm" title="Duplicar como rascunho" aria-label={`Duplicar ${p.name}`}
                        onClick={() => setEditing({ ...p, id: undefined, name: `${p.name} (cópia)`, slug: "", status: "draft", coverPath: "", coverThumbPath: "",
                          lots: p.lots.filter((l) => !l.archived).map(({ id, confirmedCount, ...l }) => ({ ...l, confirmedCount: 0 })) })}>
                        <Copy className="h-4 w-4" />
                      </button>
                      <button className="btn-ghost btn-sm text-danger" aria-label={`Excluir ${p.name}`}
                        onClick={async () => {
                          if (!(await confirm({ title: "Excluir pacote?", danger: true, confirmLabel: "Excluir",
                            text: "Se já houver agendamentos ou lançamentos financeiros ligados a ele, o pacote será arquivado (encerrado) em vez de apagado." }))) return;
                          act(p.id, async () => { const r = await deletePackage(p); if (r === "archived") toast.info("O pacote tinha histórico e foi arquivado."); }, "Feito.");
                        }}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <PackageEditor initial={editing.id || editing.name ? editing : null} categories={cats}
          onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />
      )}
    </>
  );
}

