import { onlyDigits } from "./text.js";

/**
 * Telefone brasileiro -> só dígitos com DDI 55 (formato do wa.me e o que é
 * guardado no banco). Retorna null se não parecer um celular/fixo válido.
 */
export function normalizePhoneBR(input) {
  let d = onlyDigits(input);
  if (!d) return null;
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 10 || d.length === 11) d = "55" + d;
  if (!d.startsWith("55")) return d.length >= 10 && d.length <= 13 ? d : null;
  if (d.length !== 12 && d.length !== 13) return null;
  const ddd = Number(d.slice(2, 4));
  if (ddd < 11 || ddd > 99) return null;
  return d;
}

/** "5511960382670" -> "(11) 96038-2670" */
export function formatPhoneBR(digits) {
  const d = onlyDigits(digits);
  const local = d.startsWith("55") && d.length >= 12 ? d.slice(2) : d;
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  return digits || "";
}

export function isValidEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || "").trim());
}

export function cleanText(s, max = 1000) {
  return String(s || "").replace(/\s+\n/g, "\n").trim().slice(0, max);
}

export function validateName(s) {
  const v = String(s || "").trim();
  if (v.length < 2) return "Informe seu nome.";
  if (v.length > 120) return "Nome muito longo.";
  return null;
}

/** Valida um formulário simples: { campo: [valor, validador] } -> { campo: erro } */
export function collectErrors(spec) {
  const out = {};
  for (const [k, [v, fn]] of Object.entries(spec)) {
    const err = fn(v);
    if (err) out[k] = err;
  }
  return out;
}
