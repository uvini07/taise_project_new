// Estúdios (clientes) da Revela. Por enquanto só existe um: o site da Taíse,
// que fica em /tarufino. A raiz do domínio é a página da Revela.

export const TENANT = {
  slug: "tarufino",
  name: "Taíse Foto",
  ownerEmail: "tarufino@gmail.com",
};

export const SITE_BASE = `/${TENANT.slug}`;

/** Caminho dentro do site do estúdio: sitePath("/pacotes") → "/tarufino/pacotes". */
export function sitePath(path = "/") {
  if (!path || path === "/") return SITE_BASE;
  return `${SITE_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

/** O caminho sem o prefixo do estúdio ("/tarufino/vip/x" → "/vip/x"). */
export function stripSiteBase(pathname = "/") {
  if (pathname === SITE_BASE) return "/";
  if (pathname.startsWith(`${SITE_BASE}/`)) return pathname.slice(SITE_BASE.length) || "/";
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
  "ajuda", "suporte", "termos", "privacidade", "blog", "app", "www", "legacy", "brand", "img", "static",
  ...LEGACY_SITE_ROOTS,
];
