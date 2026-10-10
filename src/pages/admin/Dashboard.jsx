import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import {
  ArrowRight, CalendarCheck, CalendarDays, CheckCircle2, Circle, Crown, Images, Inbox, Package, Settings, Ticket, Wallet,
} from "lucide-react";
import { getDocs, collection, limit, orderBy, query, where } from "firebase/firestore";
import { AdminHeader, PeriodPicker, Section, StatCard } from "../../components/admin/AdminUI.jsx";
import Badge from "../../components/common/Badge.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import { ErrorState } from "../../components/common/States.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useSettings } from "../../contexts/SettingsContext.jsx";
import { useAsync } from "../../hooks/useAsync.js";
import { db } from "../../services/firebase.js";
import { listAllPackages } from "../../services/admin/packagesAdmin.js";
import { listAllCategories } from "../../services/admin/galleryAdmin.js";
import { listOpenRequests } from "../../services/admin/agendaAdmin.js";
import { listTransactions } from "../../services/admin/financeAdmin.js";
import { APPOINTMENT_STATUS, VIP_STATUS } from "../../config/constants.js";
import { addDays, formatBRL, formatDateTime, formatDayLong, todayKey, toDate, toDayKey } from "../../utils/format.js";
import { MAX_PUBLISHED_PACKAGES, isPublicStatus, lotRemaining, packageAvailability } from "../../utils/lots.js";
import { summarize, txBalance } from "../../utils/finance.js";
import { resolvePeriod } from "../../utils/period.js";
import { getDoc, doc } from "firebase/firestore";

const withId = (d) => ({ id: d.id, ...d.data() });

async function loadDashboard(range) {
  const today = todayKey();
  const [packages, categories, pending, upcomingSnap, vipSnap, txs, availability] = await Promise.all([
    listAllPackages(),
    listAllCategories(),
    listOpenRequests(),
    getDocs(query(collection(db, "appointments"), where("date", ">=", today), where("date", "<=", addDays(today, 30)), orderBy("date", "asc"))),
    getDocs(query(collection(db, "vipRegistrations"), orderBy("createdAt", "desc"), limit(50))),
    listTransactions(range),
    getDoc(doc(db, "availability", "config")),
  ]);
  return {
    packages, categories, pending,
    upcoming: upcomingSnap.docs.map(withId).filter((a) => ["confirmed", "awaiting", "requested"].includes(a.status)).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)),
    vip: vipSnap.docs.map(withId),
    txs,
    hasAvailability: availability.exists(),
  };
}

