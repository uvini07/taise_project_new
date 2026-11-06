import { useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, CalendarPlus, Check, CheckCircle2, ChevronLeft, ChevronRight, ClipboardList, Download, Eye, Heart, Lock, PackageCheck, Pencil, RotateCcw, Send, Shuffle, Trash2, Unlock, X,
} from "lucide-react";
import { StatCard } from "../../components/admin/AdminUI.jsx";
import { ClientEditor, ClientLink, DemoBanner, DropZone, ProgressBar } from "../../components/admin/ClientPagesUI.jsx";
import Badge from "../../components/common/Badge.jsx";
import PageLoader from "../../components/common/PageLoader.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import { EmptyState, ErrorState } from "../../components/common/States.jsx";
import { useConfirm } from "../../components/common/useConfirm.jsx";
import { createPortal } from "react-dom";
import { ScrambledImage } from "../../components/selection/Protected.jsx";
import ClientPreview from "../../components/selection/ClientPreview.jsx";
import { useSettings } from "../../contexts/SettingsContext.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";
import { useAsync } from "../../hooks/useAsync.js";
import {
  DEMO_MODE, addSelectionPhotos, extendSelection, finishSelection, getSelection, removeSelectionPhotos, reopenSelection, saveDelivery,
  saveSelection, sendSelection, simulateClientChoice, takenSlugs,
} from "../../services/admin/clientPagesDemo.js";
import { makeSelectionPreview, validateImageFile } from "../../services/imageService.js";
import { DELIVERY_DEFAULTS, SELECTION_STATUS } from "../../config/constants.js";
import { clientSlug, deadlineLabel, effectiveStatus, formatBytes, namesList, randomCode, savingsPercent } from "../../utils/clientGallery.js";
import { downloadCSV } from "../../utils/csv.js";
import { formatBRL, formatDateTime } from "../../utils/format.js";

/** Converte em paralelo (2 por vez) para não travar o navegador. */
async function convertAll(files, opts, onEach) {
  let next = 0;
  const worker = async () => {
    while (next < files.length) {
      const file = files[next++];
      try {
        const r = await makeSelectionPreview(file, opts);
        onEach({
          ok: true,
          photo: {
            name: file.name, originalSize: file.size, previewSize: r.preview.size, thumbSize: r.thumb.size,
            width: r.width, height: r.height, previewUrl: URL.createObjectURL(r.preview), thumbUrl: URL.createObjectURL(r.thumb),
            previewScramble: r.previewScramble, thumbScramble: r.thumbScramble,
          },
        });
      } catch (e) {
        onEach({ ok: false, error: e.message || `${file.name}: não foi possível converter.` });
      }
    }
  };
  await Promise.all([worker(), worker()]);
}

/** Visualização ampliada no painel (monta a prévia embaralhada no canvas). */
function AdminViewer({ photos, index, onIndex, onClose }) {
  const p = photos[index];
  const go = (d) => onIndex((index + d + photos.length) % photos.length);
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={p.name} className="fixed inset-0 z-[90] flex items-center justify-center bg-[#120607]/95"
      tabIndex={-1} ref={(el) => el?.focus()}
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <ScrambledImage key={p.id} src={p.previewUrl} scramble={p.previewScramble} fit="contain" label={p.name} className="block max-h-[88vh] max-w-[94vw]" />
      <p className="pointer-events-none absolute bottom-4 left-0 right-0 text-center text-xs text-cream/70">{p.name} · {index + 1} / {photos.length}</p>
      <button onClick={onClose} aria-label="Fechar" className="absolute right-3 top-3 rounded-full p-3 text-cream/80 hover:text-white"><X className="h-6 w-6" /></button>
      {photos.length > 1 && (
        <>
          <button onClick={() => go(-1)} aria-label="Anterior" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-3 text-cream/80 hover:text-white"><ChevronLeft className="h-8 w-8" /></button>
          <button onClick={() => go(1)} aria-label="Próxima" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-3 text-cream/80 hover:text-white"><ChevronRight className="h-8 w-8" /></button>
        </>
      )}
    </div>,
    document.body,
  );
}

