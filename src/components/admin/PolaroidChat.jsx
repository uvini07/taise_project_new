// Janela da Polaroidy, a assistente da fotógrafa. Abre pela lateral do painel.
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUp, Check, Loader2, Mic, MicOff, RotateCcw, ThumbsDown, ThumbsUp, X } from "lucide-react";
import PolaroidyMascot, { PolaroidyWaving } from "./PolaroidyMascot.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useSettings } from "../../contexts/SettingsContext.jsx";
import { WhatsAppIcon } from "../common/Icons.jsx";
import { askPolaroid, parseLine, runAction, sendFeedback } from "../../services/polaroid.js";
import { currentStudio } from "../../config/tenant.js";
import { todayKey } from "../../utils/format.js";

const BASE_SUGGESTIONS = ["Quais são minhas agendas hoje?", "Quanto faturei este mês?", "Tenho horário livre sábado?", "Me dá 3 dicas para vender mais", "Onde eu troco a foto do topo do site?"];

/** Sugestões que mudam conforme o dia (o que precisa de atenção vem primeiro). */
function suggestionsFor(s) {
  const out = [];
  if (s?.requests) out.push("Tem pedido esperando confirmação?");
  if (s?.overdueCount) out.push("Quem ainda não me pagou?");
  if (s?.tomorrow) out.push("Prepara o lembrete para as clientes de amanhã");
  return [...out, ...BASE_SUGGESTIONS].slice(0, 5);
}

/** Texto da IA com **negrito**, listas e links internos do painel. */
function Rich({ text, onNavigate }) {
  return (
    <div className="space-y-1.5">
      {text.split("\n").filter((l, i, a) => l.trim() || (i > 0 && a[i - 1].trim())).map((raw, i) => {
        const bullet = /^\s*[-•*]\s+/.test(raw);
        const line = raw.replace(/^\s*[-•*]\s+/, "");
        if (!line.trim()) return <div key={i} className="h-1" />;
        const parts = parseLine(line).map((p, k) => (
          p.t === "bold" ? <b key={k} className="font-medium">{p.v}</b>
            : p.t === "link" ? (p.href.startsWith("/adm")
              ? <Link key={k} to={p.href} onClick={onNavigate} className="font-medium text-[#C95D63] underline underline-offset-2">{p.v}</Link>
              : <span key={k}>{p.v}</span>)
              : <span key={k}>{p.v}</span>
        ));
        return bullet ? <p key={i} className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-current opacity-60" /><span className="min-w-0">{parts}</span></p> : <p key={i}>{parts}</p>;
      })}
    </div>
  );
}

