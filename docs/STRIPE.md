# Assinatura da Revela com a Stripe

## Como funciona
1. A fotógrafa abre **Minha assinatura** (`/adm/assinatura`), ou a tela de "teste encerrado", e escolhe um plano.
2. `POST /api/billing/checkout` confere o login (Firebase) e o estúdio.
   - Cria o cliente na Stripe, se ainda não existir.
   - Cria o produto e o preço do plano, se ainda não existirem: `revela_essencial_mensal`, `revela_profissional_mensal` e `revela_eventos_mensal`, mensais, em BRL.
   - Abre o **Checkout** em modo assinatura.
   - Quem assina durante o teste não perde os dias que faltam: a primeira cobrança acontece no fim dos 30 dias.
3. A Stripe avisa `POST /api/billing/webhook`.
   - O servidor lê a assinatura de novo, então avisos repetidos ou fora de ordem não estragam nada.
   - Ele grava `studios/{slug}.status` (`active` ou `canceled`) e `studios/{slug}.plan`.
   - Os detalhes da cobrança ficam em `billing/{slug}`, que só o servidor lê.
4. Com o plano ativo, **Gerenciar assinatura** abre o **portal da Stripe** (`/api/billing/portal`). Lá a fotógrafa troca o cartão, muda de plano, baixa as faturas e cancela (no fim do período).

**Situação → acesso ao painel:**

| Situação na Stripe | Acesso |
|---|---|
| `active`, `trialing`, `past_due` | Liberado. Em `past_due`, a Stripe continua tentando cobrar. |
| `canceled`, `unpaid`, `incomplete_expired`, `paused` | Bloqueado, depois do teste. |

## Variáveis na Vercel (Settings → Environment Variables)

| Nome | O que é | Onde pegar |
|---|---|---|
| `STRIPE_SECRET_KEY` | Chave secreta (`sk_test_...` primeiro, `sk_live_...` depois) | Stripe → Desenvolvedores → Chaves de API |
| `STRIPE_WEBHOOK_SECRET` | Segredo do webhook (`whsec_...`) | Stripe → Desenvolvedores → Webhooks → seu endpoint |
| `FIREBASE_SERVICE_ACCOUNT` | O JSON inteiro da conta de serviço do Firebase | Firebase → Configurações do projeto → Contas de serviço → Gerar nova chave privada |
| `SITE_URL` (opcional) | Ex.: `https://revela-eta.vercel.app` | Endereço do site |
| `STRIPE_PORTAL_CONFIG` (opcional) | Configuração própria do portal (`bpc_...`) | Saída de `scripts/stripe-setup.mjs` |
| `STRIPE_TAX` (opcional) | `on` liga o cálculo automático de imposto no Checkout | Só se o Stripe Tax estiver ativo na conta |

Depois de salvar as variáveis: **Deployments → ⋯ → Redeploy**.

## Webhook
Stripe → Desenvolvedores → Webhooks → **Adicionar endpoint**:
- **URL:** `https://revela-eta.vercel.app/api/billing/webhook`
- **Eventos:**
  - `checkout.session.completed`
  - `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `customer.subscription.paused`, `customer.subscription.resumed`
  - `invoice.paid`, `invoice.payment_failed`

Copie o **Signing secret** (`whsec_...`) para `STRIPE_WEBHOOK_SECRET`.

## Portal e e-mails (uma vez no painel da Stripe)
- **Configurações → Billing → Portal do cliente:** ative e salve. Permita trocar o plano entre os 3 produtos Revela, atualizar o cartão, ver as faturas e cancelar no fim do período.
  - Alternativa: rodar `STRIPE_SECRET_KEY=sk_test_... node scripts/stripe-setup.mjs`, que cria tudo isso e mostra o `STRIPE_PORTAL_CONFIG`.
- **Configurações → Billing → E-mails para clientes:** ligue os e-mails de pagamento com sucesso, de falha e de fatura. É o que manda o recibo e a fatura (Invoicing) automaticamente.
- **Configurações → Payments → Formas de pagamento:** cartão já vem ativo. O Checkout mostra sozinho as formas ativas compatíveis com assinatura.

## Testar (modo teste)
1. Use `sk_test_...` e o webhook do modo teste.
2. Entre com uma conta de teste → Minha assinatura → Assinar → cartão `4242 4242 4242 4242`, qualquer data futura e qualquer CVC.
3. Confira na Stripe: assinatura criada; no Firestore: `studios/{slug}.status = "active"`.
4. Falha de pagamento: use o cartão `4000 0000 0000 0341`.
5. Pelo terminal: `stripe trigger checkout.session.completed` (Stripe CLI).

## Impostos (Stripe Tax) e nota fiscal
- O Checkout já aceita o cálculo automático (`STRIPE_TAX=on`).
- Para o Brasil, confirme no painel (Stripe Tax → Registros) se é possível registrar e calcular os seus impostos.
- **A Stripe não emite NFS-e.** A nota fiscal de serviço brasileira precisa de um emissor, como eNotas, NFE.io ou o da prefeitura. Dá para ligar esse emissor ao `invoice.paid` depois.
- Os preços foram criados como `tax_behavior: inclusive`, ou seja, o valor do plano já inclui os impostos.

## Antes de ir para produção
- Troque para as chaves `live` e crie o webhook no modo live.
- Ative a conta Stripe: dados do CPF ou CNPJ e a conta bancária no mesmo documento.
- Confira o `firestore.rules` publicado. A coleção `billing` não tem regra para o navegador, ou seja, fica fechada, como deve ser.
