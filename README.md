# ZapMarketing Bot AI 🤖 (SaaS Edition - Supabase)

Plataforma SaaS completa integrada com GitHub, Netlify e Supabase (PostgreSQL Grátis).

## 🚀 Passo 1: GitHub (Código)
1. Crie um repositório no GitHub (ex: `zapmarketing`).
2. Suba estes arquivos.

## 🔥 Passo 2: Supabase (Banco de Dados Grátis)
1. Crie conta em [supabase.com](https://supabase.com).
2. Crie um novo projeto (ex: `zapmarketing`).
3. Vá em **Project Settings -> API** e copie:
   - `URL`
   - `anon public` key
4. Vá em **SQL Editor** -> **New Query**, cole o código abaixo e clique em **Run** para criar as tabelas:

```sql
-- TABELA DE PERFIS (USUÁRIOS)
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  email text,
  name text,
  plan text default 'free',
  is_admin boolean default false,
  settings jsonb default '{}'::jsonb,
  primary key (id)
);

-- GATILHO PARA CRIAR PERFIL QUANDO USUÁRIO SE CADASTRA
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

-- TABELAS DE DADOS (USANDO JSON PARA FLEXIBILIDADE)
create table public.campaigns (
  id text not null,
  user_id uuid references auth.users not null,
  status text,
  content jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

create table public.contacts (
  id text not null,
  user_id uuid references auth.users not null,
  content jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

create table public.visits (
  id text not null,
  user_id uuid references auth.users not null,
  content jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

-- SEGURANÇA (RLS - ROW LEVEL SECURITY)
-- Impede que um usuário veja dados de outro
alter table profiles enable row level security;
alter table campaigns enable row level security;
alter table contacts enable row level security;
alter table visits enable row level security;

-- POLÍTICAS DE ACESSO
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

create policy "Users can view own campaigns" on campaigns for select using (auth.uid() = user_id);
create policy "Users can insert own campaigns" on campaigns for insert with check (auth.uid() = user_id);
create policy "Users can update own campaigns" on campaigns for update using (auth.uid() = user_id);

create policy "Users can view own contacts" on contacts for select using (auth.uid() = user_id);
create policy "Users can insert own contacts" on contacts for insert with check (auth.uid() = user_id);
create policy "Users can update own contacts" on contacts for update using (auth.uid() = user_id);
create policy "Users can delete own contacts" on contacts for delete using (auth.uid() = user_id);

create policy "Users can view own visits" on visits for select using (auth.uid() = user_id);
create policy "Users can insert own visits" on visits for insert with check (auth.uid() = user_id);
create policy "Users can update own visits" on visits for update using (auth.uid() = user_id);

-- PERMITIR ADMIN (VOCÊ) VER TUDO
-- (Substitua SEU_EMAIL_AQUI pelo seu email de login)
-- create policy "Admin sees all" on profiles for select using (auth.jwt() ->> 'email' = 'SEU_EMAIL_AQUI');
```

## 🌐 Passo 3: Netlify (Hospedagem)
1. Importe o projeto do GitHub no Netlify.
2. Em **Environment Variables**, adicione:
   - `VITE_SUPABASE_URL`: (Sua URL do passo 2)
   - `VITE_SUPABASE_ANON_KEY`: (Sua Key do passo 2)
3. Deploy!