/** Botão de ação: só executa quando a fotógrafa toca. */
function ActionButton({ action }) {
  const [state, setState] = useState({ busy: false, done: "", error: "" });
  async function go() {
    setState({ busy: true, done: "", error: "" });
    try { setState({ busy: false, done: await runAction(action), error: "" }); } catch (e) { setState({ busy: false, done: "", error: e.message || "Não deu certo." }); }
  }
  if (state.done) return <p className="flex items-center gap-2 rounded-xl bg-[#2F6B5C]/10 px-3 py-2 text-[13px] font-medium text-[#2F6B5C]"><Check className="h-4 w-4" />{state.done}</p>;
  return (
    <div>
      <button type="button" onClick={go} disabled={state.busy}
        className="flex w-full items-center gap-2 rounded-xl bg-[#2B2540] px-3 py-2 text-left text-[13px] font-medium text-white hover:bg-[#3a3254] disabled:opacity-60">
        {state.busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {action.label}
      </button>
      {state.error && <p className="mt-1 text-[12px] text-[#9b3d43]">{state.error}</p>}
    </div>
  );
}

const storeKey = (uid) => `polaroidy:${currentStudio()}:${uid || "anon"}`;
function loadSaved(uid) {
  try {
    const raw = JSON.parse(localStorage.getItem(storeKey(uid)) || "null");
    // A conversa guardada vale só para o mesmo dia.
    if (raw && raw.day === todayKey() && Array.isArray(raw.history) && Array.isArray(raw.chat)) return raw;
  } catch { /* ignora */ }
  return { history: [], chat: [] };
}

/** Microfone (ditado do navegador, em português). */
function useDictation(onText) {
  const rec = useRef(null);
  const [on, setOn] = useState(false);
  const Speech = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
  function toggle() {
    if (on) { rec.current?.stop(); return; }
    const r = new Speech();
    r.lang = "pt-BR"; r.interimResults = false; r.maxAlternatives = 1;
    r.onresult = (e) => onText(e.results[0][0].transcript);
    r.onend = () => setOn(false);
    r.onerror = () => setOn(false);
    rec.current = r; setOn(true); r.start();
  }
  return { supported: !!Speech, on, toggle };
}

export default function PolaroidChat({ open, onClose, summary }) {
  const { admin, user } = useAuth();
  const { settings } = useSettings();
  const uid = user?.uid;
  const [history, setHistory] = useState(() => loadSaved(uid).history); // formato da API
  const [chat, setChat] = useState(() => loadSaved(uid).chat); // o que aparece na tela
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef(null);
  const field = useRef(null);
  const mic = useDictation((t) => setInput((v) => (v ? `${v} ${t}` : t)));

  useEffect(() => {
    try { localStorage.setItem(storeKey(uid), JSON.stringify({ day: todayKey(), history: history.slice(-40), chat: chat.slice(-30) })); } catch { /* sem espaço */ }
  }, [history, chat, uid]);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [chat, busy, open]);
  useEffect(() => { if (open && window.matchMedia("(min-width: 768px)").matches) setTimeout(() => field.current?.focus(), 200); }, [open]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const firstName = (admin?.name || user?.displayName || "").split(" ")[0];
  const context = {
    today: todayKey(),
    weekday: new Date().toLocaleDateString("pt-BR", { weekday: "long" }),
    studioName: admin?.studioName || settings.brandName,
    firstName,
  };
  const long = history.length > 40;
  const hour = new Date().getHours();
  const hello = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  async function send(text) {
    const q = String(text || "").trim();
    if (!q || busy || long) return;
    setInput("");
    setChat((c) => [...c, { who: "eu", text: q }]);
    setBusy(true);
    try {
      const r = await askPolaroid(history, q, context);
      setHistory(r.history);
      setChat((c) => [...c, { who: "polaroid", text: r.text, q, charges: r.ui.charges, links: r.ui.links, actions: r.ui.actions }]);
    } catch (e) {
      setChat((c) => [...c, { who: "polaroid", text: e.message || "A Polaroidy não respondeu agora.", error: true }]);
    } finally {
      setBusy(false);
    }
  }
  function rate(i, good) {
    setChat((c) => c.map((m, k) => (k === i ? { ...m, rated: good ? "up" : "down" } : m)));
    sendFeedback(good, chat[i]?.q);
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[65]" role="dialog" aria-modal="true" aria-label="Polaroidy, sua assistente">
      <div className="absolute inset-0 animate-fade-in bg-[#2B2540]/30" onClick={onClose} aria-hidden />
      {/* Identidade da Revela (não muda com as cores do estúdio). */}
      <section className="absolute inset-y-0 right-0 flex w-full max-w-[420px] animate-fade-in flex-col bg-[#F7F5FA] text-[#2B2540] shadow-lift">
        <header className="flex items-center gap-3 bg-[#2B2540] px-4 py-3 text-[#E6E1F0]">
          <PolaroidyMascot className="h-11 w-11 overflow-hidden rounded-full ring-2 ring-[#E6E1F0]/30" />
          <div className="flex-1">
            <p className="font-revela text-2xl leading-none text-white">Polaroidy</p>
            <p className="mt-1 text-xs text-[#E6E1F0]/70">Sua assistente da Revela. Nada muda sem o seu toque.</p>
          </div>
          {chat.length > 0 && (
            <button type="button" onClick={() => { setHistory([]); setChat([]); }} className="rounded-full p-2 text-[#E6E1F0] hover:bg-white/10" aria-label="Nova conversa" title="Nova conversa"><RotateCcw className="h-4 w-4" /></button>
          )}
          <button type="button" onClick={onClose} className="rounded-full p-2 text-[#E6E1F0] hover:bg-white/10" aria-label="Fechar"><X className="h-5 w-5" /></button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
          {!chat.length && (
            <div>
              <PolaroidyWaving className="mx-auto mb-2 !block h-36 w-36" />
              <p className="text-[15px]">{hello}{firstName ? `, ${firstName}` : ""}! Sou a <b className="font-medium">Polaroidy</b>.</p>
              {summary && (
                <div className="mt-3 space-y-1.5 rounded-2xl bg-white px-4 py-3 text-sm shadow-soft">
                  <p className="text-xs uppercase tracking-wider text-[#8E86A6]">Seu dia</p>
                  <p>{summary.today.length ? <>Hoje: <b className="font-medium">{summary.today.join(" · ")}</b></> : "Nenhum ensaio hoje."}</p>
                  {summary.tomorrow > 0 && <p>Amanhã: <b className="font-medium">{summary.tomorrow} ensaio{summary.tomorrow > 1 ? "s" : ""}</b></p>}
                  {summary.requests > 0 && <p className="text-[#9b3d43]">{summary.requests} pedido{summary.requests > 1 ? "s" : ""} esperando confirmação</p>}
                  {summary.overdueCount > 0 && <p className="text-[#9b3d43]">{summary.overdue} vencido{summary.overdueCount > 1 ? "s" : ""} ({summary.overdueCount} cliente{summary.overdueCount > 1 ? "s" : ""})</p>}
                  {!summary.requests && !summary.overdueCount && <p className="text-[#2F6B5C]">Nada pendente. Tudo em dia!</p>}
                </div>
              )}
              <p className="mt-5 text-xs uppercase tracking-wider text-[#8E86A6]">Experimente</p>
              <div className="mt-2 flex flex-col gap-2">
                {suggestionsFor(summary).map((s) => (
                  <button key={s} type="button" onClick={() => send(s)} className="rounded-2xl border border-[#E6E1F0] bg-white px-4 py-2.5 text-left text-sm hover:border-[#C95D63]/50">{s}</button>
                ))}
              </div>
            </div>
          )}
          {chat.map((m, i) => (
            m.who === "eu" ? (
              <p key={i} className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-[#2B2540] px-4 py-2.5 text-sm text-[#F7F5FA]">{m.text}</p>
            ) : (
              <div key={i} className="max-w-[92%]">
                <div className={`rounded-2xl rounded-bl-md px-4 py-3 text-sm leading-relaxed ${m.error ? "bg-[#C95D63]/10 text-[#9b3d43]" : "bg-white shadow-soft"}`}>
                  <Rich text={m.text} onNavigate={onClose} />
                  {(m.charges?.length > 0 || m.links?.length > 0 || m.actions?.length > 0) && (
                    <div className="mt-3 flex flex-col gap-2 border-t border-ink/10 pt-3">
                      {m.actions?.map((a) => <ActionButton key={`${a.kind}${a.id}`} action={a} />)}
                      {[...(m.charges || []), ...(m.links || [])].map((c) => (
                        <a key={c.href} href={c.href} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-xl bg-[#25D366]/10 px-3 py-2 text-[13px] font-medium text-[#1d7a46] hover:bg-[#25D366]/20">
                          <WhatsAppIcon className="h-4 w-4" /> {c.label}
                        </a>
                      ))}
                      {(m.charges?.length > 0 || m.links?.length > 0) && <p className="text-[11px] text-ink-muted">A mensagem abre pronta no WhatsApp. Você revisa e envia.</p>}
                    </div>
                  )}
                </div>
                {!m.error && m.q && (
                  <div className="mt-1 flex gap-1 pl-1 text-[#8E86A6]">
                    {m.rated ? <span className="text-[11px]">Obrigada pela avaliação!</span> : (
                      <>
                        <button type="button" onClick={() => rate(i, true)} className="rounded-full p-1.5 hover:bg-white" aria-label="Resposta boa"><ThumbsUp className="h-3.5 w-3.5" /></button>
                        <button type="button" onClick={() => rate(i, false)} className="rounded-full p-1.5 hover:bg-white" aria-label="Resposta ruim"><ThumbsDown className="h-3.5 w-3.5" /></button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          ))}
          {busy && <p className="flex items-center gap-2 text-sm text-[#8E86A6]"><PolaroidyMascot mood="pensando" className="h-8 w-8 animate-pulse overflow-hidden rounded-full" /> Polaroidy está olhando…</p>}
          {long && <p className="rounded-xl bg-paper px-3 py-2 text-xs text-ink-muted">Esta conversa ficou longa. Toque em <RotateCcw className="inline h-3 w-3" /> para começar uma nova.</p>}
          <div ref={end} />
        </div>

        <form className="flex items-end gap-2 border-t border-[#E6E1F0] bg-white p-3 pb-safe" onSubmit={(e) => { e.preventDefault(); send(input); }}>
          <textarea ref={field} rows={1} value={input} onChange={(e) => setInput(e.target.value)} maxLength={500}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder={mic.on ? "Pode falar…" : "Pergunte para a Polaroidy…"} className="field-input !border-[#E6E1F0] focus:!border-[#C95D63] focus:!ring-[#C95D63]/20 max-h-32 min-h-[44px] flex-1 resize-none !py-2.5" disabled={busy || long} />
          {mic.supported && (
            <button type="button" onClick={mic.toggle} disabled={busy || long}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full disabled:opacity-40 ${mic.on ? "animate-pulse bg-[#C95D63] text-white" : "bg-[#E6E1F0] text-[#2B2540]"}`}
              aria-label={mic.on ? "Parar de ouvir" : "Falar a pergunta"}>
              {mic.on ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
          )}
          <button type="submit" disabled={busy || long || !input.trim()} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#2B2540] text-white disabled:opacity-40" aria-label="Enviar">
            <ArrowUp className="h-5 w-5" />
          </button>
        </form>
      </section>
    </div>
  );
}
