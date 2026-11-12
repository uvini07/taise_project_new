// Polaroidy: lado do painel. Conversa com /api/polaroid e executa as
// ferramentas aqui, com o login da fotógrafa (as regras do banco garantem que
// só os dados do estúdio dela aparecem). As ferramentas só leem dados; quando
// algo pode ser feito (confirmar um pedido, registrar um pagamento), elas
// devolvem um BOTÃO, e a ação só acontece quando a fotógrafa toca nele.
import { auth } from "./firebaseAuth.js";
import { changeAppointmentStatus, freeSlotsForAdmin, getAppointment, listAppointments, listOpenRequests } from "./admin/agendaAdmin.js";
import { addPayment, listTransactions } from "./admin/financeAdmin.js";
import { fetchTakenLocks, getAvailability } from "./agendaService.js";
import { aggregateCounters, countRecords, loadDailyCounters } from "./admin/analyticsAdmin.js";
import { listCampaigns } from "./admin/vipAdmin.js";
import { listDeliveries, listSelections } from "./admin/clientPagesDemo.js";
import { deadlineLabel, effectiveStatus } from "../utils/clientGallery.js";
import { groupIncome, summarize, txBalance, txState } from "../utils/finance.js";
import { addDays, todayKey } from "../utils/format.js";
import { APPOINTMENT_STATUS } from "../config/constants.js";

const brl = (cents) => (Number(cents || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dayBR = (d) => (d ? `${d.slice(8, 10)}/${d.slice(5, 7)}` : "");
const okDay = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ""));

const appt = (a) => ({
  data: a.date, hora: a.time, cliente: a.name, pacote: a.packageName || "",
  situacao: APPOINTMENT_STATUS[a.status]?.label || a.status, whatsapp: a.phone || "",
});

const norm = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
const sameName = (full, q) => { const a = norm(full); const b = norm(q); return !!b && (a === b || a.includes(b) || b.split(/\s+/).every((w) => a.includes(w))); };
const firstName = (n) => String(n || "").split(" ")[0];
const waLink = (phone, text) => `https://wa.me/${String(phone).replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
const weekdayBR = (d) => new Date(`${d}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "long" });

/** Agendamentos de um intervalo largo (histórico do cliente). */
const allAppointments = () => listAppointments({ from: addDays(todayKey(), -730), to: addDays(todayKey(), 365) });

/** Receitas em aberto de um cliente (as mais antigas primeiro). */
async function openIncomeOf(nome) {
  const today = todayKey();
  return (await listTransactions({ from: today, to: today }))
    .filter((t) => t.type === "income" && t.status !== "cancelled" && txBalance(t) > 0 && sameName(t.clientName, nome))
    .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));
}

