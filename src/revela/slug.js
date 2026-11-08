import { slugify } from "../utils/text.js";
import { RESERVED_SLUGS, TENANT } from "../config/tenant.js";

// Endereço do estúdio na Revela: /nome-do-estudio (letras, números e hífen).
export const SLUG_MIN = 3;
export const SLUG_MAX = 30;

/** "Ana Lima Fotografia" → "analimafotografia" (sem hífens, como /tarufino). */
export function suggestSlug(name) {
  return slugify(name).replace(/-/g, "").slice(0, SLUG_MAX);
}

/** Deixa só o que vale num endereço enquanto a pessoa digita. */
export function cleanSlugInput(v) {
  return String(v || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9-]/g, "").replace(/-{2,}/g, "-").slice(0, SLUG_MAX);
}

const TAKEN = new Set([TENANT.slug, ...RESERVED_SLUGS]);

/** null quando o endereço pode ser usado; senão, o motivo. */
export function slugProblem(slug) {
  const s = String(slug || "");
  if (s.length < SLUG_MIN) return `Use pelo menos ${SLUG_MIN} letras ou números.`;
  if (s.length > SLUG_MAX) return `Use no máximo ${SLUG_MAX} caracteres.`;
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(s)) return "Use só letras, números e hífen (sem começar ou terminar com hífen).";
  if (TAKEN.has(s)) return "Este endereço já está em uso. Tente outro.";
  return null;
}
