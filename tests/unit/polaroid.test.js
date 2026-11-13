import { afterEach, describe, expect, it } from "vitest";
import handler, { TOOLS } from "../../api/polaroid.js";
import { parseLine } from "../../src/services/polaroid.js";

function call(req) {
  return new Promise((resolve) => {
    const res = { code: 200, status(c) { this.code = c; return this; }, json(b) { resolve({ code: this.code, body: b }); return this; } };
    handler({ method: "POST", headers: {}, body: {}, ...req }, res);
  });
}

describe("api/polaroid", () => {
  const saved = process.env.ANTHROPIC_API_KEY;
  afterEach(() => { if (saved === undefined) delete process.env.ANTHROPIC_API_KEY; else process.env.ANTHROPIC_API_KEY = saved; });

  it("sem chave da IA na Vercel avisa em vez de quebrar", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const r = await call({});
    expect(r.code).toBe(503);
    expect(r.body.error).toMatch(/ANTHROPIC_API_KEY/);
  });
  it("sem login recusa", async () => {
    process.env.ANTHROPIC_API_KEY = "teste";
    const r = await call({ headers: {} });
    expect(r.code).toBe(401);
  });
  it("token inválido recusa", async () => {
    process.env.ANTHROPIC_API_KEY = "teste";
    const r = await call({ headers: { authorization: "Bearer abc.def.ghi" } });
    expect(r.code).toBe(401);
  });
  it("só aceita POST", async () => {
    const r = await call({ method: "GET" });
    expect(r.code).toBe(405);
  });
  it("ferramentas só de leitura, com esquema estrito", () => {
    expect(TOOLS.map((t) => t.name)).toEqual(["agenda", "pedidos_aguardando", "faturamento", "pagamentos_pendentes", "cliente", "horarios_livres", "selecoes_entregas", "visitas", "lista_vip", "mensagem_whatsapp", "preparar_confirmacao", "preparar_pagamento"]);
    for (const t of TOOLS) {
      expect(t.strict).toBe(true);
      expect(t.input_schema.additionalProperties).toBe(false);
    }
  });
});

describe("parseLine", () => {
  it("negrito e links do painel", () => {
    expect(parseLine("Abra **Agenda** em [Agenda](/adm/agenda) agora")).toEqual([
      { t: "text", v: "Abra " }, { t: "bold", v: "Agenda" }, { t: "text", v: " em " },
      { t: "link", v: "Agenda", href: "/adm/agenda" }, { t: "text", v: " agora" },
    ]);
  });
});

import { guard } from "../../api/polaroid.js";
describe("Polaroidy: limites contra abuso", () => {
  it("bloqueia perguntas seguidas e respeita o limite do plano", () => {
    const t0 = Date.UTC(2026, 0, 1, 12);
    expect(guard("u1", 3, true, t0).remaining).toBe(2);
    expect(guard("u1", 3, true, t0 + 1000).error).toMatch(/Espere alguns segundos/);
    expect(guard("u1", 3, true, t0 + 5000).remaining).toBe(1);
    expect(guard("u1", 3, true, t0 + 10000).remaining).toBe(0);
    expect(guard("u1", 3, true, t0 + 20000).error).toMatch(/perguntas de hoje/);
  });
  it("limita perguntas por minuto", () => {
    const t0 = Date.UTC(2026, 0, 2, 12);
    for (let i = 0; i < 5; i += 1) expect(guard("u2", 100, true, t0 + i * 5000).error).toBeUndefined();
    expect(guard("u2", 100, true, t0 + 26000).error).toMatch(/minutinho/);
  });
  it("limita voltas de consulta numa mesma pergunta", () => {
    const t0 = Date.UTC(2026, 0, 3, 12);
    guard("u3", 100, true, t0);
    for (let i = 0; i < 5; i += 1) expect(guard("u3", 100, false, t0 + 100).error).toBeUndefined();
    expect(guard("u3", 100, false, t0 + 200).error).toMatch(/complicada/);
  });
});
