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
