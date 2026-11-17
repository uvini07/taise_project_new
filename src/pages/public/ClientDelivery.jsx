// Página do CLIENTE para ver e baixar as fotos em alta (sem login), em formato
// de galeria: capa, grade de fotos e "Baixar todas". Os arquivos ficam no R2 e
// são baixados por links temporários.
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Download, FileDown, Loader2, PackageCheck, X } from "lucide-react";
import { Zip, ZipPassThrough } from "fflate";
import PageLoader from "../../components/common/PageLoader.jsx";
import GalleryCover from "../../components/selection/GalleryCover.jsx";
import PasswordGate from "../../components/selection/PasswordGate.jsx";
import { clienteApi as rawApi, savePass, savedPass } from "../../services/clienteApi.js";
import { formatBytes, deadlineLabel } from "../../utils/clientGallery.js";

const SHARE_BATCH = 20; // o iPhone/Android salva no máximo uns 20 arquivos por vez com segurança

function canShareFiles() {
  try { return !!navigator.canShare?.({ files: [new File([""], "a.jpg", { type: "image/jpeg" })] }); } catch { return false; }
}
function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
function zipName(data) {
  return `${(data.clientName || data.title || "fotos").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w-]+/g, "-").replace(/^-|-$/g, "") || "fotos"}.zip`;
}

