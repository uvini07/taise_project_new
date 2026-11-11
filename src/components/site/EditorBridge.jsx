// Dentro do Editor do site: destaca as partes editáveis ao passar o mouse e,
// no clique, avisa o painel qual parte abrir (em vez de seguir o link).
import { useEffect } from "react";
import { isEditorPreview } from "../../utils/editorMode.js";

const CSS = `
html.rv-editing [data-edit-zone] { position: relative; }
html.rv-editing [data-edit-zone]:hover { outline: 2px dashed #C95D63; outline-offset: -3px; cursor: pointer; }
html.rv-editing [data-edit-zone]:hover::after {
  content: attr(data-edit-label); position: absolute; top: 10px; right: 10px; z-index: 45;
  background: #C95D63; color: #fff; font: 500 12px/1 Jost, system-ui, sans-serif; padding: 7px 12px; border-radius: 999px;
  box-shadow: 0 6px 18px -6px rgba(0,0,0,.35); pointer-events: none;
}
html.rv-editing [data-edit]:hover { outline: 2px solid rgba(201,93,99,.55); outline-offset: 4px; border-radius: 6px; cursor: pointer; }
`;

export default function EditorBridge() {
  useEffect(() => {
    if (!isEditorPreview()) return undefined;
    const root = document.documentElement;
    root.classList.add("rv-editing");
    const style = Object.assign(document.createElement("style"), { textContent: CSS });
    document.head.appendChild(style);
    const send = (data) => window.parent.postMessage(data, window.location.origin);
    const onClick = (e) => {
      if (!root.classList.contains("rv-editing")) return;
      const field = e.target.closest?.("[data-edit]")?.getAttribute("data-edit") || null;
      const zone = e.target.closest?.("[data-edit-zone]")?.getAttribute("data-edit-zone") || (field ? field.split(".")[0] : null);
      if (!zone && !field) return;
      e.preventDefault();
      e.stopPropagation();
      send({ type: "revela:edit", zone, field });
    };
    const onMsg = (e) => {
      if (e.origin !== window.location.origin || e.data?.type !== "revela:editing") return;
      root.classList.toggle("rv-editing", !!e.data.on);
    };
    // Avisa o painel em que página a prévia está (para o seletor de páginas).
    const sendPath = () => send({ type: "revela:path", path: window.location.pathname });
    document.addEventListener("click", onClick, true);
    window.addEventListener("message", onMsg);
    sendPath();
    const iv = setInterval(sendPath, 800);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("message", onMsg);
      clearInterval(iv);
      style.remove();
      root.classList.remove("rv-editing");
    };
  }, []);
  return null;
}
