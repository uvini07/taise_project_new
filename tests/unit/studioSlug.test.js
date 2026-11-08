import { describe, expect, it } from "vitest";
import { cleanSlugInput, slugProblem, suggestSlug } from "../../src/revela/slug.js";

describe("endereço do estúdio no cadastro", () => {
  it("sugere o endereço a partir do nome", () => {
    expect(suggestSlug("Ana Lima Fotografia")).toBe("analimafotografia");
    expect(suggestSlug("Estúdio Ção & Cia")).toBe("estudiocaocia");
  });

  it("limpa o que a pessoa digita", () => {
    expect(cleanSlugInput("Ana Lima!")).toBe("analima");
    expect(cleanSlugInput("foto--studio")).toBe("foto-studio");
    expect(cleanSlugInput("JOÃO")).toBe("joao");
  });

  it("aceita endereços livres e válidos", () => {
    expect(slugProblem("analimafotografia")).toBeNull();
    expect(slugProblem("foto-studio-2")).toBeNull();
  });

  it("recusa endereços em uso, reservados ou inválidos", () => {
    expect(slugProblem("tarufino")).toMatch(/em uso/);
    expect(slugProblem("planos")).toMatch(/em uso/);
    expect(slugProblem("vip")).toMatch(/em uso/);
    expect(slugProblem("adm")).toMatch(/em uso/);
    expect(slugProblem("ab")).toMatch(/pelo menos/);
    expect(slugProblem("-foto")).toMatch(/hífen/);
    expect(slugProblem("foto-")).toMatch(/hífen/);
  });
});
