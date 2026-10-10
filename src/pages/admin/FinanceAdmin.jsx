import { useMemo, useState } from "react";
import { Archive, Ban, CircleDollarSign, Download, Info, Pencil, Plus, Receipt, Undo2, Wallet } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AdminHeader, PeriodPicker, Section, StatCard } from "../../components/admin/AdminUI.jsx";
import { SelectField, TextArea, TextField } from "../../components/common/Fields.jsx";
import Badge from "../../components/common/Badge.jsx";
import Modal from "../../components/common/Modal.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import PageLoader from "../../components/common/PageLoader.jsx";
import { EmptyState, ErrorState } from "../../components/common/States.jsx";
import { useConfirm } from "../../components/common/useConfirm.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";
import { useAsync } from "../../hooks/useAsync.js";
import {
  addPayment, addRefund, archiveTransaction, listTransactions, replacePayments, saveTransaction, setTransactionStatus,
} from "../../services/admin/financeAdmin.js";
import { listAllPackages } from "../../services/admin/packagesAdmin.js";
import { listCampaigns } from "../../services/admin/vipAdmin.js";
import { PAYMENT_METHODS, TX_STATE, groupIncome, summarize, txBalance, txPaid, txState } from "../../utils/finance.js";
import { centsToInput, formatBRL, formatDayBR, parseBRLToCents, todayKey } from "../../utils/format.js";
import { eachDay, resolvePeriod } from "../../utils/period.js";
import { downloadCSV } from "../../utils/csv.js";

const INCOME_CATS = ["Ensaio", "Evento", "Adicional", "Produto impresso", "Outro"];
const EXPENSE_CATS = ["Cenário", "Equipamento", "Aluguel", "Impressão", "Marketing", "Assistente", "Transporte", "Impostos", "Outro"];
const brlShort = (c) => (Math.abs(c) >= 100000 ? `R$ ${(c / 100000).toFixed(1).replace(".", ",")} mil` : formatBRL(c));

