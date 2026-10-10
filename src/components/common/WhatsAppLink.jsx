import { useSettings } from "../../contexts/SettingsContext.jsx";
import { whatsappLink } from "../../utils/whatsapp.js";
import { track } from "../../services/analyticsService.js";

/** Link para o WhatsApp oficial da fotógrafa, com mensagem de contexto. */
export default function WhatsAppLink({ message, context = "geral", className, children, ...rest }) {
  const { settings } = useSettings();
  const href = whatsappLink(settings.contact.whatsapp, message);
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} onClick={() => track.whatsapp(context)} {...rest}>
      {children}
    </a>
  );
}
