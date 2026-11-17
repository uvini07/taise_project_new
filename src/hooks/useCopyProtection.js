import { useEffect, useRef, useState } from "react";

/**
 * Proteção contra cópia nas páginas do cliente. Devolve { shielded, reason }:
 * quando `shielded` é true, a página deve cobrir as fotos.
 *
 * Nenhum site consegue impedir prints de verdade: no celular o print acontece
 * fora do navegador e o site nem fica sabendo. Esta proteção dificulta:
 * - bloqueia clique direito, arrastar, copiar, "salvar imagem" (toque longo),
 *   Ctrl+S, Ctrl+P, Ctrl+U e atalhos das ferramentas de desenvolvedor;
 * - cobre as fotos quando a janela perde o foco (Ferramenta de Captura,
 *   troca de app no celular), ao pressionar Cmd/Win (+ Shift), que inicia os
 *   atalhos de print do Mac e do Windows, e no Print Screen, tentando ainda
 *   limpar a área de transferência;
 * - cobre as fotos quando o painel "Inspecionar" (DevTools) é aberto preso à
 *   janela (só uma das dimensões da página encolhe de repente, no computador);
 * - esconde tudo na impressão (Ctrl+P / "Salvar como PDF").
 * O que mais protege é o que vai na própria imagem: marca d'água reforçada
 * com o nome do cliente, prévia pequena e arquivo embaralhado.
 */
export function useCopyProtection(enabled = true, onEvent = null) {
  // Rastreamento: avisa tentativas de captura/cópia (ver ClientSelection).
  const report = useRef(onEvent);
  report.current = onEvent;
  const [temp, setTemp] = useState(false);
  const [devtools, setDevtools] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (!enabled) { setTemp(false); setDevtools(false); return undefined; }

    const show = () => { clearTimeout(timer.current); setTemp(true); };
    const hideAfter = (ms) => { clearTimeout(timer.current); timer.current = setTimeout(() => setTemp(false), ms); };
    const clearClipboard = () => { try { navigator.clipboard?.writeText?.("").catch(() => {}); } catch { /* sem permissão */ } };
    const prevent = (e) => e.preventDefault();
    const seen = {};
    const log = (type) => { const t = Date.now(); if (seen[type] && t - seen[type] < 4000) return; seen[type] = t; try { report.current?.(type); } catch { /* ignora */ } };
    const onContext = (e) => { e.preventDefault(); if (e.target?.closest?.(".protect-area")) log("save_attempt"); };
    let sawShift = false;

    const onKeyDown = (e) => {
      const k = (e.key || "").toLowerCase();
      const mod = e.ctrlKey || e.metaKey;
      if (k === "printscreen") { show(); clearClipboard(); hideAfter(3000); log("print_key"); return; }
      // Cmd+Shift+3/4/5 (Mac) e Win+Shift+S (Windows): as teclas modificadoras chegam antes do atalho.
      if (k === "meta" || k === "os" || e.metaKey) { show(); if (e.shiftKey) { sawShift = true; log("capture_shortcut"); } }
      if (mod && ["s", "p", "u", "a", "c"].includes(k) && !e.shiftKey) { e.preventDefault(); if (k === "p") { show(); hideAfter(1500); log("print_page"); } if (k === "s") log("save_attempt"); }
      if (k === "f12" || (mod && e.shiftKey && ["i", "j", "c", "k", "m"].includes(k)) || (e.metaKey && e.altKey && ["i", "j", "c", "u"].includes(k))) {
        e.preventDefault();
      }
    };
    const onKeyUp = (e) => {
      const k = (e.key || "").toLowerCase();
      if (k === "printscreen") { show(); clearClipboard(); hideAfter(3000); log("print_key"); return; }
      if (k === "meta" || k === "os") { hideAfter(sawShift ? 6000 : 400); sawShift = false; }
    };
    const onBlur = () => show();
    const onFocus = () => hideAfter(300);
    const onVisibility = () => (document.hidden ? show() : hideAfter(300));

    // DevTools preso à janela: a janela não muda, mas só a largura (painel à
    // direita) ou só a altura (painel embaixo) da página encolhe bastante.
    // Zoom muda as duas proporcionalmente, então não confunde. Só no computador.
    const desktop = window.matchMedia?.("(pointer: fine)").matches;
    const size = () => ({ ow: window.outerWidth, oh: window.outerHeight, iw: window.innerWidth, ih: window.innerHeight });
    let last = size();
    let base = null;
    const onResize = () => {
      const now = size();
      const sameWindow = Math.abs(now.ow - last.ow) < 4 && Math.abs(now.oh - last.oh) < 4;
      const dw = last.iw - now.iw, dh = last.ih - now.ih;
      if (!base && sameWindow && ((dw > 120 && Math.abs(dh) < 3) || (dh > 120 && Math.abs(dw) < 3))) {
        base = last;
        setDevtools(true);
        log("devtools");
      } else if (base && (!sameWindow || (now.iw >= base.iw - 4 && now.ih >= base.ih - 4))) {
        base = null;
        setDevtools(false);
      }
      last = now;
    };

    document.addEventListener("contextmenu", onContext);
    document.addEventListener("dragstart", prevent);
    document.addEventListener("copy", prevent);
    document.addEventListener("cut", prevent);
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("keyup", onKeyUp, true);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    const onBeforePrint = () => { show(); log("print_page"); };
    window.addEventListener("beforeprint", onBeforePrint);
    window.addEventListener("afterprint", onFocus);
    if (desktop) window.addEventListener("resize", onResize);
    document.documentElement.classList.add("copy-protected");

    return () => {
      clearTimeout(timer.current);
      document.removeEventListener("contextmenu", onContext);
      document.removeEventListener("dragstart", prevent);
      document.removeEventListener("copy", prevent);
      document.removeEventListener("cut", prevent);
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("keyup", onKeyUp, true);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("beforeprint", onBeforePrint);
      window.removeEventListener("afterprint", onFocus);
      window.removeEventListener("resize", onResize);
      document.documentElement.classList.remove("copy-protected");
    };
  }, [enabled]);

  return { shielded: temp || devtools, reason: devtools ? "devtools" : temp ? "focus" : null };
}
