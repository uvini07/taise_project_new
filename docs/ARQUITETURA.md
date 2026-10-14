# Arquitetura, dados e segurança

## Visão geral

```
Navegador (React)  ──►  Firebase Auth       (login do painel)
                   ──►  Cloud Firestore     (conteúdo, agenda, VIP, financeiro, métricas)
                   ──►  Cloud Storage       (fotos: public/…)
                   ──►  Google Analytics    (opcional, só com consentimento)
```

Não há backend próprio nem Cloud Functions; o plano gratuito (Spark) basta. Toda a lógica que precisa ser confiável fica em dois lugares:

1. **Regras do Firestore/Storage.** Validam quem pode ler ou escrever, quais campos são aceitos e as relações entre documentos. Essa é a proteção real.
2. **Transações do painel.** Releem os dados no momento da operação, por exemplo ao confirmar um agendamento ou publicar um pacote.

Esconder botões na interface **não** é usado como segurança.

## Coleções

| Coleção | Quem lê | Quem escreve | Conteúdo |
|---|---|---|---|
| `adminUsers/{uid}` | o próprio usuário; admins | ninguém pelo site (console) | `active`, `role` (`owner`/`admin`), `email`, `name` |
| `auditLogs/{id}` | admin | admin (só cria; nunca altera/apaga) | `at`, `uid`, `email`, `action`, `entity`, `entityId`, `details` |
| `siteSettings/public` | todos | admin | textos, contato, redes, SEO, fotos de destaque, depoimentos, preferências |
| `meta/packages` | todos | admin | `publishedIds` (**máx. 5**): índice dos pacotes visíveis |
| `packages/{id}` | todos se publicado/esgotado; admin | admin | nome, categoria, descrição, capa, preços em centavos, duração, fotos, local, período, regras, status, ordem |
| `packageLots/{id}` | todos se `public`; admin | admin | `packageId`, nome, `priceCents`, `capacity` (null = sem limite), `confirmedCount`, janela de vendas, status, `archived` |
| `galleryCategories/{id}` | todos se `visible`; admin | admin | nome, slug, descrição, capa, ordem |
| `galleryPhotos/{id}` | todos se `published`; admin | admin | categoria, URLs/caminhos (full e thumb), dimensões, placeholder, ordem, destaque |
| `availability/config` | todos | admin | dias da semana, duração, intervalo, capacidade, antecedência, bloqueios, datas especiais |
| `slotLocks/{data_HHMM_vaga}` | todos (sem dado pessoal) | público só junto com um pedido novo; admin | `appointmentId`, `date` |
| `appointments/{id}` | admin | público cria pedido validado; admin | cliente, contato, pacote/lote, preço fixado, data/hora, status, histórico |
| `vipCampaigns/{id}` | todos se publicada/encerrada; admin | admin | textos, prazos, `countdownEndsAt`, ação ao terminar, preços VIP, campos, consentimento, retenção |
| `vipCampaignStats/{campanha}` | todos | +1 só junto com uma inscrição; admin | `count`, `lastRegId` |
| `vipMembers/{campanha_telefone}` | `get` pontual; `list` só admin | público junto com a inscrição; admin | marca de membro (sem dado pessoal) |
| `vipRegistrations/{id}` | admin | público cria inscrição validada; admin | nome, WhatsApp, e-mail, preferências, consentimento (texto gravado), status |
| `financialTransactions/{id}` | admin | admin (sem exclusão: arquivamento) | tipo, valor, vencimento, pagamentos[], reembolsos[], vínculos, status |
| `analyticsDaily/{AAAA-MM-DD}` | admin | +1 por escrita em contador permitido | contadores anônimos (`pv`, `visit`, `uv`, `wa`, `cta`, `pkg__id`, `gcat__id`, `page__x`, `src__x`, `camp__id`) |

Valores em dinheiro ficam sempre em **centavos inteiros**. Datas de agenda usam `"AAAA-MM-DD"` e `"HH:MM"` no fuso de Brasília. Prazos (vendas, campanhas) são `Timestamp`.

## Regras de negócio e como são garantidas

### Máximo de 5 pacotes publicados
O Firestore não conta documentos numa regra. Por isso todo pacote visível (publicado ou esgotado) precisa constar em `meta/packages.publishedIds`, e essa lista aceita no máximo 5 itens. A regra do pacote usa `getAfter()`, o que obriga a mudança de status e a da lista a acontecerem na mesma transação. O painel faz isso em `services/admin/packagesAdmin.js`, e há o botão **Reparar publicação** caso o índice saia de sincronia.

### Vagas e lotes
- Vagas restantes = `capacity − confirmedCount`, calculadas sempre, sem número digitado à mão.
- `confirmedCount` só muda em transação, ao confirmar, realizar, cancelar ou reativar um agendamento. A transação relê o lote e recusa a confirmação além da capacidade, a menos que a fotógrafa force conscientemente.
- **Conferir vagas** recalcula todos os contadores a partir dos agendamentos.
- Cada agendamento grava o preço do momento (`priceCents`), então mudar o preço de um lote depois não altera reservas antigas. Lotes com reservas são **arquivados**, não apagados.
- O pedido público só passa se o lote é do pacote, está ativo, dentro da janela de vendas, com vaga, e se o preço é **exatamente** o do lote (ou o preço VIP da campanha).

