// Polaroid, a assistente da fotógrafa no painel da Revela.
//
// Esta função só conversa com a IA (Claude Haiku 5.5). Os dados do estúdio
// (agenda, financeiro) são lidos pelo próprio painel, com o login da fotógrafa,
// e voltam para cá como resultado das ferramentas. Assim a chave da IA fica só
// na Vercel (ANTHROPIC_API_KEY) e o agente nunca enxerga outro estúdio.
import Anthropic from "@anthropic-ai/sdk";
import { createRemoteJWKSet, jwtVerify } from "jose";

const MODEL = "claude-haiku-5-5";
const PROJECT = process.env.VITE_FIREBASE_PROJECT_ID || "taisefoto";
const JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"));
const DAILY_LIMIT = 150; // perguntas por conta por dia (por instância da função)

// Ferramentas: o painel executa e devolve o resultado. Só leitura.
export const TOOLS = [
  {
    name: "agenda",
    description: "Lista os agendamentos do estúdio entre duas datas (inclusive). Use para perguntas sobre agenda, ensaios, compromissos ou horários marcados. Para 'hoje', use a data de hoje nas duas pontas.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        de: { type: "string", description: "Data inicial no formato AAAA-MM-DD" },
        ate: { type: "string", description: "Data final no formato AAAA-MM-DD" },
      },
      required: ["de", "ate"],
      additionalProperties: false,
    },
  },
  {
    name: "pedidos_aguardando",
    description: "Lista os pedidos de agendamento feitos pelo site que ainda esperam confirmação da fotógrafa.",
    strict: true,
    input_schema: { type: "object", properties: {}, required: [], additionalProperties: false },
  },
  {
    name: "pagamentos_pendentes",
    description: "Lista os clientes com pagamento em aberto (pendente, parcial ou vencido), com valor, vencimento e WhatsApp. Use para 'quem não me pagou', 'cobrar clientes', 'o que tenho a receber'. O painel mostra sozinho um botão 'Cobrar no WhatsApp' para cada cliente.",
    strict: true,
    input_schema: { type: "object", properties: {}, required: [], additionalProperties: false },
  },
];

const SYSTEM = `Você é a Polaroid, a assistente virtual da fotógrafa dentro do painel da Revela (plataforma de site, agenda, seleção e entrega de fotos).

Como responder:
- Português do Brasil, simpático, direto e curto (no máximo uns 6 itens ou linhas). Use **negrito** e listas com "- " quando ajudar.
- Dados do estúdio (agenda, pedidos, pagamentos): SEMPRE use as ferramentas. Nunca invente horários, nomes, valores ou datas. Se a ferramenta não trouxer nada, diga isso.
- Você só lê informações e sugere. Você não envia mensagens, não cobra, não confirma nem cancela nada. Para cobranças, diga que os botões "Cobrar no WhatsApp" aparecem logo abaixo da resposta e que é só a fotógrafa tocar para enviar.
- Valores em reais no formato R$ 1.234,56. Datas no formato 25/12 (com o dia da semana quando ajudar).
- Para perguntas de "onde fica" ou "como faço" no painel, use o mapa abaixo e coloque o link no formato [Nome da tela](/adm/caminho).
- Se não souber ou for algo fora do painel, diga que não sabe e sugira o botão "Ajuda pelo WhatsApp" no menu.

Mapa do painel:
- Editar o site com prévia ao vivo (modelo, cores, fontes, nome e logo, fotos do topo, Sobre, contato, rodapé): [Editar meu site](/adm/editor). Partes específicas: logo → [Nome e logo](/adm/editor?painel=identidade); fotos do topo → [Topo da página](/adm/editor?painel=topo); texto e foto do Sobre → [Sobre você](/adm/editor?painel=sobre); cores → [Cores](/adm/editor?painel=cores); modelo do site → [Modelo do site](/adm/editor?painel=modelo).
- Mais opções de cor e fonte: [Estilo do site](/adm/estilo).
- Textos, depoimentos, políticas, Google e exibição: [Conteúdo do site](/adm/configuracoes).
- Pacotes, preços e lotes (fases de preço com vagas): [Pacotes](/adm/pacotes).
- Fotos e categorias da galeria do site: [Galeria](/adm/galeria).
- Evento promocional (Natal, Dia das Mães) na página inicial: [Evento promocional](/adm/evento).
- Campanhas e inscritos da lista VIP: [Lista VIP](/adm/vip).
- Agendamentos, confirmar pedidos, dias e horários de atendimento, bloquear horário: [Agenda](/adm/agenda).
- Seleção de fotos pelo cliente: [Seleção de fotos](/adm/selecao). Entrega das fotos editadas: [Entrega final](/adm/entrega).
- Receitas, despesas, pagamentos, lançar receita de um agendamento: [Financeiro](/adm/financeiro).
- Visitas do site: [Visitas do site](/adm/analytics).`;

const used = new Map(); // uid → { day, n }
function overLimit(uid) {
  const day = new Date().toISOString().slice(0, 10);
  const u = used.get(uid);
  if (!u || u.day !== day) { used.set(uid, { day, n: 1 }); return false; }
  u.n += 1;
  return u.n > DAILY_LIMIT;
}

async function userFrom(req) {
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWKS, { issuer: `https://securetoken.google.com/${PROJECT}`, audience: PROJECT });
    return payload.sub ? payload : null;
  } catch {
    return null;
  }
}

const isText = (v, max) => typeof v === "string" && v.length <= max;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: "A Polaroid ainda não foi ligada: falta a chave da IA (ANTHROPIC_API_KEY) na Vercel." });
  }
  const user = await userFrom(req);
  if (!user) return res.status(401).json({ error: "Entre no painel para usar a Polaroid." });
  if (overLimit(user.sub)) return res.status(429).json({ error: "Limite de perguntas de hoje atingido. Amanhã a Polaroid volta." });

  const { messages, context = {} } = req.body || {};
  if (!Array.isArray(messages) || !messages.length || messages.length > 60 || JSON.stringify(messages).length > 120000) {
    return res.status(400).json({ error: "Conversa inválida ou longa demais. Comece uma nova conversa." });
  }
  const today = isText(context.today, 10) ? context.today : new Date().toISOString().slice(0, 10);
  const weekday = isText(context.weekday, 20) ? context.weekday : "";
  const studio = isText(context.studioName, 120) ? context.studioName : "o estúdio";
  const name = isText(context.firstName, 60) ? context.firstName : "";

  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      // Parte fixa primeiro (cacheável); dados do dia por último.
      system: [
        { type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } },
        { type: "text", text: `Estúdio: ${studio}. Fotógrafa: ${name || "(sem nome)"}. Hoje é ${weekday} ${today}.` },
      ],
      tools: TOOLS,
      output_config: { effort: "low" },
      messages,
    });
    return res.status(200).json({ content: response.content, stop_reason: response.stop_reason });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return res.status(429).json({ error: "A Polaroid está ocupada agora. Tente de novo em instantes." });
    if (err instanceof Anthropic.AuthenticationError) return res.status(503).json({ error: "A chave da IA na Vercel não foi aceita. Confira a ANTHROPIC_API_KEY." });
    if (err instanceof Anthropic.BadRequestError) return res.status(400).json({ error: "Não consegui entender essa conversa. Comece uma nova." });
    if (err instanceof Anthropic.APIError) return res.status(502).json({ error: "A IA não respondeu agora. Tente de novo." });
    return res.status(500).json({ error: "Erro inesperado na Polaroid." });
  }
}