const MESSAGES = {
  confirmacao: (n, a, studio) => `Oi, ${n}! Tudo certo? Seu ${a.packageName || "ensaio"} está confirmado para ${weekdayBR(a.date)}, ${dayBR(a.date)}, às ${a.time}. Qualquer dúvida, é só me chamar. ${studio}`,
  lembrete: (n, a, studio) => `Oi, ${n}! Passando para lembrar do seu ${a.packageName || "ensaio"} ${a.date === todayKey() ? "hoje" : a.date === addDays(todayKey(), 1) ? "amanhã" : `em ${dayBR(a.date)}`}, às ${a.time}. Estou te esperando! ${studio}`,
  fotos_prontas: (n, _a, studio) => `Oi, ${n}! Suas fotos estão prontas! Vou te enviar o link para você ver e baixar. Espero que ame tanto quanto eu amei fazer. ${studio}`,
  depoimento: (n, _a, studio) => `Oi, ${n}! Foi um prazer fotografar vocês. Se puder, me conta em poucas palavras como foi a experiência? Seu depoimento ajuda muito o meu trabalho. ${studio}`,
};

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
        recebido: brl(s.receivedCents), a_receber_do_periodo: brl(s.pendingCents),
        vencido_geral_ate_hoje: brl(s.overdueCents), obs_vencido: "Total geral de tudo que já venceu e não foi pago, de qualquer mês. Não é do período: cite só uma vez, sem comparar.",
        despesas: brl(s.expensesCents), despesas_pagas: brl(s.expensesPaidCents),
        resultado_caixa: brl(s.resultCents), ticket_medio: s.avgTicketCents != null ? brl(s.avgTicketCents) : "poucos dados",
        por_pacote: porPacote,
      },
    };
  },

  async cliente({ nome }) {
    const [appts, txs] = await Promise.all([allAppointments(), listTransactions({ from: todayKey(), to: todayKey() })]);
    const mine = appts.filter((a) => sameName(a.name, nome));
    const money = txs.filter((t) => t.type === "income" && t.status !== "cancelled" && sameName(t.clientName, nome));
    if (!mine.length && !money.length) return { forModel: { encontrado: false } };
    const nomes = [...new Set(mine.map((a) => a.name).concat(money.map((t) => t.clientName)))];
    return {
      forModel: {
        encontrado: true, nomes_encontrados: nomes.slice(0, 5),
        ensaios: mine.slice(-15).map(appt),
        total_contratado: brl(money.reduce((x, t) => x + (Number(t.amountCents) || 0), 0)),
        em_aberto: brl(money.reduce((x, t) => x + txBalance(t), 0)),
      },
    };
  },

  async horarios_livres({ data }) {
    const day = okDay(data) ? data : todayKey();
    const [cfg, locks] = await Promise.all([getAvailability(), fetchTakenLocks(day, day)]);
    const slots = freeSlotsForAdmin(cfg, day, locks.taken, cfg.sessionMinutes || 60);
    const livres = slots.filter((x) => x.available).map((x) => x.time);
    return { forModel: { data: `${weekdayBR(day)} ${dayBR(day)}`, atende_neste_dia: slots.length > 0, horarios_livres: livres } };
  },

  async selecoes_entregas() {
    const now = new Date();
    const LBL = { draft: "Rascunho (não enviada)", sent: "Enviada, cliente ainda não começou", selecting: "Cliente escolhendo", finished: "Seleção finalizada", expired: "Prazo vencido", available: "Disponível para baixar", downloaded: "Já baixada" };
    const [sel, del] = await Promise.all([listSelections(), listDeliveries()]);
    return {
      forModel: {
        aviso: "Seleção e entrega ainda estão em modo de teste na plataforma.",
        selecoes: sel.slice(0, 20).map((x) => ({ cliente: x.clientName, ensaio: x.title || "", situacao: LBL[effectiveStatus(x, now)] || x.status, escolhidas: `${(x.selectedIds || []).length} de ${x.photoLimit || "?"}`, prazo: deadlineLabel(x.expiresAt, now) })),
        entregas: del.slice(0, 20).map((x) => ({ cliente: x.clientName, ensaio: x.title || "", situacao: LBL[effectiveStatus(x, now)] || x.status, downloads: x.downloads || 0, prazo: deadlineLabel(x.expiresAt, now) })),
      },
    };
  },

  async visitas({ de, ate }) {
    const from = okDay(de) ? de : addDays(todayKey(), -6);
    const to = okDay(ate) && ate >= from ? ate : todayKey();
    const [daily, recs] = await Promise.all([loadDailyCounters(from, to), countRecords(from, to).catch(() => null)]);
    const { totals, groups } = aggregateCounters(daily);
    const top = (g) => Object.entries(g).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => ({ nome: k, total: v }));
    return { forModel: { de: dayBR(from), ate: dayBR(to), visitas: totals.visit || 0, paginas_vistas: totals.pv || 0, origens: top(groups.src), paginas: top(groups.page), pacotes_mais_vistos: top(groups.pkg), pedidos_de_agendamento: recs?.appointments ?? null, novos_na_lista_vip: recs?.vipRegistrations ?? null } };
  },

  async lista_vip() {
    const c = await listCampaigns();
    return { forModel: { campanhas: c.slice(0, 10).map((x) => ({ nome: x.name, situacao: x.status, inscritos: x.count || 0 })), total_inscritos: c.reduce((n, x) => n + (x.count || 0), 0) } };
  },

  async mensagem_whatsapp({ cliente, tipo }, { studioName }) {
    const today = todayKey();
    const mine = (await allAppointments()).filter((a) => sameName(a.name, cliente) && a.status !== "cancelled");
    if (!mine.length) return { forModel: { ok: false, motivo: "Cliente não encontrada na agenda." } };
    const next = mine.find((a) => a.date >= today) || mine[mine.length - 1];
    if (!next.phone) return { forModel: { ok: false, motivo: "Essa cliente não tem WhatsApp cadastrado." } };
    const build = MESSAGES[tipo] || MESSAGES.lembrete;
    const text = build(firstName(next.name), next, studioName || "").trimEnd();
    return { forModel: { ok: true, cliente: next.name, mensagem: text }, ui: { links: [{ label: `Enviar para ${firstName(next.name)} no WhatsApp`, href: waLink(next.phone, text) }] } };
  },

  async preparar_confirmacao({ cliente }) {
    const reqs = (await listOpenRequests()).filter((a) => sameName(a.name, cliente));
    if (!reqs.length) return { forModel: { ok: false, motivo: "Não há pedido aguardando confirmação com esse nome." } };
    return {
      forModel: { ok: true, pedidos: reqs.map(appt), observacao: "O botão de confirmar aparece abaixo da resposta." },
      ui: { actions: reqs.slice(0, 3).map((a) => ({ kind: "confirm", id: a.id, label: `Confirmar ${firstName(a.name)} · ${dayBR(a.date)} ${a.time}` })) },
    };
  },

  async preparar_pagamento({ cliente, valor_reais }) {
    const open = await openIncomeOf(cliente);
    if (!open.length) return { forModel: { ok: false, motivo: "Não encontrei valor em aberto para essa cliente." } };
    const t = open[0];
    const bal = txBalance(t);
    const cents = Number(valor_reais) > 0 ? Math.min(Math.round(Number(valor_reais) * 100), bal) : bal;
    return {
      forModel: { ok: true, cliente: t.clientName, referente: t.description || "", em_aberto: brl(bal), valor_do_botao: brl(cents), observacao: "O botão de registrar aparece abaixo da resposta." },
      ui: { actions: [{ kind: "pay", id: t.id, amountCents: cents, label: `Registrar ${brl(cents)} recebido de ${firstName(t.clientName)}` }] },
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
  const ui = { charges: [], links: [], actions: [] };
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
        if (out.ui?.links) ui.links.push(...out.ui.links);
        if (out.ui?.actions) ui.actions.push(...out.ui.actions);
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

/** Executa um botão de ação (só depois do toque da fotógrafa). */
export async function runAction(a) {
  if (a.kind === "confirm") { await changeAppointmentStatus(a.id, "confirmed", { note: "Confirmado pela Polaroidy" }); return "Pedido confirmado."; }
  if (a.kind === "pay") { await addPayment(a.id, { amountCents: a.amountCents, date: todayKey(), method: "Pix", note: "Registrado pela Polaroidy" }); return `Pagamento de ${brl(a.amountCents)} registrado.`; }
  throw new Error("Ação desconhecida.");
}

/** Resumo do dia (sem IA, então não custa nada): aparece ao abrir a Polaroidy. */
export async function dailySummary() {
  const today = todayKey();
  const [appts, reqs, txs] = await Promise.all([
    listAppointments({ from: today, to: addDays(today, 1) }),
    listOpenRequests(),
    listTransactions({ from: today, to: today }),
  ]);
  const live = appts.filter((a) => a.status !== "cancelled");
  const overdue = txs.filter((t) => t.type === "income" && t.status !== "cancelled" && txBalance(t) > 0 && t.dueDate && t.dueDate < today);
  return {
    today: live.filter((a) => a.date === today).map((a) => `${a.time} ${firstName(a.name)}`),
    tomorrow: live.filter((a) => a.date !== today).length,
    requests: reqs.length,
    overdueCount: overdue.length,
    overdue: brl(overdue.reduce((n, t) => n + txBalance(t), 0)),
  };
}

/** Avaliação de uma resposta (vai para os registros da Vercel). */
export async function sendFeedback(good, question) {
  try {
    const token = await auth.currentUser?.getIdToken();
    await fetch("/api/polaroid", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token || ""}` }, body: JSON.stringify({ feedback: { good: !!good, question: String(question || "").slice(0, 300) } }) });
  } catch { /* opcional */ }
}