export default function ClientDelivery() {
  const { studio = "", id = "" } = useParams();
  const [state, setState] = useState({ loading: true, error: null, data: null, needPassword: false });
  const pass = useRef(savedPass(id));
  const clienteApi = useCallback((body) => rawApi({ ...body, password: pass.current || undefined }), []);
  const [busy, setBusy] = useState(null);
  const [view, setView] = useState(null);
  // Baixar todas: { done, total, ready: [{ files, label }] , error }
  const [bulk, setBulk] = useState(null);

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

  const files = state.data?.files || [];
  const photos = files.filter((f) => f.thumb);
  const others = files.filter((f) => !f.thumb);

  useEffect(() => {
    const onKey = (e) => {
      if (view == null) return;
      if (e.key === "Escape") setView(null);
      if (e.key === "ArrowRight") setView((v) => (v + 1) % photos.length);
      if (e.key === "ArrowLeft") setView((v) => (v - 1 + photos.length) % photos.length);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [view, photos.length]);

  const linkFor = (fileId) => clienteApi({ action: "download", kind: "entrega", studio, id, fileId }).then((r) => r.url);

  async function download(fileId) {
    setBusy(fileId);
    try {
      const url = await linkFor(fileId);
      const a = document.createElement("a");
      a.href = url; a.rel = "noopener";
      document.body.appendChild(a); a.click(); a.remove();
    } catch (e) { alert(e.message); }
    finally { setBusy(null); }
  }

  async function fetchFile(f) {
    const r = await fetch(await linkFor(f.id));
    if (!r.ok) throw new Error(`Não foi possível baixar ${f.name}.`);
    return r;
  }

  // Celular: junta as fotos e abre o "Salvar imagens" do sistema (vai para a galeria).
  // Computador: um único .zip com tudo.
  async function downloadAll() {
    const list = files;
    if (!list.length || bulk?.running) return;
    const mobile = canShareFiles();
    setBulk({ running: true, done: 0, total: list.length, ready: [] });
    try {
      if (mobile) {
        let batch = [];
        for (let i = 0; i < list.length; i += 1) {
          const f = list[i];
          const blob = await (await fetchFile(f)).blob();
          batch.push(new File([blob], f.name, { type: blob.type || f.type || "image/jpeg" }));
          if (batch.length === SHARE_BATCH || i === list.length - 1) {
            const from = i - batch.length + 2;
            const ready = { files: batch, label: list.length > SHARE_BATCH ? `Salvar fotos ${from}–${i + 1}` : `Salvar ${batch.length} foto(s)` };
            setBulk((b) => ({ ...b, ready: [...b.ready, ready] }));
            batch = [];
          }
          setBulk((b) => ({ ...b, done: i + 1 }));
        }
      } else {
        const parts = [];
        const zip = new Zip((err, chunk) => { if (err) throw err; parts.push(chunk); });
        const used = new Set();
        for (let i = 0; i < list.length; i += 1) {
          const f = list[i];
          let name = f.name || `foto-${i + 1}`;
          while (used.has(name)) name = `${i + 1}-${name}`;
          used.add(name);
          const entry = new ZipPassThrough(name);
          zip.add(entry);
          const reader = (await fetchFile(f)).body.getReader();
          for (;;) {
            const { done, value } = await reader.read();
            if (done) { entry.push(new Uint8Array(0), true); break; }
            entry.push(value);
          }
          setBulk((b) => ({ ...b, done: i + 1 }));
        }
        zip.end();
        saveBlob(new Blob(parts, { type: "application/zip" }), zipName(state.data));
      }
      clienteApi({ action: "download", kind: "entrega", studio, id, fileId: list[0].id }).catch(() => {});
      setBulk((b) => ({ ...b, running: false }));
    } catch (e) {
      setBulk((b) => ({ ...b, running: false, error: e.message || "Não foi possível baixar tudo. Tente de novo." }));
    }
  }

  async function shareBatch(i) {
    const item = bulk.ready[i];
    try {
      await navigator.share({ files: item.files });
      setBulk((b) => ({ ...b, ready: b.ready.map((r, k) => (k === i ? { ...r, saved: true } : r)) }));
    } catch (e) { if (e?.name !== "AbortError") alert("Não foi possível abrir o salvar. Tente de novo."); }
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
  const cover = photos.find((f) => f.id === data.coverId) || photos[0];
  const current = view != null ? photos[view] : null;
  const allBtn = (cls) => (
    <button type="button" onClick={downloadAll} disabled={!files.length || bulk?.running} className={cls}>
      {bulk?.running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      {bulk?.running ? `Preparando ${bulk.done}/${bulk.total}` : "Baixar todas"}
    </button>
  );

  return (
    <div className="min-h-screen bg-paper">
      <GalleryCover studioName={data.studioName} title={data.clientName || data.title || "Suas fotos"}
        subtitle={data.clientName && data.title ? data.title : null} hint="Role para ver suas fotos"
        image={cover ? <img src={cover.thumb} alt="" className="object-cover" /> : null}
        action={files.length ? allBtn("flex items-center gap-2 rounded-md bg-black/80 px-4 py-2.5 text-sm text-white backdrop-blur hover:bg-black disabled:opacity-80") : null} />

      <header id="fotos" className="sticky top-0 z-30 flex items-center gap-3 border-b border-ink/10 bg-paper/95 px-4 py-3 backdrop-blur sm:px-8">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{files.length} foto(s)</p>
          {data.expiresAt && <p className="truncate text-xs text-ink-muted">{deadlineLabel(new Date(data.expiresAt))}</p>}
        </div>
        {files.length > 0 && allBtn("btn-primary btn-sm shrink-0 disabled:opacity-60")}
      </header>

      {bulk && (bulk.ready?.length > 0 || bulk.error) && (
        <div className="mx-4 mt-3 rounded-2xl bg-surface p-4 text-sm sm:mx-8">
          {bulk.error ? <p className="text-warning">{bulk.error}</p> : (
            <>
              <p className="text-ink-soft">Toque para salvar no celular{bulk.ready.length > 1 ? " (um grupo por vez)" : ""}:</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {bulk.ready.map((r, i) => (
                  <button key={r.label} type="button" onClick={() => shareBatch(i)} className={r.saved ? "btn-ghost btn-sm" : "btn-primary btn-sm"}>
                    <Download className="h-4 w-4" /> {r.saved ? `${r.label} ✓` : r.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {photos.length > 0 && (
        <div className="columns-2 gap-1.5 px-1.5 pb-10 pt-1.5 sm:columns-3 sm:gap-2 sm:px-2 lg:columns-4">
          {photos.map((f, i) => (
            <button key={f.id} type="button" onClick={() => setView(i)} className="mb-1.5 block w-full overflow-hidden bg-surface sm:mb-2" aria-label={`Abrir ${f.name}`}>
              <img src={f.thumb} alt={f.name} loading="lazy" className="block h-auto w-full"
                style={f.width && f.height ? { aspectRatio: `${f.width} / ${f.height}` } : undefined} />
            </button>
          ))}
        </div>
      )}

      {others.length > 0 && (
        <ul className="divide-y divide-ink/10 px-4 pb-10 sm:px-8">
          {others.map((f) => (
            <li key={f.id} className="flex items-center gap-3 py-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface text-ink-muted"><FileDown className="h-5 w-5" /></div>
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
      )}
      {!files.length && <p className="px-8 py-16 text-center text-sm text-ink-muted">Nenhum arquivo nesta entrega ainda.</p>}

      {current && (
        <div className="fixed inset-0 z-[80] flex flex-col bg-black/95" role="dialog" aria-modal="true">
          <div className="flex items-center justify-between px-4 py-2 text-cream">
            <span className="text-sm">{view + 1} / {photos.length}</span>
            <button onClick={() => setView(null)} className="rounded-full p-2 hover:bg-white/10" aria-label="Fechar"><X className="h-5 w-5" /></button>
          </div>
          <div className="relative flex flex-1 items-center justify-center overflow-hidden px-2">
            <button onClick={() => setView((v) => (v - 1 + photos.length) % photos.length)} className="absolute left-2 z-10 rounded-full bg-black/40 p-2 text-cream hover:bg-black/60" aria-label="Anterior"><ChevronLeft className="h-6 w-6" /></button>
            <img src={current.thumb} alt={current.name} className="max-h-[80vh] max-w-[92vw] object-contain" />
            <button onClick={() => setView((v) => (v + 1) % photos.length)} className="absolute right-2 z-10 rounded-full bg-black/40 p-2 text-cream hover:bg-black/60" aria-label="Próxima"><ChevronRight className="h-6 w-6" /></button>
          </div>
          <div className="flex items-center justify-center py-4">
            <button type="button" onClick={() => download(current.id)} disabled={busy === current.id}
              className="flex items-center gap-2 rounded-full bg-white/90 px-6 py-3 text-sm font-medium text-ink hover:bg-white">
              {busy === current.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Baixar esta foto em alta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
