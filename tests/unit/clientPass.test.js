import { describe, expect, it } from "vitest";
import { checkPassword, generatePassword, hashPassword } from "../../lib/clientPass.js";

describe("senha do cliente", () => {
  it("gera 6 caracteres sem ambíguos", () => {
    for (let i = 0; i < 50; i += 1) expect(generatePassword()).toMatch(/^[A-HJKMNP-Z2-9]{6}$/);
  });
  it("confere com hash e ignora caixa/espaços", () => {
    const p = generatePassword();
    const a = hashPassword(p);
    expect(checkPassword(p, a)).toBe(true);
    expect(checkPassword(` ${p.toLowerCase()} `, a)).toBe(true);
    expect(checkPassword("XXXXXX", a)).toBe(false);
    expect(checkPassword(p, null)).toBe(false);
  });
});
