import { describe, expect, it } from "vitest";
import { SITE_BASE, legacyRedirect, sitePath, stripSiteBase } from "../../src/config/tenant.js";

describe("rotas do estúdio na Revela", () => {
  it("monta caminhos dentro de /tarufino", () => {
    expect(SITE_BASE).toBe("/tarufino");
    expect(sitePath("/")).toBe("/tarufino");
    expect(sitePath()).toBe("/tarufino");
    expect(sitePath("/pacotes")).toBe("/tarufino/pacotes");
    expect(sitePath("vip/natal")).toBe("/tarufino/vip/natal");
    expect(sitePath("/politicas#privacidade")).toBe("/tarufino/politicas#privacidade");
  });

  it("tira o prefixo para o layout e para as estatísticas", () => {
    expect(stripSiteBase("/tarufino")).toBe("/");
    expect(stripSiteBase("/tarufino/")).toBe("/");
    expect(stripSiteBase("/tarufino/vip/natal")).toBe("/vip/natal");
    expect(stripSiteBase("/planos")).toBe("/planos");
    expect(stripSiteBase("/tarufinoxyz")).toBe("/tarufinoxyz");
  });

  it("leva os links antigos para o site novo, com busca e âncora", () => {
    expect(legacyRedirect("/vip/natal", "?utm_source=ig", "#topo")).toBe("/tarufino/vip/natal?utm_source=ig#topo");
    expect(legacyRedirect("/pacotes")).toBe("/tarufino/pacotes");
    expect(legacyRedirect("/agendar")).toBe("/tarufino/agendar");
    expect(legacyRedirect("/selecao/ana-k3j9")).toBe("/tarufino/selecao/ana-k3j9");
  });

  it("não mexe nas rotas da Revela nem em endereços desconhecidos", () => {
    expect(legacyRedirect("/")).toBeNull();
    expect(legacyRedirect("/planos")).toBeNull();
    expect(legacyRedirect("/entrar")).toBeNull();
    expect(legacyRedirect("/qualquer-coisa")).toBeNull();
  });
});
