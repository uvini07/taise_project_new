// Tutoriais de cada ferramenta do painel. Cada passo tem um título, um texto
// curto e uma "cena" ilustrada: o ícone da etapa e os botões/elementos que a
// fotógrafa vai procurar na tela (ui), desenhados como na própria interface.
import {
  BarChart3, CalendarDays, Check, CreditCard, Crown, Download, Eye, Filter, Heart, ImagePlus, Images, KeyRound, LayoutDashboard,
  Link2, MessageCircle, MousePointerClick, Package, PackageCheck, Palette, QrCode, Save, Send, Settings, Share2, Sparkles, Star,
  Type, Upload, Wallet, Wand2,
} from "lucide-react";

export const TUTORIALS = {
  dashboard: {
    title: "Visão geral",
    steps: [
      { icon: LayoutDashboard, title: "O resumo do seu dia", text: "Aqui você vê o que precisa da sua atenção: pedidos de agendamento, seleções finalizadas e entregas perto de vencer.", ui: ["Precisa de você", "Hoje"] },
      { icon: Sparkles, title: "A Polaroidy te ajuda", text: "A bolinha no canto da tela é a Polaroidy, sua assistente. Pergunte qualquer coisa sobre o painel ou peça ajuda para escrever textos.", ui: ["Polaroidy"] },
      { icon: Wand2, title: "Comece pelo seu site", text: "Se ainda não montou o site, vá em Meu site › Editar meu site. Em poucos minutos ele fica no ar.", ui: ["Editar meu site"] },
    ],
  },
  agenda: {
    title: "Agenda",
    steps: [
      { icon: CalendarDays, title: "Seus horários disponíveis", text: "Em Disponibilidade, marque os dias e horários em que você atende. O site só oferece ao cliente o que estiver livre.", ui: ["Disponibilidade", "Salvar"] },
      { icon: Check, title: "Confirme os pedidos", text: "Quando alguém agenda pelo site, o pedido aparece em “Aguardando sua resposta”. Confirme ou recuse com um toque. O horário fica reservado até você decidir.", ui: ["Confirmar", "Recusar"] },
      { icon: QrCode, title: "Sinal e quitação", text: "Cada pedido mostra se está com o sinal pendente, sinal pago (e quanto falta) ou quitado. Pela InfinitePay a confirmação é automática; no Pix com a sua chave ou em dinheiro, abra o pedido e marque “Sinal pago” ou “Quitado”.", ui: ["Sinal pago", "Quitado"] },
      { icon: MessageCircle, title: "Fale com o cliente", text: "Abra um agendamento para ver os dados, remarcar, anotar detalhes e chamar o cliente no WhatsApp.", ui: ["WhatsApp", "Remarcar"] },
    ],
  },
  selecao: {
    title: "Seleção de fotos",
    steps: [
      { icon: Heart, title: "Crie a página do ensaio", text: "Clique em “Nova seleção”, coloque o nome do cliente, quantas fotos o pacote inclui e o prazo para escolher.", ui: ["+ Nova seleção"] },
      { icon: Upload, title: "Suba as fotos", text: "Arraste as fotos (ou escolha a pasta). Elas viram prévias leves com marca d'água e proteção contra print. O arquivo original não sai do seu computador.", ui: ["Escolher fotos", "Escolher pasta"] },
      { icon: Images, title: "Escolha a capa", text: "Em “Foto de capa”, escolha a foto que abre a galeria do cliente. Ela aparece sem marca d'água, só na abertura.", ui: ["Escolher capa"] },
      { icon: Send, title: "Libere e envie o link", text: "Clique em “Liberar para o cliente” e mande o link com a senha pelo WhatsApp. O cliente marca as favoritas e pode deixar um pedido em cada foto.", ui: ["Liberar para o cliente", "Copiar link"] },
      { icon: Download, title: "Edite as escolhidas", text: "Na aba Escolhidas, copie os nomes para o Lightroom ou baixe o CSV, que traz também os pedidos do cliente (“tirar espinha”, “sem edição”…).", ui: ["Copiar nomes", "CSV"] },
    ],
  },
  entrega: {
    title: "Entrega final",
    steps: [
      { icon: PackageCheck, title: "Crie a entrega", text: "Clique em “Nova entrega” ou, numa seleção finalizada, em “Criar entrega final”. Defina por quantos dias o cliente pode baixar.", ui: ["+ Nova entrega"] },
      { icon: Upload, title: "Suba as fotos editadas", text: "Envie as fotos em alta, do jeito que quer entregar. Elas não são comprimidas. Se veio de uma seleção, conferimos se faltou alguma escolhida.", ui: ["Escolher fotos"] },
      { icon: Images, title: "Capa da galeria", text: "Escolha uma foto de capa. O cliente vê uma galeria bonita, com abertura animada e todas as fotos em grade.", ui: ["Escolher capa"] },
      { icon: Share2, title: "Libere o download", text: "Clique em “Liberar download” e mande o link. O cliente baixa foto a foto ou tudo de uma vez (no celular, vai direto para a galeria dele).", ui: ["Liberar download", "Baixar todas"] },
    ],
  },
  editor: {
    title: "Editar meu site",
    steps: [
      { icon: Wand2, title: "Veja o site mudando na hora", text: "À esquerda ficam as opções; à direita, o seu site de verdade. Tudo o que você muda aparece na prévia na mesma hora.", ui: ["Prévia ao vivo"] },
      { icon: MousePointerClick, title: "Clique para editar", text: "Com “Clicar para editar” ligado, clique em qualquer parte do site (título, foto, contato) e o campo certo abre aqui.", ui: ["Clicar para editar"] },
      { icon: Palette, title: "Modelo, cores e fontes", text: "Escolha um dos modelos, uma paleta de cores e as fontes. Em Fontes, “Ver mais fontes” abre todas com busca.", ui: ["Modelo do site", "Ver mais fontes"] },
      { icon: Save, title: "Salve para publicar", text: "Nada vai para o ar até você clicar em “Salvar alterações”. Um pontinho dourado avisa quando há mudanças não salvas.", ui: ["Salvar alterações"] },
    ],
  },
  configuracoes: {
    title: "Conteúdo do site",
    steps: [
      { icon: Settings, title: "Textos e informações", text: "Aqui ficam os textos do site, contato, políticas, depoimentos e como o site aparece no Google e no WhatsApp.", ui: ["Contato", "Depoimentos", "SEO"] },
      { icon: ImagePlus, title: "Fotos de destaque", text: "Escolha até 5 fotos para o topo do site, todas de uma vez. A primeira é a principal.", ui: ["Escolher fotos (até 5)"] },
      { icon: Save, title: "Não esqueça de salvar", text: "Depois de mexer, clique em “Salvar alterações” no fim da página para publicar.", ui: ["Salvar alterações"] },
    ],
  },
  pacotes: {
    title: "Pacotes",
    steps: [
      { icon: Package, title: "Crie seus pacotes", text: "Cada pacote tem nome, descrição, o que está incluso, fotos e preço. Eles aparecem na página Pacotes do site.", ui: ["+ Novo pacote"] },
      { icon: Star, title: "Lotes e preços", text: "Use lotes para mudar o preço com o tempo (ex.: 1º lote mais barato, com poucas vagas). Quando as vagas acabam, o próximo lote entra sozinho.", ui: ["1º lote", "Vagas"] },
      { icon: CalendarDays, title: "Agendamento direto", text: "Escolha se o cliente agenda pelo site (com data e horário) ou se chama no WhatsApp.", ui: ["Agendar pelo site", "WhatsApp"] },
    ],
  },
  galeria: {
    title: "Galeria",
    steps: [
      { icon: Images, title: "Seu portfólio", text: "Suba as fotos que representam o seu trabalho. Elas aparecem na página Galeria do site.", ui: ["Adicionar fotos"] },
      { icon: Filter, title: "Organize em categorias", text: "Crie categorias (Gestante, Família, Newborn…) para o visitante filtrar o que procura.", ui: ["Categorias"] },
      { icon: Star, title: "Destaques", text: "Marque as melhores como destaque para elas aparecerem também no início do site.", ui: ["Destaque"] },
    ],
  },
  recebimentos: {
    title: "Recebimentos",
    steps: [
      { icon: QrCode, title: "Receba o sinal pelo site", text: "Escolha como o cliente paga o sinal ao agendar: Pix com a sua chave ou InfinitePay (o Mercado Pago chega em breve). O dinheiro vai direto para você.", ui: ["Pix", "InfinitePay"] },
      { icon: Wallet, title: "Defina o sinal", text: "Escolha a porcentagem do valor do pacote que o cliente paga ao agendar (ex.: 30%).", ui: ["Sinal (%)"] },
      { icon: KeyRound, title: "Conecte a sua conta", text: "No Pix, basta a sua chave. Na InfinitePay, a sua InfiniteTag (o @ que aparece no app).", ui: ["Chave Pix", "InfiniteTag"] },
      { icon: Check, title: "Acompanhe na Agenda", text: "Cada pedido mostra se o sinal está pago. A InfinitePay confirma sozinha; no Pix com a sua chave, você marca como pago.", ui: ["Sinal pago"] },
    ],
  },
  financeiro: {
    title: "Financeiro",
    steps: [
      { icon: Wallet, title: "Entradas e saídas", text: "Registre o que você recebe dos clientes e o que gasta (equipamento, cenário, impostos).", ui: ["+ Lançamento"] },
      { icon: CreditCard, title: "O que falta receber", text: "Lance um ensaio com o valor total e vá registrando os pagamentos. O painel mostra o saldo em aberto.", ui: ["+ Pagamento", "Em aberto"] },
      { icon: BarChart3, title: "Veja o mês", text: "Os gráficos mostram quanto entrou, quanto saiu e o seu lucro em cada período.", ui: ["Este mês"] },
    ],
  },
  assinatura: {
    title: "Minha assinatura",
    steps: [
      { icon: CreditCard, title: "Seu plano da Revela", text: "Veja o seu plano, até quando vai o teste grátis e a próxima cobrança.", ui: ["Plano atual"] },
      { icon: Settings, title: "Mude quando quiser", text: "Troque de plano, atualize o cartão ou cancele pelo portal de pagamento seguro.", ui: ["Gerenciar assinatura"] },
    ],
  },
  evento: {
    title: "Evento promocional",
    steps: [
      { icon: Sparkles, title: "Datas especiais", text: "Crie uma campanha para Natal, Dia das Mães, Dia das Crianças… O site ganha um destaque com o tema e as cores da data.", ui: ["Criar evento"] },
      { icon: Type, title: "Textos e prazo", text: "Escreva a chamada, escolha as datas de início e fim e o pacote em promoção. Quando acaba, o site volta ao normal sozinho.", ui: ["Início", "Fim"] },
    ],
  },
  vip: {
    title: "Lista VIP",
    steps: [
      { icon: Crown, title: "Clientes que querem saber primeiro", text: "Visitantes entram na lista VIP pelo site para receber as novidades antes de todo mundo.", ui: ["Lista VIP"] },
      { icon: Link2, title: "Campanhas exclusivas", text: "Abra uma campanha VIP com preço especial: só quem está na lista consegue agendar por aquele valor.", ui: ["Nova campanha"] },
    ],
  },
  analytics: {
    title: "Visitas do site",
    steps: [
      { icon: Eye, title: "Quem visita o seu site", text: "Veja quantas pessoas entraram, quais páginas mais olharam e de onde vieram (Instagram, Google, WhatsApp).", ui: ["Visitas", "Páginas"] },
      { icon: MessageCircle, title: "Cliques no WhatsApp", text: "Acompanhe quantas pessoas clicaram para falar com você e quais pacotes chamaram mais atenção.", ui: ["Cliques"] },
    ],
  },
};

/** Tutorial da tela aberta, pelo endereço (/adm/selecao/123 → "selecao"). */
export function tutorialKeyFor(pathname) {
  const seg = String(pathname || "").replace(/^\/adm\/?/, "").split("/")[0] || "dashboard";
  return TUTORIALS[seg] ? seg : null;
}
