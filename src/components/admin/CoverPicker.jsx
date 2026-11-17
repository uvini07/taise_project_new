// Escolha da foto de capa da galeria do cliente (seleção ou entrega).
// A capa é enviada limpa, sem marca d'água, só para abrir a galeria.
import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { setGalleryCover } from "../../services/admin/clientPages.js";
import { useToast } from "../../contexts/ToastContext.jsx";

export default function CoverPicker({ kind, item, onSaved }) {
  const input = useRef(null);
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);
  const has = !!(preview || item?.cover?.key);

  async function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      setPreview(await setGalleryCover(kind, item.id, file));
      toast.success("Foto de capa salva.");
      onSaved?.();
    } catch (err) { toast.error(err.message || "Não foi possível salvar a capa."); }
    finally { setBusy(false); }
  }

  return (
    <div className="card mb-6 flex items-center gap-4 p-4">
      <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface text-ink-muted">
        {preview ? <img src={preview} alt="Capa" className="h-full w-full object-cover" /> : <ImagePlus className="h-6 w-6" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">Foto de capa</p>
        <p className="text-xs text-ink-muted">{has ? "Capa definida. Ela abre a galeria do cliente, sem marca d'água." : "Escolha a foto que abre a galeria do cliente (aparece sem marca d'água). Sem capa, usamos a primeira foto."}</p>
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={pick} />
      <button type="button" className="btn-ghost btn-sm shrink-0" disabled={busy} onClick={() => input.current?.click()}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />} {has ? "Trocar" : "Escolher capa"}
      </button>
    </div>
  );
}
