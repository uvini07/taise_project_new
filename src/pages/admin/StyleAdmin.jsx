import { useEffect, useState } from "react";
import { Check, ExternalLink, PlayCircle, Save } from "lucide-react";
import { AdminHeader, Section } from "../../components/admin/AdminUI.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import { useSettings } from "../../contexts/SettingsContext.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";
import { saveSettings } from "../../services/admin/settingsAdmin.js";
import { FALLBACK_IMAGES } from "../../config/defaults.js";
import { sitePath } from "../../config/tenant.js";
import {
  BODY_FONTS, DISPLAY_FONTS, LAYOUTS, applyFonts, loadAllFontsForPreview,
} from "../../config/siteStyle.js";
import { applyTheme, isHex } from "../../utils/theme.js";
import { ThemeEditor } from "./SettingsAdmin.jsx";

// ---------------------------------------------------------------- miniaturas
// Desenho simplificado de cada modelo, já com as cores e a foto do estúdio.
const Bar = ({ w, light, h = "h-1.5" }) => <span className={`block rounded-full ${h} ${light ? "bg-cream/80" : "bg-ink/70"}`} style={{ width: w }} />;
const Btns = ({ light, center }) => (
  <span className={`mt-2 flex gap-1 ${center ? "justify-center" : ""}`}>
    <span className={`h-2 w-7 rounded-full ${light ? "bg-gold" : "bg-wine-900"}`} />
    <span className={`h-2 w-6 rounded-full border ${light ? "border-cream/60" : "border-ink/40"}`} />
  </span>
);
const TextBlock = ({ light, center }) => (
  <span className={`flex flex-col gap-1 ${center ? "items-center" : ""}`}>
    <Bar w="28%" light={light} h="h-1" />
    <Bar w="78%" light={light} h="h-2.5" />
    <Bar w="62%" light={light} h="h-2.5" />
    <Bar w="50%" light={light} h="h-1" />
    <Btns light={light} center={center} />
  </span>
);
const MiniNav = ({ light }) => (
  <span className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-3 py-2">
    <span className={`h-2 w-10 rounded-full ${light ? "bg-cream/80" : "bg-wine-900/80"}`} />
    <span className="flex gap-1">{[0, 1, 2, 3].map((i) => <span key={i} className={`h-1 w-4 rounded-full ${light ? "bg-cream/60" : "bg-ink/30"}`} />)}</span>
  </span>
);

