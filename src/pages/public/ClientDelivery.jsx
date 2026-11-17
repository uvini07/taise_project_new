// Página do CLIENTE para baixar as fotos em alta (sem login). Acesso só pelo
// link único. Os arquivos ficam no R2 e são baixados por links temporários.
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Download, ImageDown, Loader2, PackageCheck } from "lucide-react";
import PageLoader from "../../components/common/PageLoader.jsx";
import PasswordGate from "../../components/selection/PasswordGate.jsx";
import { clienteApi as rawApi, savePass, savedPass } from "../../services/clienteApi.js";
import { formatBytes, deadlineLabel } from "../../utils/clientGallery.js";

export default function ClientDelivery() {
  const { studio = "", id = "" } = useParams();
  const [state, setState] = useState({ loading: true, error: null, data: null, needPassword: false });
  const pass = useRef(savedPass(id));
  const clienteApi = useCallback((body) => rawApi({ ...body, password: pass.current || undefined }), []);
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    setState((x) => ({ ...x, loading: !x.needPassword, error: null }));
    try {
      const data = await clienteApi({ action: "gallery", kind: "entrega", studio, id });
      setState({ loading: false, error: null, data, needPassword: false });
    } catch (e) {
      if (e.needPassword) { savePass(id, ""); pass.current = ""; }
      setState({ loading: false, error: e.message, data: null, needPassword: !!e.needPassword });
    }
  }, [studio, id, clienteApi]);
  const tryPassword = async (p) => { pass.current = p; savePass(id, p); await load(); };
  useEffect(() => { load(); }, [load]);

  async function download(fileId) {
    setBusy(fileId);
    try {
      const { url } = await clienteApi({ action: "download", kind: "entrega", studio, id, fileId });
      const a = document.createElement("a");
      a.href = url; a.rel = "noopener";
      document.body.appendChild(a); a.click(); a.remove();
    } catch (e) { alert(e.message); }
    finally { setBusy(null); }
  }

  async function downloadAll(files) {
    for (const f of files) { await download(f.id); await new Promise((r) => setTimeout(r, 600)); }
  }

  if (state.loading) return <PageLoader full />;
  if (state.needPassword) return <PasswordGate error={pass.current === "" && state.error?.startsWith("Digite") ? null : state.error} onSubmit={tryPassword} />;
  if (state.error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-ivory px-6 text-center">
        <PackageCheck className="h-10 w-10 text-gold" strokeWidth={1.3} />
        <h1 className="font-display text-3xl">Ops</h1>
        <p className="max-w-sm text-sm text-ink-muted">{state.error}</p>
      </div>
    );
  }

  const { data } = state;
  const files = data.files || [];

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-ink/10 bg-paper/95 px-4 py-6 sm:px-8">
        <p className="text-xs uppercase tracking-[.25em] text-ink-muted">Entrega de fotos</p>
        <h1 className="font-display text-3xl sm:text-4xl">{data.clientName || "Suas fotos"}</h1>
        {data.title && <p className="text-sm text-ink-muted">{data.title}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted">
          <span>{files.length} arquivo(s)</span>
          {data.expiresAt && <span>Disponível até {deadlineLabel(new Date(data.expiresAt))}</span>}
        </div>
        {files.length > 1 && (
          <button type="button" onClick={() => downloadAll(files)} disabled={!!busy} className="btn-primary mt-4 disabled:opacity-50">
            <Download className="h-4 w-4" /> Baixar todas
          </button>
        )}
      </header>

      <ul className="divide-y divide-ink/10 px-4 sm:px-8">
        {files.map((f) => (
          <li key={f.id} className="flex items-center gap-3 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface text-ink-muted"><ImageDown className="h-5 w-5" /></div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{f.name}</p>
              {f.size ? <p className="text-xs text-ink-muted">{formatBytes(f.size)}</p> : null}
            </div>
            <button type="button" onClick={() => download(f.id)} disabled={busy === f.id} className="btn-ghost btn-sm shrink-0">
              {busy === f.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Baixar
            </button>
          </li>
        ))}
      </ul>
      {!files.length && <p className="px-8 py-16 text-center text-sm text-ink-muted">Nenhum arquivo nesta entrega ainda.</p>}
    </div>
  );
}
