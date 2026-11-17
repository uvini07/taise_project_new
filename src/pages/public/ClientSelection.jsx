// Página do CLIENTE para escolher as fotos (sem login). O acesso é só pelo
// link único (o id aleatório da seleção). As fotos vêm do R2 por links
// temporários e são desenhadas embaralhadas no canvas (proteção contra cópia).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Check, ChevronLeft, ChevronRight, Heart, ShieldCheck, X } from "lucide-react";
import { AntiPiracyNotice, ProtectedImg, ProtectionShield, ScrambledImage, useLiveWatermark } from "../../components/selection/Protected.jsx";
import { useCopyProtection } from "../../hooks/useCopyProtection.js";
import PageLoader from "../../components/common/PageLoader.jsx";
import PasswordGate from "../../components/selection/PasswordGate.jsx";
import { clienteApi as rawApi, savePass, savedPass } from "../../services/clienteApi.js";
import { deadlineLabel } from "../../utils/clientGallery.js";

export default function ClientSelection() {
  const { studio = "", id = "" } = useParams();
  const [state, setState] = useState({ loading: true, error: null, data: null, needPassword: false });
  const pass = useRef(savedPass(id));
  const clienteApi = useCallback((body) => rawApi({ ...body, password: pass.current || undefined }), []);
  const [picked, setPicked] = useState(() => new Set());
  const [view, setView] = useState(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [notice, setNotice] = useState(() => { try { return !sessionStorage.getItem(`revela-aviso-${id}`); } catch { return true; } });
  const closeNotice = () => { setNotice(false); try { sessionStorage.setItem(`revela-aviso-${id}`, "1"); } catch { /* sem storage */ } };
  const saveTimer = useRef(null);

  const load = useCallback(async () => {
    setState((x) => ({ ...x, loading: !x.needPassword, error: null }));
    try {
      const data = await clienteApi({ action: "gallery", kind: "selecao", studio, id });
      setPicked(new Set(data.selectedIds || []));
      setDone(!!data.finished);
      setState({ loading: false, error: null, data, needPassword: false });
    } catch (e) {
      if (e.needPassword) { savePass(id, ""); pass.current = ""; }
      setState({ loading: false, error: e.message, data: null, needPassword: !!e.needPassword });
    }
  }, [studio, id, clienteApi]);
  const tryPassword = async (p) => { pass.current = p; savePass(id, p); await load(); };
  useEffect(() => { load(); }, [load]);

  const data = state.data;
  const protect = data?.copyProtection !== false;
  const viewRef = useRef(null);
  viewRef.current = view;
  const onCapture = useCallback((type) => {
    clienteApi({ action: "event", kind: "selecao", studio, id, type, photoIndex: viewRef.current ?? undefined }).catch(() => {});
  }, [clienteApi, studio, id]);
  const { shielded, reason } = useCopyProtection(!!data && protect && !done, onCapture);
  const [stamp] = useState(() => new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }));
  const overlay = useLiveWatermark(data && protect ? `${data.clientName || "cliente"} · ${stamp}` : null);

  const photos = data?.photos || [];
  const limit = Number(data?.photoLimit) || photos.length;
  const allowExtras = !!data?.allowExtras && !!data?.photoLimit;
  const extras = allowExtras ? Math.max(0, picked.size - limit) : 0;
  const over = picked.size > limit;
  const brl = (c) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // Salva as escolhas sozinho, pouco depois de parar de mexer.
  const persist = useCallback((ids) => {
    if (done) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      try { await clienteApi({ action: "pick", kind: "selecao", studio, id, selectedIds: [...ids] }); }
      catch { /* tenta de novo no próximo toque */ }
      finally { setSaving(false); }
    }, 900);
  }, [studio, id, done]);

  const toggle = useCallback((pid) => {
    if (done) return;
    setPicked((s) => {
      const n = new Set(s);
      if (n.has(pid)) n.delete(pid);
      else { if (limit && !allowExtras && n.size >= limit) return s; n.add(pid); }
      persist(n);
      return n;
    });
  }, [done, limit, allowExtras, persist]);

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

  async function finish() {
    if (!picked.size) return;
    setSaving(true);
    try {
      clearTimeout(saveTimer.current);
      await clienteApi({ action: "finish", kind: "selecao", studio, id, selectedIds: [...picked] });
      setDone(true); setView(null);
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  }

  if (state.loading) return <PageLoader full />;
  if (state.needPassword) return <PasswordGate error={pass.current === "" && state.error?.startsWith("Digite") ? null : state.error} onSubmit={tryPassword} />;
  if (state.error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-ivory px-6 text-center">
        <ShieldCheck className="h-10 w-10 text-gold" strokeWidth={1.3} />
        <h1 className="font-display text-3xl">Ops</h1>
        <p className="max-w-sm text-sm text-ink-muted">{state.error}</p>
      </div>
    );
  }

  const current = view != null ? photos[view] : null;

  return (
    <div className="min-h-screen bg-paper">
      <AntiPiracyNotice open={notice && !done} onClose={closeNotice} />
      <ProtectionShield show={shielded && !notice} reason={reason} brand={data.clientName} />
      <header className="sticky top-0 z-30 flex flex-wrap items-center gap-3 border-b border-ink/10 bg-paper/95 px-4 py-3 backdrop-blur sm:px-8">
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-2xl sm:text-3xl">{data.clientName || "Sua seleção"}</h1>
          {data.title && <p className="truncate text-sm text-ink-muted">{data.title}</p>}
        </div>
        {!done && (
          <div className={`rounded-full px-4 py-2 text-sm font-medium ${over && !allowExtras ? "bg-warning/15 text-warning" : "bg-wine-900 text-cream"}`}>
            <Heart className="mr-1.5 inline h-4 w-4 fill-current align-[-3px]" />
            {picked.size}{limit ? ` de ${limit}` : ""} escolhidas{extras ? ` (+${extras})` : ""}
          </div>
        )}
      </header>

      {data.expiresAt && !done && (
        <p className="px-4 pt-3 text-xs text-ink-muted sm:px-8">Prazo para escolher: {deadlineLabel(new Date(data.expiresAt))}.</p>
      )}
      {!done && allowExtras && (
        <p className={`mx-4 mt-3 max-w-2xl rounded-2xl p-3 text-sm sm:mx-8 ${extras ? "bg-warning/10 text-ink" : "bg-surface text-ink-soft"}`}>
          {extras
            ? <>Você escolheu <strong>{extras} foto(s) extra(s)</strong> além das {limit} do pacote{data.extraPriceCents ? <> · <strong>{brl(extras * data.extraPriceCents)}</strong> ({brl(data.extraPriceCents)} cada)</> : null}.</>
            : <>Seu pacote inclui {limit} fotos. Você pode escolher mais{data.extraPriceCents ? ` por ${brl(data.extraPriceCents)} cada foto extra` : " (as extras são cobradas à parte)"}.</>}
        </p>
      )}
      {data.message && <p className="mx-4 mt-3 max-w-2xl rounded-2xl bg-surface p-4 text-sm text-ink-soft sm:mx-8">{data.message}</p>}

      {done ? (
        <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success"><Check className="h-7 w-7" /></div>
          <h2 className="font-display text-3xl">Seleção enviada!</h2>
          <p className="max-w-sm text-sm text-ink-muted">Você escolheu {picked.size} foto(s). A fotógrafa já recebeu sua escolha. Pode fechar esta página.</p>
        </div>
      ) : (
        <>
          <div className="protect-area px-4 pb-28 pt-4 sm:px-8">
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
              {photos.map((p, i) => {
                const on = picked.has(p.id);
                return (
                  <li key={p.id} className="group relative">
                    <button type="button" onClick={() => setView(i)} className="block w-full overflow-hidden rounded-xl bg-surface" aria-label={`Abrir foto ${i + 1}`}>
                      <ProtectedImg src={p.thumb} scramble={p.thumbScramble} overlay={overlay} className="aspect-[4/5]" fit="cover" />
                    </button>
                    <button type="button" onClick={() => toggle(p.id)} aria-pressed={on}
                      className={`absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full border transition ${on ? "border-rose bg-rose text-white" : "border-white/70 bg-black/30 text-white hover:bg-black/50"}`}
                      aria-label={on ? "Remover das escolhidas" : "Escolher esta foto"}>
                      <Heart className={`h-4 w-4 ${on ? "fill-current" : ""}`} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-ink/10 bg-paper/95 px-4 py-3 backdrop-blur sm:px-8">
            <p className="text-xs text-ink-muted">{saving ? "Salvando…" : !allowExtras && data.photoLimit && picked.size >= limit ? `Você chegou ao limite de ${limit} fotos. Desmarque uma para trocar.` : "Suas escolhas são salvas automaticamente."}</p>
            <button type="button" onClick={finish} disabled={!picked.size || saving}
              className="btn-primary disabled:opacity-50">Finalizar escolha ({picked.size})</button>
          </div>
        </>
      )}

      {current && (
        <div className="fixed inset-0 z-[80] flex flex-col bg-black/90" role="dialog" aria-modal="true">
          <div className="flex items-center justify-between px-4 py-2 text-cream">
            <span className="text-sm">{view + 1} / {photos.length}</span>
            <button onClick={() => setView(null)} className="rounded-full p-2 hover:bg-white/10" aria-label="Fechar"><X className="h-5 w-5" /></button>
          </div>
          <div className="protect-area relative flex flex-1 items-center justify-center overflow-hidden px-2" onContextMenu={(e) => e.preventDefault()}>
            <button onClick={() => setView((v) => (v - 1 + photos.length) % photos.length)} className="absolute left-2 z-10 rounded-full bg-black/40 p-2 text-cream hover:bg-black/60" aria-label="Anterior"><ChevronLeft className="h-6 w-6" /></button>
            <div className="relative">
              <ScrambledImage src={current.full} scramble={current.fullScramble} fit="contain" label={`Foto ${view + 1}`} className="block max-h-[80vh] max-w-[92vw]" />
              {overlay && <span className="pointer-events-none absolute inset-0" style={{ backgroundImage: overlay, backgroundSize: "360px 180px" }} aria-hidden />}
            </div>
            <button onClick={() => setView((v) => (v + 1) % photos.length)} className="absolute right-2 z-10 rounded-full bg-black/40 p-2 text-cream hover:bg-black/60" aria-label="Próxima"><ChevronRight className="h-6 w-6" /></button>
          </div>
          <div className="flex items-center justify-center py-4">
            <button type="button" onClick={() => toggle(current.id)}
              className={`flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition ${picked.has(current.id) ? "bg-rose text-white" : "bg-white/90 text-ink hover:bg-white"}`}>
              <Heart className={`h-4 w-4 ${picked.has(current.id) ? "fill-current" : ""}`} />
              {picked.has(current.id) ? "Escolhida" : "Escolher esta foto"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
