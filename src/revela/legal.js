// Termos de uso e Política de privacidade da Revela.
// Os dados de quem opera a Revela ficam em LEGAL_INFO (troque pelo CNPJ quando abrir a empresa).
// O texto é um modelo e deve ser revisado por um advogado.
export const LEGAL_INFO = {
  company: "Marcelo Vinicius Jordão",
  doc: "CPF 462.899.188-00",
  address: "São Paulo/SP",
  email: "revelaphotography@gmail.com",
  phone: "(11) 97181-3986",
  city: "São Paulo/SP",
  updated: "18 de novembro de 2026",
};

const I = LEGAL_INFO;

export const TERMS = {
  title: "Termos de uso",
  intro: `Estes Termos regem o uso da Revela, plataforma que oferece a fotógrafas e fotógrafos (“você”) site, agenda, pacotes, seleção e entrega de fotos e ferramentas de gestão. A Revela é operada por ${I.company}, ${I.doc}, com endereço em ${I.address} (“Revela”, “nós”). Ao criar uma conta, você declara que leu e aceita estes Termos e a Política de privacidade.`,
  sections: [
    ["1. Conta e cadastro", [
      "Para usar a Revela você precisa ter 18 anos ou mais e informar dados verdadeiros. Você é responsável por manter a sua senha em sigilo e por tudo o que acontece na sua conta.",
      "O endereço do seu site (ex.: studiorevela.vercel.app/seu-estudio) é único. Podemos recusar ou alterar endereços que imitem marcas de terceiros, sejam ofensivos ou induzam a erro.",
    ]],
    ["2. Teste grátis, planos e pagamento", [
      "Toda conta nova tem 30 dias de teste grátis com todas as ferramentas, sem cartão. Ao fim do teste, para continuar, você escolhe um plano.",
      "Os planos são cobrados por mês, de forma recorrente, pela Stripe, até que você cancele. Os preços e limites de cada plano (seleções, prévias, espaço de entrega, prazo de download) estão na página Planos. Créditos avulsos são cobrados à parte.",
      "Se um pagamento falhar, tentaremos de novo por alguns dias. Persistindo a falta de pagamento, a conta pode ser limitada até a regularização.",
      "Podemos reajustar os preços com aviso de pelo menos 30 dias. O novo valor vale a partir da cobrança seguinte ao aviso.",
    ]],
    ["3. Cancelamento e reembolso", [
      "Você pode cancelar quando quiser em Minha assinatura, no painel. O plano continua ativo até o fim do período já pago e não há multa.",
      "Na primeira contratação, você pode desistir em até 7 dias da cobrança e receber o valor de volta, conforme o art. 49 do Código de Defesa do Consumidor. Fora desse caso, não há reembolso proporcional de meses já iniciados.",
    ]],
    ["4. O seu conteúdo", [
      "As fotos, textos e logos que você envia continuam sendo seus. Você nos dá apenas a permissão necessária para guardá-los, processá-los (por exemplo, gerar prévias com marca d'água) e exibi-los no seu site e nas páginas dos seus clientes.",
      "Você garante que tem o direito de usar e publicar esse conteúdo, incluindo a autorização de uso de imagem das pessoas fotografadas e o consentimento dos responsáveis no caso de menores de idade.",
      "É proibido usar a Revela para conteúdo ilegal, pornográfico, discriminatório, que viole direitos de terceiros ou para enviar spam.",
    ]],
    ["5. Fotos de seleção e entrega: prazos", [
      "As prévias de seleção e os arquivos de entrega ficam disponíveis pelo prazo que você define, dentro do limite do seu plano. Depois do prazo, os arquivos são apagados automaticamente dos nossos servidores.",
      "A Revela não é um serviço de backup. Mantenha sempre os originais e as fotos editadas guardados com você.",
    ]],
    ["6. Pagamentos dos seus clientes", [
      "Se você ativar Recebimentos (Pix com a sua chave, Mercado Pago ou InfinitePay), o dinheiro vai direto para a sua conta nesses serviços. A Revela não recebe, não guarda e não repassa esses valores.",
      "Questões sobre esses pagamentos, como estornos, disputas e taxas, são resolvidas entre você, o seu cliente e o serviço de pagamento escolhido.",
    ]],
    ["7. Polaroidy (assistente com IA)", [
      "A Polaroidy usa inteligência artificial para responder dúvidas e sugerir textos. As respostas podem conter erros: confira antes de usar. Não envie a ela dados sensíveis dos seus clientes.",
    ]],
    ["8. Disponibilidade e responsabilidade", [
      "Trabalhamos para manter a Revela no ar o tempo todo, mas podem ocorrer interrupções para manutenção ou por falhas de terceiros (hospedagem, armazenamento, pagamentos).",
      "Na medida permitida pela lei, a nossa responsabilidade se limita ao valor pago por você nos últimos 3 meses. Não respondemos por lucros cessantes ou por perda de arquivos que você deveria manter em cópia.",
    ]],
    ["9. Suspensão e encerramento", [
      "Podemos suspender ou encerrar contas que violem estes Termos. Se você encerrar a conta, ou ela for encerrada, os seus dados serão apagados conforme a Política de privacidade.",
    ]],
    ["10. Alterações e foro", [
      "Podemos atualizar estes Termos. Mudanças importantes serão avisadas por e-mail ou no painel com antecedência.",
      `Estes Termos seguem as leis do Brasil. Fica eleito o foro da comarca de ${I.city}, ressalvado o direito do consumidor de escolher o foro do seu domicílio.`,
      `Dúvidas: ${I.email} ou WhatsApp ${I.phone}.`,
    ]],
  ],
};

