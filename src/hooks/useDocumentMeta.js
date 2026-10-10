import { useEffect } from "react";
import { useSettings } from "../contexts/SettingsContext.jsx";

function setMeta(attr, key, value) {
  if (!value) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute("content", value);
}

/** Título, descrição e imagem de compartilhamento da página. */
export function useDocumentMeta({ title, description, image } = {}) {
  const { settings } = useSettings();
  useEffect(() => {
    const brand = settings.brandName;
    const fullTitle = title ? `${title} | ${brand}` : settings.seo.title || brand;
    const desc = description || settings.seo.description;
    const img = image || settings.seo.shareImageUrl;
    document.title = fullTitle;
    setMeta("name", "description", desc);
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:site_name", brand);
    setMeta("property", "og:url", window.location.href);
    if (img) setMeta("property", "og:image", img);
  }, [title, description, image, settings]);
}
