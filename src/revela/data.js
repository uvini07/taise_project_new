// Planos e números da Revela (definidos com a dona da plataforma).
// Todos os planos têm todas as ferramentas; muda o limite de cada uma.

export const PLANS = [
  {
    id: "essencial",
    name: "Essencial",
    price: 89,
    forWho: "Para quem está começando ou fotografa algumas vezes por mês.",
    limits: [
      { k: "selecoes", label: "4 seleções abertas ao mesmo tempo" },
      { k: "previas", label: "Até 150 prévias por ensaio" },
      { k: "espaco", label: "5 GB de entrega ativa" },
      { k: "prazo", label: "Download por 7 dias" },
    ],
  },
  {
    id: "profissional",
    name: "Profissional",
    price: 149,
    recommended: true,
    forWho: "Para quem fotografa toda semana e entrega muitos ensaios.",
    limits: [
      { k: "selecoes", label: "15 seleções abertas ao mesmo tempo" },
      { k: "previas", label: "Até 400 prévias por ensaio" },
      { k: "espaco", label: "20 GB de entrega ativa" },
      { k: "prazo", label: "Download por 14 dias" },
    ],
  },
  {
    id: "eventos",
    name: "Eventos",
    price: 229,
    forWho: "Para casamentos, formaturas e eventos com muitas fotos.",
    limits: [
      { k: "selecoes", label: "Seleções sem limite" },
      { k: "previas", label: "Até 1.500 prévias por ensaio" },
      { k: "espaco", label: "100 GB de entrega ativa" },
      { k: "prazo", label: "Download por 30 dias" },
    ],
  },
];

export const INCLUDED = ["Site com o seu nome e 10 modelos", "Agenda online com sinal", "Pacotes e lotes", "Lista VIP", "Financeiro e relatórios", "Polaroidy, assistente com IA"];

export const CREDITS = [
  { label: "+10 GB de entrega", price: 20 },
  { label: "+2 seleções no mês", price: 15 },
  { label: "+250 prévias num ensaio", price: 10 },
  { label: "+7 dias de download", price: 5 },
];

export const COMPARE = [
  { label: "Site, pacotes, agenda, lista VIP e financeiro", values: [true, true, true] },
  { label: "Seleção de fotos com proteção contra print", values: [true, true, true] },
  { label: "Polaroidy, assistente com IA", values: [true, true, true] },
  { label: "Seleções abertas ao mesmo tempo", values: ["4", "15", "Sem limite"] },
  { label: "Prévias por ensaio", values: ["150", "400", "1.500"] },
  { label: "Espaço de entrega ativa", values: ["5 GB", "20 GB", "100 GB"] },
  { label: "Prazo para o cliente baixar", values: ["7 dias", "14 dias", "30 dias"] },
  { label: "Prazo da seleção (ajustável)", values: ["7 dias", "7 dias", "7 dias"] },
];

export const FROM_PRICE = Math.min(...PLANS.map((p) => p.price));
export const planById = (id) => PLANS.find((p) => p.id === id) || null;
