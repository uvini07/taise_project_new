import WhatsAppLink from "../common/WhatsAppLink.jsx";
import { WhatsAppIcon } from "../common/Icons.jsx";
import { useSettings } from "../../contexts/SettingsContext.jsx";
import { waMessages } from "../../utils/whatsapp.js";

export default function WhatsAppFab() {
  const { settings } = useSettings();
  if (!settings.display.showWhatsappFab) return null;
  return (
    <WhatsAppLink
      message={waMessages.general(settings.brandName)}
      context="fab"
      aria-label="Conversar no WhatsApp"
      className="group fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-wine-900 text-cream shadow-lift transition hover:-translate-y-0.5 hover:bg-wine-800 sm:bottom-7 sm:right-7"
    >
      <span className="absolute inset-0 rounded-full ring-1 ring-gold/40 transition group-hover:ring-4 group-hover:ring-gold/20" aria-hidden />
      <WhatsAppIcon className="h-6 w-6" />
    </WhatsAppLink>
  );
}
