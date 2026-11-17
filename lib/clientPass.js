// Senha de acesso das páginas do cliente (seleção/entrega). Gerada no servidor
// na hora de liberar o link; só o hash (scrypt) fica no banco.
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// Sem letras/números que se confundem (0/O, 1/I/L).
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const PASS_LENGTH = 6;
export const MAX_FAILS = 8;
export const LOCK_MINUTES = 15;

export function generatePassword(len = PASS_LENGTH) {
  const bytes = randomBytes(len * 2);
  let out = "";
  for (let i = 0; out.length < len && i < bytes.length; i += 1) {
    if (bytes[i] < 248) out += ALPHABET[bytes[i] % ALPHABET.length]; // 248 = 8 × 31, sem viés
  }
  return out.length === len ? out : generatePassword(len);
}

export const normalizePassword = (p) => String(p || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(normalizePassword(password), salt, 32).toString("hex");
  return { hash, salt };
}

export function checkPassword(password, access) {
  if (!access?.hash || !access?.salt) return false;
  const got = scryptSync(normalizePassword(password), access.salt, 32);
  const want = Buffer.from(access.hash, "hex");
  return got.length === want.length && timingSafeEqual(got, want);
}
