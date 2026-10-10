import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Save, Trash2, Upload } from "lucide-react";
import { AdminHeader, ImageInput, Section } from "../../components/admin/AdminUI.jsx";
import { TextArea, TextField, Toggle } from "../../components/common/Fields.jsx";
import Badge from "../../components/common/Badge.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import PageLoader from "../../components/common/PageLoader.jsx";
import { useConfirm } from "../../components/common/useConfirm.jsx";
import { useSettings } from "../../contexts/SettingsContext.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";
import { useAsync } from "../../hooks/useAsync.js";
import { saveSettings } from "../../services/admin/settingsAdmin.js";
import { listAllPackages } from "../../services/admin/packagesAdmin.js";
import { uploadImage } from "../../services/imageService.js";
import { PACKAGE_STATUS, isPublicStatus } from "../../utils/lots.js";

const EMPTY = { enabled: false, title: "", subtitle: "", images: [], packageIds: [] };

export default function EventAdmin() {
  const { settings, loading } = useSettings();
  const toast = useToast();
  const [confirmUI, confirm] = useConfirm();
  const { data: pkgs } = useAsync(listAllPackages, []);
  const [ev, setEv] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [tplName, setTplName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !ev) { setEv({ ...EMPTY, ...settings.promoEvent }); setTemplates(settings.promoTemplates || []); }
  }, [loading, settings, ev]);
  if (!ev) return <PageLoader />;

  async function persist(nextEv = ev, nextTpl = templates, msg = "Evento salvo. O site já foi atualizado.") {
    setSaving(true);
    try { await saveSettings({ promoEvent: nextEv, promoTemplates: nextTpl }); toast.success(msg); }
    catch { toast.error("Não foi possível salvar."); } finally { setSaving(false); }
  }

  const imgs = ev.images || [];
  const move = (i, d) => { const a = [...imgs]; [a[i], a[i + d]] = [a[i + d], a[i]]; setEv({ ...ev, images: a }); };
  const togglePkg = (id) => setEv({ ...ev, packageIds: ev.packageIds.includes(id) ? ev.packageIds.filter((x) => x !== id) : [...ev.packageIds, id] });

  return (
    <>
      {confirmUI}
      <AdminHeader title="Evento promocional" text="Seção logo abaixo do topo da página inicial, para datas como Dia das Mães, Dia das Crianças ou Natal."
        actions={<button className="btn-primary" onClick={() => persist()} disabled={saving}>{saving ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />} Salvar</button>} />

      <div className="space-y-6">
        <Section title="Exibição">
          <div className="flex flex-wrap items-center gap-4">
            <div className="min-w-64 flex-1"><Toggle label="Mostrar o evento na página inicial" checked={ev.enabled} onChange={(v) => setEv({ ...ev, enabled: v })} /></div>
            <Badge tone={settings.promoEvent?.enabled ? "success" : "muted"}>{settings.promoEvent?.enabled ? "Visível no site agora" : "Oculto no site agora"}</Badge>
            <button className="btn-outline btn-sm" disabled={saving} onClick={() => { const n = { ...ev, enabled: !settings.promoEvent?.enabled }; setEv(n); persist(n, templates, n.enabled ? "Evento visível no site." : "Evento ocultado."); }}>
              {settings.promoEvent?.enabled ? <><EyeOff className="h-4 w-4" /> Ocultar agora</> : <><Eye className="h-4 w-4" /> Mostrar agora</>}
            </button>
          </div>
        </Section>

        <Section title="Título e subtítulo">
          <div className="grid gap-4">
            <TextField label="Título" placeholder="Dia das Mães" value={ev.title} maxLength={90} onChange={(e) => setEv({ ...ev, title: e.target.value })} />
            <TextArea label="Subtítulo" rows={2} placeholder="Faça o melhor para quem te criou." value={ev.subtitle} maxLength={280} onChange={(e) => setEv({ ...ev, subtitle: e.target.value })} />
          </div>
        </Section>

        <Section title="Carrossel de imagens" text="Até 10 imagens, de preferência horizontais. Elas passam sozinhas no site.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {imgs.map((img, i) => (
              <div key={img.path || img.url} className="space-y-2">
                <img src={img.thumbUrl || img.url} alt="" className="aspect-video w-full rounded-xl object-cover" />
                <input className="field-input !py-2 text-sm" placeholder="Descrição da imagem" value={img.alt || ""}
                  onChange={(e) => setEv({ ...ev, images: imgs.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)) })} />
                <div className="flex gap-1">
                  <button className="btn-ghost btn-sm" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Antes"><ArrowUp className="h-4 w-4 -rotate-90" /></button>
                  <button className="btn-ghost btn-sm" disabled={i === imgs.length - 1} onClick={() => move(i, 1)} aria-label="Depois"><ArrowDown className="h-4 w-4 -rotate-90" /></button>
                  <button className="btn-ghost btn-sm ml-auto text-danger" onClick={() => setEv({ ...ev, images: imgs.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /> Remover</button>
                </div>
              </div>
            ))}
            {imgs.length < 10 && (
              <ImageInput aspect="aspect-video" value=""
                onUpload={async (file, p) => {
                  const img = await uploadImage(file, "events", { onProgress: p });
                  setEv((x) => ({ ...x, images: [...(x.images || []), { url: img.url, thumbUrl: img.thumbUrl, path: img.path, thumbPath: img.thumbPath, alt: "" }] }));
                }} />
            )}
          </div>
        </Section>

        <Section title="Pacotes do evento" text="Escolha os pacotes criados para este evento. Só pacotes publicados aparecem no site.">
          {!pkgs ? <Spinner /> : !pkgs.filter((p) => !p.archived).length ? <p className="text-sm text-ink-muted">Crie os pacotes em Pacotes primeiro.</p> : (
            <div className="grid gap-2 sm:grid-cols-2">
              {pkgs.filter((p) => !p.archived).map((p) => {
                const on = ev.packageIds.includes(p.id);
                return (
                  <label key={p.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${on ? "border-wine-900 bg-wine-50" : "border-ink/10 bg-surface"}`}>
                    <input type="checkbox" className="accent-wine-900" checked={on} onChange={() => togglePkg(p.id)} />
                    <span className="flex-1 text-sm font-medium">{p.name}</span>
                    <Badge tone={PACKAGE_STATUS[p.status]?.tone}>{PACKAGE_STATUS[p.status]?.label}</Badge>
                  </label>
                );
              })}
            </div>
          )}
          {pkgs && ev.packageIds.some((id) => { const p = pkgs.find((x) => x.id === id); return p && !isPublicStatus(p.status); }) && (
            <p className="mt-3 text-xs text-warning">Há pacote selecionado que não está publicado: ele só aparece no site depois de publicado.</p>
          )}
        </Section>

        <Section title="Modelos do evento" text="Salve a configuração atual (título, subtítulo, imagens e pacotes) para reaproveitar em outro ano ou data.">
          <div className="flex flex-wrap gap-2">
            <input className="field-input !w-64 !py-2" placeholder="Nome do modelo (ex.: Dia das Mães)" value={tplName} maxLength={50} onChange={(e) => setTplName(e.target.value)} />
            <button className="btn-outline btn-sm" disabled={!tplName.trim() || saving} onClick={() => {
              const { enabled, ...content } = ev;
              const next = [...templates.filter((t) => t.name !== tplName.trim()), { name: tplName.trim(), ...content }];
              setTemplates(next); setTplName(""); persist(ev, next, "Modelo salvo.");
            }}><Upload className="h-4 w-4" /> Salvar como modelo</button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {!templates.length && <p className="text-sm text-ink-muted">Nenhum modelo salvo.</p>}
            {templates.map((t) => (
              <div key={t.name} className="rounded-2xl border border-ink/10 bg-surface p-3">
                {t.images?.[0] && <img src={t.images[0].thumbUrl || t.images[0].url} alt="" className="mb-2 aspect-video w-full rounded-lg object-cover" />}
                <p className="font-medium">{t.name}</p>
                <p className="truncate text-xs text-ink-muted">{t.title} · {t.images?.length || 0} imagem(ns) · {t.packageIds?.length || 0} pacote(s)</p>
                <div className="mt-2 flex gap-1">
                  <button className="btn-outline btn-sm" onClick={async () => {
                    if (!(await confirm({ title: `Aplicar “${t.name}”?`, text: "Substitui título, subtítulo, imagens e pacotes atuais (ainda é preciso salvar)." }))) return;
                    const { name, ...content } = t; setEv({ ...ev, ...content });
                  }}>Aplicar</button>
                  <button className="btn-ghost btn-sm text-danger" aria-label={`Excluir ${t.name}`} onClick={async () => {
                    if (!(await confirm({ title: "Excluir modelo?", danger: true, confirmLabel: "Excluir" }))) return;
                    const next = templates.filter((x) => x.name !== t.name); setTemplates(next); persist(ev, next, "Modelo excluído.");
                  }}><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </>
  );
}