export const PRIVACY = {
  title: "Política de privacidade",
  intro: `Esta Política explica como a Revela, operada por ${I.company} (${I.doc}), trata dados pessoais, de acordo com a Lei Geral de Proteção de Dados (Lei 13.709/2018, LGPD).`,
  sections: [
    ["1. Quem é responsável por cada dado", [
      "Dados das fotógrafas (titulares da conta): a Revela é a controladora.",
      "Dados dos clientes das fotógrafas (quem agenda, escolhe ou baixa fotos): a fotógrafa é a controladora e a Revela atua como operadora, tratando esses dados apenas para prestar o serviço a ela.",
    ]],
    ["2. Que dados coletamos", [
      "Da fotógrafa: nome, nome do estúdio, e-mail, WhatsApp, senha (guardada de forma cifrada pelo provedor de login), dados do plano e do pagamento da assinatura (os dados do cartão ficam só com a Stripe) e o conteúdo enviado (fotos, textos, logos).",
      "Dos clientes da fotógrafa: nome, WhatsApp, e-mail (se informado), data e horário agendados, fotos escolhidas e comentários deixados na seleção.",
      "De quem visita os sites: dados técnicos de acesso (páginas vistas, aparelho, navegador, cidade aproximada e endereço IP) para estatísticas e segurança, inclusive o registro de tentativas de captura de tela nas páginas de seleção protegidas.",
    ]],
    ["3. Para que usamos", [
      "Prestar o serviço: manter o site no ar, receber agendamentos, gerar prévias protegidas, entregar fotos e mostrar estatísticas para a fotógrafa.",
      "Cobrar a assinatura, prevenir fraudes, dar suporte e cumprir obrigações legais.",
      "Enviar avisos importantes sobre a conta. Mensagens de novidades só com a sua permissão, e você pode sair quando quiser.",
    ]],
    ["4. Com quem compartilhamos", [
      "Usamos fornecedores que tratam dados em nosso nome, com contratos e medidas de segurança: Google Firebase (banco de dados e login), Vercel (hospedagem), Cloudflare R2 (armazenamento de fotos), Stripe (pagamento da assinatura) e Anthropic (assistente Polaroidy).",
      "Se a fotógrafa ativar Recebimentos, os dados necessários ao pagamento do sinal são enviados ao Mercado Pago ou à InfinitePay, conforme a escolha dela.",
      "Alguns desses fornecedores ficam fora do Brasil. Nesses casos, a transferência segue as hipóteses da LGPD (art. 33).",
      "Não vendemos dados pessoais.",
    ]],
    ["5. Por quanto tempo guardamos", [
      "Prévias de seleção e arquivos de entrega: até o fim do prazo definido pela fotógrafa, e então são apagados automaticamente.",
      "Dados da conta: enquanto a conta existir. Após o encerramento, apagamos em até 90 dias, exceto o que a lei exige guardar (por exemplo, registros de acesso por 6 meses e dados fiscais pelo prazo legal).",
    ]],
    ["6. Segurança", [
      "Usamos conexão criptografada (HTTPS), regras de acesso que separam os dados de cada estúdio, links temporários para fotos e senhas de acesso para as páginas dos clientes. Nenhum sistema é 100% seguro, mas trabalhamos para proteger os seus dados e avisaremos em caso de incidente relevante.",
    ]],
    ["7. Seus direitos", [
      "Você pode pedir: confirmação de que tratamos seus dados, acesso, correção, anonimização ou exclusão, portabilidade, informação sobre compartilhamento e revogação do consentimento.",
      `Fotógrafas podem pedir pelo e-mail ${I.email} ou pelo WhatsApp ${I.phone}. Clientes de uma fotógrafa devem falar primeiro com ela, que é a responsável pelos seus dados; podemos ajudá-la a atender o pedido.`,
    ]],
    ["8. Cookies e armazenamento local", [
      "Usamos o armazenamento do navegador apenas para o funcionamento do serviço, como manter você conectada, lembrar preferências e saber quais tutoriais você já viu. Não usamos cookies de publicidade.",
    ]],
    ["9. Contato e atualizações", [
      `Encarregado de dados (DPO): ${I.company}, ${I.email}, WhatsApp ${I.phone}.`,
      "Podemos atualizar esta Política. A data da última versão fica no topo desta página.",
    ]],
  ],
};
