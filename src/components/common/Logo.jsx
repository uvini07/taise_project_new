import { LOGO } from "../../config/defaults.js";
import { useSettings } from "../../contexts/SettingsContext.jsx";
import { isLegacyStudio } from "../../config/tenant.js";

/**
 * Logo original da fotógrafa (TR — Taise Rufino Fotografia).
 * tone="dark" para fundos claros, tone="light" para fotos/fundos escuros.
 * Se uma nova logo for enviada em Configurações, ela substitui esta.
 */
// Fundo escuro? (luminância da cor de fundo do tema)
function isDarkHex(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || "").trim());
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.45;
}

export default function Logo({ tone: asked = "dark", className = "h-12 w-auto", eager = false, followSiteChoice = true }) {
  const { settings } = useSettings();
  // Qual versão usar: a fotógrafa pode fixar uma ("Sempre a clara/escura").
  // No automático, fundo de tema escuro troca a logo escura pela clara.
  const mode = followSiteChoice ? settings.logoMode || "auto" : "auto";
  let tone = asked;
  if (mode === "dark" && settings.logoUrl) tone = "dark";
  else if (mode === "light" && settings.logoLightUrl) tone = "light";
  else if (mode === "auto" && followSiteChoice && asked === "dark" && settings.logoLightUrl && isDarkHex(settings.theme?.background)) tone = "light";
  const custom = tone === "light" ? settings.logoLightUrl : settings.logoUrl;
  // Estúdio novo sem logo enviada: mostra o nome do estúdio em texto.
  if (!custom && !isLegacyStudio()) {
    return (
      <span className={`inline-flex items-center font-display leading-none ${tone === "light" ? "text-white" : "text-wine-900"} ${className}`}
        style={{ fontSize: "1.6rem", width: "auto" }}>{settings.brandName}</span>
    );
  }
  const src = custom || (tone === "light" ? LOGO.light : LOGO.dark);
  const png = tone === "light" ? LOGO.lightPng : LOGO.darkPng;
  // Logo original em cor sólida: na versão escura ela acompanha a cor principal do tema.
  if (!custom && tone === "dark") {
    const mask = `url(${LOGO.darkPng}) center / contain no-repeat`;
    return (
      <span role="img" aria-label={settings.legalName || settings.brandName}
        className={`inline-block aspect-[1200/738] bg-wine-900 ${className}`}
        style={{ WebkitMask: mask, mask }} />
    );
  }
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
