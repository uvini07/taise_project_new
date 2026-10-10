import { describe, expect, it } from "vitest";
import { formatBRL, parseBRLToCents, dayTimeToDate, toDayKey, addDays } from "../../src/utils/format.js";
import { normalizePhoneBR, formatPhoneBR } from "../../src/utils/validation.js";
import { whatsappLink } from "../../src/utils/whatsapp.js";
import { toCSV } from "../../src/utils/csv.js";
import { resolvePeriod } from "../../src/utils/period.js";

describe("formatação", () => {
  it("moeda em centavos", () => {
    expect(formatBRL(38000).replace(/\s/g, " ")).toBe("R$ 380,00");
    expect(parseBRLToCents("1.234,56")).toBe(123456);
    expect(parseBRLToCents("R$ 99")).toBe(9900);
    expect(parseBRLToCents("abc")).toBe(null);
  });

  it("datas no fuso do estúdio", () => {
    const d = dayTimeToDate("2026-10-10", "23:30");
    expect(d.toISOString()).toBe("2026-10-11T02:30:00.000Z");
    expect(toDayKey(d)).toBe("2026-10-10");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("período do mês atual", () => {
    expect(resolvePeriod("month", {}, new Date("2026-02-10T12:00:00Z"))).toEqual({ from: "2026-02-01", to: "2026-02-28" });
  });
});

describe("telefone e WhatsApp", () => {
  it("normaliza números brasileiros", () => {
    expect(normalizePhoneBR("(11) 96038-2670")).toBe("5511960382670");
    expect(normalizePhoneBR("+55 11 96038-2670")).toBe("5511960382670");
    expect(normalizePhoneBR("123")).toBe(null);
    expect(formatPhoneBR("5511960382670")).toBe("(11) 96038-2670");
  });

  it("gera link wa.me", () => {
    expect(whatsappLink("(11) 96038-2670", "Olá!")).toBe("https://wa.me/5511960382670?text=Ol%C3%A1!");
  });
});

describe("csv", () => {
  it("escapa separadores e fórmulas", () => {
    const csv = toCSV([{ a: "x;y", b: "=1+1" }], [{ label: "A", value: (r) => r.a }, { label: "B", value: (r) => r.b }]);
    expect(csv).toBe('﻿A;B\r\n"x;y";\'=1+1');
  });
});
