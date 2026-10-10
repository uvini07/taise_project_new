import { Link } from "react-router-dom";
import { ArrowUpRight, Camera, Clock } from "lucide-react";
import SmartImage from "../common/SmartImage.jsx";
import Badge from "../common/Badge.jsx";
import { formatBRL } from "../../utils/format.js";
import { lotRemaining, packageAvailability } from "../../utils/lots.js";

export function AvailabilityBadge({ av }) {
  if (av.state === "soldout") return <Badge tone="danger">Esgotado</Badge>;
  if (av.state === "upcoming") return <Badge tone="gold">Em breve</Badge>;
  if (av.state === "closed") return <Badge tone="muted">Encerrado</Badge>;
  return null;
}

export function PriceTag({ pkg, av, size = "md" }) {
  const promo = !av.lot && pkg.promoPriceCents != null && pkg.priceCents != null && pkg.promoPriceCents < pkg.priceCents;
  const price = av.priceCents;
  if (price == null) return <span className="text-sm text-ink-muted">Valor sob consulta</span>;
  return (
    <div className="flex flex-wrap items-baseline gap-x-2">
      {promo && <span className="text-sm text-ink-muted line-through">{formatBRL(pkg.priceCents)}</span>}
      <span className={`font-display text-wine-900 ${size === "lg" ? "text-4xl" : "text-3xl"}`}>{formatBRL(price)}</span>
      {av.lot && <span className="text-xs uppercase tracking-wider text-gold-dark">{av.lot.name}</span>}
    </div>
  );
}

export default function PackageCard({ pkg, categoryName, featured = false }) {
  const av = packageAvailability(pkg, pkg.lots);
  const remaining = av.lot ? lotRemaining(av.lot) : null;
  const href = `/pacotes/${pkg.slug || pkg.id}`;
  return (
    <article className={`group relative flex h-full flex-col overflow-hidden rounded-[28px] border bg-surface transition-all duration-500 ease-soft hover:-translate-y-1 hover:shadow-lift ${
      featured ? "border-gold/40 shadow-soft" : "border-ink/[.06]"}`}>
      <Link to={href} className="block overflow-hidden" tabIndex={-1} aria-hidden>
        {pkg.coverUrl ? (
          <SmartImage src={pkg.coverUrl} thumb={pkg.coverThumbUrl} placeholder={pkg.coverPlaceholder} alt=""
            sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
            className="aspect-[4/3]" imgClassName="transition-transform duration-[1.2s] ease-soft group-hover:scale-[1.04]" />
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center bg-paper text-gold"><Camera className="h-10 w-10" strokeWidth={1} /></div>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          {categoryName && <span className="eyebrow">{categoryName}</span>}
          {featured && <Badge tone="gold">Mais escolhido</Badge>}
          <AvailabilityBadge av={av} />
        </div>
        <h3 className="mt-3 font-display text-[1.9rem] leading-tight">
          <Link to={href} className="after:absolute after:inset-0">{pkg.name}</Link>
        </h3>
        {pkg.description && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-muted">{pkg.description}</p>}
        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
          {pkg.durationMin ? <li className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-gold" aria-hidden />{pkg.durationMin} min</li> : null}
          {pkg.photosDelivered ? <li className="flex items-center gap-1.5"><Camera className="h-3.5 w-3.5 text-gold" aria-hidden />{pkg.photosDelivered}</li> : null}
        </ul>
        <div className="mt-auto flex items-end justify-between gap-4 pt-6">
          <div>
            <PriceTag pkg={pkg} av={av} />
            {pkg.showRemaining && remaining != null && av.state === "available" && (
              <p className="mt-1 text-xs text-ink-muted">{remaining === 1 ? "1 vaga neste lote" : `${remaining} vagas neste lote`}</p>
            )}
          </div>
          <span className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ink/10 text-ink transition group-hover:border-wine-900 group-hover:bg-wine-900 group-hover:text-cream" aria-hidden>
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </article>
  );
}
