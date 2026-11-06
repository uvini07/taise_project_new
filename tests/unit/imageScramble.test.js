import { describe, expect, it } from "vitest";
import { scrambleMoves, scramblePlan } from "../../src/utils/imageScramble.js";

describe("embaralhamento das prévias", () => {
  it("gera uma permutação completa sem blocos no lugar", () => {
    const plan = scramblePlan(1200, 1600, 6, 6);
    expect([...plan.perm].sort((a, b) => a - b)).toEqual(Array.from({ length: 36 }, (_, i) => i));
    expect(plan.perm.some((v, i) => v === i)).toBe(false);
  });

  it("alinha os blocos em 16 px e corta só a sobra", () => {
    const plan = scramblePlan(1200, 900, 6, 6);
    expect(plan.tileW % 16).toBe(0);
    expect(plan.tileH % 16).toBe(0);
    expect(plan.width).toBeLessThanOrEqual(1200);
    expect(1200 - plan.width).toBeLessThan(16 * 6);
    expect(plan.fileWidth).toBe((plan.tileW + 16) * 6);
  });

  it("monta de volta cada pixel no lugar original", () => {
    // Simula a imagem como uma matriz de "pixels" com o índice original.
    const plan = scramblePlan(96, 64, 3, 2, () => 0.37, 4);
    const W = plan.width, H = plan.height;
    const src = (x, y) => y * W + x;
    const file = new Map();
    for (const { from: f, to: t } of scrambleMoves(plan, "scramble")) {
      for (let dy = 0; dy < f.h; dy++) for (let dx = 0; dx < f.w; dx++) file.set(`${t.x + dx},${t.y + dy}`, src(f.x + dx, f.y + dy));
    }
    let ok = 0;
    for (const { from: f, to: t } of scrambleMoves(plan, "unscramble")) {
      for (let dy = 0; dy < f.h; dy++) for (let dx = 0; dx < f.w; dx++) {
        expect(file.get(`${f.x + dx},${f.y + dy}`)).toBe(src(t.x + dx, t.y + dy));
        ok++;
      }
    }
    expect(ok).toBe(W * H);
  });
});
