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
