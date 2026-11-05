import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, CalendarPlus, Check, CheckCircle2, Lightbulb, Pencil, RotateCcw, Send, Trash2 } from "lucide-react";
import { StatCard } from "../../components/admin/AdminUI.jsx";
import { ClientEditor, ClientLink, DemoBanner, DropZone, ProgressBar } from "../../components/admin/ClientPagesUI.jsx";
import Badge from "../../components/common/Badge.jsx";
import PageLoader from "../../components/common/PageLoader.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import { EmptyState, ErrorState } from "../../components/common/States.jsx";
import { useConfirm } from "../../components/common/useConfirm.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";
import { useAsync } from "../../hooks/useAsync.js";
import {
  addDeliveryFiles, extendDelivery, getDelivery, getSelection, listSelections, publishDelivery, removeDeliveryFiles, saveDelivery, takenSlugs,
} from "../../services/admin/clientPagesDemo.js";
import { DELIVERY_STATUS } from "../../config/constants.js";
import { compareDelivery, deadlineLabel, effectiveStatus, formatBytes } from "../../utils/clientGallery.js";
import { formatDateTime } from "../../utils/format.js";

const ACCEPT = "image/jpeg,image/png,image/webp,image/tiff,image/heic,image/avif";

/** Miniatura só para o painel (o arquivo entregue continua original). */
async function thumbOf(file) {
  try {
    const bmp = await createImageBitmap(file, { resizeWidth: 360, resizeQuality: "medium", imageOrientation: "from-image" });
    const canvas = document.createElement("canvas");
    canvas.width = bmp.width;
    canvas.height = bmp.height;
    canvas.getContext("2d").drawImage(bmp, 0, 0);
    bmp.close?.();
    const blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.7));
    return blob ? URL.createObjectURL(blob) : null;
  } catch {
    return null; // formatos que o navegador não abre (ex.: TIFF) ficam sem miniatura
  }
}