### Conflito de horários
Cada horário ocupado vira um documento `slotLocks/AAAA-MM-DD_HHMM_n`, onde `n` é a vaga, para quando há mais de um atendimento por horário. O pedido e as travas vão no **mesmo lote de escrita**, e o público só consegue *criar* trava que ainda não existe. Se duas pessoas tentam o mesmo horário ao mesmo tempo, o banco aceita uma e recusa a outra, e o site mostra "esse horário acabou de ser reservado". Ensaios mais longos que a sessão padrão ocupam até 3 travas seguidas.

Ao **confirmar**, o painel revalida as regras atuais da agenda (dia bloqueado, fora do expediente), as vagas do lote e as travas. Se houver aviso, pede confirmação explícita, e o motivo fica no histórico. **Cancelar** libera as travas e devolve a vaga. **Remarcar** troca as travas numa única transação.

### Contador VIP
O contador usa sempre `countdownEndsAt`, gravado na campanha, então o mesmo prazo vale em qualquer aparelho e não reinicia ao recarregar. O relógio do aparelho é corrigido pelo horário do servidor (cabeçalho `Date` da hospedagem). Ao terminar, aplica a ação configurada: mensagem, ocultar a campanha ou encaminhar para uma página. **Lançar acesso VIP (24h)** apenas grava início = agora e fim = agora + 24h.

### Inscrição VIP
Uma transação cria `vipRegistrations`, `vipMembers/{campanha_telefone}` e incrementa `vipCampaignStats`. As regras amarram os três documentos:
- Duplicado (mesmo WhatsApp na campanha) é recusado.
- O limite de inscritos é respeitado.
- O contador não sobe sem inscrição.
- Campanha em rascunho ou com prazo vencido não aceita inscrição.
- O texto de consentimento é gravado em cada inscrição.

### Financeiro
Contratado, recebido e resultado nunca se misturam:
- **Contratado:** receitas (não canceladas) com vencimento no período.
- **Recebido:** pagamentos registrados com data no período, menos reembolsos.
- **A receber/vencido:** saldo das receitas.
- **Resultado (caixa):** recebido − despesas pagas.

Um agendamento só vira receita quando a fotógrafa lança. Não há gateway de pagamento; a interface deixa isso claro. Lançamentos não são apagados, só cancelados ou arquivados.

### Analytics
Os contadores diários são anônimos. A regra só aceita somar 1 a uma única chave permitida por escrita. Pedidos de agendamento e cadastros VIP nos relatórios vêm do banco (contagem real), não do rastreamento. Para não gastar leituras, cada dia é um documento único: 30 dias = 30 leituras. O Google Analytics (GA4) é opcional e depende de consentimento.

## Privacidade (LGPD)
- Dados pessoais só em `appointments` e `vipRegistrations`, legíveis apenas por admins.
- Consentimento obrigatório nos formulários, com o texto gravado.
- Exportação CSV pelo painel, só dos dados filtrados.
- Exclusão a pedido do titular (botão por inscrição) e retenção configurável por campanha, com aviso e exclusão em lote das inscrições vencidas.
- Política de privacidade padrão descrevendo exatamente o que é coletado (editável).
- O mapa do Google só carrega quando o visitante clica.

## Imagens
O upload passa por validação (tipo e tamanho) e é **reduzido e convertido no navegador** antes do envio. São gerados três arquivos:
- WebP de até 2048 px, para a visualização ampliada;
- miniatura de 720 px, para as grades;
- placeholder de cerca de 20 px, guardado no documento para o carregamento suave.

As grades usam `srcset`, `loading="lazy"` e proporção fixa (sem saltos de layout). A galeria pública é paginada (24 por vez). As regras do Storage aceitam só imagens de até 12 MB enviadas por admin.

## Economia de leituras do Firestore
- **Cache por versão de conteúdo.** Pacotes, categorias, fotos, campanhas e regras da agenda ficam na memória e no `localStorage` do visitante. A chave inclui `siteSettings.contentVersion`, que o painel incrementa a cada alteração. Visitante que volta ao site gasta **1 leitura** (as configurações) enquanto nada muda; quando algo muda, o cache é descartado na hora.
- **Configurações sem conexão em tempo real no site.** O site faz uma leitura por visita e mostra a última versão salva no aparelho enquanto carrega. O tempo real só é usado no painel.
- **Galeria paginada** (24 por vez), com cada página em cache.
- **Imagens** em WebP reduzido no envio, servidas por `/api/img/{id}` com `Cache-Control: immutable` de 1 ano. A CDN da Vercel e o navegador guardam a imagem, e o banco só é lido na primeira vez em cada região da CDN.
- **Analytics** grava só os contadores necessários: o total de páginas é somado dos contadores por página, sem escrita extra.
- **Contagem de inscritos VIP** em cache de 10 minutos.
