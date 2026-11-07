import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { C, EASE_ACCEL, EASE_IN, EASE_INOUT, EASE_LAND, FONT_BODY, FONT_TITLE, beatF } from "./brand";
import { AppIcon, Card, FeatureText, Logo, Photo, mix, prog, useF, useV } from "./kit";

function Shell({ dur, n, kicker, title, body, children, dark = false }: {
  dur: number; n: string; kicker: string; title: React.ReactNode; body: string; children: React.ReactNode; dark?: boolean;
}) {
  const f = useF();
  const v = useV();
  const out = prog(f, dur - 8, 8, EASE_ACCEL);
  return (
    <AbsoluteFill style={{ background: dark ? C.ameixa : C.nevoa, overflow: "hidden" }}>
      <div style={v
        ? { position: "absolute", left: 90, top: 250, opacity: 1 - out, transform: `translateY(${-out * 60}px)` }
        : { position: "absolute", left: 140, top: 0, bottom: 0, display: "flex", alignItems: "center", opacity: 1 - out, transform: `translateX(${-out * 60}px)` }}>
        <FeatureText n={n} kicker={kicker} title={title} body={body} f={f} dark={dark} vertical={v} />
      </div>
      <div style={v
        ? { position: "absolute", left: 10, width: 1060, top: 760, height: 1080, perspective: 2200, opacity: 1 - out, transform: `translateY(${out * 120}px)` }
        : { position: "absolute", left: 860, right: 0, top: 0, bottom: 0, perspective: 2200, opacity: 1 - out, transform: `translateX(${-out * 120}px)` }}>
        {children}
      </div>
    </AbsoluteFill>
  );
}

// ===== Site personalizado =====
const ACCENTS = [C.rosa, "#3F7D6E", "#C9A44C", C.rosa];
export function Site({ dur }: { dur: number }) {
  const f = useF();
  const enter = prog(f, 4, 30, EASE_IN);
  const scroll = prog(f, beatF(3), 50, EASE_INOUT);
  // troca de cor do site (personalização) em batidas
  const swapAt = [beatF(6), beatF(7), beatF(8)];
  let ai = 0; swapAt.forEach((s, i) => { if (f >= s) ai = i + 1; });
  const acc = ACCENTS[ai];
  const rotY = mix(-22, -9, enter) + Math.sin(f / 60) * 1.2;
  return (
    <Shell dur={dur} n="01" kicker="Site personalizado" title={<>Seu site,<br />com a sua cara.</>} body="Portfólio, pacotes e contato num site profissional. Escolha cores, fotos e textos — sem saber programar.">
      <div style={{ position: "absolute", left: 10, top: 170, transformStyle: "preserve-3d", transform: `translateX(${(1 - enter) * 400}px) rotateY(${rotY}deg) rotateX(4deg)`, opacity: enter }}>
        <Card style={{ width: 860, height: 700, overflow: "hidden" }}>
          <div style={{ height: 52, background: "#EFECF4", display: "flex", alignItems: "center", gap: 10, padding: "0 20px" }}>
            {[0, 1, 2].map((i) => <div key={i} style={{ width: 13, height: 13, borderRadius: 7, background: "#CFC8E0" }} />)}
            <div style={{ marginLeft: 20, flex: 1, height: 30, borderRadius: 15, background: C.branco, fontFamily: FONT_BODY, fontSize: 16, color: C.lilas, display: "flex", alignItems: "center", padding: "0 16px" }}>analima.revela.app</div>
          </div>
          <div style={{ transform: `translateY(${-scroll * 380}px)` }}>
            <div style={{ padding: "26px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: FONT_BODY, fontSize: 17, color: C.ameixa }}>
              <span style={{ fontFamily: FONT_TITLE, fontSize: 30 }}>Ana Lima <span style={{ color: acc }}>·</span> fotografia</span>
              <span style={{ display: "flex", gap: 26 }}><span>Portfólio</span><span>Pacotes</span><span>Agenda</span><span style={{ color: acc }}>VIP</span></span>
            </div>
            <div style={{ position: "relative", margin: "0 40px", height: 380 }}>
              <Photo seed={3} radius={14} />
              <div style={{ position: "absolute", left: 40, bottom: 40, fontFamily: FONT_TITLE, fontSize: 56, color: "#fff", lineHeight: 1.05 }}>Memórias que<br />ficam para sempre.</div>
              <div style={{ position: "absolute", right: 40, bottom: 44, background: acc, color: "#fff", fontFamily: FONT_BODY, fontWeight: 500, fontSize: 20, padding: "14px 28px", borderRadius: 999 }}>Agendar ensaio</div>
            </div>
            <div style={{ padding: "30px 40px 0", fontFamily: FONT_TITLE, fontSize: 34, color: C.ameixa }}>Portfólio</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, padding: "18px 40px" }}>
              {Array.from({ length: 8 }, (_, i) => <Photo key={i} seed={20 + i} h={190} />)}
            </div>
          </div>
        </Card>
        {/* seletor de cores */}
        <div style={{ position: "absolute", right: -60, top: 90, transform: "translateZ(80px)", opacity: prog(f, beatF(5), 14) }}>
          <Card style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14, borderRadius: 18 }}>
            {[C.rosa, "#3F7D6E", "#C9A44C"].map((c, i) => (
              <div key={c} style={{ width: 46, height: 46, borderRadius: 23, background: c, outline: acc === c && f >= swapAt[0] ? `3px solid ${C.ameixa}` : "none", outlineOffset: 4 }} />
            ))}
          </Card>
        </div>
      </div>
    </Shell>
  );
}