export default function SelectionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { settings } = useSettings();
  const [confirmUI, confirm] = useConfirm();
  const { data: s, loading, error, reload, setData } = useAsync(() => getSelection(id), [id]);
  const [tab, setTab] = useState("all");
  const [marked, setMarked] = useState(new Set());
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(null);
  const [queue, setQueue] = useState(null); // { total, done, errors: [] }
  const [view, setView] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const lastErrors = useRef([]);

  const chosenSet = useMemo(() => new Set(s?.selectedIds || []), [s]);
  const shown = useMemo(() => (s ? (tab === "chosen" ? s.photos.filter((p) => chosenSet.has(p.id)) : s.photos) : []), [s, tab, chosenSet]);

  if (loading && !s) return <PageLoader />;
  if (error) return <ErrorState error={error} onRetry={reload} title="Seleção não encontrada." />;

  const st = effectiveStatus(s);
  const status = SELECTION_STATUS[st];
  const original = s.photos.reduce((t, p) => t + p.originalSize, 0);
  const light = s.photos.reduce((t, p) => t + p.previewSize + p.thumbSize, 0);
  const chosen = s.photos.filter((p) => chosenSet.has(p.id));
  const extras = Math.max(0, chosen.length - s.photoLimit);

  async function act(key, fn, ok) {
    setBusy(key);
    try { const r = await fn(); if (r) setData(r); else reload(); if (ok) toast.success(ok); }
    catch (e) { toast.error(e.message || "Não foi possível concluir."); }
    finally { setBusy(null); }
  }

  async function handleFiles(files) {
    const valid = [];
    const errors = [];
    files.forEach((f) => { const err = validateImageFile(f); if (err) errors.push(err); else valid.push(f); });
    if (!valid.length) { if (errors.length) toast.error(errors[0]); return; }
    lastErrors.current = errors;
    setQueue({ total: valid.length, done: 0, errors });
    const batch = [];
    const flush = async () => { if (batch.length) setData(await addSelectionPhotos(id, batch.splice(0))); };
    const brand = settings?.brandName || "Taíse Foto";
    const mark = !s.watermark ? "" : s.watermarkClientName !== false && s.clientName ? `${brand} · ${s.clientName}` : brand;
    await convertAll(valid, { watermark: mark, brand, strong: s.watermarkStrong !== false }, (r) => {
      if (r.ok) batch.push(r.photo); else lastErrors.current = [...lastErrors.current, r.error];
      setQueue((q) => ({ ...q, done: q.done + 1, errors: lastErrors.current }));
      if (batch.length >= 6) flush();
    });
    await flush();
    const failed = lastErrors.current.length;
    setQueue((q) => ({ ...q, finished: true }));
    if (failed) toast.error(`${failed} arquivo(s) não foram convertidos. Veja a lista abaixo do envio.`);
    else toast.success(`${valid.length} foto(s) convertidas.`);
  }

  function toggleMark(pid) {
    setMarked((m) => { const n = new Set(m); if (n.has(pid)) n.delete(pid); else n.add(pid); return n; });
  }

  async function copy(text, ok) {
    try { await navigator.clipboard.writeText(text); toast.success(ok); } catch { toast.error("Não foi possível copiar."); }
  }

  async function createDelivery() {
    const did = await saveDelivery(null, {
      clientName: s.clientName, phone: s.phone || "", title: s.title || "", message: "", selectionId: s.id,
      slug: clientSlug(s.clientName, randomCode(4)), availableDays: DELIVERY_DEFAULTS.availableDays,
    });
    toast.success("Entrega criada e vinculada a esta seleção.");
    navigate(`/adm/entrega/${did}`);
  }

  const canSend = s.photos.length > 0 && (!queue || queue.finished);

  return (
    <>
      {confirmUI}
      <Link to="/adm/selecao" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Seleções</Link>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-4xl">{s.clientName}</h1>
            <Badge tone={status.tone}>{status.label}</Badge>
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            {[s.title, `até ${s.photoLimit} fotos`, s.watermark ? (s.watermarkClientName !== false ? "marca d'água com o nome do cliente" : "com marca d'água") : "sem marca d'água",
              s.copyProtection !== false ? "proteção contra cópia" : null,
              s.allowExtras ? `extras ${s.extraPriceCents ? formatBRL(s.extraPriceCents) : "liberadas"}` : null].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-ghost btn-sm" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" /> Editar</button>
          <button className="btn-ghost btn-sm" disabled={!s.photos.length} onClick={() => setPreviewing(true)}><Eye className="h-4 w-4" /> Ver como o cliente</button>
          {st === "draft" && (
            <button className="btn-primary btn-sm" disabled={!canSend || busy}
              title={!s.photos.length ? "Suba as fotos antes de liberar o link" : undefined}
              onClick={async () => {
                if (await confirm({ title: "Liberar para o cliente?", confirmLabel: "Liberar link",
                  text: `O prazo de ${s.deadlineDays} dia(s) começa agora. Depois é só mandar o link pelo WhatsApp.` })) act("send", () => sendSelection(id), "Link liberado. O prazo começou a contar.");
              }}>
              {busy === "send" ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" />} Liberar para o cliente
            </button>
          )}
          {["sent", "selecting", "expired"].includes(st) && (
            <button className="btn-outline btn-sm" onClick={() => act("extend", () => extendSelection(id, 7), "Prazo estendido em 7 dias.")}><CalendarPlus className="h-4 w-4" /> +7 dias</button>
          )}
          {["sent", "selecting"].includes(st) && (
            <button className="btn-outline btn-sm" onClick={async () => {
              if (await confirm({ title: "Encerrar a seleção agora?", confirmLabel: "Encerrar", text: "O cliente não poderá mais mudar as escolhas. Você pode reabrir depois." })) act("finish", () => finishSelection(id), "Seleção encerrada.");
            }}><Lock className="h-4 w-4" /> Encerrar</button>
          )}
          {st === "finished" && (
            <button className="btn-outline btn-sm" onClick={() => act("reopen", () => reopenSelection(id), "Seleção reaberta para o cliente.")}><Unlock className="h-4 w-4" /> Reabrir</button>
          )}
          {DEMO_MODE && s.photos.length > 0 && st !== "finished" && (
            <button className="btn-ghost btn-sm" title="Só para testar a tela" onClick={() => act("sim", () => simulateClientChoice(id), "Escolha simulada.")}><Shuffle className="h-4 w-4" /> Simular escolha do cliente</button>
          )}
        </div>
      </div>

      <DemoBanner />

      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="card card-pad">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-muted">Link do cliente</p>
          <ClientLink kind="selection" item={s} compact />
          <p className="mt-3 text-xs text-ink-muted">
            {st === "draft" ? `O prazo de ${s.deadlineDays} dia(s) começa quando você liberar o link.`
              : st === "finished" ? `Finalizada em ${formatDateTime(s.finishedAt)}.`
                : `${deadlineLabel(s.expiresAt)} · ${formatDateTime(s.expiresAt)}`}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard label="Fotos" value={s.photos.length} />
          <StatCard label="Escolhidas" value={`${chosen.length}/${s.photoLimit}`} tone={chosen.length ? "success" : "muted"} hint={extras ? `${extras} extra(s)${s.extraPriceCents ? ` · ${formatBRL(extras * s.extraPriceCents)}` : ""}` : undefined} />
          <StatCard label="Peso no site" value={formatBytes(light)} hint={original ? `Originais: ${formatBytes(original)} (−${savingsPercent(original, light)}%)` : "Prévia WebP 1200px"} />
        </div>
      </div>

      {st !== "finished" && (
        <div className="mb-6 space-y-3">
          <DropZone onFiles={handleFiles} busy={queue && !queue.finished} disabled={queue && !queue.finished}
            title="Arraste as fotos do ensaio aqui"
            hint="JPG, PNG, WebP ou AVIF até 40 MB. Cada foto vira, no seu navegador, uma prévia pequena (1200px) com marca d'água e arquivo embaralhado. O original não é enviado." />
          {queue && (
            <div className="card p-4">
              <ProgressBar value={queue.done / queue.total} label={queue.finished ? `Concluído: ${queue.done - queue.errors.length} de ${queue.total} convertidas` : `Convertendo ${queue.done} de ${queue.total}…`} />
              {queue.errors.length > 0 && (
                <ul className="mt-3 max-h-32 list-disc space-y-0.5 overflow-y-auto pl-5 text-xs text-danger">{queue.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
              )}
              {queue.finished && <button className="btn-ghost btn-sm mt-2" onClick={() => setQueue(null)}>Fechar</button>}
            </div>
          )}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-full border border-ink/10 bg-surface p-1">
          {[["all", `Todas (${s.photos.length})`], ["chosen", `Escolhidas (${chosen.length})`]].map(([k, label]) => (
            <button key={k} onClick={() => { setTab(k); setMarked(new Set()); }}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${tab === k ? "bg-wine-900 text-cream" : "text-ink-soft hover:bg-ink/5"}`}>{label}</button>
          ))}
        </div>
        {tab === "chosen" && chosen.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <button className="btn-ghost btn-sm" onClick={() => copy(namesList(chosen.map((p) => p.name)), "Nomes copiados (separados por vírgula).")}><ClipboardList className="h-4 w-4" /> Copiar nomes</button>
            <button className="btn-ghost btn-sm" onClick={() => copy(namesList(chosen.map((p) => p.name), "\n"), "Nomes copiados (um por linha).")}>Um por linha</button>
            <button className="btn-ghost btn-sm" onClick={() => downloadCSV(`selecao-${s.slug}.csv`, chosen, [{ label: "Arquivo", value: (p) => p.name }])}><Download className="h-4 w-4" /> CSV</button>
            <button className="btn-primary btn-sm" onClick={createDelivery}><PackageCheck className="h-4 w-4" /> Criar entrega final</button>
          </div>
        )}
        {tab === "all" && marked.size > 0 && (
          <div className="ml-auto flex items-center gap-2 text-sm">
            <span className="text-ink-muted">{marked.size} marcada(s)</span>
            <button className="btn-ghost btn-sm" onClick={() => setMarked(new Set())}><RotateCcw className="h-4 w-4" /> Limpar</button>
            <button className="btn-ghost btn-sm text-danger" onClick={async () => {
              if (await confirm({ title: `Remover ${marked.size} foto(s)?`, danger: true, confirmLabel: "Remover", text: "Elas saem da página do cliente. Os originais continuam no seu computador." })) {
                await act("rm", () => removeSelectionPhotos(id, [...marked]), "Fotos removidas.");
                setMarked(new Set());
              }
            }}><Trash2 className="h-4 w-4" /> Remover</button>
          </div>
        )}
      </div>

      {tab === "chosen" && chosen.length > 0 && (
        <p className="mb-4 flex items-start gap-2 rounded-2xl bg-success/5 p-3 text-xs text-ink-soft">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          Dica: cole os nomes no filtro de texto da Biblioteca do Lightroom (Nome do arquivo) para achar as escolhidas e editar só elas.
        </p>
      )}

      {!shown.length ? (
        <EmptyState icon={Heart} className="py-10"
          title={tab === "chosen" ? "O cliente ainda não escolheu" : "Nenhuma foto ainda"}
          text={tab === "chosen" ? "As fotos marcadas pelo cliente aparecem aqui, com a lista de nomes para você editar." : "Arraste as fotos do ensaio na área acima."} />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {shown.map((p) => {
            const isChosen = chosenSet.has(p.id);
            const isMarked = marked.has(p.id);
            return (
              <li key={p.id} className={`group relative overflow-hidden rounded-xl bg-surface shadow-soft ${isMarked ? "ring-2 ring-wine-900" : ""}`}>
                <button type="button" className="block aspect-[4/5] w-full overflow-hidden bg-paper" onClick={() => setView(shown.indexOf(p))} aria-label={`Ampliar ${p.name}`}>
                  <ScrambledImage src={p.thumbUrl} scramble={p.thumbScramble} label={p.name} className="h-full w-full transition group-hover:scale-[1.02]" />
                </button>
                {isChosen && <span className="absolute left-2 top-2 rounded-full bg-wine-900 p-1.5 text-cream shadow" title="Escolhida pelo cliente"><Heart className="h-3.5 w-3.5 fill-current" /></span>}
                {tab === "all" && st !== "finished" && (
                  <button type="button" onClick={() => toggleMark(p.id)} aria-pressed={isMarked} aria-label={`Marcar ${p.name}`}
                    className={`absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full border shadow transition ${isMarked ? "border-wine-900 bg-wine-900 text-cream" : "border-white/80 bg-surface/80 text-transparent opacity-0 group-hover:opacity-100 focus:opacity-100"}`}>
                    <Check className="h-4 w-4" />
                  </button>
                )}
                <div className="px-2.5 py-2">
                  <p className="truncate text-xs font-medium" title={p.name}>{p.name}</p>
                  <p className="text-[11px] text-ink-muted">{formatBytes(p.originalSize)} → {formatBytes(p.previewSize)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {previewing && <ClientPreview selection={s} brand={settings?.brandName || "Taíse Foto"} onClose={() => setPreviewing(false)} />}

      {view != null && shown[view] && <AdminViewer photos={shown} index={view} onIndex={setView} onClose={() => setView(null)} />}

      {editing && (
        <ClientEditor kind="selection" initial={s} taken={takenSlugs("selection", s.id)} onClose={() => setEditing(false)}
          onSave={async (payload) => {
            await saveSelection(s.id, payload);
            setEditing(false);
            toast.success("Alterações salvas.");
            reload();
          }} />
      )}
    </>
  );
}
