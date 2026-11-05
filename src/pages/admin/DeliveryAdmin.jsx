import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Clock, HardDrive, PackageCheck, Plus, Send, Trash2 } from "lucide-react";
import { AdminHeader, StatCard } from "../../components/admin/AdminUI.jsx";
import { ClientEditor, ClientLink, DemoBanner } from "../../components/admin/ClientPagesUI.jsx";
import Badge from "../../components/common/Badge.jsx";
import PageLoader from "../../components/common/PageLoader.jsx";
import { EmptyState, ErrorState } from "../../components/common/States.jsx";
import { useConfirm } from "../../components/common/useConfirm.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";
import { useAsync } from "../../hooks/useAsync.js";
import { deleteDelivery, listDeliveries, listSelections, saveDelivery, takenSlugs } from "../../services/admin/clientPagesDemo.js";
import { DELIVERY_STATUS } from "../../config/constants.js";
import { deadlineLabel, effectiveStatus, formatBytes } from "../../utils/clientGallery.js";

export default function DeliveryAdmin() {
  const toast = useToast();
  const navigate = useNavigate();
  const [confirmUI, confirm] = useConfirm();
  const { data, loading, error, reload } = useAsync(async () => {
    const [deliveries, selections] = await Promise.all([listDeliveries(), listSelections()]);
    return { deliveries, selections };
  }, []);
  const [creating, setCreating] = useState(false);

  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const now = new Date();
  const list = data.deliveries.map((d) => ({ ...d, st: effectiveStatus(d, now), bytes: d.files.reduce((t, f) => t + f.size, 0) }));
  const active = list.filter((d) => ["available", "downloaded"].includes(d.st));
  const activeBytes = active.reduce((t, d) => t + d.bytes, 0);
  const selName = Object.fromEntries(data.selections.map((s) => [s.id, s.clientName]));

  return (
    <>
      {confirmUI}
      <AdminHeader title="Entrega final"
        text="Suba as fotos editadas em alta qualidade e mande o link para o cliente baixar. Os arquivos ficam disponíveis pelo prazo que você definir."
        actions={<button className="btn-primary" onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Nova entrega</button>} />
      <DemoBanner />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Entregas" value={list.length} icon={PackageCheck} />
        <StatCard label="Disponíveis agora" value={active.length} icon={Send} tone={active.length ? "success" : "muted"} />
        <StatCard label="Em preparação" value={list.filter((d) => d.st === "draft").length} icon={Clock} />
        <StatCard label="Espaço em uso" value={formatBytes(activeBytes)} hint="Só das entregas disponíveis" icon={HardDrive} />
      </div>

      {!list.length ? (
        <EmptyState icon={PackageCheck} title="Nenhuma entrega ainda"
          text="Depois que o cliente escolher as fotos e você editar, crie a entrega aqui (ou direto pela seleção, em “Criar entrega final”)."
          action={<button className="btn-primary" onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Criar primeira entrega</button>} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {list.map((d) => {
            const st = DELIVERY_STATUS[d.st];
            return (
              <div key={d.id} className="card card-pad flex flex-col">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <Link to={`/adm/entrega/${d.id}`} className="font-display text-2xl hover:text-wine-900">{d.clientName}</Link>
                    <p className="truncate text-sm text-ink-muted">{[d.title, d.selectionId && selName[d.selectionId] ? "vinculada à seleção" : null].filter(Boolean).join(" · ") || " "}</p>
                  </div>
                  <Badge tone={st.tone}>{st.label}</Badge>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <div><p className="text-xs uppercase tracking-wider text-ink-muted">Arquivos</p><p className="font-display text-2xl tabular-nums">{d.files.length}</p></div>
                  <div><p className="text-xs uppercase tracking-wider text-ink-muted">Tamanho</p><p className="font-display text-2xl">{formatBytes(d.bytes)}</p></div>
                  <div><p className="text-xs uppercase tracking-wider text-ink-muted">Prazo</p><p className="text-sm">{d.st === "draft" ? `${d.availableDays} dias após liberar` : deadlineLabel(d.expiresAt, now)}</p></div>
                </div>
                <div className="mt-4"><ClientLink kind="delivery" item={d} /></div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  <Link className="btn-outline btn-sm" to={`/adm/entrega/${d.id}`}>Abrir entrega</Link>
                  <button className="btn-ghost btn-sm ml-auto text-danger" aria-label={`Excluir ${d.clientName}`}
                    onClick={async () => {
                      if (!(await confirm({ title: "Excluir entrega?", danger: true, confirmLabel: "Excluir",
                        text: "O link para de funcionar e os arquivos são apagados do site. Os originais continuam no seu computador." }))) return;
                      await deleteDelivery(d.id);
                      toast.success("Entrega excluída.");
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
        <ClientEditor kind="delivery" taken={takenSlugs("delivery")} selections={data.selections} onClose={() => setCreating(false)}
          onSave={async (payload) => {
            const id = await saveDelivery(null, payload);
            toast.success("Entrega criada. Agora suba as fotos editadas.");
            navigate(`/adm/entrega/${id}`);
          }} />
      )}
    </>
  );
}
