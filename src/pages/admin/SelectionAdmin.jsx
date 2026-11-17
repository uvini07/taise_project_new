import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Plus } from "lucide-react";
import { AdminHeader } from "../../components/admin/AdminUI.jsx";
import { ClientEditor, DemoBanner, StorageMeter } from "../../components/admin/ClientPagesUI.jsx";
import ClientList from "../../components/admin/ClientList.jsx";
import PageLoader from "../../components/common/PageLoader.jsx";
import { EmptyState, ErrorState } from "../../components/common/States.jsx";
import { useConfirm } from "../../components/common/useConfirm.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";
import { useAsync } from "../../hooks/useAsync.js";
import { listDeliveries, listSelections, saveSelection, takenSlugs } from "../../services/admin/clientPages.js";
import { SELECTION_STATUS } from "../../config/constants.js";
import { daysLeft, effectiveStatus } from "../../utils/clientGallery.js";

const SEL_FILTERS = [
  { key: "acao", label: "Precisa de você", test: (s) => !!s.need, empty: "Tudo em dia por aqui. 🎉" },
  { key: "aguardando", label: "Com o cliente", test: (s) => ["sent", "selecting"].includes(s.st), empty: "Nenhum cliente escolhendo agora." },
  { key: "finalizadas", label: "Finalizadas", test: (s) => s.st === "finished", empty: "Nenhuma seleção finalizada." },
  { key: "preparando", label: "Preparando", test: (s) => s.st === "draft", empty: "Nenhuma seleção em preparo." },
  { key: "vencidas", label: "Vencidas", test: (s) => s.st === "expired", empty: "Nenhuma seleção vencida." },
  { key: "todas", label: "Todas", test: () => true },
];

export default function SelectionAdmin() {
  const toast = useToast();
  const navigate = useNavigate();
  const [confirmUI, confirm] = useConfirm();
  const { data, loading, error, reload } = useAsync(async () => {
    const [selections, deliveries] = await Promise.all([listSelections(), listDeliveries()]);
    return { selections, deliveries };
  }, []);
  const [creating, setCreating] = useState(false);
  const list = data?.selections || [];

  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const now = new Date();
  const withStatus = list.map((s) => ({ ...s, st: effectiveStatus(s, now) }));
  const delivered = new Set((data?.deliveries || []).map((d) => d.selectionId).filter(Boolean));
  const needs = (s) => {
    if (s.st === "draft") return s.photos.length ? "Pronta para liberar ao cliente" : "Suba as fotos do ensaio";
    if (s.st === "finished") return delivered.has(s.id) ? null : "Cliente escolheu: editar e criar a entrega";
    if (s.st === "expired") return "Prazo venceu: estender ou encerrar";
    const left = daysLeft(s.expiresAt, now);
    if (left != null && left <= 2) return left === 0 ? "Prazo acaba hoje" : `Prazo acaba em ${left} dia(s)`;
    return null;
  };
  const previewBytes = list.reduce((t, s) => t + s.photos.reduce((a, p) => a + p.previewSize + p.thumbSize, 0), 0);
  const deliveryBytes = (data?.deliveries || []).reduce((t, d) => t + (d.files || []).reduce((a, f) => a + (f.size || 0), 0), 0);

  return (
    <>
      {confirmUI}
      <AdminHeader title="Seleção de fotos"
        text="Crie uma página para cada ensaio, suba as fotos (viram prévias leves em WebP) e mande o link para o cliente escolher as favoritas."
        actions={<button className="btn-primary" onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Nova seleção</button>} />
      <DemoBanner />

      {!list.length ? (
        <EmptyState icon={Heart} title="Nenhuma seleção ainda"
          text="Ex.: você fotografou 200 fotos e o pacote dá direito a 100. Crie a página, suba as 200 e o cliente marca as 100 que quer."
          action={<button className="btn-primary" onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Criar primeira seleção</button>} />
      ) : (
        <ClientList items={withStatus} kind="selection" base="/adm/selecao" statusMap={SELECTION_STATUS}
          filters={SEL_FILTERS} needs={needs} progress={(s) => `${s.selectedIds.length}/${s.photoLimit} escolhidas · ${s.photos.length} fotos`}
          empty="Nada aqui." />
      )}

      <div className="mt-8"><StorageMeter bytes={previewBytes + deliveryBytes} /></div>

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
