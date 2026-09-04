<<<<<<< HEAD
# FJJ-Connect
=======
# FJJ-Connect

Automação de DM/Instagram — responde comentários e mensagens automaticamente,
qualifica leads com IA e permite disparo em massa para quem interagiu nas
últimas 24h. Inspirado no [Gaio](https://gaio.social), construído sobre a
**API oficial da Meta** (Instagram Messaging via Graph API).

## Stack

- **Next.js 15** (App Router) + TypeScript
- **Supabase** (Postgres + Auth + RLS)
- **Anthropic Claude** para qualificação de leads
- **Meta Graph API** (Instagram Messaging) para enviar/receber DMs e comentários

## Como o fluxo funciona

```
Comentário/DM no Instagram
        │
        ▼
Webhook da Meta ──► /api/webhooks/instagram (verifica + salva contato/mensagem)
        │
        ▼
automation-engine.ts ──► casa o evento com uma regra (automations)
        │
        ├─► envia DM de resposta (Graph API)
        │
        └─► se ai_qualify=true: manda o histórico pra IA (lib/ai.ts)
                    │
                    ▼
             atualiza lead_status + tags do contato
```

## Passo a passo de setup

### 1. Meta (obrigatório, é o gargalo real de qualquer produto assim)

1. Crie um app em https://developers.facebook.com/apps (tipo **Business**).
2. Adicione o produto **Instagram** (Messaging API).
3. Sua conta Instagram precisa ser **Business ou Creator** e estar vinculada a
   uma **Página do Facebook**.
4. Configure o Webhook do app apontando para
   `https://SEU_DOMINIO/api/webhooks/instagram`, com o
   `META_WEBHOOK_VERIFY_TOKEN` que você escolher no `.env`. Assine os campos
   `messages` e `comments`.
5. Solicite o **App Review** para os escopos:
   `instagram_basic`, `instagram_manage_messages`,
   `instagram_manage_comments`, `pages_show_list`, `pages_messaging`.
   Sem isso, o app só funciona com usuários de teste (roles de
   Admin/Developer/Tester no painel do app) — ótimo pra validar antes de
   liberar pra clientes reais.
6. Copie `META_APP_ID` e `META_APP_SECRET` para o `.env`.

### 2. Supabase

1. Crie um projeto em https://supabase.com.
2. Rode o conteúdo de `supabase/schema.sql` no SQL Editor.
3. Ative **Email OTP** em Authentication → Providers (já é o padrão).
4. Copie as chaves para o `.env` (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).

### 3. Anthropic

Gere uma chave em https://console.anthropic.com e coloque em
`ANTHROPIC_API_KEY`.

### 4. Rodando localmente

```bash
cp .env.example .env   # preencha com as chaves acima
npm install
npm run dev
```

Para testar o webhook localmente, exponha a porta 3000 com algo como `ngrok
http 3000` e use essa URL pública no painel da Meta.

## Limites importantes da API oficial (não são bugs, são regra da Meta)

- **Janela de 24h**: só é possível mandar mensagem livre para quem interagiu
  nas últimas 24h. Fora disso, só com templates de mensagem aprovados. O
  endpoint de `/api/broadcast` já filtra por isso.
- **Rate limits** por app/página, escalam com o tamanho da audiência.
- **Token de página** de longa duração expira em ~60 dias — use
  `/api/cron/token-refresh` num cron (ex: Vercel Cron) para monitorar e
  avisar antes de expirar.

## Estrutura de pastas

```
src/
  app/
    api/                    → rotas de backend (webhook, oauth, CRUD, broadcast)
    dashboard/              → UI autenticada (leads, automações, conexão IG)
    login/                  → auth via magic link (Supabase)
  lib/
    instagram.ts            → wrapper da Graph API
    ai.ts                   → qualificação de lead via Claude
    automation-engine.ts    → motor que liga webhook → regra → ação
    supabase/               → clientes (browser, server, service role)
supabase/schema.sql          → schema completo com RLS
```

## Próximos passos sugeridos

- Fila assíncrona real (Upstash QStash/Supabase Queue) no lugar do
  fire-and-forget em `api/webhooks/instagram`.
- Criptografar `access_token` em repouso.
- UI pra criar automações a partir de linguagem natural (como o Gaio faz),
  usando o Claude pra transformar a descrição do usuário em uma regra
  estruturada (`trigger_type`, `trigger_value`, `reply_template`).
- Página pública de billing/planos (o front de `gaio.social/#planos` serve de
  referência de estrutura de oferta: grátis limitado × pago com mais contatos
  e recursos ilimitados).
>>>>>>> 6fbd5e1 (Scaffold inicial do FJJ-Connect)
