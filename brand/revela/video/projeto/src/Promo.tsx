import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile } from "remotion";
import { beatF } from "./brand";
import { VCtx, useFonts } from "./kit";
import { Intro, Tagline, Unify } from "./scenes1";
import { Agenda, Pacotes, Site, Vip } from "./scenes2";
import { End, Entrega, Financeiro, Hub, Selecao } from "./scenes3";

// Linha do tempo em batidas (única fonte de verdade).
const B = {
  intro: [0, 16], tagline: [16, 24], unify: [24, 36], site: [36, 48], agenda: [48, 58],
  pacotes: [58, 68], vip: [68, 78], selecao: [78, 90], entrega: [90, 100], financeiro: [100, 108],
  hub: [108, 118], end: [118, 130],
} as const;
type K = keyof typeof B;
export const SHOTS = Object.fromEntries(
  Object.entries(B).map(([k, [a, b]]) => [k, { from: beatF(a), dur: beatF(b) - beatF(a) }]),
) as Record<K, { from: number; dur: number }>;
export const TOTAL = beatF(130) + 6;

const COMP: Record<K, React.FC<{ dur: number }>> = {
  intro: Intro, tagline: Tagline, unify: Unify, site: Site, agenda: Agenda, pacotes: Pacotes,
  vip: Vip, selecao: Selecao, entrega: Entrega, financeiro: Financeiro, hub: Hub, end: End,
};

const S = SHOTS;
const rel = (k: K, beats: number) => S[k].from + beatF(beats) - beatF(0);
// Tabela de efeitos sonoros (sempre relativa às cenas).
export const SFX: { from: number; src: string; volume: number; dur?: number; note: string }[] = [
  { from: beatF(2), src: "sparkle-touch", volume: 0.55, note: "luz do r acende" },
  { from: beatF(10), src: "riser-cine", volume: 0.35, dur: beatF(14) - beatF(10), note: "subida para as cores oficiais" },
  { from: beatF(14), src: "impact-cine-big", volume: 0.55, dur: 60, note: "cores oficiais (pico 1)" },
  { from: beatF(14) + 2, src: "sparkle", volume: 0.35, note: "brilho da luz" },
  { from: S.tagline.from, src: "swoosh-quick", volume: 0.4, note: "entra a frase" },
  { from: S.unify.from, src: "transition-soft", volume: 0.4, note: "fundo escuro" },
  { from: rel("unify", 6), src: "air-woosh-quick", volume: 0.5, note: "ferramentas puxadas" },
  { from: rel("unify", 6) + 16, src: "bass-hit-short", volume: 0.6, note: "ícone pousa (pico 2)" },
  ...(["site", "agenda", "pacotes", "vip", "selecao", "entrega", "financeiro"] as K[]).map((k, i) => ({
    from: S[k].from, src: i % 2 ? "whoosh-fast" : "swoosh-quick", volume: 0.32, note: `entra ${k}`,
  })),
  { from: rel("site", 6), src: "switch-tap", volume: 0.5, note: "troca cor do site" },
  { from: rel("site", 7), src: "switch-tap", volume: 0.45, note: "troca cor do site" },
  { from: rel("site", 8), src: "switch-tap", volume: 0.4, note: "troca cor do site" },
  { from: rel("agenda", 5) + 18, src: "pop", volume: 0.45, note: "reserva pousa no dia" },
  { from: rel("agenda", 7), src: "sparkle-touch", volume: 0.35, note: "sinal pago" },
  { from: S.pacotes.from + 20, src: "swoosh-slow", volume: 0.3, note: "cartões sobem" },
  { from: rel("pacotes", 6), src: "switch-click-quick", volume: 0.45, note: "vira o lote" },
  { from: rel("vip", 7), src: "pop", volume: 0.45, note: "notificação VIP" },
  ...[0, 1, 2, 3, 4].map((k) => ({ from: rel("selecao", 3) + k * 7, src: k % 2 ? "pop" : "switch-click-quick", volume: 0.42 - k * 0.04, note: "coração" })),
  { from: rel("selecao", 8), src: "sparkle-touch", volume: 0.35, note: "selo de proteção" },
  { from: rel("entrega", 7), src: "sparkle", volume: 0.35, note: "entregue" },
  { from: S.hub.from, src: "shimmer-sparkle-sweep", volume: 0.3, note: "funções em volta do ícone" },
  { from: S.end.from - beatF(4) + beatF(0), src: "riser-cine", volume: 0.35, dur: beatF(4) - beatF(0), note: "subida para o final" },
  { from: S.end.from, src: "impact-cine-big", volume: 0.6, dur: 70, note: "logo final (pico 3)" },
  { from: S.end.from + 3, src: "sparkle", volume: 0.4, note: "brilho final" },
];

export const Promo: React.FC<{ bgm: boolean; vertical?: boolean }> = ({ bgm, vertical = false }) => {
  useFonts();
  return (
    <VCtx.Provider value={vertical}>
    <AbsoluteFill style={{ background: "#000" }}>
      {(Object.keys(S) as K[]).map((k) => {
        const C2 = COMP[k];
        return (
          <Sequence key={k} from={S[k].from} durationInFrames={S[k].dur + (k === "end" ? 6 : 0)}>
            <C2 dur={S[k].dur} />
          </Sequence>
        );
      })}
      {bgm && (
        <Audio src={staticFile("audio/house-vibez.mp3")}
          volume={(f) => interpolate(f, [0, 6, TOTAL - 50, TOTAL], [0, 0.5, 0.5, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      )}
      {SFX.map((s, i) => (
        <Sequence key={i} from={s.from} durationInFrames={s.dur ?? 90}>
          <Audio src={staticFile(`audio/${s.src}.mp3`)} volume={s.volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
    </VCtx.Provider>
  );
};