export default function DeliveryDetail() {
  const { id } = useParams();
  const toast = useToast();
  const [confirmUI, confirm] = useConfirm();
  const { data, loading, error, reload, setData } = useAsync(async () => {
    const d = await getDelivery(id);
    const [selection, selections] = await Promise.all([d.selectionId ? getSelection(d.selectionId).catch(() => null) : null, listSelections()]);
    return { d, selection, selections };
  }, [id]);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(null);
  const [queue, setQueue] = useState(null);
  const [marked, setMarked] = useState(new Set());

  const check = useMemo(() => {
    if (!data?.selection) return null;
    const chosen = data.selection.photos.filter((p) => data.selection.selectedIds.includes(p.id)).map((p) => p.name);
    return chosen.length ? { total: chosen.length, ...compareDelivery(chosen, data.d.files.map((f) => f.name)) } : { total: 0 };
  }, [data]);

  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorState error={error} onRetry={reload} title="Entrega não encontrada." />;

  const d = data.d;
  const st = effectiveStatus(d);
  const status = DELIVERY_STATUS[st];
  const bytes = d.files.reduce((t, f) => t + f.size, 0);
  const setD = (nd) => setData((x) => ({ ...x, d: nd }));

  async function act(key, fn, ok) {
    setBusy(key);
    try { const r = await fn(); if (r) setD(r); else reload(); if (ok) toast.success(ok); }
    catch (e) { toast.error(e.message || "Não foi possível concluir."); }
    finally { setBusy(null); }
  }

  async function handleFiles(files) {
    const valid = files.filter((f) => f.type.startsWith("image/"));
    const skipped = files.length - valid.length;
    if (!valid.length) return toast.error("Escolha arquivos de imagem.");
    const existing = new Set(d.files.map((f) => f.name));
    const fresh = valid.filter((f) => !existing.has(f.name));
    const dup = valid.length - fresh.length;
    if (!fresh.length) return toast.info("Essas fotos já estão na entrega.");
    setQueue({ total: fresh.length, done: 0 });
    let next = 0;
    const worker = async () => {
      while (next < fresh.length) {
        const file = fresh[next++];
        const thumbUrl = await thumbOf(file);
        setD(await addDeliveryFiles(id, [{ name: file.name, size: file.size, type: file.type, thumbUrl }]));
        setQueue((q) => ({ ...q, done: q.done + 1 }));
      }
    };
    await Promise.all([worker(), worker(), worker()]);
    setQueue(null);
    toast.success([`${fresh.length} arquivo(s) adicionados.`, dup ? `${dup} repetido(s) ignorado(s).` : null, skipped ? `${skipped} não são imagens.` : null].filter(Boolean).join(" "));
  }

  const toggle = (fid) => setMarked((m) => { const n = new Set(m); if (n.has(fid)) n.delete(fid); else n.add(fid); return n; });

  return (
    <>
      {confirmUI}
      <Link to="/adm/entrega" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Entregas</Link>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-4xl">{d.clientName}</h1>
            <Badge tone={status.tone}>{status.label}</Badge>
          </div>
          <p className="mt-1 text-sm text-ink-muted">{[d.title, `disponível por ${d.availableDays} dias`].filter(Boolean).join(" · ")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-ghost btn-sm" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" /> Editar</button>
          {st === "draft" && (
            <button className="btn-primary btn-sm" disabled={!d.files.length || !!queue || !!busy}
              title={!d.files.length ? "Suba as fotos antes de liberar" : undefined}
              onClick={async () => {
                const missing = check?.missing?.length ? ` Atenção: ${check.missing.length} foto(s) escolhida(s) ainda não foram entregues.` : "";
                if (await confirm({ title: "Liberar download?", confirmLabel: "Liberar",
                  text: `O cliente poderá baixar as ${d.files.length} foto(s) por ${d.availableDays} dias.${missing}` })) act("pub", () => publishDelivery(id), "Download liberado.");
              }}>
              {busy === "pub" ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" />} Liberar download
            </button>
          )}
          {st !== "draft" && (
            <button className="btn-outline btn-sm" onClick={() => act("ext", () => extendDelivery(id, 15), "Prazo estendido em 15 dias.")}><CalendarPlus className="h-4 w-4" /> +15 dias</button>
          )}
        </div>
      </div>

      <DemoBanner />

      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="card card-pad">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-muted">Link do cliente</p>
          <ClientLink kind="delivery" item={d} compact />
          <p className="mt-3 text-xs text-ink-muted">
            {st === "draft" ? `O prazo de ${d.availableDays} dias começa quando você liberar o download.` : `${deadlineLabel(d.expiresAt)} · ${formatDateTime(d.expiresAt)}`}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard label="Arquivos" value={d.files.length} />
          <StatCard label="Tamanho total" value={formatBytes(bytes)} hint="Qualidade original" />
          <StatCard label="Downloads" value={d.downloads || 0} tone={d.downloads ? "success" : "muted"} />
        </div>
      </div>

      {check && (
        <div className={`mb-6 rounded-2xl border p-4 text-sm ${check.total && !check.missing.length ? "border-success/20 bg-success/5" : "border-warning/25 bg-warning/5"}`}>
          {!check.total ? (
            <p className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" /> A seleção vinculada ({data.selection.clientName}) ainda não tem fotos escolhidas.</p>
          ) : (
            <>
              <p className="flex items-center gap-2 font-medium">
                {check.missing.length ? <AlertTriangle className="h-4 w-4 text-warning" /> : <CheckCircle2 className="h-4 w-4 text-success" />}
                Conferência com a seleção: {check.matched} de {check.total} escolhidas já estão na entrega.
              </p>
              {check.missing.length > 0 && <p className="mt-2 text-xs text-ink-soft"><strong>Faltando:</strong> {check.missing.join(", ")}</p>}
              {check.extra.length > 0 && <p className="mt-1 text-xs text-ink-muted"><strong>Fora da seleção</strong> (brinde ou nome diferente): {check.extra.join(", ")}</p>}
              <p className="mt-2 text-xs text-ink-muted">A conferência compara o nome do arquivo sem a extensão (IMG_4821.CR3 = IMG_4821.jpg).</p>
            </>
          )}
        </div>
      )}

      {st === "draft" || st === "available" ? (
        <div className="mb-6 space-y-3">
          <DropZone onFiles={handleFiles} accept={ACCEPT} busy={!!queue} disabled={!!queue}
            title="Arraste as fotos editadas aqui"
            hint="Os arquivos são entregues exatamente como você enviar, sem compressão." />
          {queue && <div className="card p-4"><ProgressBar value={queue.done / queue.total} label={`Adicionando ${queue.done} de ${queue.total}…`} /></div>}
          <p className="flex items-start gap-2 text-xs text-ink-muted">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            Exportar do Lightroom em JPEG qualidade 90 (em vez de 100) costuma deixar os arquivos 40–50% menores, sem diferença visível, nem na impressão. O cliente baixa mais rápido e o custo cai.
          </p>
        </div>
      ) : null}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="font-display text-2xl">Arquivos</h2>
        {marked.size > 0 && (
          <div className="ml-auto flex items-center gap-2 text-sm">
            <span className="text-ink-muted">{marked.size} marcado(s)</span>
            <button className="btn-ghost btn-sm" onClick={() => setMarked(new Set())}><RotateCcw className="h-4 w-4" /> Limpar</button>
            <button className="btn-ghost btn-sm text-danger" onClick={async () => {
              if (await confirm({ title: `Remover ${marked.size} arquivo(s)?`, danger: true, confirmLabel: "Remover" })) {
                await act("rm", () => removeDeliveryFiles(id, [...marked]), "Arquivos removidos.");
                setMarked(new Set());
              }
            }}><Trash2 className="h-4 w-4" /> Remover</button>
          </div>
        )}
      </div>

      {!d.files.length ? (
        <EmptyState className="py-10" title="Nenhum arquivo ainda" text="Arraste as fotos editadas na área acima." />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
          {d.files.map((f) => {
            const isMarked = marked.has(f.id);
            return (
              <li key={f.id} className={`group relative overflow-hidden rounded-xl bg-surface shadow-soft ${isMarked ? "ring-2 ring-wine-900" : ""}`}>
                <div className="aspect-square bg-paper">
                  {f.thumbUrl ? <img src={f.thumbUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                    : <div className="grid h-full place-items-center text-xs uppercase tracking-wider text-ink-muted">{f.name.split(".").pop()}</div>}
                </div>
                <button type="button" onClick={() => toggle(f.id)} aria-pressed={isMarked} aria-label={`Marcar ${f.name}`}
                  className={`absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full border shadow transition ${isMarked ? "border-wine-900 bg-wine-900 text-cream" : "border-white/80 bg-surface/80 text-transparent opacity-0 group-hover:opacity-100 focus:opacity-100"}`}>
                  <Check className="h-4 w-4" />
                </button>
                <div className="px-2.5 py-2">
                  <p className="truncate text-xs font-medium" title={f.name}>{f.name}</p>
                  <p className="text-[11px] text-ink-muted">{formatBytes(f.size)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <ClientEditor kind="delivery" initial={d} taken={takenSlugs("delivery", d.id)} selections={data.selections} onClose={() => setEditing(false)}
          onSave={async (payload) => {
            await saveDelivery(d.id, payload);
            setEditing(false);
            toast.success("Alterações salvas.");
            reload();
          }} />
      )}
    </>
  );
}
