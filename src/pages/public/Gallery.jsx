import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Images } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader.jsx";
import MasonryGrid from "../../components/gallery/MasonryGrid.jsx";
import Lightbox from "../../components/gallery/Lightbox.jsx";
import { Skeleton } from "../../components/common/PageLoader.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import { EmptyState, ErrorState } from "../../components/common/States.jsx";
import WhatsAppLink from "../../components/common/WhatsAppLink.jsx";
import { WhatsAppIcon } from "../../components/common/Icons.jsx";
import { useCategories } from "../../hooks/usePublicData.js";
import { useSettings } from "../../contexts/SettingsContext.jsx";
import { useDocumentMeta } from "../../hooks/useDocumentMeta.js";
import { listPublishedPhotos } from "../../services/galleryService.js";
import { track } from "../../services/analyticsService.js";
import { waMessages } from "../../utils/whatsapp.js";

const PAGE = 24;

export default function Gallery() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { data: cats, loading: catsLoading } = useCategories();
  const category = useMemo(() => (cats || []).find((c) => c.slug === slug) || null, [cats, slug]);
  const [state, setState] = useState({ items: [], cursor: null, loading: true, more: false, error: null });
  const [open, setOpen] = useState(null);
  const sentinel = useRef(null);
  const reqId = useRef(0);

  useDocumentMeta({
    title: category ? `Galeria — ${category.name}` : "Galeria",
    description: category?.description || "Fotografias de ensaios de família, infantis, gestantes, aniversários e eventos.",
    image: category?.coverUrl,
  });

  const load = useCallback(async (reset) => {
    const id = ++reqId.current;
    setState((s) => ({ ...s, loading: reset, more: !reset, error: null, ...(reset ? { items: [], cursor: null } : {}) }));
    try {
      const res = await listPublishedPhotos({ categoryId: category?.id || null, pageSize: PAGE, cursor: reset ? null : state.cursor });
      if (id !== reqId.current) return;
      setState((s) => ({ items: reset ? res.items : [...s.items, ...res.items], cursor: res.cursor, loading: false, more: false, error: null }));
    } catch (error) {
      if (id === reqId.current) setState((s) => ({ ...s, loading: false, more: false, error }));
    }
  }, [category, state.cursor]);

  useEffect(() => {
    if (catsLoading) return;
    if (slug && !category) { setState({ items: [], cursor: null, loading: false, more: false, error: null }); return; }
    if (category) track.galleryCategory(category.id);
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, catsLoading, slug]);

  // Carrega mais fotos ao chegar perto do fim da página.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !state.cursor || !("IntersectionObserver" in window)) return undefined;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting && !state.more) load(false); }, { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  }, [state.cursor, state.more, load]);

  const tabs = [{ id: null, name: "Todas", slug: "" }, ...(cats || [])];
  const notFound = !catsLoading && slug && !category;

  return (
    <>
      <PageHeader eyebrow="Galeria" title={category ? category.name : "Histórias que já contamos"}
        text={category?.description || "Uma seleção de ensaios e eventos. Toque em uma foto para ampliar."} />
      <section className="container-x py-12 sm:py-16">
        <nav aria-label="Categorias da galeria" className="scrollbar-none -mx-5 mb-10 flex gap-2 overflow-x-auto px-5">
          {tabs.map((c) => {
            const active = (c.id || null) === (category?.id || null) && !notFound;
            return (
              <Link key={c.id || "all"} to={c.slug ? `/galeria/${c.slug}` : "/galeria"} aria-current={active ? "page" : undefined}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm transition ${active ? "border-wine-900 bg-wine-900 text-cream" : "border-ink/15 hover:border-ink/40"}`}>
                {c.name}
              </Link>
            );
          })}
        </nav>

        {state.error && <ErrorState error={state.error} onRetry={() => load(true)} />}
        {state.loading && (
          <div className="columns-2 gap-4 md:columns-3 lg:columns-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className={`mb-4 ${i % 3 ? "aspect-[4/5]" : "aspect-[3/4]"}`} />)}
          </div>
        )}
        {!state.loading && !state.error && state.items.length > 0 && <MasonryGrid photos={state.items} onOpen={setOpen} />}
        {!state.loading && !state.error && !state.items.length && (
          <EmptyState icon={Images}
            title={notFound ? "Categoria não encontrada" : "Fotos chegando em breve"}
            text={notFound ? "Ela pode ter sido renomeada ou removida." : "Esta galeria ainda está sendo montada. Enquanto isso, chame no WhatsApp para ver mais trabalhos."}
            action={notFound
              ? <button className="btn-primary" onClick={() => navigate("/galeria")}>Ver todas as fotos</button>
              : <WhatsAppLink message={category ? waMessages.category(category.name) : waMessages.general(settings.brandName)} context="galeria-vazia" className="btn-primary"><WhatsAppIcon className="h-4 w-4" /> Falar no WhatsApp</WhatsAppLink>} />
        )}
        <div ref={sentinel} className="h-px" aria-hidden />
        {state.more && <div className="flex justify-center py-8"><Spinner /></div>}
        {state.cursor && !state.more && (
          <div className="mt-8 text-center"><button className="btn-outline" onClick={() => load(false)}>Carregar mais fotos</button></div>
        )}

        {category && state.items.length > 0 && (
          <div className="mt-16 flex flex-col items-center gap-4 rounded-[28px] bg-paper px-6 py-10 text-center">
            <p className="font-display text-3xl">Gostou deste estilo?</p>
            <WhatsAppLink message={waMessages.category(category.name)} context={`galeria-${category.slug}`} className="btn-primary">
              <WhatsAppIcon className="h-4 w-4" /> Quero um ensaio assim
            </WhatsAppLink>
          </div>
        )}
      </section>
      <Lightbox photos={state.items} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
    </>
  );
}
