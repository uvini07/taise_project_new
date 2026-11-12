// Polaroidy: lado do painel. Conversa com /api/polaroid e executa as
// ferramentas aqui, com o login da fotógrafa (as regras do banco garantem que
// só os dados do estúdio dela aparecem). Nada aqui altera dados.
import { auth } from "./firebaseAuth.js";
import { getAppointment, listAppointments, listOpenRequests } from "./admin/agendaAdmin.js";
import { listTransactions } from "./admin/financeAdmin.js";
import { groupIncome, summarize, txBalance, txState } from "../utils/finance.js";
import { todayKey } from "../utils/format.js";
import { APPOINTMENT_STATUS } from "../config/constants.js";

const brl = (cents) => (Number(cents || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dayBR = (d) => (d ? `${d.slice(8, 10)}/${d.slice(5, 7)}` : "");
const okDay = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ""));

const appt = (a) => ({
  data: a.date, hora: a.time, cliente: a.name, pacote: a.packageName || "",
  situacao: APPOINTMENT_STATUS[a.status]?.label || a.status, whatsapp: a.phone || "",
});

/** Ferramentas que a IA pode pedir. Cada uma devolve { forModel, ui }. */
const TOOLS = {
  async agenda({ de, ate }) {
    const from = okDay(de) ? de : todayKey();
    const to = okDay(ate) && ate >= from ? ate : from;
    const list = (await listAppointments({ from, to }))
      .filter((a) => a.status !== "cancelled")
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
      .slice(0, 50)
      .map(appt);
    return { forModel: { de: from, ate: to, total: list.length, agendamentos: list } };
  },

  async pedidos_aguardando() {
    const list = (await listOpenRequests()).slice(0, 50).map(appt);
    return { forModel: { total: list.length, pedidos: list } };
  },

  async faturamento({ de, ate }) {
    const from = okDay(de) ? de : `${todayKey().slice(0, 8)}01`;
    const to = okDay(ate) && ate >= from ? ate : todayKey();
    const all = await listTransactions({ from, to });
    const s = summarize(all, { from, to, today: todayKey() });
    const porPacote = groupIncome(all, (t) => (t.description || "").split(" — ")[0] || t.category, { from, to })
      .slice(0, 8).map((g) => ({ pacote: g.key, ensaios: g.count, contratado: brl(g.contractedCents), recebido: brl(g.receivedCents) }));
    return {
      forModel: {
        de: dayBR(from), ate: dayBR(to),
        contratado: brl(s.grossCents), receitas: s.incomeCount,
        recebido: brl(s.receivedCents), a_receber: brl(s.pendingCents), vencido_total: brl(s.overdueCents),
        despesas: brl(s.expensesCents), despesas_pagas: brl(s.expensesPaidCents),
        resultado_caixa: brl(s.resultCents), ticket_medio: s.avgTicketCents != null ? brl(s.avgTicketCents) : "poucos dados",
        por_pacote: porPacote,
      },
    };
  },

  async pagamentos_pendentes(_input, { studioName }) {
    const today = todayKey();
    const txs = (await listTransactions({ from: today, to: today }))
      .filter((t) => t.type === "income" && t.status !== "cancelled" && txBalance(t) > 0)
      .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""))
      .slice(0, 40);
    // WhatsApp do cliente: vem do agendamento ligado ao lançamento.
    const phones = {};
    await Promise.all([...new Set(txs.map((t) => t.appointmentId).filter(Boolean))].map(async (id) => {
      try { phones[id] = (await getAppointment(id))?.phone || ""; } catch { /* sem acesso: segue sem telefone */ }
    }));
    const items = txs.map((t) => {
      const state = txState(t, today);
      return {
        cliente: t.clientName || "(sem nome)",
        em_aberto: brl(txBalance(t)),
        vencimento: dayBR(t.dueDate),
        situacao: state === "overdue" ? "Vencido" : state === "partial" ? "Pago em parte" : "Pendente",
        referente: t.description || "",
        whatsapp: phones[t.appointmentId] || t.clientPhone || "",
      };
    });
    // Botões de cobrança: a mensagem é montada aqui, não pela IA.
    const charges = items.filter((i) => i.whatsapp).map((i) => {
      const first = i.cliente.split(" ")[0];
      const text = `Oi, ${first}! Tudo bem? Passando para lembrar do pagamento de ${i.em_aberto}`
        + `${i.referente ? ` referente a ${i.referente}` : ""}${i.vencimento ? `, com vencimento em ${i.vencimento}` : ""}.`
        + ` Qualquer dúvida, estou à disposição. ${studioName || ""}`.trimEnd();
      return { label: `Cobrar ${first} (${i.em_aberto})`, href: `https://wa.me/${String(i.whatsapp).replace(/\D/g, "")}?text=${encodeURIComponent(text)}` };
    });
    const semWhats = items.filter((i) => !i.whatsapp).length;
    return { forModel: { total: items.length, sem_whatsapp: semWhats, pagamentos: items }, ui: charges.length ? { charges } : null };
  },
};

async function callApi(messages, context) {
  const token = await auth.currentUser?.getIdToken();
  const r = await fetch("/api/polaroid", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token || ""}` },
    body: JSON.stringify({ messages, context }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || "A Polaroidy não respondeu agora.");
  return data;
}

/**
 * Envia a pergunta e resolve as ferramentas até a resposta final.
 * history: mensagens no formato da API (guardadas sem alteração, inclusive os
 * blocos de raciocínio, como a API pede). Retorna { history, text, ui }.
 */
export async function askPolaroid(history, question, context) {
  const messages = [...history, { role: "user", content: question }];
  const ui = { charges: [] };
  for (let round = 0; round < 5; round += 1) {
    const res = await callApi(messages, context);
    messages.push({ role: "assistant", content: res.content });
    if (res.stop_reason === "refusal") return { history: messages, text: "Não consigo ajudar com isso. Tente perguntar de outro jeito.", ui };
    if (res.stop_reason !== "tool_use") {
      const text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
      return { history: messages, text: text || "Pronto.", ui };
    }
    const calls = res.content.filter((b) => b.type === "tool_use");
    const results = await Promise.all(calls.map(async (c) => {
      const fn = TOOLS[c.name];
      try {
        if (!fn) throw new Error("Ferramenta desconhecida.");
        const out = await fn(c.input || {}, context);
        if (out.ui?.charges) ui.charges.push(...out.ui.charges);
        return { type: "tool_result", tool_use_id: c.id, content: JSON.stringify(out.forModel) };
      } catch (e) {
        return { type: "tool_result", tool_use_id: c.id, is_error: true, content: `Não foi possível ler esses dados: ${e.message || "erro"}` };
      }
    }));
    messages.push({ role: "user", content: results });
  }
  return { history: messages, text: "Essa pergunta ficou complicada demais. Pode tentar de um jeito mais simples?", ui };
}

/** Texto com **negrito**, listas "- " e links [texto](/adm/...) → pedaços para o chat. */
export function parseLine(line) {
  const parts = [];
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0; let m;
  while ((m = re.exec(line))) {
    if (m.index > last) parts.push({ t: "text", v: line.slice(last, m.index) });
    if (m[1] != null) parts.push({ t: "bold", v: m[1] });
    else parts.push({ t: "link", v: m[2], href: m[3] });
    last = re.lastIndex;
  }
  if (last < line.length) parts.push({ t: "text", v: line.slice(last) });
  return parts;
}
