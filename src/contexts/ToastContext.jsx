import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const show = useCallback((message, type = "info", ms = 4500) => {
    const id = ++idRef.current;
    setToasts((t) => [...t.slice(-3), { id, message, type }]);
    if (ms) setTimeout(() => dismiss(id), ms);
    return id;
  }, [dismiss]);

  const api = useRef(null);
  api.current = {
    show,
    success: (m) => show(m, "success"),
    error: (m) => show(m, "error", 7000),
    info: (m) => show(m, "info"),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:px-6">
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || Info;
          return (
            <div key={t.id} role={t.type === "error" ? "alert" : "status"}
              className={`pointer-events-auto flex w-full max-w-sm animate-fade-up items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-lift backdrop-blur ${
                t.type === "error" ? "border-danger/20 bg-white text-danger"
                  : t.type === "success" ? "border-success/20 bg-white text-success" : "border-ink/10 bg-white text-ink"}`}>
              <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p className="flex-1 text-ink">{t.message}</p>
              <button onClick={() => dismiss(t.id)} className="text-ink-muted hover:text-ink" aria-label="Fechar aviso">
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

/** toast.success("..."), toast.error("..."), toast.info("...") */
export function useToast() {
  const ref = useContext(ToastContext);
  return {
    success: (m) => ref.current.success(m),
    error: (m) => ref.current.error(m),
    info: (m) => ref.current.info(m),
  };
}
