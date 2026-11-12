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
    expect(TOOLS.map((t) => t.name)).toEqual(["agenda", "pedidos_aguardando", "faturamento", "pagamentos_pendentes"]);
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
