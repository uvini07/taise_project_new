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
    phone: "(11) 96038-2670",
    whatsapp: "5511960382670",
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

// Fotos provisórias (do projeto antigo) usadas só até a fotógrafa escolher as
// dela em Configurações. O painel avisa enquanto estiverem em uso.
export const FALLBACK_IMAGES = {
  hero: [
    { url: "/legacy/hero-1.webp", thumbUrl: "/legacy/hero-1-800.webp", alt: "Ensaio infantil em estúdio" },
    { url: "/legacy/hero-2.webp", thumbUrl: "/legacy/hero-2-800.webp", alt: "Irmãos abraçados durante o ensaio" },
  ],
  about: { url: "/legacy/about-1.webp", thumbUrl: "/legacy/about-1-800.webp", alt: "Ensaio em estúdio" },
};

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
  const out = { ...DEFAULT_SETTINGS, ...s };
  for (const k of ["hero", "about", "contact", "social", "policies", "seo", "display"]) {
    out[k] = { ...DEFAULT_SETTINGS[k], ...(s[k] || {}) };
  }
  out.faq = Array.isArray(s.faq) ? s.faq : [];
  out.testimonials = Array.isArray(s.testimonials) ? s.testimonials : [];
  out.isDefault = !saved;
  return out;
}
