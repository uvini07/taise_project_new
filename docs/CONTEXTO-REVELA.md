# Revela: contexto do projeto (para continuar em outra sessão)

## O que é
- **Revela** é uma plataforma (SaaS) para fotógrafas.
- Ela reúne num painel só:
  - site personalizável (10 modelos);
  - agenda com sinal pelo Pix;
  - pacotes e lotes;
  - lista VIP e evento promocional;
  - galeria;
  - seleção de fotos protegida;
  - entrega em alta;
  - financeiro e visitas;
  - **Polaroidy**, a assistente com IA.
- **Repositório:** `uvini07/taise_project_new` (React + Vite + Tailwind + Firebase + GSAP).
- **Deploy:** Vercel, em taise-project-new.vercel.app.
- **Regra:** tudo é commitado e enviado direto na **`main`**. Não usar outras branches.
- **Primeira cliente:** a fotógrafa Taíse, com o site em `/tarufino`.
- **Sociedade:** Markfy 20%, Marcelo 40%, João 40%.

## Identidade visual (paleta Lavanda)
- Cores:
  - ameixa `#2B2540`
  - rosa `#C95D63`
  - lavanda `#E6E1F0`
  - lilás `#8E86A6`
  - névoa `#F7F5FA`
- Fonte própria: `Revela-Regular-v3.woff2`. O texto corrido usa a Jost.
- Estilo: vidro translúcido (classe `.lg`), manchas de cor desfocadas e animações com GSAP.

## Rotas
- **Páginas da Revela:**
  - `/` é a landing;
  - `/planos`, `/ferramentas`, `/entrar`, `/cadastro`.
  - O cadastro tem o botão "Usar teste de 30 dias".
- **Painel:** fica em `/adm/*`.
- **Site de cada estúdio:** fica em `/:studio/*`.
  - As rotas internas são aninhadas, para que `/adm` sempre tenha prioridade.

## Arquitetura principal
- **Vários estúdios no mesmo Firestore:**
  - cada estúdio tem `studios/{slug}` (ownerUid, name, plan, status 'trial', createdAt);
  - cada dona tem `owners/{uid}`;
  - a Taíse continua nas coleções da raiz;
  - `src/services/studioDb.js` (`sCol`/`sDoc`) escolhe o caminho certo de cada estúdio.
- **Estúdio atual:** `src/config/tenant.js` cuida disso.
  - `SITE_BASE` serve para os links da Revela que apontam para o site da Taíse.
- **Regras do Firestore:**
  - são geradas por `scripts/build-firestore-rules.py`;
  - o período de teste vale 30 dias a partir de createdAt;
  - **o `firestore.rules` precisa ser publicado no console do Firebase.**
- **Consultas sem índice composto:** usar só filtros de igualdade e ordenar no navegador.
- **10 modelos de site:**
  - Clássico, Diagonal, Dividido, Arco, Mosaico, Cinema (escuro), Revista, Polaroid, Minimalista, Imersivo;
  - definidos em `src/config/siteStyle.js`;
  - cada um tem topo, seções, cabeçalho e rodapé próprios;
  - os arredondamentos usam tokens por `html[data-layout]`.
- **Editor visual estilo Wix/Shopify:**
  - fica em `/adm/editor` e mostra o site num iframe com prévia ao vivo;
  - a página e o painel conversam por postMessage (`revela:*`);
  - os pontos editáveis são marcados com `data-edit` e `data-edit-zone`.
- **Aviso de mudanças não salvas:** `src/utils/unsaved.js`.
- **Tour de boas-vindas:** termina em `/adm/editor?painel=modelo`.
- **Botão de ajuda no WhatsApp:** número 5511971813986, em `src/config/support.js`.

## Polaroidy (assistente com IA)
- **Modelo:** Claude Haiku 5.5 (`claude-haiku-5-5`), chamado pela função da Vercel `api/polaroid.js`.
  - Usa o login do Firebase verificado com jose e tem limite de 150 perguntas por dia por conta.
- **Ferramentas, todas só de leitura, executadas no painel com o login da fotógrafa:**
  - `agenda`;
  - `pedidos_aguardando`;
  - `pagamentos_pendentes`, que gera os botões "Cobrar no WhatsApp". A mensagem de cobrança é montada pelo painel, não pela IA.
- **Arquivos:**
  - `src/services/polaroid.js`;
  - `src/components/admin/PolaroidChat.jsx`, a janela lateral;
  - `PolaroidyMascot.jsx`.
- **Bolinha flutuante:** fica no canto inferior direito do painel e mostra o rosto do mascote piscando.
- **Para ligar:** a dona precisa colocar `ANTHROPIC_API_KEY` nas variáveis de ambiente da Vercel (Production) e fazer Redeploy.
  - A chave **nunca** entra no código nem no chat.
- **Mascote v2:**
  - é uma foto polaroid com braços, pernas, luvinhas, tênis, o "r" da Revela na faixa e o flash rosa;
  - tem 4 poses e 5 expressões;
  - os arquivos ficam em `brand/revela/polaroidy/mascote-v2/` e `src/assets/polaroidy/`.

## Landing page (atualizada nesta sessão)
- **Ordem das seções:** Hero, DotStatement, Unify, **SiteBuilder**, **Polaroidy**, Features, HowItWorks, Planos, Showcase, Close.
- **Hero:** tem o selo "Novo · Conheça a Polaroidy, sua assistente com IA" e a linha "30 dias grátis · a partir de R$ 89/mês".
- **`SiteBuilder.jsx` (`#editor`):**
  - demonstração que **constrói um site no modelo Clássico** passo a passo: modelo, nome e logo, fotos, textos, cor, fonte, sobre e pacotes, publicar;
  - os passos, cores e fontes podem ser clicados.
- **`Polaroidy.jsx` (`#polaroidy`):** seção escura com o mascote acenando e um chat de exemplo com dados fictícios.
- **Menu:** Ferramentas, Editor do site, Polaroidy IA, Planos.
- **Planos:** "Polaroidy, assistente com IA" aparece como incluída em todos os planos. Falta confirmar essa decisão.

## Planos e números
- **No site:** Essencial R$ 89, Profissional R$ 149, Eventos R$ 229 (em `src/revela/data.js`).
- **Estudos de preço:** foi discutido um Pro a R$ 137 ou R$ 150.
- **Custos estimados:** fotos no Cloudflare R2 (considerando as operações A e B), Firestore e hospedagem na Vercel ou Cloudflare.
  - Na seleção as fotos ficam em WebP; na entrega, o tamanho é o original.
- **PDFs em `docs/`:** guia técnico, kit de recursos e estudo de mercado e custos.

## Pendências
- **Do lado da dona:**
  - colocar a `ANTHROPIC_API_KEY` na Vercel e fazer Redeploy;
  - publicar o `firestore.rules`.
- **Próximos passos possíveis:**
  - seleção e entrega funcionando de verdade com o R2 (hoje estão em modo de teste);
  - avisos de novo agendamento e de seleção finalizada;
  - assinatura pelo Mercado Pago (precisa de CNPJ);
  - domínio próprio por estúdio;
  - mostrar, ocultar e reordenar seções no editor.

## Como testar
- `npm run build`, `npx vitest run` (45 testes) e os emuladores do Firebase para as regras.
- Prints com Playwright em `npx vite preview`.
