import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowDown, ArrowUp, Plus, Save, Trash2 } from "lucide-react";
import { AdminHeader, ImageInput, Section } from "../../components/admin/AdminUI.jsx";
import { TextArea, TextField, Toggle } from "../../components/common/Fields.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import { useSettings } from "../../contexts/SettingsContext.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";
import { saveSettings } from "../../services/admin/settingsAdmin.js";
import { deleteStoragePaths, uploadImage } from "../../services/imageService.js";
import { formatPhoneBR, isValidEmail, normalizePhoneBR } from "../../utils/validation.js";

const TABS = [
  ["identidade", "Identidade"],
  ["inicio", "Página inicial"],
  ["sobre", "Sobre"],
  ["contato", "Contato"],
  ["textos", "Rodapé e políticas"],
  ["depoimentos", "Depoimentos"],
  ["seo", "SEO e exibição"],
];

const set = (obj, path, value) => {
  const [k, ...rest] = path.split(".");
  return { ...obj, [k]: rest.length ? set(obj[k] || {}, rest.join("."), value) : value };
};

export default function SettingsAdmin() {
  const { settings, loading } = useSettings();
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [tab, setTab] = useState("identidade");
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState([]);

  useEffect(() => { if (!loading && !form) setForm(settings); }, [loading, settings, form]);

  const pending = useMemo(() => {
    if (!form) return [];
    const p = [];
    if (form.isDefault) p.push("As configurações ainda não foram salvas — o site está usando os textos iniciais.");
    if (!form.hero.images?.length) p.push("Escolha as fotos de destaque da página inicial (hoje aparecem fotos provisórias do projeto antigo).");
    if (!form.about.photoUrl) p.push("Escolha a foto da seção Sobre.");
    if (!form.contact.city) p.push("Informe a cidade/bairro do estúdio (não constava no projeto antigo).");
    if (!form.contact.hours) p.push("Informe os horários de atendimento.");
    if (!form.social.instagram) p.push("Informe o link do Instagram (no projeto antigo o link estava vazio).");
    if (form.contact.email === "tarufino@gmail.com") p.push("Confirme o e-mail de contato: o projeto antigo exibia tarufino@gmail.com no rodapé e contato@taisefoto.com na configuração.");
    return p;
  }, [form]);

  if (!form) return <div className="py-20 text-center"><Spinner /></div>;
  const upd = (path) => (e) => setForm((f) => set(f, path, e?.target ? (e.target.type === "checkbox" ? e.target.checked : e.target.value) : e));
  const v = (path) => path.split(".").reduce((o, k) => o?.[k], form) ?? "";

  async function upload(file, folder, onProgress, opts) {
    return uploadImage(file, `site/${folder}`, { onProgress, ...opts });
  }

  async function save() {
    const errs = [];
    const wa = normalizePhoneBR(form.contact.whatsapp);
    if (!wa) errs.push("WhatsApp inválido.");
    if (form.contact.email && !isValidEmail(form.contact.email)) errs.push("E-mail inválido.");
    if (!form.brandName.trim()) errs.push("Informe o nome comercial.");
    for (const [k, url] of Object.entries(form.social)) if (url && !/^https:\/\//.test(url)) errs.push(`Link do ${k} deve começar com https://`);
    if (errs.length) { toast.error(errs.join(" ")); return; }
    setSaving(true);
    try {
      await saveSettings({ ...form, contact: { ...form.contact, whatsapp: wa } });
      if (toDelete.length) { await deleteStoragePaths(toDelete); setToDelete([]); }
      setForm((f) => ({ ...f, isDefault: false, contact: { ...f.contact, whatsapp: wa } }));
      toast.success("Configurações salvas. O site já foi atualizado.");
    } catch (e) {
      toast.error(e.code === "permission-denied" ? "Sem permissão para salvar." : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  const replaceImage = (path, pathFields) => async (file, onProgress, opts) => {
    const img = await upload(file, path.replace(/\./g, "-"), onProgress, opts);
    const old = pathFields.map((f) => v(f)).filter(Boolean);
    setToDelete((d) => [...d, ...old]);
    return img;
  };

  const heroImages = form.hero.images || [];
  const testimonials = form.testimonials || [];

  return (
    <>
      <AdminHeader title="Configurações" text="Tudo o que aparece no site: textos, fotos de destaque, contato e preferências."
        actions={<button className="btn-primary" onClick={save} disabled={saving}>{saving ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />} Salvar alterações</button>} />

      {pending.length > 0 && (
        <div className="mb-6 rounded-2xl border border-warning/25 bg-warning/5 p-5 text-sm">
          <p className="flex items-center gap-2 font-medium text-warning"><AlertCircle className="h-4 w-4" /> Pendências</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-soft">{pending.map((p) => <li key={p}>{p}</li>)}</ul>
        </div>
      )}

      <div className="scrollbar-none -mx-4 mb-6 flex gap-1 overflow-x-auto px-4" role="tablist">
        {TABS.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm transition ${tab === id ? "bg-wine-900 text-cream" : "bg-white text-ink-soft hover:bg-ink/5"}`}>{label}</button>
        ))}
      </div>

      <div className="space-y-6">
        {tab === "identidade" && (
          <Section title="Identidade" text="A logo original já está no site. Envie outra apenas se a marca mudar.">
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField label="Nome comercial" value={v("brandName")} onChange={upd("brandName")} />
              <TextField label="Nome completo / razão" value={v("legalName")} onChange={upd("legalName")} hint="Usado no rodapé e no texto alternativo da logo." />
              <ImageInput label="Logo para fundo claro (opcional)" aspect="aspect-[16/9]" value={form.logoUrl}
                hint="PNG ou WebP com fundo transparente."
                onUpload={async (f, p) => { const img = await replaceImage("logo", ["logoPath"])(f, p, { thumb: false, maxEdge: 1200 }); setForm((x) => ({ ...x, logoUrl: img.url, logoPath: img.path })); }}
                onRemove={() => { setToDelete((d) => [...d, form.logoPath].filter(Boolean)); setForm((x) => ({ ...x, logoUrl: "", logoPath: "" })); }} />
              <ImageInput label="Logo para fundo escuro (opcional)" aspect="aspect-[16/9]" value={form.logoLightUrl}
                onUpload={async (f, p) => { const img = await replaceImage("logo-light", ["logoLightPath"])(f, p, { thumb: false, maxEdge: 1200 }); setForm((x) => ({ ...x, logoLightUrl: img.url, logoLightPath: img.path })); }}
                onRemove={() => { setToDelete((d) => [...d, form.logoLightPath].filter(Boolean)); setForm((x) => ({ ...x, logoLightUrl: "", logoLightPath: "" })); }} />
            </div>
          </Section>
        )}

        {tab === "inicio" && (
          <>
            <Section title="Textos do topo">
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField label="Chamada pequena" value={v("hero.eyebrow")} onChange={upd("hero.eyebrow")} maxLength={60} />
                <TextField label="Frase principal" value={v("hero.title")} onChange={upd("hero.title")} maxLength={90} />
                <TextArea className="sm:col-span-2" label="Texto de posicionamento" rows={3} value={v("hero.subtitle")} onChange={upd("hero.subtitle")} maxLength={280} />
                <TextField label="Botão principal" value={v("hero.primaryLabel")} onChange={upd("hero.primaryLabel")} maxLength={40} />
                <TextField label="Botão secundário" value={v("hero.secondaryLabel")} onChange={upd("hero.secondaryLabel")} maxLength={40} />
              </div>
            </Section>
            <Section title="Fotos de destaque" text="Até 5 fotos que se alternam no topo. Prefira fotos horizontais ou com o assunto no centro.">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {heroImages.map((img, i) => (
                  <div key={img.path || img.url} className="space-y-2">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-paper"><img src={img.thumbUrl || img.url} alt="" className="h-full w-full object-cover" /></div>
                    <input className="field-input !py-2 text-sm" placeholder="Descrição da foto (acessibilidade)" value={img.alt || ""}
                      onChange={(e) => setForm((f) => set(f, "hero.images", heroImages.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x))))} />
                    <div className="flex gap-1">
                      <button className="btn-ghost btn-sm" disabled={i === 0} aria-label="Mover para a esquerda"
                        onClick={() => { const a = [...heroImages]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; setForm((f) => set(f, "hero.images", a)); }}><ArrowUp className="h-4 w-4 -rotate-90" /></button>
                      <button className="btn-ghost btn-sm" disabled={i === heroImages.length - 1} aria-label="Mover para a direita"
                        onClick={() => { const a = [...heroImages]; [a[i + 1], a[i]] = [a[i], a[i + 1]]; setForm((f) => set(f, "hero.images", a)); }}><ArrowDown className="h-4 w-4 -rotate-90" /></button>
                      <button className="btn-ghost btn-sm ml-auto text-danger" onClick={() => { setToDelete((d) => [...d, img.path, img.thumbPath].filter(Boolean)); setForm((f) => set(f, "hero.images", heroImages.filter((_, j) => j !== i))); }}>
                        <Trash2 className="h-4 w-4" /> Remover
                      </button>
                    </div>
                  </div>
                ))}
                {heroImages.length < 5 && (
                  <ImageInput label={heroImages.length ? "" : undefined} value=""
                    onUpload={async (file, p) => {
                      const img = await upload(file, "hero", p);
                      setForm((f) => set(f, "hero.images", [...(f.hero.images || []), { url: img.url, thumbUrl: img.thumbUrl, path: img.path, thumbPath: img.thumbPath, alt: "" }]));
                    }} />
                )}
              </div>
            </Section>
          </>
        )}

        {tab === "sobre" && (
          <Section title="Apresentação da fotógrafa">
            <div className="grid gap-5 lg:grid-cols-3">
              <div className="space-y-5 lg:col-span-2">
                <TextField label="Título" value={v("about.title")} onChange={upd("about.title")} maxLength={100} />
                <TextArea label="Texto" rows={10} value={v("about.text")} onChange={upd("about.text")} hint="Deixe uma linha em branco para separar parágrafos." />
                <TextField label="Assinatura" value={v("about.signature")} onChange={upd("about.signature")} maxLength={60} />
              </div>
              <div className="space-y-3">
                <ImageInput label="Foto" aspect="aspect-[4/5]" value={form.about.photoUrl}
                  onUpload={async (f, p) => { const img = await replaceImage("about", ["about.photoPath", "about.photoThumbPath"])(f, p); setForm((x) => ({ ...x, about: { ...x.about, photoUrl: img.url, photoThumbUrl: img.thumbUrl, photoPath: img.path, photoThumbPath: img.thumbPath } })); }}
                  onRemove={() => { setToDelete((d) => [...d, form.about.photoPath, form.about.photoThumbPath].filter(Boolean)); setForm((x) => set(set(x, "about.photoUrl", ""), "about.photoThumbUrl", "")); }} />
                <TextField label="Descrição da foto" value={v("about.photoAlt")} onChange={upd("about.photoAlt")} />
              </div>
            </div>
          </Section>
        )}

        {tab === "contato" && (
          <Section title="Contato e localização" text="Dados conferidos no projeto antigo. Ajuste se algo mudou.">
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField label="Telefone (como aparece no site)" value={v("contact.phone")} onChange={upd("contact.phone")} />
              <TextField label="WhatsApp (com DDD)" value={formatPhoneBR(v("contact.whatsapp")) || v("contact.whatsapp")} onChange={upd("contact.whatsapp")}
                hint="Usado em todos os botões de WhatsApp (link wa.me)." />
              <TextField label="E-mail" type="email" value={v("contact.email")} onChange={upd("contact.email")} />
              <TextField label="Cidade / bairro" value={v("contact.city")} onChange={upd("contact.city")} />
              <TextField label="Endereço" value={v("contact.address")} onChange={upd("contact.address")} />
              <TextField label="Complemento" value={v("contact.addressLine2")} onChange={upd("contact.addressLine2")} />
              <TextField className="sm:col-span-2" label="Link do mapa" value={v("contact.mapUrl")} onChange={upd("contact.mapUrl")} hint="Cole o link de compartilhamento do Google Maps." />
              <TextArea label="Horários de atendimento" rows={3} value={v("contact.hours")} onChange={upd("contact.hours")} placeholder={"Terça a sexta, 9h às 18h\nSábado, 9h às 14h"} />
              <TextArea label="Observação sobre o estúdio" rows={3} value={v("contact.studioNote")} onChange={upd("contact.studioNote")} />
            </div>
            <h3 className="mb-4 mt-8 font-display text-xl">Redes sociais</h3>
            <div className="grid gap-5 sm:grid-cols-2">
              {["instagram", "facebook", "tiktok", "youtube", "pinterest"].map((k) => (
                <TextField key={k} label={k[0].toUpperCase() + k.slice(1)} placeholder="https://" value={v(`social.${k}`)} onChange={upd(`social.${k}`)} />
              ))}
            </div>
          </Section>
        )}

        {tab === "textos" && (
          <Section title="Rodapé e políticas">
            <div className="space-y-5">
              <TextArea label="Texto do rodapé" rows={2} value={v("footerText")} onChange={upd("footerText")} maxLength={240} />
              <TextArea label="Agendamento e pagamento" rows={6} value={v("policies.booking")} onChange={upd("policies.booking")} hint="Ex.: valor de entrada para reservar, formas de pagamento, prazos." />
              <TextArea label="Remarcação e cancelamento" rows={6} value={v("policies.cancellation")} onChange={upd("policies.cancellation")} />
              <TextArea label="Privacidade (LGPD)" rows={8} value={v("policies.privacy")} onChange={upd("policies.privacy")} hint="Em branco, o site usa um texto padrão que descreve exatamente os dados coletados." />
            </div>
          </Section>
        )}

        {tab === "depoimentos" && (
          <Section title="Depoimentos" text="Publique apenas depoimentos reais, com autorização de quem escreveu. Sem depoimentos, a seção não aparece."
            actions={<button className="btn-outline btn-sm" onClick={() => setForm((f) => ({ ...f, testimonials: [...testimonials, { name: "", context: "", text: "" }] }))}><Plus className="h-4 w-4" /> Adicionar</button>}>
            <div className="space-y-4">
              {!testimonials.length && <p className="text-sm text-ink-muted">Nenhum depoimento cadastrado.</p>}
              {testimonials.map((t, i) => (
                <div key={i} className="grid gap-3 rounded-2xl border border-ink/10 p-4 sm:grid-cols-2">
                  <TextField label="Nome" value={t.name} onChange={(e) => setForm((f) => ({ ...f, testimonials: testimonials.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) }))} />
                  <TextField label="Contexto (ex.: ensaio de família)" value={t.context} onChange={(e) => setForm((f) => ({ ...f, testimonials: testimonials.map((x, j) => (j === i ? { ...x, context: e.target.value } : x)) }))} />
                  <TextArea className="sm:col-span-2" label="Depoimento" rows={3} value={t.text} onChange={(e) => setForm((f) => ({ ...f, testimonials: testimonials.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) }))} />
                  <button className="btn-ghost btn-sm justify-self-start text-danger" onClick={() => setForm((f) => ({ ...f, testimonials: testimonials.filter((_, j) => j !== i) }))}><Trash2 className="h-4 w-4" /> Remover</button>
                </div>
              ))}
            </div>
          </Section>
        )}

        {tab === "seo" && (
          <>
            <Section title="SEO e compartilhamento" text="Como o site aparece no Google e quando o link é enviado no WhatsApp ou redes sociais.">
              <div className="grid gap-5 lg:grid-cols-3">
                <div className="space-y-5 lg:col-span-2">
                  <TextField label="Título" value={v("seo.title")} onChange={upd("seo.title")} maxLength={70} hint={`${v("seo.title").length}/70 caracteres`} />
                  <TextArea label="Descrição" rows={3} value={v("seo.description")} onChange={upd("seo.description")} maxLength={170} hint={`${v("seo.description").length}/170 caracteres`} />
                </div>
                <ImageInput label="Imagem de compartilhamento" value={form.seo.shareImageUrl} hint="Ideal: 1200 × 630."
                  onUpload={async (f, p) => { const img = await replaceImage("share", ["seo.shareImagePath"])(f, p, { thumb: false, maxEdge: 1200 }); setForm((x) => set(set(x, "seo.shareImageUrl", img.url), "seo.shareImagePath", img.path)); }}
                  onRemove={() => { setToDelete((d) => [...d, form.seo.shareImagePath].filter(Boolean)); setForm((x) => set(x, "seo.shareImageUrl", "")); }} />
              </div>
            </Section>
            <Section title="Exibição">
              <div className="max-w-xl space-y-5">
                <Toggle label="Botão flutuante do WhatsApp" checked={form.display.showWhatsappFab} onChange={upd("display.showWhatsappFab")} />
                <Toggle label="Agenda on-line" hint="Desligado: os botões levam para o WhatsApp." checked={form.display.showAgenda} onChange={upd("display.showAgenda")} />
                <Toggle label="Faixa da campanha VIP no topo" checked={form.display.showVipBanner} onChange={upd("display.showVipBanner")} />
                <Toggle label="Fotos em destaque na página inicial" checked={form.display.showFeaturedGallery} onChange={upd("display.showFeaturedGallery")} />
                <Toggle label="Depoimentos" checked={form.display.showTestimonials} onChange={upd("display.showTestimonials")} />
              </div>
            </Section>
          </>
        )}
      </div>

      <div className="sticky bottom-4 mt-8 flex justify-end">
        <button className="btn-primary shadow-lift" onClick={save} disabled={saving}>{saving ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />} Salvar alterações</button>
      </div>
    </>
  );
}
