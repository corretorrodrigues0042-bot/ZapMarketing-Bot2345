# ZapMarketing Bot AI 🤖 (SaaS Edition - Supabase)

Plataforma SaaS completa integrada com GitHub, Netlify e Supabase.

## 🚀 Passo 1: GitHub (Código)
1. Crie um repositório no GitHub (ex: `zapmarketing`).
2. Suba estes arquivos.

## 🔥 Passo 2: Supabase (Banco de Dados + Auth)

Esta é a "porta de integração" que conecta seu app ao banco de dados.

1. Crie conta em [supabase.com](https://supabase.com).
2. Crie um novo projeto.
3. Vá em **Settings -> API** e copie:
   - `Project URL`
   - `anon public` key
4. Coloque essas chaves no seu arquivo `.env` local ou nas variáveis de ambiente do Netlify:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### ⚡ CRIAÇÃO DAS TABELAS (Obrigatorio)

Vá no **SQL Editor** do Supabase, cole o código abaixo e clique em **Run**. Isso cria a estrutura para salvar campanhas, contatos e gerenciar licenças.

```sql
-- 1. TABELA DE PERFIS (Usuários)
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  email text,
  name text,
  plan text default 'free',
  is_admin boolean default false,
  settings jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

-- Gatilho: Cria perfil automaticamente quando usuario se registra
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, new.raw_user_meta_data->>'name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. TABELAS DE DADOS (Usando JSONB para flexibilidade total)
create table public.contacts (
  id text not null, -- Telefone ou ID único
  user_id uuid references auth.users not null,
  content jsonb, -- Dados completos do contato
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id, user_id) -- Chave composta
);

create table public.campaigns (
  id text not null,
  user_id uuid references auth.users not null,
  status text,
  content jsonb, -- Dados da campanha
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id, user_id)
);

create table public.visits (
  id text not null,
  user_id uuid references auth.users not null,
  content jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id, user_id)
);

create table public.licenses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users,
  key_used text,
  plan_activated text,
  activated_at timestamp default now()
);

-- 3. SEGURANÇA (RLS - Ninguém vê dados de ninguém)
alter table profiles enable row level security;
alter table contacts enable row level security;
alter table campaigns enable row level security;
alter table visits enable row level security;
alter table licenses enable row level security;

-- Políticas de Acesso (CRUD apenas para o dono dos dados)
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

create policy "Users can crud contacts" on contacts for all using (auth.uid() = user_id);
create policy "Users can crud campaigns" on campaigns for all using (auth.uid() = user_id);
create policy "Users can crud visits" on visits for all using (auth.uid() = user_id);
create policy "Users can insert licenses" on licenses for insert with check (auth.uid() = user_id);
```

## 🌐 Passo 3: Netlify (Hospedagem)
1. Importe o projeto do GitHub no Netlify.
2. Configure as variáveis de ambiente (`VITE_SUPABASE_URL`, etc).
3. Deploy!
