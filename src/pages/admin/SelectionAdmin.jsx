import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Clock, Heart, Images, ListChecks, Plus, Trash2 } from "lucide-react";
import { AdminHeader, StatCard } from "../../components/admin/AdminUI.jsx";
import { ClientEditor, ClientLink, DemoBanner } from "../../components/admin/ClientPagesUI.jsx";
import Badge from "../../components/common/Badge.jsx";
import { ScrambledImage } from "../../components/selection/Protected.jsx";
import PageLoader from "../../components/common/PageLoader.jsx";
import { EmptyState, ErrorState } from "../../components/common/States.jsx";
import { useConfirm } from "../../components/common/useConfirm.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";
import { useAsync } from "../../hooks/useAsync.js";
import { deleteSelection, listSelections, saveSelection, takenSlugs } from "../../services/admin/clientPagesDemo.js";
import { SELECTION_STATUS } from "../../config/constants.js";
import { deadlineLabel, effectiveStatus, formatBytes } from "../../utils/clientGallery.js";

export default function SelectionAdmin() {
  const toast = useToast();
  const navigate = useNavigate();
  const [confirmUI, confirm] = useConfirm();
  const { data, loading, error, reload } = useAsync(listSelections, []);
  const [creating, setCreating] = useState(false);
  const list = data || [];

  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const now = new Date();
  const withStatus = list.map((s) => ({ ...s, st: effectiveStatus(s, now) }));
  const open = withStatus.filter((s) => ["sent", "selecting"].includes(s.st)).length;
  const finished = withStatus.filter((s) => s.st === "finished").length;
  const previewBytes = list.reduce((t, s) => t + s.photos.reduce((a, p) => a + p.previewSize + p.thumbSize, 0), 0);

  return (
    <>
      {confirmUI}
      <AdminHeader title="Seleção de fotos"
        text="Crie uma página para cada ensaio, suba as fotos (viram prévias leves em WebP) e mande o link para o cliente escolher as favoritas."
        actions={<button className="btn-primary" onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Nova seleção</button>} />
      <DemoBanner />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Ensaios" value={list.length} icon={Images} />
        <StatCard label="Esperando o cliente" value={open} icon={Clock} tone={open ? "warning" : "muted"} />
        <StatCard label="Seleções finalizadas" value={finished} icon={Heart} tone={finished ? "success" : "muted"} />
        <StatCard label="Espaço das prévias" value={formatBytes(previewBytes)} hint="Apagadas ao fim do prazo" icon={ListChecks} />
      </div>

      {!list.length ? (
        <EmptyState icon={Heart} title="Nenhuma seleção ainda"
          text="Ex.: você fotografou 200 fotos e o pacote dá direito a 100. Crie a página, suba as 200 e o cliente marca as 100 que quer."
          action={<button className="btn-primary" onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Criar primeira seleção</button>} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {withStatus.map((s) => {
            const st = SELECTION_STATUS[s.st];
            const chosen = s.selectedIds.length;
            return (
              <div key={s.id} className="card card-pad flex flex-col">
                <div className="flex items-start gap-3">
                  <div className="grid h-14 w-14 shrink-0 grid-cols-2 gap-0.5 overflow-hidden rounded-xl bg-paper">
                    {s.photos.slice(0, 4).map((p) => <ScrambledImage key={p.id} src={p.thumbUrl} scramble={p.thumbScramble} className="h-full w-full" />)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link to={`/adm/selecao/${s.id}`} className="font-display text-2xl hover:text-wine-900">{s.clientName}</Link>
                    {s.title && <p className="truncate text-sm text-ink-muted">{s.title}</p>}
                  </div>
                  <Badge tone={st.tone}>{st.label}</Badge>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <div><p className="text-xs uppercase tracking-wider text-ink-muted">Fotos</p><p className="font-display text-2xl tabular-nums">{s.photos.length}</p></div>
                  <div><p className="text-xs uppercase tracking-wider text-ink-muted">Escolhidas</p>
                    <p className="font-display text-2xl tabular-nums">{chosen}<span className="text-base text-ink-muted"> / {s.photoLimit}</span></p></div>
                  <div><p className="text-xs uppercase tracking-wider text-ink-muted">Prazo</p><p className="text-sm">{s.st === "finished" ? "Concluída" : deadlineLabel(s.expiresAt, now)}</p></div>
                </div>

                <div className="mt-4"><ClientLink kind="selection" item={s} /></div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  <Link className="btn-outline btn-sm" to={`/adm/selecao/${s.id}`}>Abrir ensaio</Link>
                  <button className="btn-ghost btn-sm ml-auto text-danger" aria-label={`Excluir ${s.clientName}`}
                    onClick={async () => {
                      if (!(await confirm({ title: "Excluir seleção?", danger: true, confirmLabel: "Excluir",
                        text: "A página do cliente sai do ar e as prévias são apagadas. Os originais continuam no seu computador." }))) return;
                      await deleteSelection(s.id);
                      toast.success("Seleção excluída.");
                      reload();
                    }}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {creating && (
        <ClientEditor kind="selection" taken={takenSlugs("selection")} onClose={() => setCreating(false)}
          onSave={async (payload) => {
            const id = await saveSelection(null, payload);
            toast.success("Página criada. Agora suba as fotos do ensaio.");
            navigate(`/adm/selecao/${id}`);
          }} />
      )}
    </>
  );
}
