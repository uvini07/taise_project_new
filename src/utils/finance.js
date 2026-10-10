// Cálculos financeiros. Três conceitos que NUNCA se misturam:
//  - contratado: valor combinado (lançamentos de receita no período)
//  - recebido:   dinheiro que de fato entrou (pagamentos registrados no período)
//  - resultado:  recebido − despesas pagas no período (visão de caixa)
// Uma reserva/agendamento não vira receita sozinha: a receita é lançada no
// financeiro e só conta como recebida quando um pagamento é registrado.

export const TX_STATE = {
  pending: { label: "Pendente", tone: "warning" },
  partial: { label: "Parcial", tone: "info" },
  paid: { label: "Pago", tone: "success" },
  overdue: { label: "Vencido", tone: "danger" },
  cancelled: { label: "Cancelado", tone: "muted" },
  refunded: { label: "Reembolsado", tone: "muted" },
};

export const PAYMENT_METHODS = ["Pix", "Dinheiro", "Cartão de crédito", "Cartão de débito", "Transferência", "Boleto", "Outro"];

const sum = (arr, f) => arr.reduce((s, x) => s + (Number(f(x)) || 0), 0);

export function txRefunded(tx) {
  return sum(tx.refunds || [], (r) => r.amountCents);
}

export function txPaid(tx) {
  return sum(tx.payments || [], (p) => p.amountCents) - txRefunded(tx);
}

export function txBalance(tx) {
  if (tx.status === "cancelled") return 0;
  return Math.max(0, (Number(tx.amountCents) || 0) - txPaid(tx));
}

export function txState(tx, today) {
  if (tx.status === "cancelled") return txRefunded(tx) > 0 ? "refunded" : "cancelled";
  const paid = txPaid(tx);
  if (paid >= (Number(tx.amountCents) || 0) && (Number(tx.amountCents) || 0) > 0) return "paid";
  if (tx.dueDate && today && tx.dueDate < today) return "overdue";
  if (paid > 0) return "partial";
  return "pending";
}

const inRange = (d, from, to) => !!d && (!from || d >= from) && (!to || d <= to);

/**
 * Indicadores do período [from, to] (datas "AAAA-MM-DD").
 * Receitas e despesas usam a data de vencimento/competência (dueDate);
 * recebimentos e pagamentos usam a data de cada pagamento.
 */
export function summarize(transactions, { from, to, today }) {
  const active = transactions.filter((t) => !t.archived);
  const income = active.filter((t) => t.type === "income");
  const expense = active.filter((t) => t.type === "expense");
  const notCancelled = (t) => t.status !== "cancelled";

  const contracted = income.filter((t) => notCancelled(t) && inRange(t.dueDate, from, to));
  const grossCents = sum(contracted, (t) => t.amountCents);

  const paymentsIn = (list) => sum(list, (t) =>
    sum((t.payments || []).filter((p) => inRange(p.date, from, to)), (p) => p.amountCents)
    - sum((t.refunds || []).filter((r) => inRange(r.date, from, to)), (r) => r.amountCents));

  const receivedCents = paymentsIn(income);
  const pendingCents = sum(income.filter((t) => notCancelled(t) && inRange(t.dueDate, from, to)), txBalance);
  const overdueCents = sum(income.filter((t) => notCancelled(t) && t.dueDate && t.dueDate < today), txBalance);

  const expensesCents = sum(expense.filter((t) => notCancelled(t) && inRange(t.dueDate, from, to)), (t) => t.amountCents);
  const expensesPaidCents = paymentsIn(expense);
  const expensesPendingCents = sum(expense.filter((t) => notCancelled(t) && inRange(t.dueDate, from, to)), txBalance);

  const ticketBase = contracted.filter((t) => t.amountCents > 0);
  const avgTicketCents = ticketBase.length >= 3 ? Math.round(grossCents / ticketBase.length) : null;

  return {
    grossCents,
    receivedCents,
    pendingCents,
    overdueCents,
    expensesCents,
    expensesPaidCents,
    expensesPendingCents,
    resultCents: receivedCents - expensesPaidCents,
    avgTicketCents,
    incomeCount: contracted.length,
  };
}

/** Agrupa receitas contratadas do período por uma chave (pacote, campanha...). */
export function groupIncome(transactions, keyFn, { from, to }) {
  const map = new Map();
  for (const t of transactions) {
    if (t.archived || t.type !== "income" || t.status === "cancelled" || !inRange(t.dueDate, from, to)) continue;
    const k = keyFn(t) || "—";
    const cur = map.get(k) || { key: k, contractedCents: 0, receivedCents: 0, count: 0 };
    cur.contractedCents += Number(t.amountCents) || 0;
    cur.receivedCents += txPaid(t);
    cur.count += 1;
    map.set(k, cur);
  }
  return [...map.values()].sort((a, b) => b.contractedCents - a.contractedCents);
}
