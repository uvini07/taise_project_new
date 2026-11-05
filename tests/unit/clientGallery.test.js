import { describe, expect, it } from "vitest";
import {
  baseName, clientSlug, compareDelivery, daysLeft, deadlineLabel, effectiveStatus, formatBytes, namesList, randomCode,
  savingsPercent, validateSlug,
} from "../../src/utils/clientGallery.js";

describe("páginas de cliente", () => {
  it("monta o endereço com nome e código", () => {
    expect(clientSlug("Ana Souza")).toBe("ana-souza");
    expect(clientSlug("Família Gonçalves", "k3j9")).toBe("familia-goncalves-k3j9");
    expect(randomCode(6, () => 0)).toBe("aaaaaa");
    expect(randomCode(5)).toMatch(/^[a-z2-9]{5}$/);
  });

  it("valida o endereço", () => {
    expect(validateSlug("ab")).toMatch(/3 letras/);
    expect(validateSlug("ana--souza")).toMatch(/hífen/);
    expect(validateSlug("ana-souza", ["ana-souza"])).toMatch(/Já existe/);
    expect(validateSlug("ana-souza-k3j9", ["ana-souza"])).toBe(null);
  });

  it("formata tamanhos e economia", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1536)).toBe("1,5 KB");
    expect(formatBytes(12 * 1024 * 1024)).toBe("12 MB");
    expect(formatBytes(1.2 * 1024 ** 3)).toBe("1,2 GB");
    expect(savingsPercent(10_000_000, 300_000)).toBe(97);
    expect(savingsPercent(0, 10)).toBe(0);
  });

  it("calcula prazos", () => {
    const now = new Date("2026-11-05T12:00:00Z");
    expect(daysLeft("2026-11-12T12:00:00Z", now)).toBe(7);
    expect(daysLeft("2026-11-05T11:00:00Z", now)).toBe(0);
    expect(deadlineLabel("2026-11-05T20:00:00Z", now)).toBe("Vence hoje");
    expect(deadlineLabel("2026-11-06T20:00:00Z", now)).toBe("Vence em 2 dias");
    expect(deadlineLabel("2026-11-04T20:00:00Z", now)).toBe("Prazo vencido");
    expect(effectiveStatus({ status: "sent", expiresAt: "2026-11-04T00:00:00Z" }, now)).toBe("expired");
    expect(effectiveStatus({ status: "finished", expiresAt: "2026-11-04T00:00:00Z" }, now)).toBe("finished");
  });

  it("compara seleção e entrega pelo nome do arquivo", () => {
    expect(baseName("C:\\fotos\\IMG_4821.CR3")).toBe("IMG_4821");
    expect(baseName(".oculto")).toBe(".oculto");
    expect(namesList(["IMG_1.jpg", "IMG_2.CR3", "IMG_1.webp"])).toBe("IMG_1, IMG_2");
    const r = compareDelivery(["IMG_1.CR3", "IMG_2.CR3", "IMG_3.CR3"], ["img_1.jpg", "IMG_3-edit.jpg", "IMG_3.jpg", "IMG_9.jpg"]);
    expect(r.matched).toBe(2);
    expect(r.missing).toEqual(["IMG_2"]);
    expect(r.extra).toEqual(["IMG_3-edit", "IMG_9"]);
  });
});
