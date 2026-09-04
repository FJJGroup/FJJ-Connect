-- FJJ-Connect — schema inicial
-- Rode isso no SQL editor do Supabase (ou via `supabase db push`).

create extension if not exists "uuid-ossp";

-- Cada usuário do FJJ-Connect (agência/creator) pode conectar 1+ contas de Instagram Business.
create table if not exists ig_accounts (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  ig_business_id text not null unique,        -- Instagram Business Account ID (via Graph API)
  ig_username text,
  page_id text not null,                      -- Página do Facebook vinculada (obrigatória p/ Messaging API)
  access_token text not null,                 -- long-lived page access token (criptografar em produção)
  token_expires_at timestamptz,
  connected_at timestamptz not null default now(),
  is_active boolean not null default true
);

-- Contatos que interagiram (comentário, DM, story reply, menção).
create table if not exists contacts (
  id uuid primary key default uuid_generate_v4(),
  ig_account_id uuid not null references ig_accounts(id) on delete cascade,
  ig_scoped_id text not null,                 -- IGSID (Instagram-scoped user id) devolvido pela API
  username text,
  profile_pic_url text,
  first_seen_at timestamptz not null default now(),
  last_interaction_at timestamptz not null default now(),
  engagement_score int not null default 0,    -- alimenta o "Ranking de seguidores"
  lead_status text not null default 'novo',   -- novo | qualificando | qualificado | descartado | cliente
  tags text[] not null default '{}',
  unique (ig_account_id, ig_scoped_id)
);

-- Histórico de mensagens (para contexto da IA e auditoria).
create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  contact_id uuid not null references contacts(id) on delete cascade,
  direction text not null check (direction in ('inbound', 'outbound')),
  source text not null check (source in ('dm', 'comment', 'story_reply', 'mention')),
  content text not null,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

-- Regras de automação criadas pelo usuário (equivalente ao "descreva o que precisa" do Gaio,
-- só que aqui representado já como regra estruturada gerada pela IA ou pelo usuário).
create table if not exists automations (
  id uuid primary key default uuid_generate_v4(),
  ig_account_id uuid not null references ig_accounts(id) on delete cascade,
  name text not null,
  trigger_type text not null check (trigger_type in ('dm_keyword', 'comment_keyword', 'story_reply', 'new_dm')),
  trigger_value text,                         -- palavra-chave, vazio quando trigger_type = 'new_dm'
  reply_template text not null,               -- mensagem enviada; suporta variáveis {{username}}
  ai_qualify boolean not null default false,  -- se true, a IA analisa a conversa e classifica o lead
  qualification_prompt text,                  -- instrução customizada para a IA qualificar
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Log de execuções (útil para debug e para métricas de "leads capturados").
create table if not exists automation_runs (
  id uuid primary key default uuid_generate_v4(),
  automation_id uuid not null references automations(id) on delete cascade,
  contact_id uuid references contacts(id) on delete set null,
  status text not null check (status in ('success', 'failed', 'skipped')),
  detail text,
  created_at timestamptz not null default now()
);

create index if not exists idx_contacts_account on contacts(ig_account_id);
create index if not exists idx_messages_contact on messages(contact_id, created_at);
create index if not exists idx_automations_account on automations(ig_account_id) where is_active;

-- RLS: cada usuário só enxerga suas próprias contas/dados.
alter table ig_accounts enable row level security;
alter table contacts enable row level security;
alter table messages enable row level security;
alter table automations enable row level security;
alter table automation_runs enable row level security;

create policy "owner manages own ig_accounts" on ig_accounts
  for all using (owner_id = auth.uid());

create policy "owner reads own contacts" on contacts
  for all using (
    ig_account_id in (select id from ig_accounts where owner_id = auth.uid())
  );

create policy "owner reads own messages" on messages
  for all using (
    contact_id in (
      select c.id from contacts c
      join ig_accounts a on a.id = c.ig_account_id
      where a.owner_id = auth.uid()
    )
  );

create policy "owner manages own automations" on automations
  for all using (
    ig_account_id in (select id from ig_accounts where owner_id = auth.uid())
  );

create policy "owner reads own automation_runs" on automation_runs
  for all using (
    automation_id in (
      select au.id from automations au
      join ig_accounts a on a.id = au.ig_account_id
      where a.owner_id = auth.uid()
    )
  );

-- Observação: as rotas de webhook (app/api/webhooks/instagram) usam a service role key
-- (bypassa RLS) porque escrevem em nome da Meta, não de um usuário autenticado.
