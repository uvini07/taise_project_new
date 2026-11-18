// Estilo do site do estúdio: o modelo (estrutura do site inteiro: cabeçalho,
// seções da página inicial, topo das páginas internas, rodapé e formas) e
// as fontes. As cores ficam em utils/theme.js. Tudo é escolhido na aba Estilo.
import { isEditorPreview } from "../utils/editorMode.js";

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
  {
    id: "cinema",
    name: "Cinema",
    text: "Site escuro, fotos em formato de cinema com faixas pretas, categorias numa tira de filme e detalhes dourados. Dramático e sofisticado.",
    overlay: true,
    dark: true,
  },
  {
    id: "revista",
    name: "Revista",
    text: "Capa de revista: o nome do estúdio enorme, colunas, letra capitular, índice numerado e fios finos. Editorial e cheio de personalidade.",
    overlay: false,
  },
  {
    id: "polaroid",
    name: "Polaroid",
    text: "Fotos instantâneas tortinhas com fita adesiva, depoimentos em bilhetes e contato em cartão-postal. Afetivo, ótimo para família e infantil.",
    overlay: false,
  },
  {
    id: "minimalista",
    name: "Minimalista",
    text: "Muito espaço em branco, textos pequenos e uma foto grande por vez. Deixa as fotos falarem sozinhas.",
    overlay: false,
  },
  {
    id: "imersivo",
    name: "Imersivo",
    text: "Fotos de ponta a ponta em tela cheia, contador de fotos no topo e categorias em faixas gigantes. Para quem quer impressionar.",
    overlay: true,
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
  if (isEditorPreview()) return null; // no Editor, vale o modelo escolhido no painel
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
// cat = família de estilo (filtro no seletor). w = pesos pedidos ao Google
// (vazio = só o normal; cada fonte é carregada em um link próprio, então um
// peso indisponível nunca derruba as outras).
const D = (id, label, mood, cat, w = "") => ({ id, label, mood, cat, w });
export const DISPLAY_FONTS = [
  // Serifadas
  D("Cormorant Garamond", "Cormorant", "Clássica e elegante", "Serifada", "ital,wght@0,400;0,500;0,600;1,400"),
  D("Playfair Display", "Playfair", "Sofisticada, de revista", "Serifada", "ital,wght@0,400;0,500;0,600;1,400"),
  D("DM Serif Display", "DM Serif", "Forte e moderna", "Serifada", "ital@0;1"),
  D("Bodoni Moda", "Bodoni", "Editorial, alto contraste", "Serifada", "ital,wght@0,400;0,500;0,600;1,400"),
  D("Fraunces", "Fraunces", "Calorosa e afetiva", "Serifada", "ital,wght@0,400;0,500;0,600;1,400"),
  D("Marcellus", "Marcellus", "Delicada, com serifas finas", "Serifada"),
  D("Italiana", "Italiana", "Fina e romântica", "Serifada"),
  D("Libre Baskerville", "Baskerville", "Tradicional, de livro", "Serifada", "ital,wght@0,400;0,700;1,400"),
  D("Lora", "Lora", "Suave e acolhedora", "Serifada", "ital,wght@0,400;0,500;0,600;1,400"),
  D("EB Garamond", "Garamond", "Atemporal", "Serifada", "ital,wght@0,400;0,500;0,600;1,400"),
  D("Cinzel", "Cinzel", "Monumental, só maiúsculas", "Serifada", "wght@400;500;600"),
  D("Prata", "Prata", "Fashion, fina", "Serifada"),
  D("Gilda Display", "Gilda", "Romântica, de convite", "Serifada"),
  D("Abril Fatface", "Abril", "Pesada, de capa", "Serifada"),
  D("Yeseva One", "Yeseva", "Feminina e marcante", "Serifada"),
  D("Spectral", "Spectral", "Literária e leve", "Serifada", "ital,wght@0,400;0,500;1,400"),
  D("Forum", "Forum", "Clássica romana", "Serifada"),
  D("Rozha One", "Rozha", "Contraste dramático", "Serifada"),
  // Sem serifa
  D("Montserrat", "Montserrat", "Sem serifa, limpa", "Sem serifa", "wght@400;500;600"),
  D("Josefin Sans", "Josefin", "Geométrica e vintage", "Sem serifa", "wght@300;400;600"),
  D("Raleway", "Raleway", "Fina e elegante", "Sem serifa", "wght@300;400;600"),
  D("Tenor Sans", "Tenor", "Minimalista de luxo", "Sem serifa"),
  D("Poppins", "Poppins", "Moderna e redonda", "Sem serifa", "wght@400;500;600"),
  D("Syne", "Syne", "Criativa, de estúdio", "Sem serifa", "wght@400;600;700"),
  D("Space Grotesk", "Space Grotesk", "Tecnológica e atual", "Sem serifa", "wght@400;500;600"),
  D("Unbounded", "Unbounded", "Larga e ousada", "Sem serifa", "wght@400;600"),
  // Impacto
  D("Bebas Neue", "Bebas", "Alta, de pôster", "Impacto"),
  D("Oswald", "Oswald", "Condensada e firme", "Impacto", "wght@400;500;600"),
  D("Anton", "Anton", "Pesada, de manchete", "Impacto"),
  D("Archivo Black", "Archivo Black", "Grossa e direta", "Impacto"),
  // Slab
  D("Zilla Slab", "Zilla Slab", "Robusta e amigável", "Slab", "wght@400;600"),
  D("Arvo", "Arvo", "Retrô, de máquina", "Slab", "wght@400;700"),
  // Manuscritas
  D("Great Vibes", "Great Vibes", "Caligrafia de convite", "Manuscrita"),
  D("Parisienne", "Parisienne", "Francesa e charmosa", "Manuscrita"),
  D("Allura", "Allura", "Assinatura delicada", "Manuscrita"),
  D("Pinyon Script", "Pinyon", "Formal, de casamento", "Manuscrita"),
  D("Dancing Script", "Dancing Script", "Alegre e solta", "Manuscrita", "wght@400;600"),
  D("Sacramento", "Sacramento", "Fina, de assinatura", "Manuscrita"),
  D("Alex Brush", "Alex Brush", "Pincel elegante", "Manuscrita"),
  D("Tangerine", "Tangerine", "Caligrafia leve", "Manuscrita", "wght@400;700"),
  D("Italianno", "Italianno", "Itálica romântica", "Manuscrita"),
  D("Caveat", "Caveat", "Escrita à mão, casual", "Manuscrita", "wght@400;600"),
  D("Amatic SC", "Amatic", "Desenhada à mão", "Manuscrita", "wght@400;700"),
];

const B = (id, cat, w) => ({ id, label: id, cat, w });
export const BODY_FONTS = [
  B("Jost", "Sem serifa", "wght@300;400;500;600"),
  B("Lato", "Sem serifa", "wght@300;400;700"),
  B("DM Sans", "Sem serifa", "wght@300;400;500;600"),
  B("Nunito Sans", "Sem serifa", "wght@300;400;600"),
  B("Work Sans", "Sem serifa", "wght@300;400;500;600"),
  B("Karla", "Sem serifa", "wght@300;400;500;600"),
  B("Inter", "Sem serifa", "wght@300;400;500;600"),
  B("Montserrat", "Sem serifa", "wght@300;400;500;600"),
  B("Raleway", "Sem serifa", "wght@300;400;500;600"),
  B("Poppins", "Sem serifa", "wght@300;400;500;600"),
  B("Open Sans", "Sem serifa", "wght@300;400;600"),
  B("Source Sans 3", "Sem serifa", "wght@300;400;600"),
  B("Mulish", "Sem serifa", "wght@300;400;600"),
  B("Manrope", "Sem serifa", "wght@300;400;500;600"),
  B("Outfit", "Sem serifa", "wght@300;400;500;600"),
  B("Figtree", "Sem serifa", "wght@300;400;500;600"),
  B("Quicksand", "Sem serifa", "wght@400;500;600"),
  B("Josefin Sans", "Sem serifa", "wght@300;400;600"),
  B("Nunito", "Sem serifa", "wght@300;400;600"),
  B("Rubik", "Sem serifa", "wght@300;400;500;600"),
  B("Lora", "Serifada", "ital,wght@0,400;0,500;0,600;1,400"),
  B("Libre Baskerville", "Serifada", "ital,wght@0,400;0,700;1,400"),
  B("Crimson Pro", "Serifada", "ital,wght@0,400;0,600;1,400"),
  B("EB Garamond", "Serifada", "ital,wght@0,400;0,500;0,600;1,400"),
  B("Merriweather", "Serifada", "ital,wght@0,300;0,400;0,700;1,400"),
  B("Spectral", "Serifada", "ital,wght@0,300;0,400;0,500;1,400"),
];

export const DEFAULT_FONTS = { display: "Cormorant Garamond", body: "Jost" };
const ALREADY_LOADED = new Set(["Cormorant Garamond", "Jost"]); // vêm no index.html

const familyUrl = (f, text) => `https://fonts.googleapis.com/css2?family=${f.id.replace(/ /g, "+")}${f.w && !text ? `:${f.w}` : ""}&display=swap${text ? `&text=${encodeURIComponent(text)}` : ""}`;
function ensureLink(id, href) {
  if (typeof document === "undefined" || document.getElementById(id)) return;
  document.head.appendChild(Object.assign(document.createElement("link"), { id, rel: "stylesheet", href }));
}
const slug = (s) => s.replace(/[^a-z0-9]/gi, "-").toLowerCase();

/** Carrega uma fonte inteira (para usar no site). */
export function loadFont(f) {
  if (!f || ALREADY_LOADED.has(f.id) || typeof document === "undefined") return;
  // A fonte completa entra depois da amostra (se houver) e passa a valer.
  const old = document.getElementById(`font-${slug(f.id)}`);
  if (!old) ensureLink(`font-${slug(f.id)}`, familyUrl(f));
}
/** Carrega só as letras da amostra (leve) para mostrar no seletor. */
export function loadFontSample(f, text) {
  if (!f || ALREADY_LOADED.has(f.id) || typeof document === "undefined" || document.getElementById(`font-${slug(f.id)}`)) return;
  ensureLink(`font-s-${slug(f.id)}`, familyUrl(f, text));
}

/** Carrega as fontes escolhidas e aplica nas variáveis CSS que o Tailwind usa. */
export function applyFonts(fonts) {
  if (typeof document === "undefined") return;
  const d = DISPLAY_FONTS.find((f) => f.id === fonts?.display) || DISPLAY_FONTS[0];
  const b = BODY_FONTS.find((f) => f.id === fonts?.body) || BODY_FONTS[0];
  loadFont(d); loadFont(b);
  const root = document.documentElement.style;
  root.setProperty("--font-display", `"${d.id}"`);
  root.setProperty("--font-body", `"${b.id}"`);
}

/** Amostras de todas as fontes (só as letras usadas nos exemplos: leve). */
export function loadAllFontsForPreview() {
  DISPLAY_FONTS.forEach((f) => loadFontSample(f, FONT_SAMPLE_TEXT));
  BODY_FONTS.forEach((f) => loadFontSample(f, FONT_SAMPLE_TEXT));
}
export const FONT_SAMPLE_TEXT = "AaMomentosquemerecemserlembradosAgendejáEnsaiofotográficoÁáé ";