function MiniHero({ id, img, img2, img3 }) {
  const photo = (cls, src = img, style) => <span className={`block bg-cover bg-center ${cls}`} style={{ backgroundImage: `url(${src})`, ...style }} />;
  const wrap = "relative block aspect-[4/3] overflow-hidden rounded-xl";
  if (id === "classico") return (
    <span className={`${wrap} bg-wine-950`}>
      {photo("absolute inset-0")}
      <span className="absolute inset-0 bg-gradient-to-t from-wine-950/90 via-wine-950/30 to-transparent" />
      <MiniNav light />
      <span className="absolute bottom-4 left-4 w-1/2"><TextBlock light /></span>
    </span>
  );
  if (id === "diagonal") return (
    <span className={`${wrap} bg-wine-950`}>
      {photo("absolute inset-y-0 right-0 w-[58%]", img, { clipPath: "polygon(24% 0,100% 0,100% 100%,0 100%)" })}
      <MiniNav light />
      <span className="absolute left-4 top-1/2 w-[42%] -translate-y-1/2"><TextBlock light /></span>
    </span>
  );
  if (id === "dividido") return (
    <span className={`${wrap} grid grid-cols-2 bg-ivory`}>
      {photo("h-full")}
      <span className="flex items-center px-3"><span className="w-full"><TextBlock /></span></span>
      <MiniNav />
    </span>
  );
  if (id === "arco") return (
    <span className={`${wrap} bg-paper`}>
      <MiniNav />
      <span className="absolute inset-x-0 top-7 mx-auto w-2/3"><TextBlock center /></span>
      {photo("absolute bottom-0 left-1/2 h-[42%] w-[64%] -translate-x-1/2 rounded-t-full")}
    </span>
  );
  if (id === "cinema") return (
    <span className={`${wrap} flex flex-col bg-black`}>
      <span className="h-[14%]" />
      <span className="relative flex-1">{photo("absolute inset-0")}<span className="absolute inset-0 bg-black/45" /><MiniNav light /><span className="absolute inset-x-0 top-1/2 mx-auto w-2/3 -translate-y-1/2"><TextBlock light center /></span></span>
      <span className="h-[14%]" />
    </span>
  );
  if (id === "revista") return (
    <span className={`${wrap} bg-ivory p-2.5`}>
      <span className="block border-y border-ink/60 py-0.5"><Bar w="100%" h="h-0.5" /></span>
      <span className="mt-1.5 block text-center font-display text-[26px] leading-none text-wine-900">Aa Aa</span>
      <span className="mt-2 grid grid-cols-[1.3fr_1fr] gap-2 border-t border-ink/20 pt-2">{photo("aspect-[4/3]")}<TextBlock /></span>
    </span>
  );
  if (id === "polaroid") return (
    <span className={`${wrap} bg-paper`}>
      <MiniNav />
      <span className="absolute left-3 top-1/2 w-[42%] -translate-y-1/2"><TextBlock /></span>
      <span className="absolute right-[26%] top-[22%] -rotate-6 bg-white p-1 pb-3 shadow">{photo("h-12 w-12", img2)}</span>
      <span className="absolute right-3 top-[18%] rotate-6 bg-white p-1 pb-3 shadow">{photo("h-12 w-12", img3)}</span>
      <span className="absolute bottom-3 right-[14%] rotate-1 bg-white p-1 pb-3 shadow">{photo("h-14 w-14")}</span>
    </span>
  );
  if (id === "minimalista") return (
    <span className={`${wrap} bg-ivory`}>
      <MiniNav />
      <span className="absolute inset-x-0 top-8 mx-auto w-1/2"><span className="flex flex-col items-center gap-1"><Bar w="80%" h="h-1.5" /><Bar w="50%" h="h-1" /></span></span>
      {photo("absolute inset-x-4 bottom-3 top-[46%]")}
    </span>
  );
  if (id === "imersivo") return (
    <span className={`${wrap} bg-black`}>
      {photo("absolute inset-0")}
      <span className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
      <MiniNav light />
      <span className="absolute left-3 top-1/2 flex -translate-y-1/2 items-center gap-3"><span className="font-display text-xl leading-none text-white">01</span><span className="w-28"><TextBlock light /></span></span>
      <span className="absolute inset-x-0 bottom-0 grid grid-cols-3 gap-0.5"><span className="h-1 bg-white" /><span className="h-1 bg-white/30" /><span className="h-1 bg-white/30" /></span>
    </span>
  );
  return (
    <span className={`${wrap} bg-ivory`}>
      <MiniNav />
      <span className="absolute left-3 top-1/2 w-[40%] -translate-y-1/2"><TextBlock /></span>
      <span className="absolute bottom-3 right-3 top-8 grid w-[50%] grid-cols-2 grid-rows-2 gap-1">
        {photo("row-span-2 rounded-lg")}
        {photo("rounded-lg", img2)}
        {photo("rounded-lg", img3)}
      </span>
    </span>
  );
}

