export const APPOINTMENT_STATUS = {
  requested: { label: "Solicitação recebida", tone: "info" },
  awaiting: { label: "Aguardando confirmação", tone: "warning" },
  confirmed: { label: "Confirmado", tone: "success" },
  done: { label: "Realizado", tone: "neutral" },
  cancelled: { label: "Cancelado", tone: "muted" },
};

/** Status que ocupam vaga no lote. */
export const COUNTED_STATUSES = ["confirmed", "done"];
/** Status que seguram o horário na agenda. */
export const HOLDING_STATUSES = ["requested", "awaiting", "confirmed", "done"];

export const VIP_STATUS = {
  new: { label: "Novo", tone: "info" },
  contacted: { label: "Contatado", tone: "warning" },
  converted: { label: "Cliente", tone: "success" },
  optout: { label: "Não quer contato", tone: "muted" },
};

export const CAMPAIGN_STATUS = {
  draft: { label: "Rascunho", tone: "neutral" },
  published: { label: "Publicada", tone: "success" },
  closed: { label: "Encerrada", tone: "muted" },
};

export const AFTER_END_ACTIONS = {
  message: "Mostrar mensagem de encerramento",
  hide: "Ocultar a campanha do site",
  redirect: "Encaminhar para a oferta regular",
};

export const CONSENT_TEXT_DEFAULT =
  "Autorizo o uso dos meus dados (nome, WhatsApp e e-mail) para receber comunicações sobre esta campanha e futuros ensaios. Posso pedir a exclusão a qualquer momento.";

/**
 * Páginas dos clientes (seleção de fotos e entrega final). O prefixo vira o
 * endereço público: /selecao/{codigo} e /entrega/{codigo}. Para trocar o nome
 * do endereço (ex.: "mostruario"), basta mudar aqui.
 */
export const CLIENT_PATHS = { selection: "selecao", delivery: "entrega" };

export const SELECTION_STATUS = {
  draft: { label: "Preparando", tone: "neutral" },
  sent: { label: "Aguardando cliente", tone: "info" },
  selecting: { label: "Cliente escolhendo", tone: "warning" },
  finished: { label: "Seleção finalizada", tone: "success" },
  expired: { label: "Prazo vencido", tone: "muted" },
};

export const DELIVERY_STATUS = {
  draft: { label: "Preparando", tone: "neutral" },
  available: { label: "Disponível", tone: "info" },
  downloaded: { label: "Baixada", tone: "success" },
  expired: { label: "Expirada", tone: "muted" },
};

export const SELECTION_DEFAULTS = { photoLimit: 100, deadlineDays: 7, watermark: true, allowExtras: false, extraPriceCents: null };
export const DELIVERY_DEFAULTS = { availableDays: 30 };
