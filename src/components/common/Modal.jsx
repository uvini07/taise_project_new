import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useBodyLock } from "../../hooks/useBodyLock.js";

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** Diálogo acessível: foco preso dentro, Esc fecha, foco volta ao botão de origem. */
export default function Modal({ open, onClose, title, children, footer, size = "md", labelledBy }) {
  const panel = useRef(null);
  const lastFocus = useRef(null);
  useBodyLock(open);

  useEffect(() => {
    if (!open) return undefined;
    lastFocus.current = document.activeElement;
    const el = panel.current;
    setTimeout(() => (el?.querySelector("[data-autofocus]") || el?.querySelector(FOCUSABLE) || el)?.focus(), 30);
    const onKey = (e) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose?.(); }
      if (e.key === "Tab" && el) {
        const items = [...el.querySelectorAll(FOCUSABLE)].filter((x) => x.offsetParent !== null);
        if (!items.length) return;
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); lastFocus.current?.focus?.(); };
  }, [open, onClose]);

  if (!open) return null;
  const widths = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl" };
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 animate-fade-in bg-ink/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy || "modal-title"}
        tabIndex={-1}
        className={`relative flex max-h-[92vh] w-full ${widths[size]} animate-fade-up flex-col rounded-t-3xl bg-ivory shadow-lift sm:rounded-3xl`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink/5 px-5 py-4 sm:px-7">
          <h2 id={labelledBy || "modal-title"} className="font-display text-2xl">{title}</h2>
          <button onClick={onClose} className="-mr-2 rounded-full p-2 text-ink-muted hover:bg-ink/5 hover:text-ink" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-ink/5 px-5 py-4 pb-safe sm:px-7">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
