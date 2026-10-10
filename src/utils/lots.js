// Lotes e vagas. As vagas restantes saem SEMPRE de capacidade − confirmados;
// o contador de confirmados é mantido por transação no painel (e pode ser
// recalculado a partir dos agendamentos a qualquer momento).
import { toDate } from "./format.js";

export const PACKAGE_STATUS = {
  draft: { label: "Rascunho", tone: "neutral" },
  published: { label: "Publicado", tone: "success" },
  soldout: { label: "Esgotado", tone: "warning" },
  closed: { label: "Encerrado", tone: "muted" },
};

export const MAX_PUBLISHED_PACKAGES = 5;
export const isPublicStatus = (s) => s === "published" || s === "soldout";

export function lotRemaining(lot) {
  if (!lot) return 0;
  if (lot.capacity == null) return null; // sem limite
  return Math.max(0, Number(lot.capacity) - Number(lot.confirmedCount || 0));
}

export function lotState(lot, now = new Date()) {
  if (!lot || lot.status === "closed") return "closed";
  const start = toDate(lot.salesStart);
  const end = toDate(lot.salesEnd);
  if (start && start > now) return "upcoming";
  if (end && end < now) return "ended";
  const r = lotRemaining(lot);
  if (r !== null && r <= 0) return "soldout";
  return "open";
}

/**
 * Situação comercial do pacote.
 * Retorna { state: 'available'|'soldout'|'upcoming'|'closed', lot, nextLot, priceCents }
 */
export function packageAvailability(pkg, lots = [], now = new Date()) {
  const sorted = [...lots].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const salesStart = toDate(pkg?.salesStart);
  const salesEnd = toDate(pkg?.salesEnd);
  const basePrice = pkg?.promoPriceCents ?? pkg?.priceCents ?? null;

  if (!pkg || pkg.status === "closed" || pkg.status === "draft") return { state: "closed", lot: null, priceCents: basePrice };
  if (pkg.status === "soldout") return { state: "soldout", lot: null, priceCents: basePrice };
  if (salesEnd && salesEnd < now) return { state: "closed", lot: null, priceCents: basePrice };

  if (!sorted.length) {
    if (salesStart && salesStart > now) return { state: "upcoming", lot: null, priceCents: basePrice, opensAt: salesStart };
    return { state: "available", lot: null, priceCents: basePrice };
  }

  const open = sorted.find((l) => lotState(l, now) === "open");
  if (open && !(salesStart && salesStart > now)) {
    const next = sorted.find((l) => (l.order ?? 0) > (open.order ?? 0) && lotState(l, now) !== "closed");
    return { state: "available", lot: open, nextLot: next || null, priceCents: open.priceCents };
  }
  const upcoming = sorted.find((l) => lotState(l, now) === "upcoming");
  if (upcoming) {
    return { state: "upcoming", lot: upcoming, priceCents: upcoming.priceCents, opensAt: toDate(upcoming.salesStart) };
  }
  const anySoldOut = sorted.some((l) => lotState(l, now) === "soldout");
  return { state: anySoldOut ? "soldout" : "closed", lot: null, priceCents: basePrice };
}

/** Recalcula confirmados por lote a partir da lista de agendamentos. */
export function countConfirmedByLot(appointments) {
  const out = {};
  for (const a of appointments) {
    if (!a.lotId) continue;
    if (a.status === "confirmed" || a.status === "done") out[a.lotId] = (out[a.lotId] || 0) + 1;
  }
  return out;
}

/** Validação do formulário de lotes antes de salvar. */
export function validateLots(lots) {
  const errors = [];
  lots.forEach((l, i) => {
    const n = `Lote ${i + 1}`;
    if (!String(l.name || "").trim()) errors.push(`${n}: informe o nome.`);
    if (l.priceCents == null || l.priceCents < 0) errors.push(`${n}: preço inválido.`);
    if (l.capacity != null && (!Number.isInteger(l.capacity) || l.capacity < 0)) errors.push(`${n}: vagas inválidas.`);
    if (l.capacity != null && l.capacity < (l.confirmedCount || 0)) {
      errors.push(`${n}: já tem ${l.confirmedCount} reserva(s) confirmada(s); as vagas não podem ser menores que isso.`);
    }
    const s = toDate(l.salesStart), e = toDate(l.salesEnd);
    if (s && e && s > e) errors.push(`${n}: o fim das vendas é antes do início.`);
  });
  return errors;
}
