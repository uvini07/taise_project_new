// Regras puras das páginas de cliente (seleção de fotos e entrega final):
// endereço da página, prazos, tamanhos e conferência entre o que o cliente
// escolheu e o que foi entregue.
import { slugify } from "./text.js";

const CODE_CHARS = "abcdefghjkmnpqrstuvwxyz23456789"; // sem 0/o, 1/l/i

/** Código curto e difícil de adivinhar (ex.: "k3j9"). */
export function randomCode(length = 4, rand = Math.random) {
  let s = "";
  for (let i = 0; i < length; i++) s += CODE_CHARS[Math.floor(rand() * CODE_CHARS.length)];
  return s;
}

/**
 * Endereço da página do cliente: nome em formato de link + código opcional.
 * "Ana Souza" + "k3j9" -> "ana-souza-k3j9".
 */
export function clientSlug(name, code = "") {
  const base = slugify(name).slice(0, 48);
  return [base, code].filter(Boolean).join("-");
}

/** O endereço precisa ter ao menos 3 caracteres válidos e não pode repetir. */
export function validateSlug(slug, taken = []) {
  if (!slug || slug.length < 3) return "O endereço precisa ter pelo menos 3 letras ou números.";
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return "Use só letras minúsculas, números e hífen.";
  if (taken.includes(slug)) return "Já existe uma página com esse endereço.";
  return null;
}

const UNITS = ["B", "KB", "MB", "GB", "TB"];
export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const i = Math.min(UNITS.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const v = bytes / 1024 ** i;
  return `${v.toLocaleString("pt-BR", { maximumFractionDigits: v >= 100 || i === 0 ? 0 : 1 })} ${UNITS[i]}`;
}

/** Economia percentual (0–100) entre o original e a versão leve. */
export function savingsPercent(original, converted) {
  if (!original) return 0;
  return Math.max(0, Math.round((1 - converted / original) * 100));
}

const DAY = 24 * 60 * 60 * 1000;

export function addDaysTo(date, days) {
  return new Date(new Date(date).getTime() + days * DAY);
}

/** Dias inteiros que faltam (arredonda para cima; 0 = vence hoje ou já venceu). */
export function daysLeft(expiresAt, now = new Date()) {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - now.getTime();
  return ms <= 0 ? 0 : Math.ceil(ms / DAY);
}

export function isExpired(expiresAt, now = new Date()) {
  return !!expiresAt && new Date(expiresAt).getTime() <= now.getTime();
}

/** Texto curto do prazo: "Vence em 3 dias", "Vence hoje", "Venceu". */
export function deadlineLabel(expiresAt, now = new Date()) {
  if (!expiresAt) return "Prazo começa ao enviar o link";
  if (isExpired(expiresAt, now)) return "Prazo vencido";
  const d = daysLeft(expiresAt, now);
  const hours = (new Date(expiresAt).getTime() - now.getTime()) / 36e5;
  if (hours < 24) return "Vence hoje";
  return d === 1 ? "Vence amanhã" : `Vence em ${d} dias`;
}

/** Status efetivo: um link enviado que passou do prazo aparece como vencido. */
export function effectiveStatus(item, now = new Date()) {
  if (["sent", "selecting", "available"].includes(item.status) && isExpired(item.expiresAt, now)) return "expired";
  return item.status;
}

/** "IMG_4821.CR3" -> "IMG_4821" (para comparar seleção x entrega). */
export function baseName(filename) {
  const name = String(filename || "").split(/[\\/]/).pop();
  const dot = name.lastIndexOf(".");
  return (dot > 0 ? name.slice(0, dot) : name).trim();
}

/** Lista de nomes para colar no filtro do Lightroom (ou onde preferir). */
export function namesList(filenames, separator = ", ") {
  return [...new Set(filenames.map(baseName).filter(Boolean))].join(separator);
}

/**
 * Confere a entrega com a seleção, pelo nome do arquivo sem extensão
 * (sem diferenciar maiúsculas). Retorna o que falta entregar e o que veio a mais.
 */
export function compareDelivery(selectedNames, deliveredNames) {
  const key = (n) => baseName(n).toLowerCase();
  const delivered = new Set(deliveredNames.map(key));
  const selected = new Set(selectedNames.map(key));
  return {
    missing: selectedNames.filter((n) => !delivered.has(key(n))).map(baseName),
    extra: deliveredNames.filter((n) => !selected.has(key(n))).map(baseName),
    matched: selectedNames.filter((n) => delivered.has(key(n))).length,
  };
}

/** Mensagem pronta para mandar o link pelo WhatsApp. */
export function clientMessage(kind, { clientName, url, expiresAt, photoLimit }) {
  const first = String(clientName || "").trim().split(/\s+/)[0] || "";
  const prazo = expiresAt ? new Date(expiresAt).toLocaleDateString("pt-BR") : null;
  if (kind === "delivery") {
    return [
      `Oi${first ? `, ${first}` : ""}! Suas fotos estão prontas 🤍`,
      `Para baixar: ${url}`,
      prazo ? `O link fica disponível até ${prazo}. Baixe e guarde em um lugar seguro.` : null,
    ].filter(Boolean).join("\n");
  }
  return [
    `Oi${first ? `, ${first}` : ""}! As fotos do seu ensaio já estão disponíveis para escolha 🤍`,
    `Acesse: ${url}`,
    photoLimit ? `Você pode escolher até ${photoLimit} fotos.` : null,
    prazo ? `A seleção fica aberta até ${prazo}.` : null,
  ].filter(Boolean).join("\n");
}
