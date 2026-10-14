import { useMemo, useState } from "react";
import { BarChart3, CalendarCheck, Crown, ExternalLink, Eye, Info, MousePointerClick, Users } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AdminHeader, PeriodPicker, Section, StatCard } from "../../components/admin/AdminUI.jsx";
import { WhatsAppIcon } from "../../components/common/Icons.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import { EmptyState, ErrorState } from "../../components/common/States.jsx";
import { useAsync } from "../../hooks/useAsync.js";
import { aggregateCounters, countRecords, loadDailyCounters } from "../../services/admin/analyticsAdmin.js";
import { listAllPackages } from "../../services/admin/packagesAdmin.js";
import { listAllCategories } from "../../services/admin/galleryAdmin.js";
import { listCampaigns } from "../../services/admin/vipAdmin.js";
import { eachDay, resolvePeriod } from "../../utils/period.js";
import { firebaseConfig } from "../../config/firebaseConfig.js";

const PAGE_NAMES = { inicio: "Início", sobre: "Sobre", pacotes: "Pacotes", galeria: "Galeria", agenda: "Agenda", vip: "VIP", contato: "Contato", politicas: "Políticas" };
const SRC_NAMES = { direto: "Acesso direto", interno: "Navegação interna", instagram: "Instagram", facebook: "Facebook", google: "Google", whatsapp: "WhatsApp", tiktok: "TikTok", outro: "Outros" };
const n = (v) => new Intl.NumberFormat("pt-BR").format(v || 0);
const pct = (a, b) => (b ? `${((a / b) * 100).toFixed(1).replace(".", ",")}%` : "—");

function RankTable({ title, rows, empty = "Sem dados no período." }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <Section title={title}>
      {!rows.length ? <p className="text-sm text-ink-muted">{empty}</p> : (
        <ul className="space-y-2.5">
          {rows.slice(0, 8).map((r) => (
            <li key={r.key} className="text-sm">
              <div className="flex justify-between gap-3"><span className="truncate">{r.label}</span><span className="tabular-nums text-ink-muted">{n(r.value)}</span></div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink/5"><div className="h-full rounded-full bg-wine-900/80" style={{ width: `${(r.value / max) * 100}%` }} /></div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

export default function AnalyticsAdmin() {
  const [period, setPeriod] = useState({ id: "30d", custom: {} });
  const range = resolvePeriod(period.id, period.custom);
  const names = useAsync(async () => {
    const [p, c, v] = await Promise.all([listAllPackages(), listAllCategories(), listCampaigns()]);
    const m = (arr) => Object.fromEntries(arr.map((x) => [x.id, x.name]));
    return { pkg: m(p), cat: m(c), camp: m(v) };
  }, []);
  const data = useAsync(async () => {
    const [daily, records] = await Promise.all([loadDailyCounters(range.from, range.to), countRecords(range.from, range.to)]);
    return { daily, records };
  }, [range.from, range.to]);

  const agg = useMemo(() => aggregateCounters(data.data?.daily || {}), [data.data]);
  const chart = useMemo(() => eachDay(range.from, range.to).map((d) => ({
    label: `${d.slice(8)}/${d.slice(5, 7)}`, visitas: data.data?.daily[d]?.visit || 0, paginas: Object.entries(data.data?.daily[d] || {}).reduce((a, [k, v]) => a + (k === "pv" || k.startsWith("page__") ? Number(v) || 0 : 0), 0),
  })), [data.data, range.from, range.to]);

  const t = agg.totals;
  const rec = data.data?.records || { appointments: 0, vipRegistrations: 0 };
  const hasData = (t.pv || 0) > 0;
  const rank = (group, nameMap, fallback) => Object.entries(agg.groups[group]).map(([k, v]) => ({ key: k, value: v, label: nameMap?.[k] || fallback?.[k] || k })).sort((a, b) => b.value - a.value);

  return (
    <>
      <AdminHeader title="Analytics" text="Como os visitantes usam o site. Métricas anônimas, sem dados pessoais." />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <PeriodPicker value={period.id} custom={period.custom} onChange={(id, custom) => setPeriod({ id, custom: custom || {} })} />
        <a className="btn-ghost btn-sm" href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/analytics`} target="_blank" rel="noopener noreferrer">
          Google Analytics <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      {data.error ? <ErrorState error={data.error} onRetry={data.reload} /> : data.loading && !data.data ? <div className="py-20 text-center"><Spinner /></div> : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Visitas" value={hasData ? n(t.visit) : "—"} hint="Sessões (uma por aba aberta)" icon={Users} />
            <StatCard label="Visitantes únicos" value={hasData ? n(t.uv) : "—"} hint="Aparelhos distintos por dia, somados" icon={Users} />
            <StatCard label="Páginas vistas" value={hasData ? n(t.pv) : "—"} icon={Eye} />
            <StatCard label="Cliques no WhatsApp" value={hasData ? n(t.wa) : "—"} icon={WhatsAppIcon} />
            <StatCard label="Cliques em botões" value={hasData ? n(t.cta) : "—"} hint="Conhecer pacotes, agendar, VIP…" icon={MousePointerClick} />
            <StatCard label="Pedidos de agendamento" value={n(rec.appointments)} hint="Registros reais no banco" icon={CalendarCheck} tone="wine" />
            <StatCard label="Cadastros VIP" value={n(rec.vipRegistrations)} hint="Registros reais no banco" icon={Crown} tone="wine" />
            <StatCard label="Conversão" value={hasData ? pct(rec.appointments, t.visit) : "—"} hint="Pedidos de agendamento ÷ visitas" icon={BarChart3} />
          </div>

          {!hasData ? (
            <EmptyState icon={BarChart3} title="Ainda não há dados de navegação neste período"
              text="A contagem começa sozinha quando o site recebe visitas — depois que as regras do Firestore estiverem publicadas. Visitas ao painel não são contadas." />
          ) : (
            <>
              <Section title="Evolução">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chart} margin={{ left: -20, right: 8 }}>
                      <defs>
                        <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3E060A" stopOpacity={0.25} /><stop offset="100%" stopColor="#3E060A" stopOpacity={0} /></linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="#00000010" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #0000001a" }} />
                      <Area type="monotone" dataKey="paginas" name="Páginas vistas" stroke="#C9AE8A" fill="transparent" strokeWidth={2} />
                      <Area type="monotone" dataKey="visitas" name="Visitas" stroke="#3E060A" fill="url(#gv)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Section>
              <div className="grid gap-6 lg:grid-cols-2">
                <RankTable title="Páginas mais vistas" rows={rank("page", null, PAGE_NAMES)} />
                <RankTable title="Origem do tráfego" rows={rank("src", null, SRC_NAMES)} />
                <RankTable title="Pacotes mais vistos" rows={rank("pkg", names.data?.pkg)} />
                <RankTable title="Categorias da galeria" rows={rank("gcat", names.data?.cat)} />
                <RankTable title="Cadastros por campanha" rows={rank("camp", names.data?.camp)} empty="Nenhum cadastro VIP rastreado no período." />
              </div>
            </>
          )}

          <p className="flex items-start gap-2 text-xs text-ink-muted">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Visitas, páginas e cliques são contadores anônimos do próprio site (bloqueadores e robôs podem reduzir ou inflar um pouco os números).
            Pedidos de agendamento e cadastros VIP vêm direto do banco de dados. Faturamento e pagamentos ficam no Financeiro — não são métricas de navegação.
          </p>
        </div>
      )}
    </>
  );
}
