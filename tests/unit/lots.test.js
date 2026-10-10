import { describe, expect, it } from "vitest";
import { countConfirmedByLot, lotRemaining, packageAvailability, validateLots } from "../../src/utils/lots.js";

const now = new Date("2026-10-10T12:00:00Z");
const d = (s) => new Date(s);
const lots = [
  { id: "a", order: 1, name: "1º lote", priceCents: 38000, capacity: 2, confirmedCount: 2, status: "active" },
  { id: "b", order: 2, name: "2º lote", priceCents: 42000, capacity: 5, confirmedCount: 1, status: "active" },
  { id: "c", order: 3, name: "3º lote", priceCents: 49000, capacity: null, confirmedCount: 0, status: "active", salesStart: d("2026-12-01T00:00:00Z") },
];

describe("lotes", () => {
  it("vagas restantes = capacidade − confirmados", () => {
    expect(lotRemaining(lots[0])).toBe(0);
    expect(lotRemaining(lots[1])).toBe(4);
    expect(lotRemaining(lots[2])).toBe(null);
  });

  it("escolhe o primeiro lote aberto com vaga", () => {
    const r = packageAvailability({ status: "published" }, lots, now);
    expect(r.state).toBe("available");
    expect(r.lot.id).toBe("b");
    expect(r.priceCents).toBe(42000);
  });

  it("fica esgotado quando nenhum lote tem vaga", () => {
    const full = lots.slice(0, 2).map((l) => ({ ...l, confirmedCount: l.capacity }));
    expect(packageAvailability({ status: "published" }, full, now).state).toBe("soldout");
  });

  it("indica abertura futura", () => {
    const r = packageAvailability({ status: "published" }, [lots[2]], now);
    expect(r.state).toBe("upcoming");
  });

  it("status manual prevalece", () => {
    expect(packageAvailability({ status: "soldout" }, lots, now).state).toBe("soldout");
    expect(packageAvailability({ status: "draft" }, lots, now).state).toBe("closed");
  });

  it("recontagem a partir dos agendamentos", () => {
    const appts = [
      { lotId: "a", status: "confirmed" }, { lotId: "a", status: "done" },
      { lotId: "a", status: "cancelled" }, { lotId: "b", status: "requested" },
    ];
    expect(countConfirmedByLot(appts)).toEqual({ a: 2 });
  });

  it("não deixa reduzir vagas abaixo dos confirmados", () => {
    const errs = validateLots([{ name: "x", priceCents: 100, capacity: 1, confirmedCount: 3 }]);
    expect(errs.length).toBe(1);
  });
});
