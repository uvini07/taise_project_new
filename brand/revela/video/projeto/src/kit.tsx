import React from "react";
import { continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from "remotion";
import { LOGO_PATHS, LOGO_VB } from "./logoPaths";
import { C, EASE_IN, FONT_BODY, FONT_TITLE, mulberry32 } from "./brand";

// ---------- fontes ----------
let fontsLoaded = false;
export function useFonts() {
  const [handle] = React.useState(() => (fontsLoaded ? null : delayRender("fontes")));
  React.useEffect(() => {
    if (!handle) return;
    const faces = [
      new FontFace("Revela", `url(${staticFile("Revela-Regular.otf")})`),
      new FontFace("Jost", `url(${staticFile("jost-latin-400-normal.woff")})`, { weight: "400" }),
      new FontFace("Jost", `url(${staticFile("jost-latin-500-normal.woff")})`, { weight: "500" }),
    ];
    Promise.all(faces.map((f) => f.load().then(() => document.fonts.add(f)))).then(() => {
      fontsLoaded = true;
      continueRender(handle);
    });
  }, [handle]);
}

// ---------- progresso ----------
export const prog = (f: number, start: number, dur: number, ease = EASE_IN) =>
  interpolate(f, [start, start + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

// ---------- logo ----------
// reveal(i) devolve 0..1 para cada parte (r, luz, e, v, e, l, a).
export function Logo({ width, ink, dot, reveal, dotScale = 1 }: {
  width: number; ink: string; dot: string; reveal?: (i: number) => number; dotScale?: number;
}) {
  return (
    <svg viewBox={LOGO_VB} style={{ width, height: "auto", display: "block", overflow: "visible" }}>
      {LOGO_PATHS.map((p, i) => {
        const r = reveal ? reveal(i) : 1;
        const isDot = p.k === "dot";
        const s = isDot ? r * dotScale : 1;
        return (
          <path key={i} d={p.d} fill={isDot ? dot : ink}
            style={{
              transformBox: "fill-box", transformOrigin: "center",
              transform: isDot ? `scale(${s})` : `translateY(${(1 - r) * 60}px)`,
              opacity: isDot ? 1 : Math.min(1, r * 1.4),
            }} />
        );
      })}
    </svg>
  );
}

// Ícone do app: o "r" com a luz dentro do quadrado arredondado.
export function AppIcon({ size, bg = C.ameixa, ink = C.lavanda, dot = C.rosa }: { size: number; bg?: string; ink?: string; dot?: string }) {
  const r = LOGO_PATHS[0];
  const d = LOGO_PATHS[1];
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.22, background: bg, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 30px 60px rgba(43,37,64,.35)" }}>
      <svg viewBox="-9 33 110 110" style={{ width: size * 0.46, height: "auto" }}>
        <path d={r.d} fill={ink} />
        <path d={d.d} fill={dot} />
      </svg>
    </div>
  );
}

// ---------- foto de exemplo (sem fotos reais de clientes) ----------
const TONES = [
  ["#C9A48A", "#6E4F45"], ["#B8B2C9", "#4A4360"], ["#D8C3A5", "#8A6E52"], ["#A9B7A0", "#4D5B46"],
  ["#E2B8A8", "#9A5B52"], ["#9FB2C6", "#3F5168"], ["#D9CBB8", "#7B6A58"], ["#C7A3B5", "#6A4459"],
];
export function Photo({ seed, style, w = "100%", h = "100%", radius = 8 }: { seed: number; style?: React.CSSProperties; w?: number | string; h?: number | string; radius?: number }) {
  const r = mulberry32(seed * 977 + 13);
  const [a, b] = TONES[Math.floor(r() * TONES.length)];
  const x = 30 + r() * 40, y = 35 + r() * 30, s = 22 + r() * 18;
  return (
    <div style={{ width: w, height: h, borderRadius: radius, overflow: "hidden", position: "relative", background: `linear-gradient(${150 + r() * 60}deg, ${a}, ${b})`, ...style }}>
      <div style={{ position: "absolute", left: `${x}%`, top: `${y}%`, width: `${s}%`, aspectRatio: "1", transform: "translate(-50%,-50%)", borderRadius: "50%", background: "rgba(255,240,230,.35)", filter: "blur(10px)" }} />
      <div style={{ position: "absolute", left: `${x}%`, top: `${y + s * 0.9}%`, width: `${s * 1.7}%`, height: "60%", transform: "translateX(-50%)", borderRadius: "45% 45% 0 0", background: "rgba(30,20,30,.22)", filter: "blur(6px)" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 40%, transparent 50%, rgba(0,0,0,.18))" }} />
    </div>
  );
}

// ---------- bloco de texto das funções ----------
export function FeatureText({ n, kicker, title, body, f, dark = false, vertical = false }: { n: string; kicker: string; title: React.ReactNode; body: string; f: number; dark?: boolean; vertical?: boolean }) {
  const k = prog(f, 2, 16), t = prog(f, 6, 20), b = prog(f, 12, 20);
  const ink = dark ? C.lavanda : C.ameixa;
  return (
    <div style={{ width: vertical ? 900 : 640 }}>
      <div style={{ opacity: k, transform: `translateY(${(1 - k) * 20}px)`, fontFamily: FONT_BODY, fontWeight: 500, fontSize: 20, letterSpacing: ".22em", textTransform: "uppercase", color: C.rosa, display: "flex", gap: 16 }}>
        <span>{n}</span><span style={{ color: dark ? C.lilas : C.lilas }}>{kicker}</span>
      </div>
      <div style={{ overflow: "hidden", marginTop: 18 }}>
        <div style={{ transform: `translateY(${(1 - t) * 110}%)`, fontFamily: FONT_TITLE, fontSize: vertical ? 84 : 76, lineHeight: 1.06, color: ink }}>{title}</div>
      </div>
      <div style={{ opacity: b, transform: `translateY(${(1 - b) * 16}px)`, fontFamily: FONT_BODY, fontSize: 27, lineHeight: 1.5, color: dark ? "#C9C2DC" : "#4A4360", marginTop: 26, maxWidth: vertical ? 860 : 580 }}>{body}</div>
    </div>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: C.branco, borderRadius: 22, boxShadow: "0 40px 90px rgba(43,37,64,.18), 0 2px 0 rgba(43,37,64,.04)", ...style }}>{children}</div>;
}

export const useF = useCurrentFrame;
export const VCtx = React.createContext(false);
export const useV = () => React.useContext(VCtx);
