import { useEffect, useRef } from "react";

/** Adiciona .is-visible quando o elemento entra na tela (uma vez só). */
export function useReveal(options = {}) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (!("IntersectionObserver" in window)) { el.classList.add("is-visible"); return undefined; }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { el.classList.add("is-visible"); io.disconnect(); }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08, ...options });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}
