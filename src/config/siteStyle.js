// Estilo do site do estúdio: a estrutura (modelo do topo da página inicial) e
// as fontes. As cores ficam em utils/theme.js. Tudo é escolhido na aba Estilo.

export const LAYOUTS = [
  {
    id: "classico",
    name: "Clássico",
    text: "Foto em tela cheia, texto por cima no canto. Impactante e emocional.",
    overlay: true,
  },
  {
    id: "diagonal",
    name: "Diagonal",
    text: "Texto sobre a sua cor principal e a foto cortada em diagonal. Moderno e marcante.",
    overlay: true,
  },
  {
    id: "dividido",
    name: "Dividido",
    text: "Foto de um lado e texto do outro, em fundo claro. Limpo e direto.",
    overlay: false,
  },
  {
    id: "arco",
    name: "Arco",
    text: "Título centralizado e a foto numa moldura em arco. Delicado, ótimo para gestante e newborn.",
    overlay: false,
  },
  {
    id: "mosaico",
    name: "Mosaico",
    text: "Texto ao lado de uma composição com três fotos. Mostra variedade logo de cara.",
    overlay: false,
  },
];

export const DEFAULT_LAYOUT = "classico";
export const layoutById = (id) => LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];

/** Modelo em uso: o salvo, ou o da prévia (?modelo=diagonal) aberta pela aba Estilo. */
export function effectiveLayout(saved, search = typeof window !== "undefined" ? window.location.search : "") {
  const q = new URLSearchParams(search).get("modelo");
  if (q && LAYOUTS.some((l) => l.id === q)) return q;
  return layoutById(saved).id;
}

// Fontes do Google Fonts. "display" = títulos; "body" = textos e menus.
export const DISPLAY_FONTS = [
  { id: "Cormorant Garamond", label: "Cormorant", mood: "Clássica e elegante", w: "ital,wght@0,400;0,500;0,600;1,400" },
  { id: "Playfair Display", label: "Playfair", mood: "Sofisticada, de revista", w: "ital,wght@0,400;0,500;0,600;1,400" },
  { id: "DM Serif Display", label: "DM Serif", mood: "Forte e moderna", w: "ital@0;1" },
  { id: "Bodoni Moda", label: "Bodoni", mood: "Editorial, alto contraste", w: "ital,wght@0,400;0,500;0,600;1,400" },
  { id: "Fraunces", label: "Fraunces", mood: "Calorosa e afetiva", w: "ital,wght@0,400;0,500;0,600;1,400" },
  { id: "Marcellus", label: "Marcellus", mood: "Delicada, com serifas finas", w: "" },
  { id: "Italiana", label: "Italiana", mood: "Fina e romântica", w: "" },
  { id: "Montserrat", label: "Montserrat", mood: "Sem serifa, limpa", w: "wght@400;500;600" },
];

export const BODY_FONTS = [
  { id: "Jost", label: "Jost", w: "wght@300;400;500;600" },
  { id: "Lato", label: "Lato", w: "wght@300;400;700" },
  { id: "DM Sans", label: "DM Sans", w: "wght@300;400;500;600" },
  { id: "Nunito Sans", label: "Nunito Sans", w: "wght@300;400;600" },
  { id: "Work Sans", label: "Work Sans", w: "wght@300;400;500;600" },
  { id: "Karla", label: "Karla", w: "wght@300;400;500;600" },
];

export const DEFAULT_FONTS = { display: "Cormorant Garamond", body: "Jost" };
const ALREADY_LOADED = new Set(["Cormorant Garamond", "Jost"]); // vêm no index.html

const fontUrl = (fonts) => {
  const fams = fonts
    .filter((f) => f && !ALREADY_LOADED.has(f.id))
    .map((f) => `family=${f.id.replace(/ /g, "+")}${f.w ? `:${f.w}` : ""}`);
  return fams.length ? `https://fonts.googleapis.com/css2?${fams.join("&")}&display=swap` : "";
};

/** Carrega as fontes escolhidas e aplica nas variáveis CSS que o Tailwind usa. */
export function applyFonts(fonts) {
  if (typeof document === "undefined") return;
  const d = DISPLAY_FONTS.find((f) => f.id === fonts?.display) || DISPLAY_FONTS[0];
  const b = BODY_FONTS.find((f) => f.id === fonts?.body) || BODY_FONTS[0];
  const url = fontUrl([d, b]);
  let link = document.getElementById("studio-fonts");
  if (url) {
    if (!link) {
      link = Object.assign(document.createElement("link"), { id: "studio-fonts", rel: "stylesheet" });
      document.head.appendChild(link);
    }
    if (link.href !== url) link.href = url;
  }
  const root = document.documentElement.style;
  root.setProperty("--font-display", `"${d.id}"`);
  root.setProperty("--font-body", `"${b.id}"`);
}

/** Carrega de uma vez todas as fontes (para mostrar os exemplos na aba Estilo). */
export function loadAllFontsForPreview() {
  if (typeof document === "undefined" || document.getElementById("studio-fonts-all")) return;
  const url = fontUrl([...DISPLAY_FONTS, ...BODY_FONTS]);
  if (url) document.head.appendChild(Object.assign(document.createElement("link"), { id: "studio-fonts-all", rel: "stylesheet", href: url }));
}
