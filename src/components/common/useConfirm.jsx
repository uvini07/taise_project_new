import { useCallback, useRef, useState } from "react";
import Modal from "./Modal.jsx";

/**
 * const [confirmUI, confirm] = useConfirm();
 * if (await confirm({ title, text, confirmLabel, danger })) { ... }
 */
export function useConfirm() {
  const [opts, setOpts] = useState(null);
  const resolver = useRef(null);
  const confirm = useCallback((o) => new Promise((resolve) => { resolver.current = resolve; setOpts(o); }), []);
  const close = (v) => { resolver.current?.(v); setOpts(null); };
  const ui = (
    <Modal
      open={!!opts}
      onClose={() => close(false)}
      title={opts?.title || "Confirmar"}
      size="sm"
      footer={
        <>
          <button className="btn-ghost" onClick={() => close(false)}>{opts?.cancelLabel || "Cancelar"}</button>
          <button className={opts?.danger ? "btn-danger" : "btn-primary"} onClick={() => close(true)} data-autofocus>
            {opts?.confirmLabel || "Confirmar"}
          </button>
        </>
      }
    >
      <div className="space-y-2 text-sm text-ink-soft">{typeof opts?.text === "string" ? <p>{opts.text}</p> : opts?.text}</div>
    </Modal>
  );
  return [ui, confirm];
}
