// "Minha conta" da cliente no site da fotógrafa: dados, agendamentos (com o
// pagamento) e, pela LGPD, sair e apagar os próprios dados a qualquer momento.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, Loader2, LogOut, Trash2, UserRound } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader.jsx";
import PageLoader from "../../components/common/PageLoader.jsx";
import { useSettings } from "../../contexts/SettingsContext.jsx";
import { useDocumentMeta } from "../../hooks/useDocumentMeta.js";
import { authErrorMessage } from "../../services/authService.js";
import { deleteClientData, getClientProfile, signInClient, signOutClient, watchClient } from "../../services/clientAccount.js";
import { pagamentosApi } from "../../services/pagamentosApi.js";
import { currentStudio, sitePath } from "../../config/tenant.js";
import { formatBRL, formatDayLong } from "../../utils/format.js";
import { formatPhoneBR } from "../../utils/validation.js";

function PayState({ apptId, priceCents }) {
  const [s, setS] = useState(null);
  useEffect(() => {
    pagamentosApi({ action: "status", studio: currentStudio(), apptId }).then(setS).catch(() => setS({ status: "none" }));
  }, [apptId]);
  if (!s) return <span className="text-xs text-ink-muted">…</span>;
  if (s.status !== "paid") return <span className="rounded-full bg-ink/5 px-2.5 py-1 text-xs text-ink-muted">Pagamento pendente</span>;
  const total = s.totalCents || priceCents;
  const full = s.mode === "total" || (total && s.amountCents >= total);
  return full
    ? <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs text-success">Quitado</span>
    : <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs text-success">Sinal pago · faltam {formatBRL(Math.max(0, total - (s.amountCents || 0)))}</span>;
}

export default function ClientAccount() {
  const { settings } = useSettings();
  useDocumentMeta("Minha conta", `Seus agendamentos com ${settings.brandName}.`);
  const [user, setUser] = useState(undefined);
  const [prof, setProf] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);

  useEffect(() => watchClient(async (u) => {
    setUser(u);
    setProf(u ? await getClientProfile(u.uid).catch(() => null) : null);
  }), []);

  if (user === undefined) return <PageLoader />;

  if (!user) {
    return (
      <section className="container-x flex min-h-[60vh] items-center justify-center py-16">
        <div className="w-full max-w-sm text-center">
          <UserRound className="mx-auto h-10 w-10 text-wine-900" strokeWidth={1.4} />
          <h1 className="display-md mt-4">Minha conta</h1>
          <p className="mt-2 text-sm text-ink-muted">Entre para ver seus agendamentos e pagamentos com {settings.brandName}.</p>
          {err && <p className="mt-3 text-sm text-danger">{err}</p>}
          <button type="button" className="btn-primary mt-6 w-full justify-center" disabled={busy}
            onClick={async () => { setBusy(true); setErr(""); try { await signInClient(); } catch (e) { if (e?.code !== "auth/popup-closed-by-user") setErr(authErrorMessage(e)); } finally { setBusy(false); } }}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Entrar com Google
          </button>
        </div>
      </section>
    );
  }

  const bookings = [...(prof?.bookings || [])].sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));

  return (
    <>
      <PageHeader eyebrow={settings.brandName} title="Minha conta" text="Seus dados e agendamentos neste estúdio." />
      <section className="container-x grid gap-6 pb-20 lg:grid-cols-[1fr_1.4fr]">
        <div className="card card-pad h-fit">
          <p className="text-xs uppercase tracking-[.2em] text-ink-muted">Seus dados</p>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3"><dt className="text-ink-muted">Nome</dt><dd className="truncate font-medium">{prof?.name || user.displayName || "—"}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-ink-muted">WhatsApp</dt><dd className="font-medium">{prof?.phone ? formatPhoneBR(prof.phone) : "—"}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-ink-muted">E-mail</dt><dd className="truncate font-medium">{user.email}</dd></div>
          </dl>
          <p className="mt-4 text-xs text-ink-muted">Usamos esses dados só para os seus agendamentos e para falar com você sobre o ensaio. <Link to={sitePath("/politicas")} className="underline">Política de privacidade</Link>.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" className="btn-ghost btn-sm" onClick={() => signOutClient()}><LogOut className="h-4 w-4" /> Sair</button>
            {!confirmDel
              ? <button type="button" className="btn-ghost btn-sm text-danger" onClick={() => setConfirmDel(true)}><Trash2 className="h-4 w-4" /> Apagar meus dados</button>
              : (
                <div className="w-full rounded-xl bg-danger/5 p-3 text-sm">
                  <p>Apagar seus dados de conta deste estúdio? Os agendamentos já feitos continuam com a fotógrafa para o atendimento e obrigações legais.</p>
                  <div className="mt-2 flex gap-2">
                    <button type="button" className="btn-primary btn-sm" disabled={busy}
                      onClick={async () => { setBusy(true); try { await deleteClientData(user.uid); } catch { setErr("Não foi possível apagar agora. Tente de novo."); } finally { setBusy(false); setConfirmDel(false); } }}>Apagar</button>
                    <button type="button" className="btn-ghost btn-sm" onClick={() => setConfirmDel(false)}>Cancelar</button>
                  </div>
                </div>
              )}
          </div>
          {err && <p className="mt-3 text-sm text-danger">{err}</p>}
        </div>

        <div className="card card-pad">
          <p className="text-xs uppercase tracking-[.2em] text-ink-muted">Seus agendamentos</p>
          {bookings.length ? (
            <ul className="mt-3 divide-y divide-ink/10">
              {bookings.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center gap-3 py-3">
                  <CalendarCheck className="h-5 w-5 shrink-0 text-wine-900" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{b.packageName || "Ensaio"}</p>
                    <p className="text-sm text-ink-muted">{formatDayLong(b.date)}, {b.time} · {formatBRL(b.priceCents)}</p>
                  </div>
                  <PayState apptId={b.id} priceCents={b.priceCents} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-8 text-center text-sm text-ink-muted">
              Nenhum agendamento ainda. <Link to={sitePath("/agenda")} className="underline">Agendar um ensaio</Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
