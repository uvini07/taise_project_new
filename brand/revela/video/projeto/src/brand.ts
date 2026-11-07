import { Easing } from "remotion";

export const FPS = 30;
// Música house-vibez: 123 BPM, primeira batida em 0,07 s.
export const BEAT = 0.4878;
export const beatF = (n: number) => Math.round((0.07 + n * BEAT) * FPS);

export const C = {
  ameixa: "#2B2540",
  rosa: "#C95D63",
  lavanda: "#E6E1F0",
  lilas: "#8E86A6",
  nevoa: "#F7F5FA",
  branco: "#FFFFFF",
  linha: "#DDD8E8",
};

// Paletas que passam rápido na abertura (todas saíram dos testes de cor do guia).
export const PALETTES: { bg: string; ink: string; dot: string }[] = [
  { bg: "#0B1F3A", ink: "#F3EEE6", dot: "#F2A541" }, // azul marinho
  { bg: "#4E1622", ink: "#F2E6D8", dot: "#E3B47C" }, // vinho
  { bg: "#1E3A2F", ink: "#EFE8D8", dot: "#E0A84B" }, // verde floresta
  { bg: "#FF6A3D", ink: "#FFFFFF", dot: "#1C1917" }, // laranja revelação
  { bg: "#EBD5D0", ink: "#4A2B29", dot: "#B8574C" }, // rosa antigo
  { bg: "#0E4D5A", ink: "#F4EFE6", dot: "#F28C38" }, // petróleo
  { bg: "#F7C948", ink: "#1C1917", dot: "#FFFFFF" }, // amarelo câmera
  { bg: "#2E1A3A", ink: "#EFE6F2", dot: "#E8A87C" }, // berinjela
  { bg: "#7B5CFF", ink: "#FFFFFF", dot: "#FFD166" }, // lilás elétrico
  { bg: "#B85C3E", ink: "#FBF3EA", dot: "#2B1D16" }, // terracota
  { bg: "#DCE3D3", ink: "#2E3B2B", dot: "#C0623F" }, // sálvia
  { bg: "#0D0D0D", ink: "#E9DCB8", dot: "#C9A44C" }, // preto e ouro
];

// Tokens de movimento: "sensível e confiável" → entradas suaves sem quique,
// só os pousos (cartões, ícone) têm um leve overshoot.
export const EASE_IN = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_INOUT = Easing.bezier(0.65, 0, 0.35, 1);
export const EASE_LAND = Easing.bezier(0.34, 1.35, 0.64, 1);
export const EASE_ACCEL = Easing.bezier(0.55, 0, 1, 0.45);

export const FONT_TITLE = "Revela, Jost, sans-serif";
export const FONT_BODY = "Jost, sans-serif";

// Pseudoaleatório determinístico.
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