/** Faixa com o "meio" da página de cada modelo (seções e rodapé). */
function MiniBelow({ id, img, img2, img3 }) {
  const ph = (cls, src = img, style) => <span className={`block bg-cover bg-center ${cls}`} style={{ backgroundImage: `url(${src})`, ...style }} />;
  const base = "relative mt-1.5 block h-20 overflow-hidden rounded-xl";
  if (id === "classico") return (
    <span className={`${base} flex items-center gap-1.5 bg-paper px-3`}>
      {[img, img2, img3, img].map((x, i) => ph("h-14 flex-1 rounded-lg", x))}
    </span>
  );
  if (id === "diagonal") return (
    <span className={`${base} bg-wine-950`} style={{ clipPath: "polygon(0 12%,100% 0,100% 88%,0 100%)" }}>
      <span className="absolute inset-y-3 left-3 flex w-[44%] flex-col justify-center gap-1"><Bar w="70%" light h="h-2" /><Bar w="90%" light h="h-1" /><Bar w="60%" light h="h-1" /></span>
      {ph("absolute inset-y-2 right-3 w-[42%]", img3, { clipPath: "polygon(14% 0,100% 0,86% 100%,0 100%)" })}
    </span>
  );
  if (id === "dividido") return (
    <span className={`${base} grid grid-cols-2 bg-ivory`}>
      <span className="flex flex-col justify-center gap-0 px-3">
        {[0, 1, 2, 3].map((i) => <span key={i} className="flex items-center gap-2 border-b border-ink/15 py-[5px]"><span className="h-1 w-2 bg-ink/30" /><Bar w="60%" h="h-1.5" /></span>)}
      </span>
      {ph("h-full", img2)}
    </span>
  );
  if (id === "arco") return (
    <span className={`${base} flex items-end justify-center gap-2 bg-paper px-3 pb-2`}>
      {[img, img2, img3, img].map((x, i) => ph("h-14 w-10 rounded-t-full", x))}
    </span>
  );
  if (id === "cinema") return (
    <span className={`${base} flex items-center gap-1 bg-black px-1`}>
      {[img, img2, img3].map((x, i) => <span key={i} className="flex h-full flex-1 flex-col justify-between py-1"><span className="flex justify-between px-1">{[0, 1, 2, 3].map((k) => <i key={k} className="h-1 w-1.5 bg-white/70" />)}</span>{ph("h-12", x)}<span className="flex justify-between px-1">{[0, 1, 2, 3].map((k) => <i key={k} className="h-1 w-1.5 bg-white/70" />)}</span></span>)}
    </span>
  );
  if (id === "revista") return (
    <span className={`${base} grid grid-cols-3 gap-2 border-t-2 border-ink bg-ivory px-2 pt-2`}>
      {[img, img2, img3].map((x, i) => <span key={i} className="flex flex-col gap-1"><span className="h-px bg-ink/30" />{ph("h-10", x)}<Bar w="70%" h="h-1.5" /></span>)}
    </span>
  );
  if (id === "polaroid") return (
    <span className={`${base} flex items-center justify-center gap-3 bg-paper`}>
      {[img, img2, img3].map((x, i) => <span key={i} className={`bg-white p-1 pb-3 shadow ${["-rotate-6", "rotate-3", "-rotate-2"][i]}`}>{ph("h-10 w-10", x)}</span>)}
    </span>
  );
  if (id === "minimalista") return (
    <span className={`${base} grid grid-cols-3 gap-3 bg-ivory px-4 py-3`}>
      {[img, img2, img3].map((x, i) => <span key={i} className="flex flex-col gap-1">{ph("aspect-square", x)}<Bar w="40%" h="h-0.5" /></span>)}
    </span>
  );
  if (id === "imersivo") return (
    <span className={`${base} flex flex-col`}>
      {[img2, img3].map((x, i) => <span key={i} className="relative flex flex-1 items-center justify-center">{ph("absolute inset-0", x)}<span className="absolute inset-0 bg-black/40" /><span className="relative"><Bar w="48px" light h="h-1.5" /></span></span>)}
    </span>
  );
  return (
    <span className={`${base} grid grid-cols-4 grid-rows-2 gap-1 bg-ivory p-1.5`}>
      {ph("col-span-2 row-span-2 rounded-lg", img)}
      {ph("rounded-lg", img2)}
      <span className="rounded-lg bg-wine-900" />
      {ph("col-span-2 rounded-lg", img3)}
    </span>
  );
}

