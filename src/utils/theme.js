// Tema de cores do site. A fotógrafa escolhe a cor principal (hoje vinho) e a
// cor de fundo; os tons intermediários são calculados aqui e aplicados como
// variáveis CSS, que o Tailwind usa (wine-*, ivory, paper, sand, cream).

export const DEFAULT_THEME = { primary: "#3E060A", background: "#FAF7F2", surface: "#FFFFFF", text: "#221A16", onPrimary: "#F0E6D7", accent: "#A1815E" };

export const BUILTIN_THEMES = [
  { id: "original", name: "Original (vinho)", primary: "#3E060A", background: "#FAF7F2", surface: "#FFFFFF", text: "#221A16", onPrimary: "#F0E6D7", accent: "#A1815E" },
  { id: "maes", name: "Dia das Mães (rosa)", primary: "#9D3C5E", background: "#FDF6F7", surface: "#FFFFFF", text: "#2A1A20", onPrimary: "#FFF4F7", accent: "#C98A9E" },
  { id: "criancas", name: "Dia das Crianças (azul)", primary: "#1F4E79", background: "#F6F9FC", surface: "#FFFFFF", text: "#1A2430", onPrimary: "#F2F7FC", accent: "#D9A441" },
  { id: "natal", name: "Natal (verde)", primary: "#1C3D2E", background: "#FAF7F0", surface: "#FFFFFF", text: "#1E2420", onPrimary: "#F3EEDF", accent: "#B08D57" },
  { id: "neutro", name: "Neutro (grafite)", primary: "#2B2B2B", background: "#F7F6F4", surface: "#FFFFFF", text: "#222222", onPrimary: "#F5F5F5", accent: "#8C8C8C" },
];

const hexOk = (h) => /^#[0-9a-fA-F]{6}$/.test(h || "");
const toRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const trip = (c) => c.join(" ");

export function themeVars(theme) {
  const p = toRgb(hexOk(theme?.primary) ? theme.primary : DEFAULT_THEME.primary);
  const pick = (k) => toRgb(hexOk(theme?.[k]) ? theme[k] : DEFAULT_THEME[k]);
  const bg = pick("background");
  const surface = pick("surface");
  const text = pick("text");
  const onP = pick("onPrimary");
  const acc = pick("accent");
  const W = [255, 255, 255], K = [0, 0, 0];
  return {
    "--wine-950": trip(mix(p, K, 0.32)),
    "--wine-900": trip(p),
    "--wine-800": trip(mix(p, W, 0.12)),
    "--wine-700": trip(mix(p, W, 0.24)),
    "--wine-600": trip(mix(p, W, 0.34)),
    "--wine-100": trip(mix(p, W, 0.88)),
    "--wine-50": trip(mix(p, W, 0.94)),
    "--ivory": trip(bg),
    "--paper": trip(mix(bg, p, 0.035)),
    "--sand": trip(mix(mix(bg, K, 0.06), p, 0.04)),
    "--cream": trip(onP),
    "--gold": trip(acc),
    "--gold-light": trip(mix(acc, W, 0.3)),
    "--gold-dark": trip(mix(acc, K, 0.22)),
    "--surface": trip(surface),
    "--ink": trip(text),
    "--ink-soft": trip(mix(text, bg, 0.22)),
    "--ink-muted": trip(mix(text, bg, 0.4)),
  };
}

export function applyTheme(theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  for (const [k, v] of Object.entries(themeVars(theme))) root.style.setProperty(k, v);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta && hexOk(theme?.primary)) meta.content = theme.primary;
}

export const isHex = hexOk;
