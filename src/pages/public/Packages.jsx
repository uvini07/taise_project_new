import { useMemo, useState } from "react";
import PageHeader from "../../components/layout/PageHeader.jsx";
import Reveal from "../../components/common/Reveal.jsx";
import PackageCard from "../../components/packages/PackageCard.jsx";
import { Skeleton } from "../../components/common/PageLoader.jsx";
import { EmptyState, ErrorState } from "../../components/common/States.jsx";
import WhatsAppLink from "../../components/common/WhatsAppLink.jsx";
import { WhatsAppIcon } from "../../components/common/Icons.jsx";
import { useCategories, usePublicPackages } from "../../hooks/usePublicData.js";
import { useDocumentMeta } from "../../hooks/useDocumentMeta.js";
import { useSettings } from "../../contexts/SettingsContext.jsx";
import { waMessages } from "../../utils/whatsapp.js";
import { Package } from "lucide-react";

export default function Packages() {
  useDocumentMeta({ title: "Pacotes", description: "Pacotes de ensaios fotográficos: valores, lotes, o que está incluso e como agendar." });
  const { settings } = useSettings();
  const { data: pkgs, loading, error, reload } = usePublicPackages();
  const { data: cats } = useCategories();
  const [filter, setFilter] = useState("all");
  const catName = useMemo(() => Object.fromEntries((cats || []).map((c) => [c.id, c.name])), [cats]);
  const usedCats = useMemo(() => [...new Set((pkgs || []).map((p) => p.categoryId).filter((id) => catName[id]))], [pkgs, catName]);
  const list = (pkgs || []).filter((p) => filter === "all" || p.categoryId === filter);

  return (
    <>
      <PageHeader eyebrow="Pacotes" title="Escolha a experiência ideal para o seu ensaio"
        text="Valores, lotes e tudo o que está incluso. Ficou com alguma dúvida? É só chamar no WhatsApp." />
      <section className="container-x py-16 sm:py-20">
        {usedCats.length > 1 && (
          <div className="scrollbar-none -mx-5 mb-10 flex gap-2 overflow-x-auto px-5" role="tablist" aria-label="Filtrar por categoria">
            {[["all", "Todos"], ...usedCats.map((id) => [id, catName[id]])].map(([id, label]) => (
              <button key={id} role="tab" aria-selected={filter === id} onClick={() => setFilter(id)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm transition ${filter === id ? "border-wine-900 bg-wine-900 text-cream" : "border-ink/15 hover:border-ink/40"}`}>
                {label}
              </button>
            ))}
          </div>
        )}
        {error && <ErrorState error={error} onRetry={reload} />}
        <div className={`grid gap-6 md:grid-cols-2 ${list.length === 1 ? "mx-auto max-w-md md:grid-cols-1" : list.length === 2 ? "mx-auto max-w-4xl" : "lg:grid-cols-3"}`}>
          {loading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[520px] rounded-[28px]" />)}
          {list.map((p, i) => (
            <Reveal key={p.id} delay={i * 70}><PackageCard pkg={p} categoryName={catName[p.categoryId]} featured={p.featured} /></Reveal>
          ))}
        </div>
        {!loading && !error && !list.length && (
          <EmptyState icon={Package} title="Novos pacotes em breve"
            text="No momento não há pacotes publicados. Fale com a gente para montar um orçamento sob medida."
            action={<WhatsAppLink message={waMessages.quote(settings.brandName)} context="pacotes-vazio" className="btn-primary"><WhatsAppIcon className="h-4 w-4" /> Pedir orçamento</WhatsAppLink>} />
        )}
      </section>
    </>
  );
}
