# Taíse Foto — site e painel administrativo

Plataforma da **Taíse Foto / Taise Rufino Fotografia**. Tem um site público (pacotes, galeria, agenda on-line, lista VIP e contato) e um painel em `/adm`, onde a fotógrafa administra o conteúdo sem mexer no código.

- **Stack:** React 18 + Vite, Tailwind CSS, React Router, Firebase (Authentication, Cloud Firestore, Storage e Analytics), Lucide e Recharts.
- **Sem servidor próprio:** o navegador fala direto com o Firebase. A segurança fica nas regras `firestore.rules`, que são testadas automaticamente (veja [Testes](#testes)).

> O projeto antigo (`uvini07/taise-project`, site de Natal) serviu só como referência. Dele vieram a logo original, o WhatsApp, o endereço e a paleta vinho/creme/dourado. O código, o Firebase e o banco de dados são novos.

---

## Rodar localmente

Requisitos: Node 20+ (testado com Node 22) e Java 17+, que só é necessário para os emuladores.

```bash
npm install
npm run dev            # site em http://localhost:5173, conectado ao Firebase real (projeto taisefoto)
```

### Com os emuladores (recomendado para testar)

Nesse modo nada é gravado no projeto real.

```bash
npm i -g firebase-tools
npm run emulators                       # terminal 1: Auth, Firestore e Storage locais
npm run seed:emulator                   # terminal 2: dados de demonstração [DEMO] e usuário admin
VITE_USE_EMULATORS=true npm run dev     # terminal 2: site apontando para os emuladores
```

Login de teste no emulador: `tarufino@gmail.com` / `demo-123456`. Ele existe **só no emulador**.

## Variáveis de ambiente

Copie `.env.example` para `.env` se quiser sobrescrever algo. Sem `.env`, o app usa a configuração do projeto `taisefoto` que está em `src/config/firebaseConfig.js`. A configuração web do Firebase **não é segredo**: ela só identifica o projeto, e quem protege os dados são as regras.

| Variável | Para quê |
|---|---|
| `VITE_FIREBASE_*` | Configuração web do Firebase (API key, projectId, bucket, measurementId…) |
| `VITE_USE_EMULATORS` | `true` conecta nos emuladores locais e usa o projeto `demo-taisefoto` |

Nenhuma senha ou credencial privada vai para o front-end.

## Configurar o Firebase (uma vez)

No [console do Firebase](https://console.firebase.google.com/project/taisefoto):

1. **Authentication → Sign-in method:** ative **E-mail/senha**.
2. **Authentication → Users → Adicionar usuário:** crie o login da fotógrafa e copie o **UID**.
3. **Firestore Database:** crie o banco (modo produção, região `southamerica-east1`).
4. **Firestore → Dados:** crie a coleção `adminUsers` e, nela, um documento cujo ID é o UID copiado, com os campos:
   - `active` (boolean) = `true`
   - `role` (string) = `owner`
   - `email` (string), opcional
   - `name` (string), opcional

   Só quem tem esse documento consegue entrar no painel e ler ou alterar dados privados. Para tirar o acesso de alguém, mude `active` para `false`.
5. **Storage:** ative o Storage.
6. Publique regras, índices e site:
   ```bash
   firebase login
   npm run deploy        # build + firebase deploy (regras e índices do Firestore)
   ```
   No primeiro deploy das regras do Storage, o Firebase pede permissão para que elas consultem o Firestore (lista `adminUsers`). **Aceite**, senão o upload de fotos é negado.
7. Opcional: ative o **Google Analytics** no projeto. Ele só é carregado quando o visitante aceita os cookies.
8. Recomendado: ative o **App Check** (reCAPTCHA Enterprise) para Firestore e Storage. Ele reduz robôs enviando pedidos falsos. As regras já validam formato e conteúdo de tudo o que o público envia, mas não limitam a frequência.

### Recuperar acesso

Na tela `/adm/login` use **"Esqueci minha senha"**: o Firebase envia um link de redefinição. Se o e-mail também se perder, um administrador do projeto Firebase pode criar um novo usuário (passos 2 e 4).

## Estrutura

```
src/
  config/        firebaseConfig, textos e contatos padrão, constantes de status
  services/      firebase.js (inicialização única), serviços públicos
    admin/       operações do painel (transações, auditoria)
  utils/         regras puras: horários, lotes, financeiro, WhatsApp, CSV, datas
  hooks/ contexts/
  components/    common, layout, packages, gallery, forms, vip, admin
  pages/public/  Home, About, Packages, PackageDetail, Gallery, Booking, VIP, Contact, Policies
  pages/admin/   AdminLogin, Dashboard, PackagesAdmin, GalleryAdmin, AgendaAdmin,
                 AnalyticsAdmin, FinanceAdmin, VIPAdmin, SettingsAdmin
  routes/        AdminApp (rotas /adm), ProtectedRoute
tests/unit/      lógica pura (vitest)
tests/rules/     regras do Firestore/Storage no emulador
docs/            ARQUITETURA.md (modelo de dados e segurança) e MANUAL-DA-FOTOGRAFA.md
```

O painel e os gráficos são carregados sob demanda, então o visitante do site não baixa o código do painel.

## Testes

```bash
npm test               # 22 testes de lógica: horários, lotes/vagas, financeiro, telefone, CSV
npm run test:rules     # 28 testes de segurança no emulador (precisa de Java)
```

O que os testes de regras garantem:
- O público não lê agendamentos, inscritos VIP, financeiro, auditoria nem rascunhos.
- Dois pedidos para o mesmo horário: só um é aceito, inclusive quando chegam ao mesmo tempo.
- Preço adulterado, status forçado, pacote em rascunho, lote cheio, data passada e campos extras são recusados.
- O preço VIP só vale para quem está na lista e só durante a janela de acesso.
- O máximo de 5 pacotes publicados é garantido pelo banco, não só pela tela.
- Inscrição VIP duplicada ou além do limite é recusada, e o contador não pode ser inflado.
- Os contadores de analytics só aceitam +1 em chaves permitidas.
- Ninguém se torna admin pelo site, e lançamentos financeiros não podem ser apagados.

Há uma exceção: o teste "admin envia imagem" do Storage depende das regras consultarem o Firestore, e em alguns ambientes o emulador não suporta isso. Ele só roda com `STORAGE_XSERVICE=1 npm run test:rules`. Os testes de bloqueio do Storage rodam sempre.

## Publicação

`npm run deploy` publica no Firebase Hosting, que já está configurado com rotas de SPA, cache longo para os arquivos com hash e cabeçalhos de segurança. Para usar um domínio próprio: Hosting → Adicionar domínio personalizado.

## Pendências de informação

Estes itens não existiam no projeto antigo e não foram inventados. Eles aparecem como pendências em **Painel → Configurações**:

- Cidade/bairro do estúdio (o antigo tinha só rua, número e edifício).
- Horário de atendimento.
- Link do Instagram (no antigo o link estava vazio, `href="#"`).
- E-mail: o antigo exibia `tarufino@gmail.com` no rodapé e `contato@taisefoto.com` na configuração. Hoje está o do rodapé; confirme qual usar.
- Políticas de agendamento, pagamento e cancelamento.
- Depoimentos reais (a seção fica oculta enquanto não houver nenhum).
- Fotos próprias para o topo e para a seção Sobre. Até lá aparecem fotos do ensaio de Natal antigo, e o painel avisa.

Nenhum pacote, preço ou campanha foi criado no banco real: isso é feito pela fotógrafa no painel.
