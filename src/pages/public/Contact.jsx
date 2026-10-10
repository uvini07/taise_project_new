import { useState } from "react";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader.jsx";
import Reveal from "../../components/common/Reveal.jsx";
import WhatsAppLink from "../../components/common/WhatsAppLink.jsx";
import { InstagramIcon, WhatsAppIcon } from "../../components/common/Icons.jsx";
import { useSettings } from "../../contexts/SettingsContext.jsx";
import { useDocumentMeta } from "../../hooks/useDocumentMeta.js";
import { waMessages } from "../../utils/whatsapp.js";

const TOPICS = [
  ["quote", "Solicitar orçamento"],
  ["availability", "Datas disponíveis"],
  ["general", "Outras dúvidas"],
];

export default function Contact() {
  const { settings } = useSettings();
  const { contact, social } = settings;
  const [showMap, setShowMap] = useState(false);
  useDocumentMeta({ title: "Contato", description: `Fale com a ${settings.brandName} pelo WhatsApp ${contact.phone}.` });
  const fullAddress = [contact.address, contact.addressLine2, contact.city].filter(Boolean).join(", ");
  const msg = { quote: waMessages.quote(settings.brandName), availability: waMessages.availability(), general: waMessages.general(settings.brandName) };

  return (
    <>
      <PageHeader eyebrow="Contato" title="Vamos conversar sobre o seu ensaio" text="O jeito mais rápido de falar com a gente é pelo WhatsApp." />
      <section className="container-x grid gap-10 py-16 lg:grid-cols-2 lg:py-20">
        <Reveal className="space-y-6">
          <div className="card card-pad">
            <h2 className="font-display text-2xl">Sobre o que você quer falar?</h2>
            <div className="mt-5 grid gap-3">
              {TOPICS.map(([k, label]) => (
                <WhatsAppLink key={k} message={msg[k]} context={`contato-${k}`}
                  className="group flex items-center justify-between rounded-2xl border border-ink/10 px-5 py-4 transition hover:border-wine-900 hover:bg-wine-900 hover:text-cream">
                  <span className="font-medium">{label}</span>
                  <WhatsAppIcon className="h-5 w-5 text-gold transition group-hover:text-cream" />
                </WhatsAppLink>
              ))}
            </div>
          </div>
          <ul className="card card-pad space-y-5 text-ink-soft">
            {contact.phone && <li className="flex gap-4"><Phone className="h-5 w-5 shrink-0 text-gold" aria-hidden /><div><p className="text-xs uppercase tracking-wider text-ink-muted">WhatsApp e telefone</p><p className="text-ink">{contact.phone}</p></div></li>}
            {contact.email && <li className="flex gap-4"><Mail className="h-5 w-5 shrink-0 text-gold" aria-hidden /><div><p className="text-xs uppercase tracking-wider text-ink-muted">E-mail</p><a className="link-underline text-ink" href={`mailto:${contact.email}`}>{contact.email}</a></div></li>}
            {social.instagram && <li className="flex gap-4"><InstagramIcon className="h-5 w-5 shrink-0 text-gold" /><div><p className="text-xs uppercase tracking-wider text-ink-muted">Instagram</p><a className="link-underline text-ink" href={social.instagram} target="_blank" rel="noopener noreferrer">{social.instagram.replace(/^https?:\/\/(www\.)?/, "")}</a></div></li>}
            {contact.hours && <li className="flex gap-4"><Clock className="h-5 w-5 shrink-0 text-gold" aria-hidden /><div><p className="text-xs uppercase tracking-wider text-ink-muted">Atendimento</p><p className="whitespace-pre-line text-ink">{contact.hours}</p></div></li>}
          </ul>
        </Reveal>

        {contact.address && (
          <Reveal delay={100} className="card overflow-hidden">
            <div className="card-pad">
              <MapPin className="h-6 w-6 text-gold" aria-hidden />
              <h2 className="mt-3 font-display text-3xl">Onde fica o estúdio</h2>
              <address className="mt-3 not-italic text-ink-soft">
                <span className="block text-lg text-ink">{contact.address}</span>
                {contact.addressLine2 && <span className="block">{contact.addressLine2}</span>}
                {contact.city && <span className="block">{contact.city}</span>}
              </address>
              {contact.studioNote && <p className="mt-4 text-sm text-ink-muted">{contact.studioNote}</p>}
              {contact.mapUrl && <a href={contact.mapUrl} target="_blank" rel="noopener noreferrer" className="btn-outline btn-sm mt-6">Abrir no Google Maps</a>}
            </div>
            <div className="aspect-[4/3] border-t border-ink/5 bg-paper">
              {showMap ? (
                <iframe title="Mapa do estúdio" className="h-full w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&output=embed`} />
              ) : (
                <button onClick={() => setShowMap(true)} className="flex h-full w-full flex-col items-center justify-center gap-2 text-sm text-ink-muted hover:text-ink">
                  <MapPin className="h-6 w-6 text-gold" aria-hidden />
                  Carregar mapa
                  <span className="text-xs">(o mapa é carregado do Google)</span>
                </button>
              )}
            </div>
          </Reveal>
        )}
      </section>
    </>
  );
}
