import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Camera, Check, Clock, MapPin, Package, Sparkles } from "lucide-react";
import SmartImage from "../../components/common/SmartImage.jsx";
import Reveal from "../../components/common/Reveal.jsx";
import Badge from "../../components/common/Badge.jsx";
import PageLoader from "../../components/common/PageLoader.jsx";
import { EmptyState, ErrorState } from "../../components/common/States.jsx";
import WhatsAppLink from "../../components/common/WhatsAppLink.jsx";
import { WhatsAppIcon } from "../../components/common/Icons.jsx";
import { AvailabilityBadge, PriceTag } from "../../components/packages/PackageCard.jsx";
import { useAsync } from "../../hooks/useAsync.js";
import { useCategories } from "../../hooks/usePublicData.js";
import { useDocumentMeta } from "../../hooks/useDocumentMeta.js";
import { useSettings } from "../../contexts/SettingsContext.jsx";
import { getPublicPackage } from "../../services/packageService.js";
import { track } from "../../services/analyticsService.js";
import { formatBRL, formatDateTime, formatDayBR } from "../../utils/format.js";
import { lines, paragraphs } from "../../utils/text.js";
import { lotRemaining, lotState, packageAvailability } from "../../utils/lots.js";
import { waMessages } from "../../utils/whatsapp.js";

const LOT_LABEL = { open: ["Disponível", "success"], upcoming: ["Em breve", "gold"], soldout: ["Esgotado", "danger"], ended: ["Encerrado", "muted"], closed: ["Encerrado", "muted"] };