// ===== Agenda online =====
export function Agenda({ dur }: { dur: number }) {
  const f = useF();
  const enter = prog(f, 4, 26);
  const busy = [3, 9, 12, 17, 23];
  const target = 19;
  const fly = prog(f, beatF(5), 22, EASE_LAND);
  const paid = prog(f, beatF(7), 14, EASE_LAND);
  return (
    <Shell dur={dur} n="02" kicker="Agenda online" title={<>O cliente marca.<br />Você só confirma.</>} body="Horários livres na hora, sinal pago pelo Pix e lembrete automático. Acabou o vai e vem no WhatsApp.">
      <div style={{ position: "absolute", left: 80, top: 170, transform: `rotateY(-10deg) rotateX(6deg) translateY(${(1 - enter) * 80}px)`, opacity: enter, transformStyle: "preserve-3d" }}>
        <Card style={{ width: 820, padding: 40 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT_TITLE, fontSize: 40, color: C.ameixa }}>
            <span>Dezembro</span><span style={{ fontFamily: FONT_BODY, fontSize: 20, color: C.lilas, alignSelf: "center" }}>2026</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 12, marginTop: 28 }}>
            {"DSTQQSS".split("").map((d, i) => <div key={i} style={{ textAlign: "center", fontFamily: FONT_BODY, fontSize: 17, color: C.lilas }}>{d}</div>)}
            {Array.from({ length: 31 }, (_, i) => {
              const day = i + 1;
              const a = prog(f, 8 + i * 0.9, 14, EASE_IN);
              const isBusy = busy.includes(day), isT = day === target;
              return (
                <div key={i} style={{
                  height: 74, borderRadius: 14, display: "flex", alignItems: "flex-start", justifyContent: "flex-start", padding: 10,
                  fontFamily: FONT_BODY, fontSize: 19, opacity: a, transform: `scale(${mix(0.85, 1, a)})`,
                  background: isT && fly > 0.9 ? C.ameixa : isBusy ? "#EFECF4" : C.nevoa,
                  color: isT && fly > 0.9 ? C.lavanda : isBusy ? C.lilas : C.ameixa,
                  textDecoration: isBusy ? "line-through" : "none",
                }}>{day}</div>
              );
            })}
          </div>
        </Card>
        {/* reserva que pousa no dia 19 */}
        <div style={{ position: "absolute", left: 330 + (1 - fly) * 520, top: 560 - (1 - fly) * 380, transform: `translateZ(${60 + (1 - fly) * 200}px) rotate(${(1 - fly) * 8}deg)`, opacity: prog(f, beatF(5) - 4, 6) }}>
          <Card style={{ width: 360, padding: 22, borderRadius: 18 }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 15, color: C.lilas, letterSpacing: ".14em", textTransform: "uppercase" }}>Novo agendamento</div>
            <div style={{ fontFamily: FONT_TITLE, fontSize: 30, color: C.ameixa, marginTop: 6 }}>Ensaio gestante</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 18, color: "#4A4360", marginTop: 4 }}>Sáb, 19 dez · 16h · Juliana M.</div>
            <div style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 8, background: `rgba(63,125,110,${0.12 * paid})`, color: "#2F6B5C", fontFamily: FONT_BODY, fontWeight: 500, fontSize: 17, padding: "8px 14px", borderRadius: 999, transform: `scale(${mix(0.6, 1, paid)})`, opacity: paid }}>✓ Sinal pago via Pix</div>
          </Card>
        </div>
      </div>
    </Shell>
  );
}

