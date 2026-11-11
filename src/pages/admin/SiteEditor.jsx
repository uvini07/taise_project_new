// Editor do site, no estilo Shopify/Wix: painel de edição à esquerda e o site
// de verdade à direita (iframe), que muda na hora. Clicar numa parte do site
// abre o campo dela aqui. Nada vai para o ar até clicar em "Salvar".
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, Check, ChevronDown, Eye, ExternalLink, Image as ImageIcon, LayoutTemplate, Monitor, MousePointerClick,
  Palette, Pencil, Save, Smartphone, Trash2, Type, User, MapPin, PanelBottom, Sparkles,
} from "lucide-react";
import { ImageInput } from "../../components/admin/AdminUI.jsx";
import { SelectField, TextArea, TextField } from "../../components/common/Fields.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import { useSettings } from "../../contexts/SettingsContext.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";
import { saveSettings } from "../../services/admin/settingsAdmin.js";
import { uploadImage } from "../../services/imageService.js";
import { BODY_FONTS, DISPLAY_FONTS, LAYOUTS, loadAllFontsForPreview } from "../../config/siteStyle.js";
import { BUILTIN_THEMES, isHex } from "../../utils/theme.js";
import { normalizePhoneBR, isValidEmail } from "../../utils/validation.js";
import { sitePath } from "../../config/tenant.js";
import { FALLBACK_IMAGES } from "../../config/defaults.js";
import { EDITOR_FRAME } from "../../utils/editorMode.js";
import { confirmLeave, useUnsavedGuard } from "../../utils/unsaved.js";
import { MiniHero } from "./StyleAdmin.jsx";

const set = (obj, path, value) => {
  const [k, ...rest] = path.split(".");
  return { ...obj, [k]: rest.length ? set(obj?.[k] || {}, rest.join("."), value) : value };
};
const get = (obj, path) => path.split(".").reduce((o, k) => o?.[k], obj) ?? "";

const PANELS = [
  { id: "modelo", label: "Modelo do site", icon: LayoutTemplate },
  { id: "cores", label: "Cores", icon: Palette },
  { id: "fontes", label: "Fontes", icon: Type },
  { id: "identidade", label: "Nome e logo", icon: Sparkles },
  { id: "topo", label: "Topo da página", icon: ImageIcon },
  { id: "sobre", label: "Sobre você", icon: User },
  { id: "contato", label: "Contato e redes", icon: MapPin },
  { id: "rodape", label: "Rodapé", icon: PanelBottom },
];
// Parte clicada no site → painel do editor (as que não estão aqui têm tela própria).
const ZONE_PANEL = { topo: "topo", hero: "topo", sobre: "sobre", contato: "contato", rodape: "rodape", identidade: "identidade" };
const OTHER = {
  galeria: ["Galeria", "As fotos e as categorias da galeria ficam na tela Galeria.", "/adm/galeria"],
  pacotes: ["Pacotes", "Preços, lotes e o que está incluso ficam na tela Pacotes.", "/adm/pacotes"],
  depoimentos: ["Depoimentos", "Os depoimentos ficam em Conteúdo do site → Depoimentos.", "/adm/configuracoes?aba=depoimentos"],
  evento: ["Evento promocional", "O evento (Natal, Dia das Mães…) tem tela própria.", "/adm/evento"],
};
const PAGES = [["/", "Início"], ["/sobre", "Sobre"], ["/pacotes", "Pacotes"], ["/galeria", "Galeria"], ["/contato", "Contato"]];
const PICK_COLORS = [["primary", "Cor principal"], ["accent", "Cor de destaque"], ["background", "Fundo da página"]];
const DEF_THEME = { surface: "#FFFFFF", text: "#221A16", onPrimary: "#F0E6D7", accent: "#A1815E" };

