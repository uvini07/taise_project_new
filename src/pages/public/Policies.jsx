import PageHeader from "../../components/layout/PageHeader.jsx";
import WhatsAppLink from "../../components/common/WhatsAppLink.jsx";
import { useSettings } from "../../contexts/SettingsContext.jsx";
import { useDocumentMeta } from "../../hooks/useDocumentMeta.js";
import { paragraphs } from "../../utils/text.js";
import { waMessages } from "../../utils/whatsapp.js";

// Texto de privacidade padrão: descreve exatamente o que este site coleta e
// como. A fotógrafa pode substituí-lo em Configurações > Políticas.
const DEFAULT_PRIVACY = `Coletamos apenas os dados que você mesmo informa nos formulários do site: nome, WhatsApp, e-mail (opcional) e observações. Eles são usados para responder ao seu pedido de agendamento ou à sua inscrição em uma lista VIP, e para enviar comunicações quando você autorizar.

Esses dados ficam guardados em um banco de dados protegido, acessível somente pela administração do estúdio. Eles não são vendidos nem compartilhados com terceiros.

O site conta visitas de forma anônima (sem identificar você). Cookies do Google Analytics só são usados se você aceitar no aviso de cookies.

Você pode pedir a qualquer momento a correção ou a exclusão dos seus dados pelo WhatsApp. As inscrições em listas VIP são excluídas automaticamente ao fim do prazo de retenção de cada campanha.`;

function Block({ id, title, text, fallback }) {
  const { settings } = useSettings();
  const ps = paragraphs(text);
  return (
    <section id={id} className="scroll-mt-28 border-b border-ink/5 py-10 last:border-0">
      <h2 className="display-md">{title}</h2>
      <div className="mt-5 space-y-4 leading-relaxed text-ink-soft">
        {ps.length ? ps.map((p) => <p key={p} className="whitespace-pre-line">{p}</p>) : (
          <p>{fallback} <WhatsAppLink message={waMessages.general(settings.brandName)} context={`politicas-${id}`} className="text-wine-900 underline underline-offset-2">Fale com a gente pelo WhatsApp</WhatsAppLink>.</p>
        )}
      </div>
    </section>
  );
}

export default function Policies() {
  const { settings } = useSettings();
  const { policies } = settings;
  useDocumentMeta({ title: "Políticas e privacidade" });
  return (
    <>
      <PageHeader eyebrow="Informações" title="Políticas e privacidade" />
      <div className="container-x max-w-3xl py-8">
        <Block id="agendamento" title="Agendamento e pagamento" text={policies.booking} fallback="As condições de reserva e pagamento são combinadas no atendimento." />
        <Block id="cancelamento" title="Remarcação e cancelamento" text={policies.cancellation} fallback="As regras de remarcação e cancelamento são informadas no momento da contratação." />
        <Block id="privacidade" title="Privacidade e dados pessoais (LGPD)" text={policies.privacy || DEFAULT_PRIVACY} />
      </div>
    </>
  );
}
