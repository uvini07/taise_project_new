import { normalizePhoneBR } from "./validation.js";
import { formatBRL, formatDayBR } from "./format.js";

/** Link oficial wa.me com número normalizado e mensagem opcional. */
export function whatsappLink(number, message = "") {
  const n = normalizePhoneBR(number);
  if (!n) return null;
  const q = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${n}${q}`;
}

/**
 * Mensagens prontas por contexto. Só vai o necessário para a fotógrafa
 * entender o pedido — nada de dados pessoais além do que a pessoa digitar.
 */
export const waMessages = {
  general: (brand) => `Olá! Vim pelo site da ${brand} e gostaria de mais informações.`,
  quote: (brand) => `Olá! Vim pelo site da ${brand} e gostaria de solicitar um orçamento.`,
  package: (pkg, lot) =>
    [
      `Olá! Tenho interesse no pacote *${pkg.name}*.`,
      lot ? `${lot.name} — ${formatBRL(lot.priceCents)}` : null,
      "Pode me passar mais informações sobre disponibilidade?",
    ].filter(Boolean).join("\n"),
  category: (name) => `Olá! Tenho interesse em um ensaio de *${name}*. Pode me passar mais informações?`,
  availability: () => "Olá! Gostaria de saber sobre as datas disponíveis para ensaio.",
  campaign: (name) => `Olá! Tenho uma dúvida sobre *${name}*.`,
  booking: (appt) =>
    [
      "Olá! Acabei de enviar um pedido de agendamento pelo site.",
      `Pacote: ${appt.packageName}${appt.lotName ? ` (${appt.lotName})` : ""}`,
      `Data: ${formatDayBR(appt.date)} às ${appt.time}`,
      `Nome: ${appt.name}`,
      appt.code ? `Código do pedido: ${appt.code}` : null,
    ].filter(Boolean).join("\n"),
};
