import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { C, EASE_ACCEL, EASE_IN, EASE_INOUT, EASE_LAND, FONT_BODY, FONT_TITLE, beatF } from "./brand";
import { AppIcon, Card, FeatureText, Logo, Photo, mix, prog, useF } from "./kit";

function Shell({ dur, n, kicker, title, body, children, dark = false }: {
  dur: number; n: string; kicker: string; title: React.ReactNode; body: string; children: React.ReactNode; dark?: boolean;
}) {
  const f = useF();
  const out = prog(f, dur - 8, 8, EASE_ACCEL);
  return (
    <AbsoluteFill style={{ background: dark ? C.ameixa : C.nevoa, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 140, top: 0, bottom: 0, display: "flex", alignItems: "center", opacity: 1 - out, transform: `translateX(${-out * 60}px)` }}>
        <FeatureText n={n} kicker={kicker} title={title} body={body} f={f} dark={dark} />
      </div>
      <div style={{ position: "absolute", left: 860, right: 0, top: 0, bottom: 0, perspective: 2200, opacity: 1 - out, transform: `translateX(${-out * 120}px)` }}>
        {children}
      </div>
    </AbsoluteFill>
  );
}

const WM = `url("data:image/svg+xml,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='150' height='90'><text x='75' y='50' text-anchor='middle' font-family='Jost' font-size='17' fill='white' fill-opacity='.45' transform='rotate(-24 75 45)'>revela · prévia</text></svg>")}")`;

