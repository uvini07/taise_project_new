// Suporte da Revela pelo WhatsApp (botão "Ajuda" do painel, entrar e cadastro).
export const SUPPORT_WHATSAPP = "5511971813986";

/** Link do WhatsApp do suporte com uma mensagem pronta (cita o estúdio, se houver). */
export function supportLink(studioName) {
  const text = studioName
    ? `Olá! Preciso de ajuda com a Revela. Meu estúdio: ${studioName}.`
    : "Olá! Preciso de ajuda com a Revela.";
  return `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(text)}`;
}
