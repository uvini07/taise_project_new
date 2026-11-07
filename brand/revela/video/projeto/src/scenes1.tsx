import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { BEAT, C, EASE_ACCEL, EASE_IN, EASE_INOUT, EASE_LAND, FONT_BODY, FONT_TITLE, PALETTES, beatF, mulberry32 } from "./brand";
import { AppIcon, Logo, mix, prog, useF } from "./kit";

const BF = BEAT * 30; // frames por batida

// ===== 1. Abertura: logo branco no preto → cores trocando → cores oficiais =====
export function Intro({ dur }: { dur: number }) {
  const f = useF();
  // letras sobem uma a uma a partir da batida 0,5; a luz acende na batida 2
  const order = [0, -1, 1, 2, 3, 4, 5]; // r, (luz), e, v, e, l, a
  const reveal = (i: number) => {
    if (i === 1) return prog(f, beatF(2), 10, EASE_LAND);
    const k = order[i];
    return prog(f, beatF(0.5) + k * 4, 22, EASE_IN);
  };
  // trocas de cor: 1 por batida (4→11), depois a cada meia batida (12→13,5), oficial na 14
  const swaps: number[] = [];
  for (let b = 4; b < 12; b++) swaps.push(beatF(b));
  for (let b = 12; b < 14; b += 0.5) swaps.push(beatF(b));
  const official = beatF(14);
  let pal = { bg: "#000000", ink: "#FFFFFF", dot: "#FFFFFF" };
  let lastSwap = -999;
  swaps.forEach((s, i) => { if (f >= s) { pal = PALETTES[i % PALETTES.length]; lastSwap = s; } });
  const isOfficial = f >= official;
  if (isOfficial) { pal = { bg: C.lavanda, ink: C.ameixa, dot: C.rosa }; lastSwap = official; }
  // pulso pequeno só no logo a cada troca (o fundo corta seco)
  const since = f - lastSwap;
  const punch = since >= 0 && since < 8 ? interpolate(since, [0, 8], [isOfficial ? 1.06 : 1.025, 1], { easing: EASE_IN }) : 1;
  // a luz brilha quando as cores oficiais chegam
  const glow = isOfficial ? interpolate(f - official, [0, 6, 40], [0, 1, 0], { extrapolateRight: "clamp" }) : 0;
  const settle = prog(f, official, 40, EASE_INOUT);
  const out = prog(f, dur - 10, 10, EASE_ACCEL);
  return (
    <AbsoluteFill style={{ background: pal.bg, alignItems: "center", justifyContent: "center" }}>
      {isOfficial && (
        <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, rgba(201,93,99,${0.25 * glow}), transparent 45%)` }} />
      )}
      <div style={{ transform: `scale(${punch * mix(1, 0.92, settle) * mix(1, 0.6, out)}) translateY(${-out * 260}px)`, opacity: 1 - out * 0.0 }}>
        <Logo width={1100} ink={pal.ink} dot={pal.dot} reveal={reveal} dotScale={1 + glow * 0.25} />
      </div>
    </AbsoluteFill>
  );
}

// ===== 2. Frase de posicionamento =====
export function Tagline({ dur }: { dur: number }) {
  const f = useF();
  const words1 = ["Do", "agendamento", "à", "entrega."];
  const words2 = ["Tudo", "em", "um", "só", "lugar."];
  const w = (i: number, start: number) => prog(f, start + i * 3, 18, EASE_IN);
  const l2 = beatF(4) - 2;
  const out = prog(f, dur - 8, 8, EASE_ACCEL);
  const logoIn = prog(f, 0, 14);
  return (
    <AbsoluteFill style={{ background: C.lavanda, alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", top: 80 - (1 - logoIn) * 20, opacity: logoIn }}>
        <Logo width={250} ink={C.ameixa} dot={C.rosa} />
      </div>
      <div style={{ textAlign: "center", transform: `translateY(${-out * 40}px)`, opacity: 1 - out }}>
        <div style={{ fontFamily: FONT_TITLE, fontSize: 118, color: C.ameixa, display: "flex", gap: 30, justifyContent: "center" }}>
          {words1.map((t, i) => (
            <span key={i} style={{ display: "inline-block", overflow: "hidden", paddingBottom: 10 }}>
              <span style={{ display: "inline-block", transform: `translateY(${(1 - w(i, 2)) * 110}%)` }}>{t}</span>
            </span>
          ))}
        </div>
        <div style={{ fontFamily: FONT_TITLE, fontSize: 118, display: "flex", gap: 30, justifyContent: "center", marginTop: 6 }}>
          {words2.map((t, i) => (
            <span key={i} style={{ display: "inline-block", overflow: "hidden", paddingBottom: 10 }}>
              <span style={{ display: "inline-block", color: i >= 2 ? C.rosa : C.ameixa, transform: `translateY(${(1 - w(i, l2)) * 110}%)` }}>{t}</span>
            </span>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ===== 3. Ferramentas espalhadas → um lugar só =====
const TOOLS = ["WhatsApp", "Planilha", "Google Drive", "Agenda de papel", "Pix", "Instagram", "WeTransfer", "Formulário", "E-mail"];
export function Unify({ dur }: { dur: number }) {
  const f = useF();
  const pull = beatF(6);       // ferramentas são puxadas para o centro
  const land = pull + 16;      // ícone aparece
  const textA = prog(f, 4, 20), textAout = prog(f, pull - 6, 10, EASE_ACCEL);
  const textB = prog(f, land + 6, 22);
  const out = prog(f, dur - 8, 8, EASE_ACCEL);
  return (
    <AbsoluteFill style={{ background: C.ameixa, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 120, width: "100%", textAlign: "center", fontFamily: FONT_TITLE, fontSize: 62, color: C.lavanda, opacity: textA * (1 - textAout), transform: `translateY(${(1 - textA) * 30}px)` }}>
        Agenda aqui, fotos ali, cliente no WhatsApp…
      </div>
      {TOOLS.map((t, i) => {
        const r = mulberry32(i + 7);
        const ang = (i / TOOLS.length) * Math.PI * 2 + r() * 0.4;
        const rad = 330 + r() * 160;
        const appear = prog(f, 6 + i * 4, 18, EASE_LAND);
        const drift = Math.sin((f + i * 20) / 22) * 12;
        const p = prog(f, pull + i * 0.8, 16, EASE_ACCEL);
        const x = Math.cos(ang) * rad * 1.45 * (1 - p);
        const y = (Math.sin(ang) * rad * 0.62 + 60) * (1 - p) + drift * (1 - p);
        const rot = (r() - 0.5) * 16 * (1 - p);
        return (
          <div key={t} style={{
            position: "absolute", left: "50%", top: "50%",
            transform: `translate(-50%,-50%) translate(${x}px, ${y}px) rotate(${rot}deg) scale(${appear * (1 - p * 0.85)})`,
            opacity: p > 0.95 ? 0 : 1,
            padding: "18px 30px", borderRadius: 999, border: `2px solid ${C.lilas}`, background: "rgba(230,225,240,.06)",
            color: C.lavanda, fontFamily: FONT_BODY, fontSize: 30, whiteSpace: "nowrap",
          }}>{t}</div>
        );
      })}
      <div style={{ transform: `scale(${prog(f, land, 22, EASE_LAND) * (1 - out * 0.3)}) translateY(${-prog(f, land + 10, 24) * 60}px)` }}>
        <AppIcon size={230} bg={C.lavanda} ink={C.ameixa} dot={C.rosa} />
      </div>
      <div style={{ position: "absolute", bottom: 170, width: "100%", textAlign: "center", fontFamily: FONT_TITLE, fontSize: 70, color: C.lavanda, opacity: textB * (1 - out), transform: `translateY(${(1 - textB) * 30}px)` }}>
        Com a Revela, <span style={{ color: C.rosa }}>tudo fica num lugar só.</span>
      </div>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 50%, rgba(201,93,99,${0.3 * interpolate(f - land, [0, 5, 30], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}), transparent 40%)` }} />
    </AbsoluteFill>
  );
}

export { BF };