/** Bloco recolhível do painel. */
function Panel({ id, label, icon: Icon, open, onToggle, children }) {
  return (
    <section id={`painel-${id}`} className="border-b border-ink/[.07]">
      <button type="button" onClick={onToggle} aria-expanded={open}
        className={`flex w-full items-center gap-3 px-5 py-4 text-left text-[15px] transition ${open ? "bg-wine-900/[.04] font-medium text-ink" : "text-ink-soft hover:bg-ink/[.03]"}`}>
        <Icon className="h-[18px] w-[18px] shrink-0 text-wine-900" strokeWidth={1.6} aria-hidden />
        <span className="flex-1">{label}</span>
        <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && <div className="space-y-4 px-5 pb-6 pt-2">{children}</div>}
    </section>
  );
}

export default function SiteEditor() {
  const { settings, loading } = useSettings();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState(null);
  const [snapshot, setSnapshot] = useState("");
  const [open, setOpen] = useState(() => (PANELS.some((p) => p.id === params.get("painel")) ? params.get("painel") : "modelo"));
  const [other, setOther] = useState(null);
  const [device, setDevice] = useState("desktop");
  const [page, setPage] = useState("/");
  const [mobileView, setMobileView] = useState("editar");
  const [editing, setEditing] = useState(true);
  const [saving, setSaving] = useState(false);
  const frame = useRef(null);
  const ready = useRef(false);
  const site = sitePath("/");

  useEffect(() => { if (!loading && !form) { setForm(settings); setSnapshot(JSON.stringify(settings)); } }, [loading, settings, form]);
  useEffect(() => { loadAllFontsForPreview(); }, []);
  const dirty = !!form && !!snapshot && JSON.stringify(form) !== snapshot;
  useUnsavedGuard(dirty);

  // Manda o rascunho para a prévia (sempre que muda e quando ela fica pronta).
  const push = useCallback(() => {
    const w = frame.current?.contentWindow;
    if (!w || !form) return;
    const { updatedAt, ...draft } = form;
    w.postMessage({ type: "revela:settings", settings: draft }, window.location.origin);
    w.postMessage({ type: "revela:editing", on: editing }, window.location.origin);
  }, [form, editing]);
  useEffect(() => { const t = setTimeout(push, 120); return () => clearTimeout(t); }, [push]);

  // Mensagens da prévia: pronta, clique numa parte, página atual.
  useEffect(() => {
    const onMsg = (e) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return;
      const d = e.data || {};
      if (d.type === "revela:ready") { ready.current = true; push(); }
      if (d.type === "revela:path") setPage(d.path.slice(site.length) || "/");
      if (d.type === "revela:edit") {
        const panel = ZONE_PANEL[d.zone] || (d.field && ZONE_PANEL[d.field.split(".")[0]]);
        if (panel) {
          setOther(null);
          setOpen(panel);
          setMobileView("editar");
          setTimeout(() => {
            document.getElementById(`painel-${panel}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
            const el = d.field && document.querySelector(`[data-field="${d.field}"]`);
            if (el) { el.focus({ preventScroll: false }); el.select?.(); }
          }, 120);
        } else if (OTHER[d.zone]) {
          setOther(d.zone);
          setMobileView("editar");
        }
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [push, site]);

  const upd = (path) => (e) => setForm((f) => set(f, path, e?.target ? e.target.value : e));
  const field = (path, label, extra = {}) => (
    <TextField label={label} value={get(form, path)} onChange={upd(path)} data-field={path} {...extra} />
  );
  const up = (folder) => (file, onProgress, opts) => uploadImage(file, `site/${folder}`, { onProgress, ...opts });

  const theme = useMemo(() => ({ ...DEF_THEME, ...(form?.theme || {}) }), [form?.theme]);
  const sameTheme = (t) => ["primary", "background", "accent"].every((k) => (t[k] || "").toUpperCase() === (theme[k] || "").toUpperCase());

  async function save() {
    const errs = [];
    const wa = form.contact?.whatsapp ? normalizePhoneBR(form.contact.whatsapp) : "";
    if (form.contact?.whatsapp && !wa) errs.push("WhatsApp inválido (use DDD + número).");
    if (form.contact?.email && !isValidEmail(form.contact.email)) errs.push("E-mail inválido.");
    if (!String(form.brandName || "").trim()) errs.push("Informe o nome do estúdio.");
    if (["primary", "background", "accent"].some((k) => theme[k] && !isHex(theme[k]))) errs.push("Cor inválida: use o formato #RRGGBB.");
    if (form.social?.instagram && !/^https:\/\//.test(form.social.instagram)) errs.push("O link do Instagram deve começar com https://");
    if (errs.length) { toast.error(errs.join(" ")); return; }
    setSaving(true);
    try {
      const { promoEvent, promoTemplates, onboardingDone, updatedAt, ...rest } = form;
      const next = { ...rest, theme, contact: { ...form.contact, whatsapp: wa }, styleChosen: true, contentSaved: true };
      await saveSettings(next);
      const saved = { ...form, ...next, isDefault: false };
      setForm(saved);
      setSnapshot(JSON.stringify(saved));
      toast.success("Salvo! Seu site já está no ar com as mudanças.");
    } catch (e) {
      toast.error(e.code === "permission-denied" ? "Sem permissão para salvar." : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  if (!form) return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-paper"><Spinner /></div>;
  const heroImages = form.hero?.images || [];
  const toggle = (id) => { setOther(null); setOpen((o) => (o === id ? null : id)); };

  // ----------------------------------------------------------- painéis
  const panelBody = {
    modelo: (
      <>
        <p className="text-sm text-ink-muted">Muda a estrutura do site inteiro. Clique para ver na prévia ao lado.</p>
        <div className="grid grid-cols-2 gap-3">
          {LAYOUTS.map((l) => {
            const on = (form.layout || "classico") === l.id;
            const img = heroImages[0] || FALLBACK_IMAGES.hero[0];
            return (
              <button key={l.id} type="button" onClick={() => setForm((f) => ({ ...f, layout: l.id }))} aria-pressed={on}
                className={`rounded-xl border bg-surface p-1.5 text-left transition ${on ? "border-wine-900 ring-2 ring-wine-900/15" : "border-ink/10 hover:border-ink/30"}`}>
                <MiniHero id={l.id} img={img.thumbUrl || img.url} img2={(heroImages[1] || img).url} img3={form.about?.photoUrl || FALLBACK_IMAGES.about.url} />
                <span className="flex items-center justify-between px-1 pb-0.5 pt-1.5 text-[13px] font-medium">{l.name}{on && <Check className="h-3.5 w-3.5 text-wine-900" />}</span>
              </button>
            );
          })}
        </div>
      </>
    ),
    cores: (
      <>
        <div className="grid grid-cols-3 gap-2">
          {[...BUILTIN_THEMES, ...(form.themePresets || [])].map((t, i) => (
            <button key={`${t.name}-${i}`} type="button" onClick={() => setForm((f) => ({ ...f, theme: { ...DEF_THEME, ...t } }))}
              className={`overflow-hidden rounded-xl border text-left text-[11px] ${sameTheme(t) ? "border-wine-900 ring-2 ring-wine-900/15" : "border-ink/10"}`}>
              <span className="flex h-9"><span className="flex-1" style={{ background: t.background }} /><span className="w-1/3" style={{ background: t.primary }} /><span className="w-1/6" style={{ background: t.accent }} /></span>
              <span className="block truncate px-2 py-1.5">{t.name}</span>
            </button>
          ))}
        </div>
        {PICK_COLORS.map(([k, label]) => (
          <label key={k} className="flex items-center gap-3">
            <input type="color" value={isHex(theme[k]) ? theme[k] : "#000000"} onChange={(e) => setForm((f) => ({ ...f, theme: { ...theme, [k]: e.target.value } }))}
              className="h-10 w-12 cursor-pointer rounded-lg border border-ink/10 bg-transparent p-0.5" />
            <span className="flex-1 text-sm">{label}</span>
            <input className="field-input !w-28 !py-2 font-mono text-xs" value={theme[k]} onChange={(e) => setForm((f) => ({ ...f, theme: { ...theme, [k]: e.target.value } }))} />
          </label>
        ))}
        <p className="text-xs text-ink-muted">Mais opções de cor (texto, cartões) ficam em Estilo do site.</p>
      </>
    ),
    fontes: (
      <>
        <SelectField label="Fonte dos títulos" value={form.fonts?.display} onChange={(e) => setForm((f) => ({ ...f, fonts: { ...f.fonts, display: e.target.value } }))}>
          {DISPLAY_FONTS.map((f) => <option key={f.id} value={f.id}>{f.label} — {f.mood}</option>)}
        </SelectField>
        <p className="rounded-xl bg-paper px-4 py-3 text-2xl" style={{ fontFamily: `"${form.fonts?.display}"` }}>{form.hero?.title || "Momentos que merecem ser lembrados"}</p>
        <SelectField label="Fonte dos textos e menus" value={form.fonts?.body} onChange={(e) => setForm((f) => ({ ...f, fonts: { ...f.fonts, body: e.target.value } }))}>
          {BODY_FONTS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
        </SelectField>
      </>
    ),
    identidade: (
      <>
        {field("brandName", "Nome do estúdio", { hint: "Aparece no topo quando não há logo, no rodapé e no Google." })}
        <div data-field="identidade.logo" tabIndex={-1}>
          <ImageInput label="Logo (para fundo claro)" aspect="aspect-[16/7]" value={form.logoUrl} hint="PNG com fundo transparente fica melhor."
            onUpload={async (file, p) => { const img = await up("logo")(file, p, { thumb: false, maxEdge: 1200 }); setForm((f) => ({ ...f, logoUrl: img.url, logoPath: img.path })); }}
            onRemove={() => setForm((f) => ({ ...f, logoUrl: "", logoPath: "" }))} />
        </div>
        <ImageInput label="Logo (para fundo escuro, opcional)" aspect="aspect-[16/7]" value={form.logoLightUrl} hint="Usada sobre fotos e nos modelos escuros, como o Cinema."
          onUpload={async (file, p) => { const img = await up("logo-light")(file, p, { thumb: false, maxEdge: 1200 }); setForm((f) => ({ ...f, logoLightUrl: img.url, logoLightPath: img.path })); }}
          onRemove={() => setForm((f) => ({ ...f, logoLightUrl: "", logoLightPath: "" }))} />
      </>
    ),
    topo: (
      <>
        {field("hero.eyebrow", "Frase pequena acima do título", { placeholder: "Fotografia afetiva" })}
        <TextArea label="Título principal" rows={2} value={get(form, "hero.title")} onChange={upd("hero.title")} data-field="hero.title" />
        <TextArea label="Texto abaixo do título" rows={3} value={get(form, "hero.subtitle")} onChange={upd("hero.subtitle")} data-field="hero.subtitle" />
        <div className="grid grid-cols-2 gap-3">
          {field("hero.primaryLabel", "Botão principal", { placeholder: "Conhecer os pacotes" })}
          {field("hero.secondaryLabel", "Botão secundário", { placeholder: "Ver a galeria" })}
        </div>
        <div>
          <p className="field-label">Fotos do topo (até 5)</p>
          <div className="grid grid-cols-3 gap-2">
            {heroImages.map((img, i) => (
              <div key={img.url} className="group relative aspect-square overflow-hidden rounded-xl">
                <img src={img.thumbUrl || img.url} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={() => setForm((f) => set(f, "hero.images", heroImages.filter((_, j) => j !== i)))}
                  className="absolute right-1 top-1 rounded-full bg-surface/90 p-1 text-danger shadow" aria-label="Remover foto"><Trash2 className="h-3.5 w-3.5" /></button>
                {i === 0 && <span className="absolute bottom-1 left-1 rounded-full bg-surface/90 px-2 py-0.5 text-[10px]">Principal</span>}
              </div>
            ))}
            {heroImages.length < 5 && (
              <ImageInput aspect="aspect-square" onUpload={async (file, p) => {
                const img = await up("hero")(file, p);
                setForm((f) => set(f, "hero.images", [...(f.hero?.images || []), { url: img.url, thumbUrl: img.thumbUrl, path: img.path, thumbPath: img.thumbPath, alt: "" }]));
              }} />
            )}
          </div>
          {!heroImages.length && <p className="field-hint">Enquanto você não envia, o site mostra fotos de exemplo.</p>}
        </div>
      </>
    ),
    sobre: (
      <>
        {field("about.title", "Título")}
        <TextArea label="Seu texto" rows={7} value={get(form, "about.text")} onChange={upd("about.text")} data-field="about.text" hint="Deixe uma linha em branco para começar um novo parágrafo." />
        {field("about.signature", "Assinatura", { placeholder: "Ana Lima" })}
        <ImageInput label="Sua foto" aspect="aspect-[4/5]" value={form.about?.photoUrl}
          onUpload={async (file, p) => { const img = await up("about")(file, p); setForm((f) => set(set(f, "about.photoUrl", img.url), "about.photoThumbUrl", img.thumbUrl)); }}
          onRemove={() => setForm((f) => set(set(f, "about.photoUrl", ""), "about.photoThumbUrl", ""))} />
      </>
    ),
    contato: (
      <>
        {field("contact.whatsapp", "WhatsApp (com DDD)", { inputMode: "tel", placeholder: "(11) 90000-0000" })}
        {field("contact.email", "E-mail", { type: "email", inputMode: "email" })}
        {field("contact.address", "Endereço do estúdio")}
        {field("contact.city", "Cidade / bairro")}
        <TextArea label="Horários de atendimento" rows={2} value={get(form, "contact.hours")} onChange={upd("contact.hours")} data-field="contact.hours" />
        {field("social.instagram", "Link do Instagram", { placeholder: "https://instagram.com/seuestudio" })}
      </>
    ),
    rodape: (
      <TextArea label="Frase do rodapé" rows={3} value={get(form, "footerText")} onChange={upd("footerText")} data-field="footerText" />
    ),
  };

  // ------------------------------------------------------------- layout
  const leave = (to) => { if (confirmLeave()) navigate(to); };
  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-paper">
      {/* Barra do topo */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-ink/10 bg-ivory px-3 sm:px-4">
        <button type="button" onClick={() => leave("/adm/dashboard")} className="btn-ghost btn-sm"><ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">Painel</span></button>
        <p className="hidden font-display text-xl md:block">Editor do site</p>
        <div className="mx-auto hidden items-center gap-1 rounded-full border border-ink/10 bg-surface p-1 lg:flex">
          <button type="button" onClick={() => setDevice("desktop")} aria-pressed={device === "desktop"} className={`rounded-full p-1.5 ${device === "desktop" ? "bg-wine-900 text-cream" : "text-ink-soft"}`} aria-label="Ver como no computador"><Monitor className="h-4 w-4" /></button>
          <button type="button" onClick={() => setDevice("mobile")} aria-pressed={device === "mobile"} className={`rounded-full p-1.5 ${device === "mobile" ? "bg-wine-900 text-cream" : "text-ink-soft"}`} aria-label="Ver como no celular"><Smartphone className="h-4 w-4" /></button>
          <select value={PAGES.some(([p]) => p === page) ? page : ""} onChange={(e) => { setPage(e.target.value); frame.current.src = sitePath(e.target.value); }}
            className="rounded-full bg-transparent px-2 py-1 text-xs text-ink-soft outline-none" aria-label="Página da prévia">
            {!PAGES.some(([p]) => p === page) && <option value="">Outra página</option>}
            {PAGES.map(([p, l]) => <option key={p} value={p}>{l}</option>)}
          </select>
          <button type="button" onClick={() => setEditing((v) => !v)} aria-pressed={editing}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs ${editing ? "bg-gold/20 text-gold-dark" : "text-ink-soft"}`}
            title="Com isto ligado, clicar numa parte do site abre o campo dela aqui">
            <MousePointerClick className="h-3.5 w-3.5" /> Clicar para editar
          </button>
        </div>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <a href={site} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm hidden sm:inline-flex"><ExternalLink className="h-4 w-4" /> Abrir site</a>
          <button type="button" className="btn-primary btn-sm" onClick={save} disabled={saving || !dirty}>
            {saving ? <Spinner className="h-4 w-4" /> : dirty ? <Save className="h-4 w-4" /> : <Check className="h-4 w-4" />} {dirty ? "Salvar alterações" : "Tudo salvo"}
            {dirty && !saving && <span className="h-2 w-2 rounded-full bg-gold" title="Há alterações ainda não salvas" aria-hidden />}
          </button>
        </div>
      </header>

      {/* Celular: alterna entre editar e ver a prévia */}
      <div className="flex shrink-0 border-b border-ink/10 bg-ivory lg:hidden">
        {[["editar", "Editar", Pencil], ["previa", "Ver prévia", Eye]].map(([k, l, Icon]) => (
          <button key={k} type="button" onClick={() => setMobileView(k)} aria-pressed={mobileView === k}
            className={`flex flex-1 items-center justify-center gap-2 py-2.5 text-sm ${mobileView === k ? "border-b-2 border-wine-900 font-medium text-ink" : "text-ink-muted"}`}>
            <Icon className="h-4 w-4" /> {l}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Painel */}
        <aside className={`w-full shrink-0 overflow-y-auto border-r border-ink/10 bg-ivory lg:block lg:w-[360px] ${mobileView === "editar" ? "block" : "hidden"}`}>
          {other && (
            <div className="m-4 rounded-2xl border border-gold/30 bg-gold/5 p-4 text-sm">
              <p className="font-medium">{OTHER[other][0]}</p>
              <p className="mt-1 text-ink-soft">{OTHER[other][1]}</p>
              <div className="mt-3 flex gap-2">
                <Link to={OTHER[other][2]} onClick={(e) => { if (!confirmLeave()) e.preventDefault(); }} className="btn-primary btn-sm">Abrir {OTHER[other][0]}</Link>
                <button type="button" className="btn-ghost btn-sm" onClick={() => setOther(null)}>Fechar</button>
              </div>
            </div>
          )}
          <p className="flex items-start gap-2 px-5 pt-4 text-xs text-ink-muted">
            <MousePointerClick className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="hidden lg:inline">Dica: clique em qualquer parte do site ao lado para editar.</span>
            <span className="lg:hidden">Edite aqui e toque em “Ver prévia” para conferir.</span>
          </p>
          {PANELS.map((p) => (
            <Panel key={p.id} {...p} open={open === p.id} onToggle={() => toggle(p.id)}>{panelBody[p.id]}</Panel>
          ))}
          <div className="space-y-2 px-5 py-5 text-sm">
            <p className="text-xs uppercase tracking-wider text-ink-muted">Outras partes do site</p>
            {Object.entries(OTHER).map(([k, [label, , to]]) => (
              <Link key={k} to={to} onClick={(e) => { if (!confirmLeave()) e.preventDefault(); }} className="flex items-center justify-between rounded-xl px-3 py-2 text-ink-soft hover:bg-ink/5">
                {label} <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            ))}
          </div>
        </aside>

        {/* Prévia ao vivo */}
        <main className={`min-w-0 flex-1 items-start justify-center overflow-auto bg-[#e9e6e1] lg:flex lg:p-5 ${mobileView === "previa" ? "flex" : "hidden"}`}>
          <div className={`h-full w-full overflow-hidden bg-white shadow-lift transition-all duration-500 lg:rounded-xl ${device === "mobile" ? "lg:h-[min(844px,100%)] lg:w-[390px] lg:rounded-[2.2rem] lg:border-[10px] lg:border-[#1d1b20]" : ""}`}>
            <iframe ref={frame} name={EDITOR_FRAME} title="Prévia do site" src={site} className="h-full w-full border-0" onLoad={() => setTimeout(push, 200)} />
          </div>
        </main>
      </div>
      <span className="sr-only" aria-live="polite">{saving ? "Salvando" : ""}</span>
    </div>
  );
}
