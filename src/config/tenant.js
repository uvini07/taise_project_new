// Estúdios (clientes) da Revela. Por enquanto só existe um: o site da Taíse,
// que fica em /tarufino. A raiz do domínio é a página da Revela.

export const TENANT = {
  slug: "tarufino",
  name: "Taíse Foto",
  ownerEmail: "tarufino@gmail.com",
};

export const SITE_BASE = `/${TENANT.slug}`;

// Estúdio aberto agora (no site público, o do endereço; no painel, o da conta).
// A Taíse continua nas coleções da raiz do banco; os novos estúdios ficam em
// studios/{slug}/... (veja services/studioDb.js).
let current = TENANT.slug;
export function setCurrentStudio(slug) { current = slug || TENANT.slug; }
export function currentStudio() { return current; }
export function isLegacyStudio(slug = current) { return slug === TENANT.slug; }
const base = () => `/${current}`;

/** Caminho dentro do site do estúdio: sitePath("/pacotes") → "/tarufino/pacotes". */
export function sitePath(path = "/") {
  if (!path || path === "/") return base();
  return `${base()}${path.startsWith("/") ? path : `/${path}`}`;
}

/** O caminho sem o prefixo do estúdio ("/tarufino/vip/x" → "/vip/x"). */
export function stripSiteBase(pathname = "/") {
  const b = base();
  if (pathname === b) return "/";
  if (pathname.startsWith(`${b}/`)) return pathname.slice(b.length) || "/";
  return pathname;
}

// Endereços antigos do site da Taíse (antes de /tarufino). Links já enviados
// para clientes, como /vip/natal ou /pacotes/abc, continuam funcionando.
export const LEGACY_SITE_ROOTS = ["sobre", "pacotes", "galeria", "agenda", "agendar", "vip", "contato", "politicas", "selecao", "entrega"];

/** Para onde levar um endereço antigo; null se não for do site antigo. */
export function legacyRedirect(pathname = "/", search = "", hash = "") {
  const first = pathname.split("/")[1] || "";
  if (!LEGACY_SITE_ROOTS.includes(first)) return null;
  return `${SITE_BASE}${pathname}${search || ""}${hash || ""}`;
}

// Endereços que nenhum estúdio pode usar (rotas da própria Revela).
export const RESERVED_SLUGS = [
  "adm", "api", "assets", "entrar", "cadastro", "planos", "ferramentas", "login", "revela", "admin", "painel", "conta",
  "ajuda", "suporte", "termos", "privacidade", "blog", "app", "www", "legacy", "brand", "img", "static", "studios",
  ...LEGACY_SITE_ROOTS,
];
