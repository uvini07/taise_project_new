import { describe, expect, it } from "vitest";
import { dayInfo, generateSlots, lockId } from "../../src/utils/slots.js";
import { dayTimeToDate } from "../../src/utils/format.js";

const now = dayTimeToDate("2026-10-12", "08:00"); // segunda-feira
const cfg = {
  weekly: {
    0: { enabled: false, start: "09:00", end: "18:00" },
    1: { enabled: true, start: "09:00", end: "12:00" },
    2: { enabled: true, start: "09:00", end: "12:00" },
    3: { enabled: true, start: "09:00", end: "12:00" },
    4: { enabled: true, start: "09:00", end: "12:00" },
    5: { enabled: true, start: "09:00", end: "12:00" },
    6: { enabled: false, start: "09:00", end: "12:00" },
  },
  sessionMinutes: 45,
  bufferMinutes: 15,
  capacityPerSlot: 1,
  minAdvanceHours: 24,
  maxAdvanceDays: 60,
  blockedDates: [{ date: "2026-10-15", reason: "Feriado" }],
  blockedRanges: [{ start: "2026-11-02", end: "2026-11-06", reason: "Férias" }],
  specialDates: [{ date: "2026-10-18", start: "10:00", end: "12:00", label: "Minissessão", packageIds: ["mini"] }],
};

describe("dayInfo", () => {
  it("respeita dia da semana, bloqueios e datas especiais", () => {
    expect(dayInfo(cfg, "2026-10-13", { now }).open).toBe(true);
    expect(dayInfo(cfg, "2026-10-17", { now }).open).toBe(false); // sábado
    expect(dayInfo(cfg, "2026-10-15", { now }).reason).toBe("Feriado");
    expect(dayInfo(cfg, "2026-11-04", { now }).reason).toBe("Férias");
    expect(dayInfo(cfg, "2026-10-11", { now }).open).toBe(false); // passado
    expect(dayInfo(cfg, "2027-01-30", { now }).open).toBe(false); // além do limite
    expect(dayInfo(cfg, "2026-10-18", { now, packageId: "mini" }).open).toBe(true); // domingo especial
    expect(dayInfo(cfg, "2026-10-18", { now, packageId: "outro" }).open).toBe(false);
  });

  it("respeita o período do pacote", () => {
    expect(dayInfo(cfg, "2026-10-13", { now, window: { start: "2026-10-20" } }).open).toBe(false);
  });
});

describe("generateSlots", () => {
  it("monta a grade com sessão + intervalo", () => {
    const slots = generateSlots(cfg, "2026-10-14", { now });
    expect(slots.map((s) => s.time)).toEqual(["09:00", "10:00", "11:00"]);
    expect(slots.every((s) => s.available)).toBe(true);
    expect(slots[0].lockIds).toEqual(["2026-10-14_0900_0"]);
  });

  it("aplica antecedência mínima", () => {
    const slots = generateSlots(cfg, "2026-10-13", { now: dayTimeToDate("2026-10-12", "09:30") });
    expect(slots.find((s) => s.time === "09:00").available).toBe(false);
    expect(slots.find((s) => s.time === "10:00").available).toBe(true);
  });

  it("marca horários ocupados pelas travas", () => {
    const taken = new Set([lockId("2026-10-14", "10:00", 0)]);
    const slots = generateSlots(cfg, "2026-10-14", { now, taken });
    expect(slots.find((s) => s.time === "10:00").available).toBe(false);
    expect(slots.find((s) => s.time === "09:00").available).toBe(true);
  });

  it("ensaios longos ocupam várias células e não sobrepõem outros", () => {
    const taken = new Set([lockId("2026-10-14", "10:00", 0)]);
    const slots = generateSlots(cfg, "2026-10-14", { now, taken, durationMin: 90 });
    // 90 min a partir das 09:00 precisa das células 09:00 e 10:00 (ocupada).
    expect(slots.find((s) => s.time === "09:00")?.available).toBe(false);
    const free = generateSlots(cfg, "2026-10-13", { now, durationMin: 90 });
    expect(free[0].lockIds).toEqual(["2026-10-13_0900_0", "2026-10-13_1000_0"]);
    expect(free.at(-1).time).toBe("10:00"); // 10:00 + 90min = 11:30 <= 12:00
  });

  it("capacidade por horário usa travas numeradas", () => {
    const c2 = { ...cfg, capacityPerSlot: 2 };
    const taken = new Set([lockId("2026-10-14", "09:00", 0)]);
    const slot = generateSlots(c2, "2026-10-14", { now, taken })[0];
    expect(slot.available).toBe(true);
    expect(slot.lockIds).toEqual(["2026-10-14_0900_1"]);
  });
});
