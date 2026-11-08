import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

function setMeta(attr, key, value) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute("content", value);
}

function setIcon(rel, href, sizes) {
  const sel = sizes ? `link[rel="${rel}"][sizes="${sizes}"]` : `link[rel="${rel}"]`;
  let el = document.head.querySelector(sel);
  if (!el) { el = document.createElement("link"); el.rel = rel; if (sizes) el.sizes = sizes; document.head.appendChild(el); }
  el.href = href;
}

/** Título, descrição, cor do navegador e ícone da Revela em cada página. */
export function useRevelaMeta(title, description) {
  useEffect(() => {
    const full = title ? `${title} | Revela` : "Revela — site, agenda e entrega de fotos para fotógrafas";
    document.title = full;
    if (description) setMeta("name", "description", description);
    setMeta("property", "og:title", full);
    setMeta("property", "og:site_name", "Revela");
    setMeta("property", "og:url", window.location.href);
    setMeta("name", "theme-color", "#E6E1F0");
    setIcon("icon", "/revela/favicon-32.png", "32x32");
    setIcon("icon", "/revela/favicon-192.png", "192x192");
    setIcon("apple-touch-icon", "/revela/apple-touch-icon.png");
  }, [title, description]);
}

/**
 * Refração de vidro (filtro SVG no backdrop-filter) só existe no Chrome/Edge
 * de computador. Nos outros, o vidro continua com desfoque e brilho.
 */
export function useLensSupport() {
  useIsoLayoutEffect(() => {
    const ua = navigator.userAgent;
    const chromium = /Chrome\/\d+/.test(ua) && !/CriOS|FxiOS|Firefox/.test(ua);
    const ok = chromium
      && window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1024px)").matches
      && !window.matchMedia("(prefers-reduced-transparency: reduce)").matches;
    document.documentElement.classList.toggle("rv-lens-ok", ok);
    // A rolagem suave do site do estúdio atrapalha as cenas presas à rolagem.
    const prev = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "auto";
    return () => {
      document.documentElement.classList.remove("rv-lens-ok");
      document.documentElement.style.scrollBehavior = prev;
    };
  }, []);
}

/**
 * Brilho do vidro seguindo o ponteiro: um único ouvinte na página, que só
 * troca duas variáveis no vidro sob o ponteiro (uma vez por quadro).
 */
export function usePointerSheen(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return undefined;
    let frame = 0;
    let last = null;
    const onMove = (e) => {
      last = e;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const el = last.target instanceof Element ? last.target.closest(".lg") : null;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${(((last.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
        el.style.setProperty("--my", `${(((last.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
      });
    };
    root.addEventListener("pointermove", onMove, { passive: true });
    return () => { root.removeEventListener("pointermove", onMove); cancelAnimationFrame(frame); };
  }, [rootRef]);
}

/** Pausa os loops (CSS) de um bloco quando ele sai da tela. */
export function useOffscreenPause(ref, rootMargin = "120px") {
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return undefined;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) el.removeAttribute("data-offscreen");
      else el.setAttribute("data-offscreen", "");
    }, { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);
}

/** Chegou em /#secao vindo de outra página: rola até a seção. */
export function useHashScroll(ready = true) {
  const { hash, pathname } = useLocation();
  useEffect(() => {
    if (!ready || !hash) return undefined;
    const id = decodeURIComponent(hash.slice(1));
    const t = setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 160);
    return () => clearTimeout(t);
  }, [hash, pathname, ready]);
}

/** Endereço do site como aparece no navegador (sem https://). */
export const siteHost = () => (typeof window !== "undefined" ? window.location.host : "revela");
