import { Link } from "react-router-dom";
import { MapPin, Mail, Phone, Clock } from "lucide-react";
import Logo from "../common/Logo.jsx";
import WhatsAppLink from "../common/WhatsAppLink.jsx";
import { Divider } from "../common/SectionHeading.jsx";
import { FacebookIcon, InstagramIcon, PinterestIcon, TikTokIcon, WhatsAppIcon, YoutubeIcon } from "../common/Icons.jsx";
import { useSettings } from "../../contexts/SettingsContext.jsx";
import { waMessages } from "../../utils/whatsapp.js";
import { useNavItems } from "./Header.jsx";
import { sitePath } from "../../config/tenant.js";
import { useLayout } from "../../hooks/useLayout.js";

const SOCIAL = [
  ["instagram", "Instagram", InstagramIcon],
  ["facebook", "Facebook", FacebookIcon],
  ["tiktok", "TikTok", TikTokIcon],
  ["youtube", "YouTube", YoutubeIcon],
  ["pinterest", "Pinterest", PinterestIcon],
];

export default function Footer({ hasVip }) {
  const { settings } = useSettings();
  const { contact, social } = settings;
  const nav = useNavItems(hasVip);
  const year = new Date().getFullYear();
  const layout = useLayout();

  const social_ = SOCIAL.filter(([k]) => social[k]);
  const bottom = (cls) => (
    <div className={`flex flex-col items-center justify-between gap-2 text-xs sm:flex-row ${cls}`}>
      <span>© {year} {settings.legalName || settings.brandName}</span>
      <span className="flex gap-5">
        <Link to={sitePath("/politicas")} className="hover:underline">Políticas e privacidade</Link>
        <Link to="/adm" className="hover:underline">Área restrita</Link>
      </span>
    </div>
  );

  // Minimalista: uma linha só.
  if (layout === "minimalista") {
    return (
      <footer className="mt-24 border-t border-ink/10">
        <div className="container-x flex flex-col gap-6 py-10 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <span className="font-display text-lg text-ink">{settings.brandName}</span>
          <nav aria-label="Rodapé" className="flex flex-wrap gap-x-5 gap-y-2 lowercase">{nav.map((n) => <Link key={n.to} to={n.to} className="hover:text-ink">{n.label}</Link>)}</nav>
          {bottom("text-ink-muted")}
        </div>
      </footer>
    );
  }

  // Revista: colunas separadas por fios, como o expediente de uma revista.
  if (layout === "revista") {
    return (
      <footer className="container-x mt-24">
        <div className="border-t-4 border-double border-ink pt-8">
          <p className="truncate font-display text-[12vw] leading-none text-wine-900 lg:text-[7rem]">{settings.brandName}</p>
          <div className="mt-8 grid gap-8 border-t border-ink/15 pt-8 text-sm sm:grid-cols-3 sm:divide-x sm:divide-ink/15">
            <div><p className="text-[11px] uppercase tracking-[0.24em] text-ink-muted">Expediente</p><p className="mt-3 text-ink-soft">{settings.footerText}</p></div>
            <div className="sm:pl-8"><p className="text-[11px] uppercase tracking-[0.24em] text-ink-muted">Seções</p>
              <ul className="mt-3 grid grid-cols-2 gap-2">{nav.map((n) => <li key={n.to}><Link to={n.to} className="hover:text-wine-900">{n.label}</Link></li>)}</ul></div>
            <div className="sm:pl-8"><p className="text-[11px] uppercase tracking-[0.24em] text-ink-muted">Redação</p>
              <ul className="mt-3 space-y-1 text-ink-soft">{[contact.email, contact.address, contact.city].filter(Boolean).map((l) => <li key={l}>{l}</li>)}</ul></div>
          </div>
          {bottom("mt-10 border-t border-ink/15 py-6 text-ink-muted")}
        </div>
      </footer>
    );
  }

  // Polaroid: papel com borda tracejada, redes em "selos".
  if (layout === "polaroid") {
    return (
      <footer className="mt-24 border-t-2 border-dashed border-ink/20 bg-paper">
        <div className="container-x py-14 text-center">
          <Logo className="mx-auto h-14 w-auto" />
          {settings.footerText && <p className="mx-auto mt-4 max-w-md font-display text-lg italic text-ink-soft">{settings.footerText}</p>}
          <div className="mt-6 flex justify-center gap-3">
            {social_.map(([k, label, Icon], i) => (
              <a key={k} href={social[k]} target="_blank" rel="noopener noreferrer" aria-label={label}
                className={`border-2 border-dashed border-wine-900/40 bg-surface p-3 text-wine-900 transition hover:rotate-0 ${i % 2 ? "rotate-3" : "-rotate-3"}`}><Icon className="h-4 w-4" /></a>
            ))}
            <WhatsAppLink message={waMessages.general(settings.brandName)} context="footer" aria-label="WhatsApp"
              className="rotate-2 border-2 border-dashed border-wine-900/40 bg-surface p-3 text-wine-900 transition hover:rotate-0"><WhatsAppIcon className="h-4 w-4" /></WhatsAppLink>
          </div>
          <nav aria-label="Rodapé" className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 font-display text-lg italic text-ink-soft">
            {nav.map((n) => <Link key={n.to} to={n.to} className="hover:text-wine-900">{n.label}</Link>)}
          </nav>
          {bottom("mt-10 text-ink-muted")}
        </div>
      </footer>
    );
  }

  // Cinema e Imersivo: escuro, centralizado, com o nome grande.
  if (layout === "cinema" || layout === "imersivo") {
    return (
      <footer className="mt-24 bg-black text-white/70">
        <div className="container-x py-16 text-center">
          <p className="font-display text-5xl text-white sm:text-6xl">{settings.brandName}</p>
          {layout === "cinema" && <span className="mx-auto mt-6 block h-px w-24 bg-gold" aria-hidden />}
          <nav aria-label="Rodapé" className="mt-8 flex flex-wrap justify-center gap-x-7 gap-y-3 text-[12px] uppercase tracking-[0.22em]">
            {nav.map((n) => <Link key={n.to} to={n.to} className="hover:text-white">{n.label}</Link>)}
          </nav>
          <div className="mt-8 flex justify-center gap-2">
            {social_.map(([k, label, Icon]) => (
              <a key={k} href={social[k]} target="_blank" rel="noopener noreferrer" aria-label={label} className="rounded-full border border-white/20 p-2.5 hover:border-gold hover:text-white"><Icon className="h-4 w-4" /></a>
            ))}
            <WhatsAppLink message={waMessages.general(settings.brandName)} context="footer" aria-label="WhatsApp" className="rounded-full border border-white/20 p-2.5 hover:border-gold hover:text-white"><WhatsAppIcon className="h-4 w-4" /></WhatsAppLink>
          </div>
          {bottom("mt-12 border-t border-white/10 pt-6 text-white/45")}
        </div>
      </footer>
    );
  }

  // Rodapé claro e centralizado (Dividido e Arco).
  if (layout === "dividido" || layout === "arco") {
    const arco = layout === "arco";
    return (
      <footer className={`mt-24 ${arco ? "bg-paper" : "border-t border-ink/10 bg-ivory"}`}>
        <div className="container-x py-16 text-center">
          <Logo className="mx-auto h-16 w-auto" />
          {settings.footerText && <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-ink-muted">{settings.footerText}</p>}
          <nav aria-label="Rodapé" className="mt-8 flex flex-wrap justify-center gap-x-7 gap-y-3 text-[13px] uppercase tracking-[0.16em] text-ink-soft">
            {nav.map((n) => <Link key={n.to} className="link-underline hover:text-wine-900" to={n.to}>{n.label}</Link>)}
          </nav>
          <div className="mt-8 flex justify-center gap-2">
            {SOCIAL.filter(([k]) => social[k]).map(([k, label, Icon]) => (
              <a key={k} href={social[k]} target="_blank" rel="noopener noreferrer" aria-label={label}
                className="rounded-full border border-ink/15 p-2.5 text-ink-soft transition hover:border-wine-900 hover:text-wine-900"><Icon className="h-4 w-4" /></a>
            ))}
            <WhatsAppLink message={waMessages.general(settings.brandName)} context="footer" aria-label="WhatsApp"
              className="rounded-full border border-ink/15 p-2.5 text-ink-soft transition hover:border-wine-900 hover:text-wine-900"><WhatsAppIcon className="h-4 w-4" /></WhatsAppLink>
          </div>
          {(contact.address || contact.email) && (
            <p className="mt-8 text-sm text-ink-muted">
              {[contact.address, contact.city, contact.email].filter(Boolean).join(" · ")}
            </p>
          )}
          <div className={`mt-10 flex flex-col items-center justify-between gap-2 pt-6 text-xs text-ink-muted sm:flex-row ${arco ? "" : "border-t border-ink/10"}`}>
            <span>© {year} {settings.legalName || settings.brandName}</span>
            <span className="flex gap-5">
              <Link to={sitePath("/politicas")} className="hover:text-ink">Políticas e privacidade</Link>
              <Link to="/adm" className="hover:text-ink">Área restrita</Link>
            </span>
          </div>
        </div>
      </footer>
    );
  }

  const wrap = layout === "diagonal"
    ? "relative mt-24 overflow-hidden bg-wine-950 pt-10 text-cream/80 [clip-path:polygon(0_8%,100%_0,100%_100%,0_100%)]"
    : layout === "mosaico"
      ? "relative mx-3 mb-3 mt-24 overflow-hidden r-box bg-wine-900 text-cream/80 sm:mx-5 sm:mb-5"
      : "relative mt-24 overflow-hidden bg-wine-900 text-cream/80 grain";

  return (
    <footer className={wrap}>
      <div className="container-x relative py-16 sm:py-20">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <Logo tone="light" className="h-20 w-auto" />
            {settings.footerText && <p className="mt-6 max-w-xs text-sm leading-relaxed text-cream/70">{settings.footerText}</p>}
            <div className="mt-6 flex flex-wrap gap-2">
              {SOCIAL.filter(([k]) => social[k]).map(([k, label, Icon]) => (
                <a key={k} href={social[k]} target="_blank" rel="noopener noreferrer" aria-label={label}
                  className="rounded-full border border-cream/20 p-2.5 text-cream/80 transition hover:border-gold-light hover:text-white">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
              <WhatsAppLink message={waMessages.general(settings.brandName)} context="footer" aria-label="WhatsApp"
                className="rounded-full border border-cream/20 p-2.5 text-cream/80 transition hover:border-gold-light hover:text-white">
                <WhatsAppIcon className="h-4 w-4" />
              </WhatsAppLink>
            </div>
          </div>

          <div className="md:col-span-3">
            <h2 className="eyebrow !text-gold-light">Navegação</h2>
            <ul className="mt-5 space-y-3 text-sm">
              {nav.map((n) => <li key={n.to}><Link className="link-underline hover:text-white" to={n.to}>{n.label}</Link></li>)}
              <li><Link className="link-underline hover:text-white" to={sitePath("/politicas")}>Políticas e privacidade</Link></li>
            </ul>
          </div>

          <div className="md:col-span-5">
            <h2 className="eyebrow !text-gold-light">Contato</h2>
            <ul className="mt-5 space-y-4 text-sm">
              {contact.phone && (
                <li className="flex gap-3"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold-light" aria-hidden />
                  <WhatsAppLink message={waMessages.general(settings.brandName)} context="footer-phone" className="link-underline hover:text-white">{contact.phone}</WhatsAppLink></li>
              )}
              {contact.email && (
                <li className="flex gap-3"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold-light" aria-hidden />
                  <a className="link-underline hover:text-white" href={`mailto:${contact.email}`}>{contact.email}</a></li>
              )}
              {contact.address && (
                <li className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-light" aria-hidden />
                  <span>
                    {contact.mapUrl ? <a className="link-underline hover:text-white" href={contact.mapUrl} target="_blank" rel="noopener noreferrer">{contact.address}</a> : contact.address}
                    {contact.addressLine2 && <span className="block text-cream/60">{contact.addressLine2}</span>}
                    {contact.city && <span className="block text-cream/60">{contact.city}</span>}
                  </span></li>
              )}
              {contact.hours && (
                <li className="flex gap-3"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold-light" aria-hidden />
                  <span className="whitespace-pre-line">{contact.hours}</span></li>
              )}
            </ul>
          </div>
        </div>

        <Divider className="mt-14 !text-gold/50" />
        <div className="mt-6 flex flex-col gap-2 text-xs text-cream/50 sm:flex-row sm:items-center sm:justify-between">
          <span>© {year} {settings.legalName || settings.brandName}. Todos os direitos reservados.</span>
          <Link to="/adm" className="hover:text-cream/80">Área restrita</Link>
        </div>
        {layout === "diagonal" && (
          <p className="mt-10 select-none truncate font-display text-[16vw] leading-none text-cream/[.06] lg:text-[11rem]" aria-hidden>{settings.brandName}</p>
        )}
      </div>
    </footer>
  );
}