export default function PackageDetail() {
  const { id } = useParams();
  const { settings } = useSettings();
  const { data: pkg, loading, error, reload } = useAsync(() => getPublicPackage(id), [id]);
  const { data: cats } = useCategories();
  const catName = useMemo(() => (cats || []).find((c) => c.id === pkg?.categoryId)?.name, [cats, pkg]);
  useDocumentMeta({ title: pkg?.name, description: pkg?.description, image: pkg?.coverUrl });
  useEffect(() => { if (pkg) track.packageView(pkg.id); }, [pkg]);

  if (loading) return <PageLoader />;
  if (error) return <div className="container-x py-20"><ErrorState error={error} onRetry={reload} /></div>;
  if (!pkg) {
    return (
      <div className="container-x py-20">
        <EmptyState icon={Package} title="Pacote não encontrado" text="Ele pode ter sido encerrado ou ainda não foi publicado."
          action={<Link to="/pacotes" className="btn-primary">Ver pacotes disponíveis</Link>} />
      </div>
    );
  }

  const av = packageAvailability(pkg, pkg.lots);
  const canBook = av.state === "available" && pkg.ctaMode !== "whatsapp" && settings.display.showAgenda;
  const info = [
    pkg.durationMin && [Clock, "Duração", `${pkg.durationMin} minutos`],
    pkg.photosDelivered && [Camera, "Fotos entregues", pkg.photosDelivered],
    (pkg.sessionStart || pkg.sessionEnd) && [CalendarDays, "Período dos ensaios",
      pkg.sessionStart && pkg.sessionEnd ? `${formatDayBR(pkg.sessionStart)} a ${formatDayBR(pkg.sessionEnd)}` : formatDayBR(pkg.sessionStart || pkg.sessionEnd)],
    pkg.location && [MapPin, "Local", pkg.location],
    pkg.deliveryInfo && [Sparkles, "Entrega e edição", pkg.deliveryInfo],
  ].filter(Boolean);

  return (
    <article>
      <div className="container-x pt-8">
        <Link to="/pacotes" className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Todos os pacotes</Link>
      </div>
      <section className="container-x grid gap-12 py-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          {pkg.coverUrl
            ? <SmartImage src={pkg.coverUrl} thumb={pkg.coverThumbUrl} placeholder={pkg.coverPlaceholder} alt={pkg.coverAlt || pkg.name} priority sizes="(min-width:1024px) 58vw, 100vw" className="arch-soft aspect-[4/5] shadow-lift sm:aspect-[5/4] lg:aspect-[4/5]" />
            : <div className="arch-soft flex aspect-[4/3] items-center justify-center bg-paper text-gold"><Camera className="h-14 w-14" strokeWidth={1} /></div>}
        </div>

        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <div className="flex flex-wrap items-center gap-2">
              {catName && <span className="eyebrow">{catName}</span>}
              <AvailabilityBadge av={av} />
            </div>
            <h1 className="display-lg mt-3">{pkg.name}</h1>
            <div className="mt-5"><PriceTag pkg={pkg} av={av} size="lg" /></div>
            {av.state === "upcoming" && av.opensAt && <p className="mt-2 text-sm text-ink-muted">Vendas a partir de {formatDateTime(av.opensAt)}.</p>}
            {av.nextLot && <p className="mt-2 text-sm text-ink-muted">Próximo lote: {formatBRL(av.nextLot.priceCents)}.</p>}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              {canBook && (
                <Link to={`/agenda?pacote=${pkg.id}`} className="btn-primary flex-1 py-3.5" onClick={() => track.cta(`agendar-${pkg.id}`)}>
                  {pkg.ctaLabel || "Escolher data e horário"}
                </Link>
              )}
              <WhatsAppLink message={waMessages.package(pkg, av.lot)} context={`pacote-${pkg.id}`}
                className={`${canBook ? "btn-outline" : "btn-primary"} flex-1 py-3.5`}>
                <WhatsAppIcon className="h-4 w-4" /> {canBook ? "Tirar dúvidas" : pkg.ctaLabel || "Contratar pelo WhatsApp"}
              </WhatsAppLink>
            </div>
            {av.state === "soldout" && <p className="mt-3 text-sm text-ink-muted">As vagas deste pacote se esgotaram. Chame no WhatsApp para entrar na lista de espera.</p>}

            {info.length > 0 && (
              <dl className="mt-10 divide-y divide-ink/5 border-y border-ink/5">
                {info.map(([Icon, label, value]) => (
                  <div key={label} className="flex gap-4 py-4">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-gold" strokeWidth={1.5} aria-hidden />
                    <div><dt className="text-xs uppercase tracking-wider text-ink-muted">{label}</dt><dd className="mt-0.5 whitespace-pre-line text-ink">{value}</dd></div>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      </section>

      <section className="container-x grid gap-12 pb-10 lg:grid-cols-12 lg:gap-16">
        <div className="space-y-12 lg:col-span-7">
          {pkg.description && (
            <Reveal className="space-y-4 text-lg leading-relaxed text-ink-soft">
              {paragraphs(pkg.description).map((p) => <p key={p}>{p}</p>)}
            </Reveal>
          )}
          {pkg.highlights?.length > 0 && (
            <Reveal>
              <h2 className="display-md">O que está incluso</h2>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {pkg.highlights.map((h) => (
                  <li key={h} className="flex gap-3 rounded-2xl bg-paper px-4 py-3 text-ink-soft">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-wine-700" aria-hidden /> {h}
                  </li>
                ))}
              </ul>
            </Reveal>
          )}
          {pkg.lots?.length > 0 && (
            <Reveal>
              <h2 className="display-md">Lotes e valores</h2>
              <ul className="mt-6 space-y-3">
                {pkg.lots.map((l) => {
                  const st = lotState(l);
                  const [label, tone] = LOT_LABEL[st];
                  const rem = lotRemaining(l);
                  return (
                    <li key={l.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-5 py-4 ${st === "open" ? "border-gold/40 bg-white" : "border-ink/5 bg-paper/60"}`}>
                      <div>
                        <p className="font-medium">{l.name}</p>
                        <p className="text-xs text-ink-muted">
                          {l.salesStart || l.salesEnd ? `${l.salesStart ? `de ${formatDateTime(l.salesStart).slice(0, 10)} ` : ""}${l.salesEnd ? `até ${formatDateTime(l.salesEnd).slice(0, 10)}` : ""}` : "Enquanto houver vagas"}
                          {pkg.showRemaining && rem != null && st === "open" ? ` · ${rem} ${rem === 1 ? "vaga" : "vagas"}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-display text-2xl ${st === "open" ? "text-wine-900" : "text-ink-muted"}`}>{formatBRL(l.priceCents)}</span>
                        <Badge tone={tone}>{label}</Badge>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Reveal>
          )}
          {pkg.rules && (
            <Reveal>
              <h2 className="display-md">Regras e condições</h2>
              <ul className="mt-6 space-y-2 text-ink-soft">
                {lines(pkg.rules).map((r) => <li key={r} className="flex gap-3"><span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-gold" aria-hidden />{r}</li>)}
              </ul>
            </Reveal>
          )}
        </div>
      </section>
    </article>
  );
}
