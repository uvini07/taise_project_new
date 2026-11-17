import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PackageCheck, Plus } from "lucide-react";
import { AdminHeader } from "../../components/admin/AdminUI.jsx";
import { ClientEditor, DemoBanner, StorageMeter } from "../../components/admin/ClientPagesUI.jsx";
import ClientList from "../../components/admin/ClientList.jsx";
import PageLoader from "../../components/common/PageLoader.jsx";
import { EmptyState, ErrorState } from "../../components/common/States.jsx";
import { useConfirm } from "../../components/common/useConfirm.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";
import { useAsync } from "../../hooks/useAsync.js";
import { listDeliveries, listSelections, saveDelivery, takenSlugs } from "../../services/admin/clientPages.js";
import { DELIVERY_STATUS } from "../../config/constants.js";
import { daysLeft, effectiveStatus, formatBytes } from "../../utils/clientGallery.js";

const DEL_FILTERS = [
  { key: "acao", label: "Precisa de você", test: (d) => !!d.need, empty: "Tudo em dia por aqui. 🎉" },
  { key: "disponiveis", label: "Aguardando download", test: (d) => d.st === "available", empty: "Nenhuma entrega aguardando download." },
  { key: "baixadas", label: "Baixadas", test: (d) => d.st === "downloaded", empty: "Nenhuma entrega baixada ainda." },
  { key: "preparando", label: "Preparando", test: (d) => d.st === "draft", empty: "Nenhuma entrega em preparo." },
  { key: "expiradas", label: "Expiradas", test: (d) => d.st === "expired", empty: "Nenhuma entrega expirada." },
  { key: "todas", label: "Todas", test: () => true },
];

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
  const needs = (d) => {
    if (d.st === "draft") return d.files.length ? "Pronta para liberar o download" : "Suba as fotos editadas";
    const left = daysLeft(d.expiresAt, now);
    if (d.st === "available" && left != null && left <= 3) return `Cliente ainda não baixou · ${left === 0 ? "vence hoje" : `vence em ${left} dia(s)`}`;
    return null;
  };
  // Total guardado no Cloudflare: prévias de seleção + arquivos de entrega.
  const selBytes = data.selections.reduce((t, s) => t + (s.photos || []).reduce((a, p) => a + (p.previewSize || 0) + (p.thumbSize || 0), 0), 0);
  const delBytes = list.reduce((t, d) => t + d.bytes, 0);

  return (
    <>
      {confirmUI}
      <AdminHeader title="Entrega final"
        text="Suba as fotos editadas em alta qualidade e mande o link para o cliente baixar. Os arquivos ficam disponíveis pelo prazo que você definir."
        actions={<button className="btn-primary" onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Nova entrega</button>} />
      <DemoBanner />

      {!list.length ? (
        <EmptyState icon={PackageCheck} title="Nenhuma entrega ainda"
          text="Depois que o cliente escolher as fotos e você editar, crie a entrega aqui (ou direto pela seleção, em “Criar entrega final”)."
          action={<button className="btn-primary" onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Criar primeira entrega</button>} />
      ) : (
        <ClientList items={list} kind="delivery" base="/adm/entrega" statusMap={DELIVERY_STATUS}
          filters={DEL_FILTERS} needs={needs} progress={(d) => `${d.files.length} arquivo(s) · ${formatBytes(d.bytes)}${d.downloads ? ` · ${d.downloads} download(s)` : ""}`}
          empty="Nada aqui." />
      )}

      <div className="mt-8"><StorageMeter bytes={selBytes + delBytes} /></div>

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
