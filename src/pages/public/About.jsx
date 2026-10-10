import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader.jsx";
import Reveal from "../../components/common/Reveal.jsx";
import SmartImage from "../../components/common/SmartImage.jsx";
import WhatsAppLink from "../../components/common/WhatsAppLink.jsx";
import { WhatsAppIcon } from "../../components/common/Icons.jsx";
import { useSettings } from "../../contexts/SettingsContext.jsx";
import { useDocumentMeta } from "../../hooks/useDocumentMeta.js";
import { FALLBACK_IMAGES } from "../../config/defaults.js";
import { paragraphs } from "../../utils/text.js";
import { waMessages } from "../../utils/whatsapp.js";

export default function About() {
  const { settings } = useSettings();
  const { about } = settings;
  useDocumentMeta({ title: "Sobre", description: paragraphs(about.text)[0] });
  const photo = about.photoUrl ? { url: about.photoUrl, thumbUrl: about.photoThumbUrl, alt: about.photoAlt || "" } : FALLBACK_IMAGES.about;
  return (
    <>
      <PageHeader eyebrow="Sobre" title={about.title} />
      <section className="container-x py-20 sm:py-28">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
          <Reveal className="mx-auto w-full max-w-md lg:col-span-5 lg:sticky lg:top-28 lg:self-start">
            <SmartImage src={photo.url} thumb={photo.thumbUrl} alt={photo.alt} sizes="(min-width:1024px) 40vw, 90vw" className="arch-soft aspect-[4/5] shadow-lift" priority />
          </Reveal>
          <div className="lg:col-span-7">
            <Reveal className="space-y-5 text-lg leading-relaxed text-ink-soft">
              {paragraphs(about.text).map((p) => <p key={p} className="text-pretty">{p}</p>)}
            </Reveal>
            {about.signature && <Reveal className="mt-8 font-display text-4xl italic text-wine-900">{about.signature}</Reveal>}
            <Reveal className="mt-12 flex flex-wrap gap-3">
              <Link to="/pacotes" className="btn-primary">Ver pacotes <ArrowRight className="h-4 w-4" /></Link>
              <WhatsAppLink message={waMessages.general(settings.brandName)} context="sobre" className="btn-outline">
                <WhatsAppIcon className="h-4 w-4" /> Conversar
              </WhatsAppLink>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