// ------------------------------------------------------------------ página
export default function StyleAdmin() {
  const { settings, loading } = useSettings();
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!loading && !form) setForm(settings); }, [loading, settings, form]);
  useEffect(() => { loadAllFontsForPreview(); }, []);
  // Ao sair sem salvar, a prévia volta para o que está publicado.
  const saved = { theme: settings.theme, fonts: settings.fonts };
  useEffect(() => () => { applyTheme(saved.theme); applyFonts(saved.fonts); }, [saved.theme, saved.fonts]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!form) return <div className="py-20 text-center"><Spinner /></div>;

  const imgs = form.hero?.images?.length ? form.hero.images : FALLBACK_IMAGES.hero;
  const imgAt = (k) => { const i = imgs[k % imgs.length]; return i.thumbUrl || i.url; };
  const about = form.about?.photoThumbUrl || form.about?.photoUrl || FALLBACK_IMAGES.about.url;
  const setFont = (k, id) => setForm((f) => { const fonts = { ...f.fonts, [k]: id }; applyFonts(fonts); return { ...f, fonts }; });
  const dirty = form.layout !== settings.layout
    || form.fonts.display !== settings.fonts.display || form.fonts.body !== settings.fonts.body
    || JSON.stringify(form.theme) !== JSON.stringify(settings.theme)
    || JSON.stringify(form.themePresets) !== JSON.stringify(settings.themePresets);

  async function save() {
    if (["primary", "background", "surface", "text", "onPrimary", "accent"].some((k) => form.theme[k] && !isHex(form.theme[k]))) {
      toast.error("Cores inválidas: use o formato #RRGGBB.");
      return;
    }
    setSaving(true);
    try {
      await saveSettings({ layout: form.layout, fonts: form.fonts, theme: form.theme, themePresets: form.themePresets || [] });
      toast.success("Estilo salvo. O site já foi atualizado.");
    } catch (e) {
      toast.error(e.code === "permission-denied" ? "Sem permissão para salvar." : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  const saveBtn = (
    <button className="btn-primary" onClick={save} disabled={saving || !dirty}>
      {saving ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />} Salvar estilo
    </button>
  );

  return (
    <>
      <AdminHeader title="Estilo" text="A cara do seu site: o modelo (estrutura do site inteiro), as fontes e as cores. Os textos e as fotos ficam em Configurações."
        actions={(
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-outline" onClick={() => window.dispatchEvent(new Event("revela:tour"))}>
              <PlayCircle className="h-4 w-4" /> Rever apresentação
            </button>
            {saveBtn}
          </div>
        )} />

      <div className="space-y-6">
        <Section title="1. Modelo do site" text="O modelo muda a estrutura do site inteiro: cabeçalho, ordem e desenho das seções, topo das páginas, rodapé e o formato de botões, cartões e fotos. Abra a prévia e navegue pelo site antes de decidir.">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {LAYOUTS.map((l) => {
              const on = form.layout === l.id;
              return (
                <div key={l.id} className={`flex flex-col rounded-2xl border bg-surface p-3 transition ${on ? "border-wine-900 ring-4 ring-wine-900/10" : "border-ink/10 hover:border-ink/25"}`}>
                  <button type="button" onClick={() => setForm((f) => ({ ...f, layout: l.id }))} className="block text-left" aria-pressed={on}>
                    <MiniHero id={l.id} img={imgAt(0)} img2={imgAt(1)} img3={about} />
                    <MiniBelow id={l.id} img={imgAt(1)} img2={imgAt(2)} img3={about} />
                  </button>
                  <div className="flex flex-1 flex-col px-1 pb-1 pt-4">
                    <p className="flex items-center justify-between gap-2 font-display text-2xl">
                      {l.name}
                      {on && <span className="inline-flex items-center gap-1 rounded-full bg-wine-900 px-2.5 py-1 font-sans text-[11px] font-medium text-cream"><Check className="h-3 w-3" /> Escolhido</span>}
                    </p>
                    <p className="mt-1 flex-1 text-sm text-ink-soft">{l.text}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <a href={`${sitePath("/")}?modelo=${l.id}`} target="_blank" rel="noopener noreferrer" className="btn-outline btn-sm">
                        <ExternalLink className="h-4 w-4" /> Visualizar modelo de site
                      </a>
                      {!on && <button type="button" className="btn-primary btn-sm" onClick={() => setForm((f) => ({ ...f, layout: l.id }))}>Usar este modelo</button>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-ink-muted">Na prévia dá para navegar por todas as páginas com o modelo. Ela mostra o que já está publicado (textos, fotos e cores salvos). Depois de escolher, clique em Salvar estilo.</p>
        </Section>

        <Section title="2. Fontes" text="Uma fonte para os títulos e outra para os textos e menus. A mudança aparece aqui na hora como prévia.">
          <p className="mb-3 text-sm font-medium">Títulos</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {DISPLAY_FONTS.map((f) => {
              const on = form.fonts.display === f.id;
              return (
                <button key={f.id} type="button" onClick={() => setFont("display", f.id)} aria-pressed={on}
                  className={`rounded-2xl border bg-surface px-4 py-4 text-left transition ${on ? "border-wine-900 ring-4 ring-wine-900/10" : "border-ink/10 hover:border-ink/25"}`}>
                  <span className="block text-3xl leading-none text-ink" style={{ fontFamily: `"${f.id}"` }}>Aa</span>
                  <span className="mt-3 block text-sm font-medium">{f.label}</span>
                  <span className="block text-xs text-ink-muted">{f.mood}</span>
                </button>
              );
            })}
          </div>
          <p className="mb-3 mt-6 text-sm font-medium">Textos e menus</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {BODY_FONTS.map((f) => {
              const on = form.fonts.body === f.id;
              return (
                <button key={f.id} type="button" onClick={() => setFont("body", f.id)} aria-pressed={on}
                  className={`rounded-2xl border bg-surface px-4 py-3 text-left transition ${on ? "border-wine-900 ring-4 ring-wine-900/10" : "border-ink/10 hover:border-ink/25"}`}>
                  <span className="block text-lg text-ink" style={{ fontFamily: `"${f.id}"` }}>Agende já</span>
                  <span className="block text-xs text-ink-muted">{f.label}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-6 rounded-2xl border border-ink/10 bg-paper p-6">
            <p className="eyebrow">Prévia</p>
            <p className="display-md mt-2">{form.hero?.title || "Momentos que merecem ser lembrados"}</p>
            <p className="mt-3 max-w-xl text-ink-soft">{form.hero?.subtitle || "Fotografia feita com calma, luz cuidadosa e muito carinho pelos detalhes."}</p>
          </div>
        </Section>

        <ThemeEditor form={form} setForm={setForm} />

        <div className="flex justify-end">{saveBtn}</div>
      </div>
    </>
  );
}