function TxEditor({ initial, packages, campaigns, onClose, onSaved }) {
  const toast = useToast();
  const [f, setF] = useState(() => ({
    type: "income", description: "", category: "Ensaio", amount: "", dueDate: todayKey(), clientName: "", packageId: "", campaignId: "", notes: "",
    ...initial,
    amount: initial?.amountCents != null ? centsToInput(initial.amountCents) : "",
    payments: (initial?.payments || []).map((p) => ({ ...p, amountText: centsToInput(p.amountCents) })),
  }));
  const [saving, setSaving] = useState(false);
  const up = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function save() {
    const amountCents = parseBRLToCents(f.amount);
    if (!f.description.trim()) return toast.error("Informe a descrição.");
    if (amountCents == null || amountCents <= 0) return toast.error("Informe um valor válido.");
    if (!f.dueDate) return toast.error("Informe a data de vencimento/competência.");
    const payments = f.payments.map(({ amountText, ...p }) => ({ ...p, amountCents: parseBRLToCents(amountText) }));
    if (payments.some((p) => !p.amountCents || !p.date)) return toast.error("Confira os pagamentos: valor e data são obrigatórios.");
    setSaving(true);
    try {
      const data = {
        type: f.type, description: f.description.trim(), category: f.category, amountCents, dueDate: f.dueDate,
        clientName: f.clientName.trim(), packageId: f.packageId || null, campaignId: f.campaignId || null,
        appointmentId: f.appointmentId || null, notes: f.notes.trim(),
      };
      const id = await saveTransaction(initial?.id || null, { ...data, payments: initial?.id ? undefined : payments, refunds: initial?.refunds });
      if (initial?.id) await replacePayments(id, payments);
      toast.success("Lançamento salvo.");
      onSaved();
    } catch (e) {
      toast.error(e.message || "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  const cats = f.type === "income" ? INCOME_CATS : EXPENSE_CATS;
  return (
    <Modal open onClose={onClose} title={initial?.id ? "Editar lançamento" : "Novo lançamento"} size="lg"
      footer={<><button className="btn-ghost" onClick={onClose}>Cancelar</button><button className="btn-primary" onClick={save} disabled={saving}>{saving && <Spinner className="h-4 w-4" />} Salvar</button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Tipo" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value, category: e.target.value === "income" ? "Ensaio" : "Outro" })}>
          <option value="income">Receita</option>
          <option value="expense">Despesa</option>
        </SelectField>
        <SelectField label="Categoria" value={f.category} onChange={up("category")}>{cats.map((c) => <option key={c}>{c}</option>)}</SelectField>
        <TextField className="sm:col-span-2" label="Descrição *" value={f.description} onChange={up("description")} maxLength={160} data-autofocus />
        <TextField label="Valor total (R$) *" inputMode="decimal" value={f.amount} onChange={up("amount")} />
        <TextField label="Vencimento / competência *" type="date" value={f.dueDate} onChange={up("dueDate")} />
        <TextField label={f.type === "income" ? "Cliente" : "Fornecedor"} value={f.clientName} onChange={up("clientName")} />
        <SelectField label="Pacote" value={f.packageId || ""} onChange={up("packageId")}>
          <option value="">—</option>
          {packages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </SelectField>
        <SelectField label="Evento / campanha" value={f.campaignId || ""} onChange={up("campaignId")}>
          <option value="">—</option>
          {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </SelectField>
        <TextArea className="sm:col-span-2" label="Observações" rows={2} value={f.notes} onChange={up("notes")} />
      </div>
      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <p className="field-label !mb-0">Pagamentos registrados</p>
          <button className="btn-ghost btn-sm" onClick={() => setF((x) => ({ ...x, payments: [...x.payments, { date: todayKey(), amountText: "", method: "Pix", note: "" }] }))}><Plus className="h-4 w-4" /> Pagamento</button>
        </div>
        {!f.payments.length && <p className="text-sm text-ink-muted">Nenhum pagamento — o valor fica pendente.</p>}
        <div className="space-y-2">
          {f.payments.map((p, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 sm:grid-cols-[140px_120px_1fr_1fr_auto]">
              <input type="date" className="field-input !py-2" value={p.date} onChange={(e) => setF((x) => ({ ...x, payments: x.payments.map((y, j) => (j === i ? { ...y, date: e.target.value } : y)) }))} aria-label="Data" />
              <input className="field-input !py-2" placeholder="Valor" value={p.amountText} onChange={(e) => setF((x) => ({ ...x, payments: x.payments.map((y, j) => (j === i ? { ...y, amountText: e.target.value } : y)) }))} aria-label="Valor" />
              <select className="field-input !py-2" value={p.method} onChange={(e) => setF((x) => ({ ...x, payments: x.payments.map((y, j) => (j === i ? { ...y, method: e.target.value } : y)) }))} aria-label="Forma">
                {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
              </select>
              <input className="field-input !py-2" placeholder="Obs." value={p.note || ""} onChange={(e) => setF((x) => ({ ...x, payments: x.payments.map((y, j) => (j === i ? { ...y, note: e.target.value } : y)) }))} aria-label="Observação" />
              <button className="rounded-full p-2 text-danger hover:bg-danger/10" onClick={() => setF((x) => ({ ...x, payments: x.payments.filter((_, j) => j !== i) }))} aria-label="Remover pagamento">×</button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

function MoneyModal({ title, tx, kind, onClose, onDone }) {
  const toast = useToast();
  const [f, setF] = useState({ amount: centsToInput(kind === "payment" ? txBalance(tx) : txPaid(tx)), date: todayKey(), method: "Pix", note: "" });
  const [saving, setSaving] = useState(false);
  async function save() {
    const amountCents = parseBRLToCents(f.amount);
    if (!amountCents) return toast.error("Valor inválido.");
    setSaving(true);
    try {
      const entry = { amountCents, date: f.date, method: f.method, note: f.note.trim() };
      if (kind === "payment") await addPayment(tx.id, entry); else await addRefund(tx.id, entry);
      toast.success(kind === "payment" ? "Pagamento registrado." : "Reembolso registrado.");
      onDone();
    } catch (e) { toast.error(e.message || "Não foi possível registrar."); } finally { setSaving(false); }
  }
  return (
    <Modal open onClose={onClose} title={title} size="sm"
      footer={<><button className="btn-ghost" onClick={onClose}>Cancelar</button><button className="btn-primary" onClick={save} disabled={saving}>Registrar</button></>}>
      <p className="mb-4 text-sm text-ink-muted">{tx.description} · total {formatBRL(tx.amountCents)} · pago {formatBRL(txPaid(tx))}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Valor (R$)" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} data-autofocus />
        <TextField label="Data" type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
        <SelectField label="Forma" value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })}>{PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}</SelectField>
        <TextField label="Observação" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
      </div>
    </Modal>
  );
}

export default function FinanceAdmin() {
  const toast = useToast();
  const [confirmUI, confirm] = useConfirm();
  const [period, setPeriod] = useState({ id: "month", custom: {} });
  const range = resolvePeriod(period.id, period.custom);
  const today = todayKey();
  const meta = useAsync(async () => {
    const [packages, campaigns] = await Promise.all([listAllPackages(), listCampaigns()]);
    return { packages, campaigns };
  }, []);
  const txs = useAsync(() => listTransactions(range), [range.from, range.to]);
  const [editing, setEditing] = useState(null);
  const [money, setMoney] = useState(null);
  const [filter, setFilter] = useState({ type: "", state: "", q: "" });

  const all = txs.data || [];
  const sum = useMemo(() => summarize(all, { ...range, today }), [all, range.from, range.to, today]); // eslint-disable-line react-hooks/exhaustive-deps
  const pkgName = Object.fromEntries((meta.data?.packages || []).map((p) => [p.id, p.name]));
  const campName = Object.fromEntries((meta.data?.campaigns || []).map((c) => [c.id, c.name]));
  const byPackage = useMemo(() => groupIncome(all, (t) => pkgName[t.packageId] || (t.packageId ? "Pacote removido" : "Sem pacote"), range), [all, meta.data]); // eslint-disable-line react-hooks/exhaustive-deps
  const byCampaign = useMemo(() => groupIncome(all.filter((t) => t.campaignId), (t) => campName[t.campaignId] || "Campanha removida", range), [all, meta.data]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lista: lançamentos com vencimento no período + vencidos de antes (cobrança em aberto).
  const list = all
    .filter((t) => (t.dueDate >= range.from && t.dueDate <= range.to) || (txState(t, today) === "overdue"))
    .filter((t) => (!filter.type || t.type === filter.type) && (!filter.state || txState(t, today) === filter.state))
    .filter((t) => !filter.q || `${t.description} ${t.clientName || ""}`.toLowerCase().includes(filter.q.toLowerCase()))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const chart = useMemo(() => {
    const days = eachDay(range.from, range.to);
    const monthly = days.length > 62;
    const key = (d) => (monthly ? d.slice(0, 7) : d);
    const buckets = new Map(days.map((d) => [key(d), { label: monthly ? `${d.slice(5, 7)}/${d.slice(2, 4)}` : `${d.slice(8)}/${d.slice(5, 7)}`, recebido: 0, despesas: 0 }]));
    for (const t of all) {
      for (const p of t.payments || []) {
        const b = buckets.get(key(p.date || ""));
        if (b) b[t.type === "income" ? "recebido" : "despesas"] += (p.amountCents || 0) / 100;
      }
      for (const r of t.refunds || []) {
        const b = buckets.get(key(r.date || ""));
        if (b && t.type === "income") b.recebido -= (r.amountCents || 0) / 100;
      }
    }
    return [...buckets.values()];
  }, [all, range.from, range.to]);

  function exportCSV() {
    downloadCSV(`financeiro-${range.from}-a-${range.to}.csv`, list, [
      { label: "Tipo", value: (t) => (t.type === "income" ? "Receita" : "Despesa") },
      { label: "Vencimento", value: (t) => formatDayBR(t.dueDate) },
      { label: "Descrição", value: (t) => t.description },
      { label: "Categoria", value: (t) => t.category },
      { label: "Cliente/Fornecedor", value: (t) => t.clientName || "" },
      { label: "Pacote", value: (t) => pkgName[t.packageId] || "" },
      { label: "Evento/Campanha", value: (t) => campName[t.campaignId] || "" },
      { label: "Valor", value: (t) => centsToInput(t.amountCents) },
      { label: "Pago", value: (t) => centsToInput(txPaid(t)) },
      { label: "Saldo", value: (t) => centsToInput(txBalance(t)) },
      { label: "Situação", value: (t) => TX_STATE[txState(t, today)].label },
      { label: "Formas de pagamento", value: (t) => [...new Set((t.payments || []).map((p) => p.method))].join(", ") },
    ]);
  }

  if (meta.loading && !meta.data) return <PageLoader />;
  if (meta.error) return <ErrorState error={meta.error} onRetry={meta.reload} />;

  return (
    <>
      {confirmUI}
      <AdminHeader title="Financeiro" text="Receitas, despesas e pagamentos dos serviços."
        actions={<>
          <button className="btn-outline" onClick={exportCSV} disabled={!list.length}><Download className="h-4 w-4" /> Exportar</button>
          <button className="btn-primary" onClick={() => setEditing({})}><Plus className="h-4 w-4" /> Novo lançamento</button>
        </>} />

      <p className="mb-5 flex items-start gap-2 rounded-2xl bg-paper px-4 py-3 text-sm text-ink-soft">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
        Controle manual: o site não recebe pagamentos. Um agendamento só vira receita quando você lança (em Agenda → Detalhes → Lançar receita), e só conta como recebido quando um pagamento é registrado.
      </p>

      <div className="mb-6"><PeriodPicker value={period.id} custom={period.custom} onChange={(id, custom) => setPeriod({ id, custom: custom || {} })} /></div>

      {txs.error ? <ErrorState error={txs.error} onRetry={txs.reload} /> : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Faturamento contratado" value={brlShort(sum.grossCents)} hint={`${sum.incomeCount} receita(s) com vencimento no período`} icon={Receipt} />
            <StatCard label="Recebido" value={brlShort(sum.receivedCents)} hint="Pagamentos registrados no período, menos reembolsos" icon={CircleDollarSign} tone="success" />
            <StatCard label="A receber" value={brlShort(sum.pendingCents)} hint="Saldo das receitas do período" tone="warning" />
            <StatCard label="Vencido" value={brlShort(sum.overdueCents)} hint="Saldo em aberto com vencimento já passado" tone={sum.overdueCents ? "danger" : "muted"} />
            <StatCard label="Despesas" value={brlShort(sum.expensesCents)} hint={`Pagas: ${formatBRL(sum.expensesPaidCents)}`} icon={Wallet} />
            <StatCard label="Resultado (caixa)" value={brlShort(sum.resultCents)} hint="Recebido − despesas pagas no período" tone={sum.resultCents >= 0 ? "wine" : "danger"} />
            <StatCard label="Ticket médio" value={sum.avgTicketCents != null ? brlShort(sum.avgTicketCents) : "—"} hint={sum.avgTicketCents != null ? "Contratado ÷ nº de receitas" : "Precisa de 3 ou mais receitas"} />
            <StatCard label="Despesas a pagar" value={brlShort(sum.expensesPendingCents)} tone="muted" />
          </div>

          <Section title="Entradas e saídas" text="Pelo dia em que o dinheiro entrou ou saiu.">
            {txs.loading ? <div className="py-10 text-center"><Spinner /></div> : !chart.some((c) => c.recebido || c.despesas) ? (
              <p className="py-10 text-center text-sm text-ink-muted">Nenhum pagamento registrado no período.</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chart} margin={{ left: -10, right: 8 }}>
                    <CartesianGrid vertical={false} stroke="#00000010" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`} />
                    <Tooltip formatter={(v) => formatBRL(Math.round(v * 100))} contentStyle={{ borderRadius: 12, border: "1px solid #0000001a" }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="recebido" name="Recebido" fill="#3E060A" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="despesas" name="Despesas pagas" fill="#C9AE8A" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Section>

          {(byPackage.length > 0 || byCampaign.length > 0) && (
            <div className="grid gap-6 lg:grid-cols-2">
              {[["Por pacote", byPackage], ["Por evento / campanha", byCampaign]].map(([title, rows]) => rows.length > 0 && (
                <Section key={title} title={title}>
                  <table className="table">
                    <thead><tr><th>Item</th><th className="text-right">Qtd.</th><th className="text-right">Contratado</th><th className="text-right">Recebido</th></tr></thead>
                    <tbody>{rows.map((r) => (
                      <tr key={r.key}><td>{r.key}</td><td className="text-right tabular-nums">{r.count}</td><td className="text-right tabular-nums">{formatBRL(r.contractedCents)}</td><td className="text-right tabular-nums">{formatBRL(r.receivedCents)}</td></tr>
                    ))}</tbody>
                  </table>
                </Section>
              ))}
            </div>
          )}

          <Section title="Lançamentos" text="Do período selecionado, mais cobranças vencidas em aberto.">
            <div className="mb-4 grid gap-2 sm:grid-cols-3">
              <input className="field-input !py-2" placeholder="Buscar descrição ou cliente" value={filter.q} onChange={(e) => setFilter({ ...filter, q: e.target.value })} />
              <select className="field-input !py-2" value={filter.type} onChange={(e) => setFilter({ ...filter, type: e.target.value })} aria-label="Tipo">
                <option value="">Receitas e despesas</option><option value="income">Receitas</option><option value="expense">Despesas</option>
              </select>
              <select className="field-input !py-2" value={filter.state} onChange={(e) => setFilter({ ...filter, state: e.target.value })} aria-label="Situação">
                <option value="">Todas as situações</option>
                {Object.entries(TX_STATE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            {txs.loading ? <div className="py-10 text-center"><Spinner /></div> : !list.length ? (
              <EmptyState icon={Wallet} title="Nenhum lançamento" text="Registre receitas e despesas para acompanhar o resultado." />
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Vencimento</th><th>Descrição</th><th className="text-right">Valor</th><th className="text-right">Pago</th><th>Situação</th><th /></tr></thead>
                  <tbody>
                    {list.map((t) => {
                      const st = txState(t, today);
                      return (
                        <tr key={t.id}>
                          <td className="whitespace-nowrap tabular-nums">{formatDayBR(t.dueDate)}</td>
                          <td>
                            <p className="font-medium">{t.description}</p>
                            <p className="text-xs text-ink-muted">{t.type === "income" ? "Receita" : "Despesa"} · {t.category}{t.clientName ? ` · ${t.clientName}` : ""}</p>
                          </td>
                          <td className={`text-right tabular-nums ${t.type === "expense" ? "text-danger" : ""}`}>{t.type === "expense" ? "−" : ""}{formatBRL(t.amountCents)}</td>
                          <td className="text-right tabular-nums">{formatBRL(txPaid(t))}</td>
                          <td><Badge tone={TX_STATE[st].tone}>{TX_STATE[st].label}</Badge></td>
                          <td>
                            <div className="flex justify-end gap-1">
                              {t.status !== "cancelled" && txBalance(t) > 0 && (
                                <button className="btn-outline btn-sm" onClick={() => setMoney({ tx: t, kind: "payment" })}>{t.type === "income" ? "Receber" : "Pagar"}</button>
                              )}
                              <button className="btn-ghost btn-sm" onClick={() => setEditing(t)} aria-label="Editar"><Pencil className="h-4 w-4" /></button>
                              {t.status !== "cancelled" ? (
                                <button className="btn-ghost btn-sm" title="Cancelar" aria-label="Cancelar lançamento" onClick={async () => {
                                  if (await confirm({ title: "Cancelar lançamento?", confirmLabel: "Cancelar lançamento", text: "Ele deixa de contar no faturamento. Se houve devolução de dinheiro, registre o reembolso em seguida." })) {
                                    try { await setTransactionStatus(t.id, "cancelled"); toast.success("Lançamento cancelado."); txs.reload(); } catch (e) { toast.error(e.message); }
                                  }
                                }}><Ban className="h-4 w-4" /></button>
                              ) : txPaid(t) > 0 && (
                                <button className="btn-ghost btn-sm" title="Registrar reembolso" aria-label="Registrar reembolso" onClick={() => setMoney({ tx: t, kind: "refund" })}><Undo2 className="h-4 w-4" /></button>
                              )}
                              <button className="btn-ghost btn-sm" title="Arquivar" aria-label="Arquivar" onClick={async () => {
                                if (await confirm({ title: "Arquivar lançamento?", text: "Ele some dos relatórios, mas continua guardado no banco (não é apagado)." })) {
                                  try { await archiveTransaction(t.id); toast.success("Arquivado."); txs.reload(); } catch (e) { toast.error(e.message); }
                                }
                              }}><Archive className="h-4 w-4" /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </div>
      )}

      {editing && <TxEditor initial={editing.id ? editing : null} packages={meta.data.packages} campaigns={meta.data.campaigns} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); txs.reload(); }} />}
      {money && <MoneyModal title={money.kind === "payment" ? "Registrar pagamento" : "Registrar reembolso"} tx={money.tx} kind={money.kind} onClose={() => setMoney(null)} onDone={() => { setMoney(null); txs.reload(); }} />}
    </>
  );
}