export default function Dashboard() {
  const { admin, user } = useAuth();
  const { settings } = useSettings();
  const [period, setPeriod] = useState({ id: "month", custom: {} });
  const range = resolvePeriod(period.id, period.custom);
  const { data, loading, error, reload } = useAsync(() => loadDashboard(range), [range.from, range.to]);
  const today = todayKey();

  const view = useMemo(() => {
    if (!data) return null;
    const published = data.packages.filter((p) => isPublicStatus(p.status));
    let seats = 0, unlimited = false;
    published.forEach((p) => {
      const av = packageAvailability(p, p.lots);
      p.lots.filter((l) => !l.archived && l.status === "active").forEach((l) => {
        const r = lotRemaining(l);
        if (r == null) unlimited = true; else seats += r;
      });
      return av;
    });
    const fin = summarize(data.txs, { ...range, today });
    const vipInPeriod = data.vip.filter((r) => { const d = toDayKey(toDate(r.createdAt) || new Date()); return d >= range.from && d <= range.to; });
    const openIncome = data.txs.filter((t) => t.type === "income" && t.status !== "cancelled" && txBalance(t) > 0);
    const recentExpenses = data.txs.filter((t) => t.type === "expense").sort((a, b) => b.dueDate.localeCompare(a.dueDate)).slice(0, 5);
    return { published, seats, unlimited, fin, vipInPeriod, openIncome, recentExpenses, next7: data.upcoming.filter((a) => a.date <= addDays(today, 7)) };
  }, [data, range.from, range.to, today]); // eslint-disable-line react-hooks/exhaustive-deps

  const steps = data ? [
    [!settings.isDefault, "Revise textos, contato e fotos de destaque", "/adm/configuracoes"],
    [data.categories.length > 0, "Crie as categorias da galeria", "/adm/galeria"],
    [data.categories.length > 0 && data.categories.some((c) => c.visible), "Publique fotos e deixe uma categoria visível", "/adm/galeria"],
    [data.hasAvailability, "Configure dias e horários de atendimento", "/adm/agenda"],
    [data.packages.some((p) => isPublicStatus(p.status)), "Publique o primeiro pacote", "/adm/pacotes"],
  ] : [];
  const pendingSteps = steps.filter(([ok]) => !ok).length;
  const first = (admin?.name || user?.email || "").split(/[ @]/)[0];

  return (
    <>
      <AdminHeader title={`Olá${first ? `, ${first}` : ""}`} text={formatDayLong(today)}
        actions={<PeriodPicker value={period.id} custom={period.custom} onChange={(id, custom) => setPeriod({ id, custom: custom || {} })} />} />

      {error ? <ErrorState error={error} onRetry={reload} /> : !view ? <div className="py-20 text-center"><Spinner /></div> : (
        <div className="space-y-6">
          {pendingSteps > 0 && (
            <Section title="Primeiros passos" text={`${steps.length - pendingSteps} de ${steps.length} concluídos.`}>
              <ul className="grid gap-2 sm:grid-cols-2">
                {steps.map(([ok, label, to]) => (
                  <li key={label}>
                    <Link to={to} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-ink/5">
                      {ok ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5 text-ink-muted" />}
                      <span className={ok ? "text-ink-muted line-through" : ""}>{label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Link to="/adm/agenda"><StatCard label="Aguardando confirmação" value={data.pending.length} icon={Inbox} tone={data.pending.length ? "warning" : "muted"} hint="Pedidos do site" /></Link>
            <Link to="/adm/agenda"><StatCard label="Próximos 7 dias" value={view.next7.length} icon={CalendarDays} hint="Agendamentos ativos" /></Link>
            <Link to="/adm/pacotes"><StatCard label="Pacotes publicados" value={`${view.published.length}/${MAX_PUBLISHED_PACKAGES}`} icon={Package} tone={view.published.length >= MAX_PUBLISHED_PACKAGES ? "warning" : "default"} /></Link>
            <StatCard label="Vagas disponíveis" value={view.unlimited ? `${view.seats}+` : view.seats} icon={Ticket} hint={view.unlimited ? "Há lotes sem limite de vagas" : "Somando lotes ativos publicados"} />
            <Link to="/adm/vip"><StatCard label="Inscritos VIP" value={view.vipInPeriod.length} icon={Crown} hint="No período" /></Link>
            <Link to="/adm/financeiro"><StatCard label="Recebido" value={formatBRL(view.fin.receivedCents)} icon={Wallet} tone="success" hint="No período" /></Link>
            <Link to="/adm/financeiro"><StatCard label="A receber" value={formatBRL(view.fin.pendingCents + view.fin.overdueCents)} tone={view.fin.overdueCents ? "danger" : "warning"} hint={view.fin.overdueCents ? `${formatBRL(view.fin.overdueCents)} vencido` : "Período + vencidos"} /></Link>
            <Link to="/adm/financeiro"><StatCard label="Despesas" value={formatBRL(view.fin.expensesCents)} hint="No período" /></Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Section title="Próximos agendamentos" actions={<Link to="/adm/agenda" className="btn-ghost btn-sm">Agenda <ArrowRight className="h-4 w-4" /></Link>}>
              {!data.upcoming.length ? <p className="text-sm text-ink-muted">Nenhum agendamento nos próximos 30 dias.</p> : (
                <ul className="divide-y divide-ink/5">
                  {data.upcoming.slice(0, 8).map((a) => (
                    <li key={a.id} className="flex items-center gap-3 py-2.5 text-sm">
                      <div className="w-20 shrink-0 tabular-nums"><p className="font-medium">{a.date.slice(8)}/{a.date.slice(5, 7)}</p><p className="text-xs text-ink-muted">{a.time}</p></div>
                      <div className="min-w-0 flex-1"><p className="truncate">{a.name}</p><p className="truncate text-xs text-ink-muted">{a.packageName}</p></div>
                      <Badge tone={APPOINTMENT_STATUS[a.status].tone}>{APPOINTMENT_STATUS[a.status].label}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title="Inscritos VIP recentes" actions={<Link to="/adm/vip" className="btn-ghost btn-sm">VIP <ArrowRight className="h-4 w-4" /></Link>}>
              {!data.vip.length ? <p className="text-sm text-ink-muted">Nenhuma inscrição ainda.</p> : (
                <ul className="divide-y divide-ink/5">
                  {data.vip.slice(0, 6).map((r) => (
                    <li key={r.id} className="flex items-center gap-3 py-2.5 text-sm">
                      <div className="min-w-0 flex-1"><p className="truncate">{r.name}</p><p className="truncate text-xs text-ink-muted">{r.campaignName} · {formatDateTime(r.createdAt)}</p></div>
                      <Badge tone={VIP_STATUS[r.status]?.tone}>{VIP_STATUS[r.status]?.label}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title="Pagamentos pendentes" actions={<Link to="/adm/financeiro" className="btn-ghost btn-sm">Financeiro <ArrowRight className="h-4 w-4" /></Link>}>
              {!view.openIncome.length ? <p className="text-sm text-ink-muted">Nada pendente.</p> : (
                <ul className="divide-y divide-ink/5">
                  {view.openIncome.sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 6).map((t) => (
                    <li key={t.id} className="flex items-center gap-3 py-2.5 text-sm">
                      <div className="min-w-0 flex-1"><p className="truncate">{t.description}</p><p className={`text-xs ${t.dueDate < today ? "text-danger" : "text-ink-muted"}`}>vence {t.dueDate.split("-").reverse().join("/")}</p></div>
                      <span className="tabular-nums">{formatBRL(txBalance(t))}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title="Despesas recentes">
              {!view.recentExpenses.length ? <p className="text-sm text-ink-muted">Nenhuma despesa no período.</p> : (
                <ul className="divide-y divide-ink/5">
                  {view.recentExpenses.map((t) => (
                    <li key={t.id} className="flex items-center gap-3 py-2.5 text-sm">
                      <div className="min-w-0 flex-1"><p className="truncate">{t.description}</p><p className="text-xs text-ink-muted">{t.category} · {t.dueDate.split("-").reverse().join("/")}</p></div>
                      <span className="tabular-nums text-danger">−{formatBRL(t.amountCents)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>

          <Section title="Atalhos">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[[Images, "Enviar fotos", "/adm/galeria"], [Package, "Editar pacotes", "/adm/pacotes"], [CalendarCheck, "Administrar agenda", "/adm/agenda"], [Settings, "Configurações", "/adm/configuracoes"]].map(([Icon, label, to]) => (
                <Link key={to} to={to} className="flex flex-col items-center gap-2 rounded-2xl border border-ink/10 px-3 py-5 text-center text-sm transition hover:border-wine-900 hover:bg-wine-50">
                  <Icon className="h-6 w-6 text-gold" strokeWidth={1.5} /> {label}
                </Link>
              ))}
            </div>
          </Section>
        </div>
      )}
    </>
  );
}
