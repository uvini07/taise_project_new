// Estilo do site do estúdio: o modelo (estrutura do site inteiro: cabeçalho,
// seções da página inicial, topo das páginas internas, rodapé e formas) e
// as fontes. As cores ficam em utils/theme.js. Tudo é escolhido na aba Estilo.

export const LAYOUTS = [
  {
    id: "classico",
    name: "Clássico",
    text: "Foto em tela cheia no topo, seções em cartões arredondados e rodapé escuro. Emocional e acolhedor.",
    overlay: true,
  },
  {
    id: "diagonal",
    name: "Diagonal",
    text: "Cortes em diagonal, faixas escuras, categorias numeradas, cantos retos e depoimento em destaque. Moderno e marcante.",
    overlay: true,
  },
  {
    id: "dividido",
    name: "Dividido",
    text: "Estilo revista: logo centralizada, blocos meio a meio, índice de ensaios em lista e galeria em grade. Limpo e elegante.",
    overlay: false,
  },
  {
    id: "arco",
    name: "Arco",
    text: "Tudo centralizado, fotos em arco, menu dos dois lados da logo e muito respiro. Delicado, ótimo para gestante e newborn.",
    overlay: false,
  },
  {
    id: "mosaico",
    name: "Mosaico",
    text: "Blocos de tamanhos diferentes lado a lado, menu em cápsula e depoimentos em carrossel. Atual e cheio de fotos.",
    overlay: false,
  },
];

export const DEFAULT_LAYOUT = "classico";
export const layoutById = (id) => LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];

// A prévia (?modelo=diagonal) vale para a aba inteira: dá para navegar por
// todas as páginas do site vendo o modelo, até fechar a prévia.
const PREVIEW_KEY = "tf-preview-layout";
const valid = (id) => LAYOUTS.some((l) => l.id === id);

/** Modelo em prévia nesta aba do navegador, ou null. */
export function previewLayout(search = typeof window !== "undefined" ? window.location.search : "") {
  const q = new URLSearchParams(search).get("modelo");
  if (valid(q)) {
    try { sessionStorage.setItem(PREVIEW_KEY, q); } catch { /* sem armazenamento */ }
    return q;
  }
  try { const s = sessionStorage.getItem(PREVIEW_KEY); return valid(s) ? s : null; } catch { return null; }
}
export function endPreview() { try { sessionStorage.removeItem(PREVIEW_KEY); } catch { /* sem armazenamento */ } }

/** Modelo em uso: o da prévia aberta pela aba Estilo, ou o salvo. */
export function effectiveLayout(saved, search) {
  return previewLayout(search) || layoutById(saved).id;
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
