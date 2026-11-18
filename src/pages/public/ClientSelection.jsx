// Página do CLIENTE para escolher as fotos (sem login). O acesso é só pelo
// link único (o id aleatório da seleção). As fotos vêm do R2 por links
// temporários e são desenhadas embaralhadas no canvas (proteção contra cópia).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Check, ChevronLeft, ChevronRight, Heart, MessageCircle, ShieldCheck, X } from "lucide-react";
import { AntiPiracyNotice, ProtectedImg, ProtectionShield, ScrambledImage, useLiveWatermark } from "../../components/selection/Protected.jsx";
import { useCopyProtection } from "../../hooks/useCopyProtection.js";
import PageLoader from "../../components/common/PageLoader.jsx";
import GalleryCover from "../../components/selection/GalleryCover.jsx";
import PasswordGate from "../../components/selection/PasswordGate.jsx";
import { clienteApi as rawApi, savePass, savedPass } from "../../services/clienteApi.js";
import { deadlineLabel } from "../../utils/clientGallery.js";

export default function ClientSelection() {
  const { studio = "", id = "" } = useParams();
  const [state, setState] = useState({ loading: true, error: null, data: null, needPassword: false });
  const pass = useRef(savedPass(id));
  const clienteApi = useCallback((body) => rawApi({ ...body, password: pass.current || undefined }), []);
  const [picked, setPicked] = useState(() => new Set());
  // Comentários do cliente por foto ("deixa sem edição", "tira a espinha"…).
  const [comments, setComments] = useState({});
  const [draft, setDraft] = useState(null); // texto em edição na foto aberta (null = fechado)
  const [savingNote, setSavingNote] = useState(false);
  const [view, setView] = useState(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [notice, setNotice] = useState(() => { try { return !sessionStorage.getItem(`revela-aviso-${id}`); } catch { return true; } });
  const closeNotice = () => { setNotice(false); try { sessionStorage.setItem(`revela-aviso-${id}`, "1"); } catch { /* sem storage */ } };
  const saveTimer = useRef(null);
  // O aviso de proteção espera a abertura da capa terminar.
  const [introDone, setIntroDone] = useState(false);
  // A barra de baixo só aparece depois que o cliente sai da capa.
  const [pastCover, setPastCover] = useState(false);
  useEffect(() => {
    const on = () => setPastCover(window.scrollY > window.innerHeight * 0.6);
    on(); window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  // Aviso quando passa do limite do pacote (uma vez) ou tenta passar sem extras.
  const [limitAlert, setLimitAlert] = useState(null);
  const warned = useRef(false);
  useEffect(() => { const t = setTimeout(() => setIntroDone(true), 3400); return () => clearTimeout(t); }, []);

  const load = useCallback(async () => {
    setState((x) => ({ ...x, loading: !x.needPassword, error: null }));
    try {
      const data = await clienteApi({ action: "gallery", kind: "selecao", studio, id });
      setPicked(new Set(data.selectedIds || []));
      setComments(Object.fromEntries(Object.entries(data.comments || {}).map(([k, v]) => [k, v?.text || ""]).filter(([, v]) => v)));
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
      else {
        if (limit && !allowExtras && n.size >= limit) { setLimitAlert("block"); return s; }
        n.add(pid);
        if (allowExtras && n.size === limit + 1 && !warned.current) { warned.current = true; setLimitAlert("extra"); }
      }
      persist(n);
      return n;
    });
  }, [done, limit, allowExtras, persist]);

  useEffect(() => {
    const onKey = (e) => {
      if (view == null) return;
      if (e.target?.tagName === "TEXTAREA") return; // digitando o comentário
      if (e.key === "Escape") setView(null);
      if (e.key === "ArrowRight") setView((v) => (v + 1) % photos.length);
      if (e.key === "ArrowLeft") setView((v) => (v - 1 + photos.length) % photos.length);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [view, photos.length]);

  useEffect(() => { setDraft(null); }, [view]);

  async function saveNote(pid, text) {
    setSavingNote(true);
    try {
      const r = await clienteApi({ action: "comment", kind: "selecao", studio, id, photoId: pid, text });
      setComments((c) => { const n = { ...c }; if (r.text) n[pid] = r.text; else delete n[pid]; return n; });
      setDraft(null);
    } catch (e) { alert(e.message); }
    finally { setSavingNote(false); }
  }

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
  const cover = photos.find((p) => p.id === data.coverId) || photos[0];

  return (
    <div className="min-h-screen bg-paper">
      <AntiPiracyNotice open={notice && !done && introDone} onClose={closeNotice} />
      <ProtectionShield show={shielded && !notice} reason={reason} brand={data.clientName} />
      <GalleryCover studioName={data.studioName} title={data.clientName || data.title || "Sua seleção"}
        subtitle={data.clientName && data.title ? data.title : null}
        hint={done ? "Ver suas fotos" : "Role para escolher suas fotos"}
        image={data.coverUrl ? <img src={data.coverUrl} alt="" className="object-cover" draggable={false} onContextMenu={(e) => e.preventDefault()} />
          : cover ? <ProtectedImg src={cover.full} scramble={cover.fullScramble} className="h-full w-full" fit="cover" /> : null} />
      <header id="fotos" className="sticky top-0 z-30 scroll-mt-0 flex flex-wrap items-center gap-3 border-b border-ink/10 bg-paper/95 px-4 py-3 backdrop-blur sm:px-8">
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
                    {comments[p.id] && (
                      <span className="pointer-events-none absolute bottom-2 left-2 flex max-w-[85%] items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[11px] text-white" title={comments[p.id]}>
                        <MessageCircle className="h-3 w-3 shrink-0" /><span className="truncate">{comments[p.id]}</span>
                      </span>
                    )}
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

          <div className={`fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-paper/95 px-4 py-2 backdrop-blur transition-transform duration-300 sm:px-8 ${pastCover ? "translate-y-0" : "translate-y-full"}`}
            style={{ paddingBottom: "max(.5rem, env(safe-area-inset-bottom))" }}>
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1 leading-tight">
                <p className={`truncate text-sm font-medium ${extras ? "text-warning" : "text-ink"}`}>
                  <Heart className="mr-1 inline h-3.5 w-3.5 fill-current align-[-2px] text-rose" />
                  {picked.size}{data.photoLimit ? ` de ${limit}` : ""}{extras ? ` · +${extras} extra${extras > 1 ? "s" : ""}` : ""}
                </p>
                <p className="truncate text-[11px] text-ink-muted">
                  {saving ? "Salvando…"
                    : extras ? (data.extraPriceCents ? `Extras: ${brl(extras * data.extraPriceCents)} (${brl(data.extraPriceCents)} cada)` : "Fotos extras são cobradas à parte")
                    : allowExtras ? (data.extraPriceCents ? `Foto extra: ${brl(data.extraPriceCents)} cada` : "Pode escolher fotos extras")
                    : data.photoLimit && picked.size >= limit ? "Limite do pacote atingido" : "Salvo automaticamente"}
                </p>
              </div>
              <button type="button" onClick={finish} disabled={!picked.size || saving}
                className="btn-primary btn-sm shrink-0 disabled:opacity-50">Finalizar ({picked.size})</button>
            </div>
          </div>
        </>
      )}

      {limitAlert && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 p-4 sm:items-center" role="dialog" aria-modal="true" onClick={() => setLimitAlert(null)}>
          <div className="w-full max-w-sm rounded-3xl bg-ivory p-6 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-2xl">{limitAlert === "extra" ? "Você passou do limite do pacote" : "Limite do pacote atingido"}</h2>
            <p className="mt-3 text-sm text-ink-soft">
              {limitAlert === "extra"
                ? <>Seu pacote inclui <strong>{limit} fotos</strong>. As fotos a mais são extras{data.extraPriceCents ? <> e custam <strong>{brl(data.extraPriceCents)} cada</strong></> : " e são cobradas à parte"}. O valor aparece na barra de baixo.</>
                : <>Seu pacote inclui <strong>{limit} fotos</strong>. Para escolher outra, desmarque uma das escolhidas.</>}
            </p>
            <button type="button" onClick={() => setLimitAlert(null)} className="btn-primary mt-6 w-full justify-center">Entendi</button>
          </div>
        </div>
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
          {!done && (
            <div className="mx-auto w-full max-w-md px-4 pt-3 text-cream">
              {draft == null ? (
                <button type="button" onClick={() => setDraft(comments[current.id] || "")}
                  className="flex w-full items-center gap-2 rounded-2xl bg-white/10 px-4 py-2.5 text-left text-sm hover:bg-white/15">
                  <MessageCircle className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{comments[current.id] || "Adicionar um pedido para esta foto"}</span>
                  {comments[current.id] && <span className="text-xs text-cream/70">Editar</span>}
                </button>
              ) : (
                <div className="rounded-2xl bg-white p-3 text-ink">
                  <textarea value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={300} rows={2} autoFocus
                    placeholder="Ex.: gostei dessa, deixa sem editar" className="w-full resize-none rounded-xl border border-ink/10 p-2 text-sm outline-none focus:border-wine-900" />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {["Deixar sem edição", "Tirar espinhas", "Suavizar a pele", "Clarear", "Preto e branco"].map((t) => (
                      <button key={t} type="button" onClick={() => setDraft((d) => (d ? `${d.replace(/[.\s]+$/, "")}. ${t}` : t))}
                        className="rounded-full border border-ink/15 px-2.5 py-1 text-xs text-ink-soft hover:border-wine-900">{t}</button>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-end gap-2">
                    {comments[current.id] && <button type="button" className="mr-auto text-xs text-danger" disabled={savingNote} onClick={() => saveNote(current.id, "")}>Apagar</button>}
                    <button type="button" className="btn-ghost btn-sm" onClick={() => setDraft(null)}>Cancelar</button>
                    <button type="button" className="btn-primary btn-sm" disabled={savingNote} onClick={() => saveNote(current.id, draft)}>{savingNote ? "Salvando…" : "Salvar"}</button>
                  </div>
                </div>
              )}
            </div>
          )}
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
