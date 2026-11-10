import { isLegacyStudio } from "./tenant.js";

// Valores iniciais do site, usados enquanto a fotógrafa não salva as
// Configurações no painel. Contato e endereço foram conferidos no projeto
// antigo (index.html: CONFIG.contact, seção "Onde fica o estúdio?" e rodapé).
// O que não existia lá fica vazio e aparece como pendência no painel.

export const DEFAULT_SETTINGS = {
  brandName: "Taíse Foto",
  legalName: "Taise Rufino Fotografia",
  logoUrl: "",
  hero: {
    eyebrow: "Fotografia afetiva",
    title: "Momentos que merecem ser lembrados",
    subtitle: "Fotografia feita com calma, luz cuidadosa e muito carinho pelos detalhes — para guardar a sua história do jeito que ela é.",
    primaryLabel: "Conhecer os pacotes",
    secondaryLabel: "Ver a galeria",
    images: [],
  },
  about: {
    title: "Um olhar sensível para a sua história",
    text: "Cada ensaio é pensado para que você e a sua família fiquem à vontade, sem pressa e sem poses forçadas.\n\nO resultado são imagens verdadeiras, para rever daqui a muitos anos e reencontrar exatamente o que foi sentido naquele dia.",
    photoUrl: "",
    signature: "Taise Rufino",
  },
  contact: {
    // Atendimento geral (dúvidas, orçamentos, botões do site).
    phone: "(11) 91456-4549",
    whatsapp: "5511914564549",
    // Número das clientes com reserva: mensagem enviada depois do agendamento.
    bookingWhatsapp: "5511960382670",
    email: "tarufino@gmail.com",
    address: "Rua Presidente Castelo Branco, 45 — 5º andar",
    addressLine2: "Edifício Comercial In Offices",
    city: "",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Rua%20Presidente%20Castelo%20Branco%2C%2045%20-%20Edif%C3%ADcio%20Comercial%20In%20Offices",
    hours: "",
    studioNote: "Os ensaios em estúdio acontecem em ambiente fechado e climatizado, com cenário montado.",
  },
  social: { instagram: "", facebook: "", tiktok: "", youtube: "", pinterest: "" },
  footerText: "Fotografia feita com calma, luz cuidadosa e muito carinho pelos detalhes.",
  policies: {
    booking: "",
    cancellation: "",
    privacy: "",
  },
  faq: [],
  testimonials: [],
  seo: {
    title: "Taíse Foto — Fotografia de família, ensaios e eventos",
    description: "Ensaios fotográficos de família, infantis, gestantes, aniversários e eventos. Conheça os pacotes, a galeria e agende seu horário.",
    shareImageUrl: "",
  },
  display: {
    showWhatsappFab: true,
    showAgenda: true,
    showVipBanner: true,
    showTestimonials: true,
    showFeaturedGallery: true,
  },
};

// Estúdio novo (cadastro pela Revela): o mesmo modelo do site, "em branco",
// sem nenhum dado da Taíse. A fotógrafa preenche tudo em Configurações.
const BLANK_SETTINGS = {
  ...DEFAULT_SETTINGS,
  brandName: "Seu estúdio",
  legalName: "",
  about: { ...DEFAULT_SETTINGS.about, signature: "" },
  contact: { phone: "", whatsapp: "", bookingWhatsapp: "", email: "", address: "", addressLine2: "", city: "", mapUrl: "", hours: "", studioNote: "" },
  seo: { title: "", description: "", shareImageUrl: "" },
};

// Fotos provisórias usadas só até a fotógrafa escolher as dela em
// Configurações. O painel avisa enquanto estiverem em uso.
const LEGACY_FALLBACK = {
  hero: [
    { url: "/legacy/hero-1.webp", thumbUrl: "/legacy/hero-1-800.webp", alt: "Ensaio infantil em estúdio" },
    { url: "/legacy/hero-2.webp", thumbUrl: "/legacy/hero-2-800.webp", alt: "Irmãos abraçados durante o ensaio" },
  ],
  about: { url: "/legacy/about-1.webp", thumbUrl: "/legacy/about-1-800.webp", alt: "Ensaio em estúdio" },
};
// Estúdios novos: fotos de exemplo livres (StockSnap, CC0), nunca as da Taíse.
const BLANK_FALLBACK = {
  hero: [
    { url: "/revela/img/familia-brincando.webp", thumbUrl: "/revela/img/familia-brincando.webp", alt: "Foto de exemplo" },
    { url: "/revela/img/gestante-floral.webp", thumbUrl: "/revela/img/gestante-floral.webp", alt: "Foto de exemplo" },
  ],
  about: { url: "/revela/img/fotografo.webp", thumbUrl: "/revela/img/fotografo.webp", alt: "Foto de exemplo" },
};
export const FALLBACK_IMAGES = new Proxy({}, { get: (_, k) => (isLegacyStudio() ? LEGACY_FALLBACK : BLANK_FALLBACK)[k] });

export const LOGO = {
  dark: "/brand/logo-dark.webp",
  light: "/brand/logo-light.webp",
  darkPng: "/brand/logo-dark.png",
  lightPng: "/brand/logo-light.png",
};

export const SUGGESTED_CATEGORIES = [
  "Aniversários", "Ensaios de família", "Natal", "Dia das Crianças", "Festas", "Casamentos",
  "Ensaios individuais", "Gestantes", "Ensaios infantis", "Eventos",
];

/** Mescla o documento salvo com os padrões, campo a campo. */
export function mergeSettings(saved) {
  const s = saved || {};
  const legacy = isLegacyStudio();
  const base = legacy ? DEFAULT_SETTINGS : BLANK_SETTINGS;
  const out = { ...base, ...s };
  for (const k of ["hero", "about", "contact", "social", "policies", "seo", "display"]) {
    out[k] = { ...base[k], ...(s[k] || {}) };
  }
  out.faq = Array.isArray(s.faq) ? s.faq : [];
  out.testimonials = Array.isArray(s.testimonials) ? s.testimonials : [];
  out.theme = { primary: "#3E060A", background: "#FAF7F2", surface: "#FFFFFF", text: "#221A16", onPrimary: "#F0E6D7", accent: "#A1815E", ...(s.theme || {}) };
  out.themePresets = Array.isArray(s.themePresets) ? s.themePresets : [];
  out.layout = s.layout || "classico";
  out.fonts = { display: "Cormorant Garamond", body: "Jost", ...(s.fonts || {}) };
  out.onboardingDone = s.onboardingDone === true;
  out.promoEvent = { enabled: false, title: "", subtitle: "", images: [], packageIds: [], ...(s.promoEvent || {}) };
  out.promoTemplates = Array.isArray(s.promoTemplates) ? s.promoTemplates : [];
  // Migração: o número antigo passou a ser só das reservas.
  if (legacy && !s.contact?.bookingWhatsapp && out.contact.whatsapp === "5511960382670") {
    out.contact = { ...out.contact, bookingWhatsapp: "5511960382670", whatsapp: "5511914564549", phone: "(11) 91456-4549" };
  }
  out.contentVersion = s.contentVersion ?? 0;
  out.isDefault = !saved;
  return out;
}
