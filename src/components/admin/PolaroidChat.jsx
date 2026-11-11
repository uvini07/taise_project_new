// Janela da Polaroid, a assistente da fotógrafa. Abre pela lateral do painel.
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUp, Camera, RotateCcw, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useSettings } from "../../contexts/SettingsContext.jsx";
import { WhatsAppIcon } from "../common/Icons.jsx";
import Spinner from "../common/Spinner.jsx";
import { askPolaroid, parseLine } from "../../services/polaroid.js";
import { todayKey } from "../../utils/format.js";

const SUGGESTIONS = ["Quais são minhas agendas hoje?", "Quem ainda não me pagou?", "Tem pedido esperando confirmação?", "Onde eu troco a foto do topo do site?"];

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
              ? <Link key={k} to={p.href} onClick={onNavigate} className="font-medium text-wine-900 underline underline-offset-2">{p.v}</Link>
              : <span key={k}>{p.v}</span>)
              : <span key={k}>{p.v}</span>
        ));
        return bullet ? <p key={i} className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-current opacity-60" />{parts}</p> : <p key={i}>{parts}</p>;
      })}
    </div>
  );
}

export default function PolaroidChat({ open, onClose }) {
  const { admin, user } = useAuth();
  const { settings } = useSettings();
  const [history, setHistory] = useState([]); // formato da API (vai inteiro para a IA)
  const [chat, setChat] = useState([]); // o que aparece na tela
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef(null);
  const field = useRef(null);

  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [chat, busy]);
  useEffect(() => { if (open) setTimeout(() => field.current?.focus(), 200); }, [open]);
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

  async function send(text) {
    const q = String(text || "").trim();
    if (!q || busy || long) return;
    setInput("");
    setChat((c) => [...c, { who: "eu", text: q }]);
    setBusy(true);
    try {
      const r = await askPolaroid(history, q, context);
      setHistory(r.history);
      setChat((c) => [...c, { who: "polaroid", text: r.text, charges: r.ui.charges }]);
    } catch (e) {
      setChat((c) => [...c, { who: "polaroid", text: e.message || "A Polaroid não respondeu agora.", error: true }]);
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[65]" role="dialog" aria-modal="true" aria-label="Polaroid, sua assistente">
      <div className="absolute inset-0 animate-fade-in bg-ink/30" onClick={onClose} aria-hidden />
      <section className="absolute inset-y-0 right-0 flex w-full max-w-[420px] animate-fade-in flex-col bg-ivory shadow-lift">
        <header className="flex items-center gap-3 border-b border-ink/10 px-4 py-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-wine-900 text-cream"><Camera className="h-5 w-5" strokeWidth={1.6} /></span>
          <div className="flex-1">
            <p className="font-display text-xl leading-none">Polaroid</p>
            <p className="mt-1 text-xs text-ink-muted">Sua assistente. Ela só consulta e sugere.</p>
          </div>
          {chat.length > 0 && (
            <button type="button" onClick={() => { setHistory([]); setChat([]); }} className="rounded-full p-2 text-ink-soft hover:bg-ink/5" aria-label="Nova conversa" title="Nova conversa"><RotateCcw className="h-4 w-4" /></button>
          )}
          <button type="button" onClick={onClose} className="rounded-full p-2 text-ink-soft hover:bg-ink/5" aria-label="Fechar"><X className="h-5 w-5" /></button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
          {!chat.length && (
            <div>
              <p className="text-[15px]">Oi{firstName ? `, ${firstName}` : ""}! Sou a Polaroid. Posso olhar sua agenda, ver quem ainda não pagou e mostrar onde fica cada coisa no painel.</p>
              <p className="mt-5 text-xs uppercase tracking-wider text-ink-muted">Experimente</p>
              <div className="mt-2 flex flex-col gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => send(s)} className="rounded-2xl border border-ink/10 bg-surface px-4 py-2.5 text-left text-sm hover:border-wine-900/40">{s}</button>
                ))}
              </div>
            </div>
          )}
          {chat.map((m, i) => (
            m.who === "eu" ? (
              <p key={i} className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-wine-900 px-4 py-2.5 text-sm text-cream">{m.text}</p>
            ) : (
              <div key={i} className={`max-w-[92%] rounded-2xl rounded-bl-md px-4 py-3 text-sm leading-relaxed ${m.error ? "bg-danger/10 text-danger" : "bg-surface shadow-soft"}`}>
                <Rich text={m.text} onNavigate={onClose} />
                {m.charges?.length > 0 && (
                  <div className="mt-3 flex flex-col gap-2 border-t border-ink/10 pt-3">
                    {m.charges.map((c) => (
                      <a key={c.href} href={c.href} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-xl bg-[#25D366]/10 px-3 py-2 text-[13px] font-medium text-[#1d7a46] hover:bg-[#25D366]/20">
                        <WhatsAppIcon className="h-4 w-4" /> {c.label}
                      </a>
                    ))}
                    <p className="text-[11px] text-ink-muted">A mensagem abre pronta no WhatsApp. Você revisa e envia.</p>
                  </div>
                )}
              </div>
            )
          ))}
          {busy && <p className="flex items-center gap-2 text-sm text-ink-muted"><Spinner className="h-4 w-4" /> Polaroid está olhando…</p>}
          {long && <p className="rounded-xl bg-paper px-3 py-2 text-xs text-ink-muted">Esta conversa ficou longa. Toque em <RotateCcw className="inline h-3 w-3" /> para começar uma nova.</p>}
          <div ref={end} />
        </div>

        <form className="flex items-end gap-2 border-t border-ink/10 p-3 pb-safe" onSubmit={(e) => { e.preventDefault(); send(input); }}>
          <textarea ref={field} rows={1} value={input} onChange={(e) => setInput(e.target.value)} maxLength={500}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder="Pergunte para a Polaroid…" className="field-input max-h-32 min-h-[44px] flex-1 resize-none !py-2.5" disabled={busy || long} />
          <button type="submit" disabled={busy || long || !input.trim()} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-wine-900 text-cream disabled:opacity-40" aria-label="Enviar">
            <ArrowUp className="h-5 w-5" />
          </button>
        </form>
      </section>
    </div>
  );
}
