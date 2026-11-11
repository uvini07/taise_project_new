// Aviso de "alterações não salvas" no painel (Estilo e Conteúdo do site).
// O app usa BrowserRouter (sem bloqueio de navegação embutido), então o menu
// pergunta antes de sair e o navegador avisa ao fechar/recarregar a aba.
import { useEffect } from "react";

let dirty = false;

export function confirmLeave() {
  if (!dirty) return true;
  const ok = window.confirm("Você tem alterações que ainda não foram salvas. Sair mesmo assim e perder essas alterações?");
  if (ok) dirty = false;
  return ok;
}

/** Marca a página como "com alterações não salvas" enquanto isDirty for true. */
export function useUnsavedGuard(isDirty) {
  useEffect(() => {
    dirty = !!isDirty;
    const onUnload = (e) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onUnload);
    return () => { window.removeEventListener("beforeunload", onUnload); dirty = false; };
  }, [isDirty]);
}
