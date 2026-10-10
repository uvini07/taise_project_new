import { LOGO } from "../../config/defaults.js";
import { useSettings } from "../../contexts/SettingsContext.jsx";

/**
 * Logo original da fotógrafa (TR — Taise Rufino Fotografia).
 * tone="dark" para fundos claros, tone="light" para fotos/fundos escuros.
 * Se uma nova logo for enviada em Configurações, ela substitui esta.
 */
export default function Logo({ tone = "dark", className = "h-12 w-auto", eager = false }) {
  const { settings } = useSettings();
  const custom = tone === "light" ? settings.logoLightUrl : settings.logoUrl;
  const src = custom || (tone === "light" ? LOGO.light : LOGO.dark);
  const png = tone === "light" ? LOGO.lightPng : LOGO.darkPng;
  return (
    <picture>
      {!custom && <source srcSet={src} type="image/webp" />}
      <img
        src={custom || png}
        alt={settings.legalName || settings.brandName}
        className={className}
        width="1200"
        height="738"
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        fetchpriority={eager ? "high" : undefined}
      />
    </picture>
  );
}