// ===== Pacotes e lotes =====
const PKGS = [
  { n: "Essencial", p: 450, d: "1h · 20 fotos" },
  { n: "Completo", p: 690, d: "2h · 40 fotos" },
  { n: "Premium", p: 990, d: "3h · 70 fotos" },
];
export function Pacotes({ dur }: { dur: number }) {
  const f = useF();
  const lot2 = beatF(6);
  return (
    <Shell dur={dur} n="03" kicker="Pacotes e lotes" title={<>Venda pacotes<br />com preço por lote.</>} body="Monte seus pacotes, abra lotes promocionais e a virada de preço acontece sozinha na data marcada.">
      <div style={{ position: "absolute", left: 60, top: 0, bottom: 0, display: "flex", alignItems: "center", gap: 28 }}>
        {PKGS.map((p, i) => {
          const d = prog(f, 6 + i * 6, 24, EASE_LAND);
          const mid = i === 1;
          const price = mid ? Math.round(interpolate(f, [lot2, lot2 + 18], [p.p, p.p + 80], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_IN })) : p.p;
          const lotLabel = mid && f >= lot2 ? "2º lote" : "1º lote";
          return (
            <div key={p.n} style={{ transform: `translateY(${(1 - d) * 500}px) rotate(${(1 - d) * (i - 1) * 14}deg) scale(${mid ? 1.06 : 1})`, opacity: Math.min(1, d * 2) }}>
              <Card style={{ width: 280, padding: 0, overflow: "hidden", outline: mid ? `3px solid ${C.rosa}` : "none" }}>
                <Photo seed={40 + i} h={200} radius={0} />
                <div style={{ padding: 24 }}>
                  <div style={{ fontFamily: FONT_BODY, fontWeight: 500, fontSize: 14, letterSpacing: ".16em", textTransform: "uppercase", color: mid ? C.rosa : C.lilas }}>{lotLabel}</div>
                  <div style={{ fontFamily: FONT_TITLE, fontSize: 36, color: C.ameixa, marginTop: 6 }}>{p.n}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 17, color: "#4A4360" }}>{p.d}</div>
                  <div style={{ fontFamily: FONT_TITLE, fontSize: 44, color: C.ameixa, marginTop: 14 }}>R$ {price}</div>
                  <div style={{ marginTop: 14, background: C.ameixa, color: C.lavanda, textAlign: "center", borderRadius: 999, padding: "10px 0", fontFamily: FONT_BODY, fontWeight: 500, fontSize: 17 }}>Reservar</div>
                </div>
              </Card>
            </div>
          );
        })}
      </div>
    </Shell>
  );
}

// ===== Lista VIP =====
const NAMES = ["Camila R.", "Bianca S.", "Paula T.", "Renata F.", "Marina L.", "Luana C."];
export function Vip({ dur }: { dur: number }) {
  const f = useF();
  const enter = prog(f, 4, 26);
  const count = Math.round(interpolate(f, [12, beatF(6)], [0, 248], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_INOUT }));
  const notif = prog(f, beatF(7), 18, EASE_LAND);
  return (
    <Shell dur={dur} n="04" kicker="Canal VIP" title={<>Sua lista VIP<br />sempre pronta.</>} body="Fãs entram na lista e recebem primeiro as datas novas, os lotes e as promoções. Agenda cheia antes de abrir.">
      <div style={{ position: "absolute", left: 220, top: 110, transform: `translateY(${(1 - enter) * 120}px) rotateY(-12deg)`, opacity: enter }}>
        <div style={{ width: 430, height: 860, borderRadius: 60, background: C.ameixa, padding: 16, boxShadow: "0 50px 100px rgba(43,37,64,.3)" }}>
          <div style={{ width: "100%", height: "100%", borderRadius: 46, background: C.nevoa, overflow: "hidden", padding: "60px 28px" }}>
            <Logo width={130} ink={C.ameixa} dot={C.rosa} />
            <div style={{ fontFamily: FONT_TITLE, fontSize: 40, color: C.ameixa, marginTop: 26 }}>Lista VIP</div>
            <div style={{ fontFamily: FONT_TITLE, fontSize: 92, color: C.rosa, lineHeight: 1, marginTop: 12 }}>{count}</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 18, color: C.lilas }}>pessoas esperando sua agenda</div>
            <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 12 }}>
              {NAMES.map((n, i) => {
                const a = prog(f, 14 + i * 7, 16, EASE_IN);
                return (
                  <div key={n} style={{ display: "flex", alignItems: "center", gap: 14, background: C.branco, borderRadius: 14, padding: "12px 14px", opacity: a, transform: `translateX(${(1 - a) * 60}px)` }}>
                    <div style={{ width: 38, height: 38, borderRadius: 19, overflow: "hidden" }}><Photo seed={60 + i} radius={19} /></div>
                    <span style={{ fontFamily: FONT_BODY, fontSize: 19, color: C.ameixa }}>{n}</span>
                    <span style={{ marginLeft: "auto", fontFamily: FONT_BODY, fontSize: 14, color: C.rosa }}>VIP</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div style={{ position: "absolute", left: 270, top: 150, transform: `scale(${notif}) translateZ(100px)`, transformOrigin: "left top", opacity: Math.min(1, notif * 1.5) }}>
          <Card style={{ width: 400, padding: 20, borderRadius: 20, display: "flex", gap: 16, alignItems: "center" }}>
            <AppIcon size={58} />
            <div>
              <div style={{ fontFamily: FONT_BODY, fontWeight: 500, fontSize: 18, color: C.ameixa }}>Agenda de janeiro aberta!</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 16, color: C.lilas }}>Enviado para 248 VIPs</div>
            </div>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