// ===== Seleção de fotos protegida =====
export function Selecao({ dur }: { dur: number }) {
  const f = useF();
  const enter = prog(f, 4, 26);
  const picks = [1, 4, 6, 9, 10];
  const pickAt = (k: number) => beatF(3) + k * 7;
  const chosen = picks.filter((_, k) => f >= pickAt(k)).length;
  const shield = prog(f, beatF(8), 18, EASE_LAND);
  const push = prog(f, 0, dur, EASE_INOUT);
  return (
    <Shell dark dur={dur} n="05" kicker="Seleção de fotos" title={<>O cliente escolhe.<br />As fotos ficam protegidas.</>} body="Galeria privada com marca d'água, sem download e bloqueio de print. Você recebe a lista de favoritas na hora.">
      <div style={{ position: "absolute", left: 40, top: 130, transform: `translateY(${(1 - enter) * 100}px) rotateY(${mix(-14, -6, push)}deg) rotateX(5deg) scale(${mix(0.96, 1.02, push)})`, opacity: enter }}>
        <Card style={{ width: 920, padding: 30, background: C.nevoa }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: FONT_TITLE, fontSize: 36, color: C.ameixa }}>Ensaio gestante · Juliana</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 17, color: C.lilas }}>Escolha até 20 fotos</div>
            </div>
            <div style={{ background: C.ameixa, color: C.lavanda, fontFamily: FONT_BODY, fontWeight: 500, fontSize: 19, padding: "12px 22px", borderRadius: 999 }}>
              <span style={{ color: C.rosa, fontFamily: FONT_TITLE, fontSize: 24 }}>{7 + chosen}</span> de 20 escolhidas
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginTop: 22 }}>
            {Array.from({ length: 12 }, (_, i) => {
              const k = picks.indexOf(i);
              const on = k >= 0 && f >= pickAt(k);
              const pop = k >= 0 ? interpolate(f - pickAt(k), [0, 5, 12], [1, 1.35, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
              const a = prog(f, 8 + i * 1.5, 16);
              return (
                <div key={i} style={{ position: "relative", height: 170, opacity: a, transform: `translateY(${(1 - a) * 30}px)` }}>
                  <Photo seed={80 + i} radius={10} />
                  <div style={{ position: "absolute", inset: 0, borderRadius: 10, backgroundImage: WM, backgroundSize: "150px 90px" }} />
                  <div style={{ position: "absolute", right: 10, top: 10, width: 38, height: 38, borderRadius: 19, background: on ? C.rosa : "rgba(255,255,255,.85)", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${pop})`, color: on ? "#fff" : C.lilas, fontSize: 20 }}>♥</div>
                  {on && <div style={{ position: "absolute", inset: 0, borderRadius: 10, outline: `3px solid ${C.rosa}`, outlineOffset: -3 }} />}
                </div>
              );
            })}
          </div>
        </Card>
        <div style={{ position: "absolute", right: -30, bottom: -40, transform: `scale(${shield}) translateZ(120px)`, transformOrigin: "right bottom", opacity: Math.min(1, shield * 1.5) }}>
          <Card style={{ padding: "18px 24px", borderRadius: 18, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 46, height: 46, borderRadius: 23, background: C.ameixa, color: C.lavanda, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🛡</div>
            <div>
              <div style={{ fontFamily: FONT_BODY, fontWeight: 500, fontSize: 19, color: C.ameixa }}>Protegido contra print e download</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 15, color: C.lilas }}>Marca d'água com nome e horário</div>
            </div>
          </Card>
        </div>
      </div>
    </Shell>
  );
}

// ===== Entrega final =====
export function Entrega({ dur }: { dur: number }) {
  const f = useF();
  const enter = prog(f, 4, 26, EASE_LAND);
  const bar = prog(f, beatF(3), beatF(4), EASE_INOUT);
  const done = prog(f, beatF(3) + beatF(4), 14, EASE_LAND);
  return (
    <Shell dur={dur} n="06" kicker="Entrega final" title={<>Entrega em alta,<br />num link só.</>} body="O cliente baixa todas as fotos de uma vez, com prazo de 7, 14 ou 30 dias. Sem WeTransfer, sem pendrive.">
      <div style={{ position: "absolute", left: 120, top: 0, bottom: 0, display: "flex", alignItems: "center" }}>
        <div style={{ position: "relative", transform: `translateY(${(1 - enter) * 160}px) rotateY(-8deg)`, opacity: Math.min(1, enter * 1.5) }}>
          {[2, 1].map((k) => (
            <div key={k} style={{ position: "absolute", inset: 0, transform: `translate(${k * 26}px, ${-k * 26}px) rotate(${k * 3}deg)`, opacity: 0.6 }}>
              <Photo seed={100 + k} radius={22} />
            </div>
          ))}
          <Card style={{ width: 640, overflow: "hidden", position: "relative" }}>
            <Photo seed={104} h={300} radius={0} />
            <div style={{ padding: 32 }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 16, letterSpacing: ".16em", textTransform: "uppercase", color: C.lilas }}>Entrega · 48 fotos em alta</div>
              <div style={{ fontFamily: FONT_TITLE, fontSize: 42, color: C.ameixa, marginTop: 6 }}>Ensaio gestante · Juliana</div>
              <div style={{ height: 12, borderRadius: 6, background: "#EFECF4", marginTop: 24, overflow: "hidden" }}>
                <div style={{ width: `${bar * 100}%`, height: "100%", background: C.rosa, borderRadius: 6 }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT_BODY, fontSize: 17, color: "#4A4360", marginTop: 10 }}>
                <span>{Math.round(bar * 48)} de 48 fotos</span><span>Link válido por 14 dias</span>
              </div>
              <div style={{ marginTop: 22, display: "flex", gap: 14, alignItems: "center" }}>
                <div style={{ background: C.ameixa, color: C.lavanda, fontFamily: FONT_BODY, fontWeight: 500, fontSize: 19, padding: "14px 28px", borderRadius: 999 }}>Baixar todas</div>
                <div style={{ opacity: done, transform: `scale(${mix(0.6, 1, done)})`, color: "#2F6B5C", background: "rgba(63,125,110,.12)", fontFamily: FONT_BODY, fontWeight: 500, fontSize: 18, padding: "10px 16px", borderRadius: 999 }}>✓ Entregue</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Shell>
  );
}

// ===== Financeiro e relatórios =====
const BARS = [38, 52, 46, 64, 58, 80, 92];
export function Financeiro({ dur }: { dur: number }) {
  const f = useF();
  const enter = prog(f, 4, 24);
  const total = Math.round(interpolate(f, [14, beatF(5)], [0, 12480], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_INOUT }));
  return (
    <Shell dur={dur} n="07" kicker="Financeiro e relatórios" title={<>Seu negócio<br />em números.</>} body="Receitas, sinais, pagamentos pendentes e de onde vêm seus clientes — tudo atualizado sozinho.">
      <div style={{ position: "absolute", left: 80, top: 0, bottom: 0, display: "flex", alignItems: "center" }}>
        <Card style={{ width: 820, padding: 40, transform: `translateY(${(1 - enter) * 80}px) rotateY(-10deg)`, opacity: enter }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: 17, letterSpacing: ".16em", textTransform: "uppercase", color: C.lilas }}>Faturamento · dezembro</div>
          <div style={{ fontFamily: FONT_TITLE, fontSize: 84, color: C.ameixa, marginTop: 4 }}>R$ {total.toLocaleString("pt-BR")}</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 22, height: 300, marginTop: 30, borderBottom: `2px solid ${C.linha}` }}>
            {BARS.map((h, i) => {
              const g = prog(f, 12 + i * 4, 26, EASE_LAND);
              return <div key={i} style={{ flex: 1, height: `${h * g}%`, borderRadius: "10px 10px 0 0", background: i === BARS.length - 1 ? C.rosa : C.lavanda }} />;
            })}
          </div>
          <div style={{ display: "flex", gap: 18, marginTop: 26 }}>
            {[["Sinais recebidos", "18"], ["A receber", "R$ 2.340"], ["Novos clientes", "+12"]].map(([k, v], i) => {
              const a = prog(f, beatF(4) + i * 4, 16);
              return (
                <div key={k} style={{ flex: 1, background: C.nevoa, borderRadius: 14, padding: 16, opacity: a, transform: `translateY(${(1 - a) * 20}px)` }}>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 15, color: C.lilas }}>{k}</div>
                  <div style={{ fontFamily: FONT_TITLE, fontSize: 32, color: C.ameixa }}>{v}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </Shell>
  );
}

// ===== Tudo unificado =====
const FEATS = ["Site", "Agenda", "Pacotes", "Lista VIP", "Seleção", "Entrega", "Financeiro", "Relatórios", "Eventos", "Galeria"];
export function Hub({ dur }: { dur: number }) {
  const f = useF();
  const icon = prog(f, 2, 22, EASE_LAND);
  const out = prog(f, dur - 8, 8, EASE_ACCEL);
  const spin = interpolate(f, [0, dur], [-0.35, 0.15], { easing: EASE_INOUT });
  const t = prog(f, beatF(4), 22);
  return (
    <AbsoluteFill style={{ background: C.lavanda, alignItems: "center", justifyContent: "center", overflow: "hidden", opacity: 1 - out }}>
      <div style={{ position: "absolute", top: 110, width: "100%", textAlign: "center", fontFamily: FONT_TITLE, fontSize: 78, color: C.ameixa, opacity: t, transform: `translateY(${(1 - t) * 30}px)` }}>
        Tudo unificado. <span style={{ color: C.rosa }}>Mais tempo para fotografar.</span>
      </div>
      <div style={{ position: "relative", width: 0, height: 0, top: 70 }}>
        {FEATS.map((n, i) => {
          const a = prog(f, 6 + i * 2.5, 22, EASE_LAND);
          const ang = (i / FEATS.length) * Math.PI * 2 + spin;
          const R = mix(900, 330, a);
          return (
            <div key={n} style={{ position: "absolute", transform: `translate(-50%,-50%) translate(${Math.cos(ang) * R * 1.35}px, ${Math.sin(ang) * R * 0.75}px)`, opacity: a, background: C.branco, color: C.ameixa, fontFamily: FONT_BODY, fontWeight: 500, fontSize: 30, padding: "16px 30px", borderRadius: 999, whiteSpace: "nowrap", boxShadow: "0 14px 30px rgba(43,37,64,.12)" }}>{n}</div>
          );
        })}
        <div style={{ position: "absolute", transform: `translate(-50%,-50%) scale(${icon})` }}>
          <AppIcon size={200} />
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ===== Fechamento =====
export function End({ dur }: { dur: number }) {
  const f = useF();
  const slam = prog(f, 0, 14, EASE_LAND);
  const glow = interpolate(f, [0, 4, 40], [0, 1, 0], { extrapolateRight: "clamp" });
  const t = prog(f, 22, 22);
  const u = prog(f, 34, 22);
  const fade = prog(f, dur - 24, 24, EASE_INOUT);
  return (
    <AbsoluteFill style={{ background: C.ameixa, alignItems: "center", justifyContent: "center" }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 46%, rgba(201,93,99,${0.3 * glow}), transparent 45%)` }} />
      <div style={{ transform: `scale(${mix(1.25, 1, slam)})`, opacity: Math.min(1, slam * 2), marginTop: -60 }}>
        <Logo width={900} ink={C.lavanda} dot={C.rosa} dotScale={1 + glow * 0.3} />
      </div>
      <div style={{ fontFamily: FONT_TITLE, fontSize: 54, color: C.lavanda, marginTop: 50, opacity: t, transform: `translateY(${(1 - t) * 20}px)` }}>
        Do agendamento à entrega, <span style={{ color: C.rosa }}>tudo em um só lugar.</span>
      </div>
      <div style={{ fontFamily: FONT_BODY, fontWeight: 500, fontSize: 26, letterSpacing: ".3em", color: C.lilas, marginTop: 26, opacity: u }}>REVELA.APP</div>
      <AbsoluteFill style={{ background: "#000", opacity: fade }} />
    </AbsoluteFill>
  );
}
