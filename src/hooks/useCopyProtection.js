import { useEffect, useRef, useState } from "react";

/**
 * Proteção contra cópia nas páginas do cliente.
 *
 * Nenhum site consegue impedir prints de verdade: no celular o print acontece
 * fora do navegador e o site nem fica sabendo. Esta proteção só dificulta:
 * - bloqueia clique direito, arrastar, "salvar imagem" (toque longo), Ctrl+S,
 *   Ctrl+P, Ctrl+U e atalhos das ferramentas de desenvolvedor;
 * - esconde as fotos (`shielded = true`) quando a janela perde o foco
 *   (Ferramenta de Captura do Windows, troca de app no celular), quando
 *   Cmd/Win + Shift é pressionado (atalhos de print do Mac e do Windows) e
 *   ao apertar Print Screen, tentando ainda limpar a área de transferência;
 * - esconde tudo na impressão (Ctrl+P / "Salvar como PDF").
 * O que realmente desestimula o vazamento é a marca d'água com o nome do
 * cliente, gravada na própria imagem.
 */
export function useCopyProtection(enabled = true) {
  const [shielded, setShielded] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (!enabled) { setShielded(false); return undefined; }

    const show = () => { clearTimeout(timer.current); setShielded(true); };
    const hideAfter = (ms) => { clearTimeout(timer.current); timer.current = setTimeout(() => setShielded(false), ms); };
    const clearClipboard = () => { try { navigator.clipboard?.writeText?.("").catch(() => {}); } catch { /* sem permissão */ } };
    const prevent = (e) => e.preventDefault();
    let sawShift = false;

    const onKeyDown = (e) => {
      const k = (e.key || "").toLowerCase();
      const mod = e.ctrlKey || e.metaKey;
      if (k === "printscreen") { show(); clearClipboard(); hideAfter(3000); return; }
      // Cmd+Shift+3/4/5 (Mac) e Win+Shift+S (Windows): as teclas modificadoras chegam antes do atalho.
      if (k === "meta" || k === "os" || e.metaKey) { show(); if (e.shiftKey) sawShift = true; }
      if (mod && ["s", "p", "u"].includes(k)) { e.preventDefault(); if (k === "p") { show(); hideAfter(1500); } }
      if (k === "f12" || (mod && e.shiftKey && ["i", "j", "c"].includes(k))) e.preventDefault();
    };
    const onKeyUp = (e) => {
      const k = (e.key || "").toLowerCase();
      if (k === "printscreen") { show(); clearClipboard(); hideAfter(3000); return; }
      if (k === "meta" || k === "os") { hideAfter(sawShift ? 6000 : 400); sawShift = false; }
    };
    const onBlur = () => show();
    const onFocus = () => hideAfter(300);
    const onVisibility = () => (document.hidden ? show() : hideAfter(300));

    document.addEventListener("contextmenu", prevent);
    document.addEventListener("dragstart", prevent);
    document.addEventListener("copy", prevent);
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("keyup", onKeyUp, true);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    window.addEventListener("beforeprint", show);
    window.addEventListener("afterprint", onFocus);
    document.documentElement.classList.add("copy-protected");

    return () => {
      clearTimeout(timer.current);
      document.removeEventListener("contextmenu", prevent);
      document.removeEventListener("dragstart", prevent);
      document.removeEventListener("copy", prevent);
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("keyup", onKeyUp, true);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("beforeprint", show);
      window.removeEventListener("afterprint", onFocus);
      document.documentElement.classList.remove("copy-protected");
    };
  }, [enabled]);

  return shielded;
}
