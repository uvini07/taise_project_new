import { describe, expect, it } from "vitest";
import { summarize, txBalance, txState } from "../../src/utils/finance.js";

const today = "2026-10-10";
const txs = [
  { type: "income", amountCents: 50000, dueDate: "2026-10-05", payments: [{ amountCents: 50000, date: "2026-10-05" }] },
  { type: "income", amountCents: 80000, dueDate: "2026-10-08", payments: [{ amountCents: 24000, date: "2026-10-01" }] },
  { type: "income", amountCents: 30000, dueDate: "2026-10-20", payments: [] },
  { type: "income", amountCents: 99999, dueDate: "2026-10-06", payments: [], status: "cancelled" },
  { type: "income", amountCents: 40000, dueDate: "2026-10-02", payments: [{ amountCents: 40000, date: "2026-10-02" }], refunds: [{ amountCents: 40000, date: "2026-10-09" }], status: "cancelled" },
  { type: "expense", amountCents: 20000, dueDate: "2026-10-03", payments: [{ amountCents: 20000, date: "2026-10-03" }] },
  { type: "expense", amountCents: 5000, dueDate: "2026-10-25", payments: [] },
  { type: "income", amountCents: 70000, dueDate: "2026-10-07", payments: [], archived: true },
];

describe("financeiro", () => {
  it("estado de cada lançamento", () => {
    expect(txState(txs[0], today)).toBe("paid");
    expect(txState(txs[1], today)).toBe("overdue");
    expect(txState(txs[2], today)).toBe("pending");
    expect(txState(txs[3], today)).toBe("cancelled");
    expect(txState(txs[4], today)).toBe("refunded");
    expect(txBalance(txs[1])).toBe(56000);
  });

  it("separa contratado, recebido, pendente e resultado", () => {
    const s = summarize(txs, { from: "2026-10-01", to: "2026-10-31", today });
    expect(s.grossCents).toBe(50000 + 80000 + 30000); // canceladas e arquivadas fora
    expect(s.receivedCents).toBe(50000 + 24000 + 40000 - 40000);
    expect(s.pendingCents).toBe(56000 + 30000);
    expect(s.overdueCents).toBe(56000);
    expect(s.expensesCents).toBe(25000);
    expect(s.expensesPaidCents).toBe(20000);
    expect(s.resultCents).toBe(74000 - 20000);
    expect(s.avgTicketCents).toBe(Math.round(160000 / 3));
  });
});
