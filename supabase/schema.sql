-- ============================================================
-- FAMILY WEALTH MANAGER — SCHEMA SUPABASE COMPLETO
-- ============================================================
-- Convenzioni:
--  - Tutte le tabelle hanno id uuid, created_at, updated_at
--  - household_id lega tutto al nucleo familiare (Mirco + Debora)
--    così il realtime e la RLS funzionano naturalmente per entrambi
--  - user_id indica CHI ha inserito/CHI riguarda il movimento
-- ============================================================

create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- 1. HOUSEHOLD & PROFILI
-- ------------------------------------------------------------

create table households (
  id uuid primary key default uuid_generate_v4(),
  name text not null default 'Famiglia',
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  household_id uuid references households(id) on delete cascade,
  full_name text not null,
  color text default '#6366f1', -- colore identificativo utente nei grafici
  avatar_url text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. CATEGORIE (entrate, spese, casa) — configurabili
-- ------------------------------------------------------------

create type category_kind as enum ('entrata', 'spesa_fissa', 'spesa_variabile', 'casa', 'investimento');

create table categories (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid references households(id) on delete cascade,
  kind category_kind not null,
  name text not null,
  parent_id uuid references categories(id), -- per sottocategorie
  icon text,           -- nome icona lucide-react
  color text,
  is_default boolean default false, -- categorie seed non cancellabili
  created_at timestamptz not null default now(),
  unique (household_id, kind, name, parent_id)
);

-- ------------------------------------------------------------
-- 3. RICORRENZE (motore automazioni entrate/spese)
-- ------------------------------------------------------------

create type recurrence_type as enum ('una_tantum', 'mensile', 'annuale');

create table recurrences (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid references households(id) on delete cascade,
  type recurrence_type not null default 'una_tantum',
  interval_count int not null default 1, -- ogni N mesi/anni
  day_of_month int,       -- per mensile: giorno di generazione (1-28)
  month_of_year int,      -- per annuale
  start_date date not null,
  end_date date,           -- null = infinito
  next_run_date date not null,
  active boolean default true,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 4. ENTRATE
-- ------------------------------------------------------------

create table incomes (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid references households(id) on delete cascade,
  user_id uuid references profiles(id),          -- a chi si riferisce (Mirco/Debora/comune)
  category_id uuid references categories(id),
  recurrence_id uuid references recurrences(id) on delete set null,
  amount numeric(12,2) not null,
  date date not null,
  description text,
  source text,           -- es. "Stipendio azienda X"
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 5. SPESE (fisse + variabili, unificate con flag)
-- ------------------------------------------------------------

create table expenses (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid references households(id) on delete cascade,
  user_id uuid references profiles(id),
  category_id uuid references categories(id),      -- es. "Spese Fisse > Mutuo"
  recurrence_id uuid references recurrences(id) on delete set null,
  amount numeric(12,2) not null,
  date date not null,
  description text,
  attachment_url text,       -- scontrino/fattura opzionale (Supabase Storage)
  is_home_expense boolean default false, -- true se generata dalla sezione Casa
  home_expense_id uuid,       -- FK verso home_expenses (evita doppio inserimento)
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 6. CASA (specializzazione che "spinge" automaticamente in expenses)
-- ------------------------------------------------------------

create table home_expenses (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid references households(id) on delete cascade,
  category_id uuid references categories(id),   -- Mobili/Elettrodomestici/Manutenzione/...
  amount numeric(12,2) not null,
  date date not null,
  description text,
  attachment_url text,
  expense_id uuid references expenses(id) on delete cascade, -- riga gemella creata via trigger
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

alter table expenses add constraint fk_home_expense
  foreign key (home_expense_id) references home_expenses(id) on delete cascade;

-- Trigger: ogni home_expenses genera automaticamente una riga in expenses
create or replace function fn_home_expense_sync() returns trigger as $$
declare
  v_expense_id uuid;
  v_home_category uuid;
begin
  -- categoria "Casa" dentro le spese variabili (creata a seed)
  select id into v_home_category from categories
    where household_id = new.household_id and kind = 'spesa_variabile' and name = 'Casa'
    limit 1;

  insert into expenses (household_id, category_id, amount, date, description,
                         attachment_url, is_home_expense, home_expense_id, created_by)
  values (new.household_id, coalesce(v_home_category, new.category_id), new.amount, new.date,
          new.description, new.attachment_url, true, new.id, new.created_by)
  returning id into v_expense_id;

  update home_expenses set expense_id = v_expense_id where id = new.id;
  return new;
end;
$$ language plpgsql;

create trigger trg_home_expense_insert
after insert on home_expenses
for each row execute function fn_home_expense_sync();

-- ------------------------------------------------------------
-- 7. INVESTIMENTI
-- ------------------------------------------------------------

create type investment_type as enum ('etf','pac','azione','obbligazione','conto_deposito','crypto','fondo_pensione','liquidita');

create table investments (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid references households(id) on delete cascade,
  user_id uuid references profiles(id),
  type investment_type not null,
  name text not null,
  broker text,
  ticker text,
  quantity numeric(18,6) default 0,
  avg_price numeric(18,6) default 0,
  current_price numeric(18,6) default 0,
  currency text default 'EUR',
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- storico prezzi/valore per grafico evoluzione investimenti
create table investment_snapshots (
  id uuid primary key default uuid_generate_v4(),
  investment_id uuid references investments(id) on delete cascade,
  date date not null,
  price numeric(18,6) not null,
  value numeric(18,2) not null,
  created_at timestamptz not null default now(),
  unique (investment_id, date)
);

create table investment_cashflows ( -- versamenti PAC, dividendi, vendite parziali
  id uuid primary key default uuid_generate_v4(),
  investment_id uuid references investments(id) on delete cascade,
  type text not null check (type in ('versamento','dividendo','vendita','prelievo')),
  amount numeric(12,2) not null,
  date date not null,
  notes text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 8. PATRIMONIO — attività/passività non finanziarie e storico
-- ------------------------------------------------------------

create type asset_type as enum ('conto_corrente','contanti','casa','auto','altro_bene');
create type liability_type as enum ('mutuo','prestito','carta','finanziamento');

create table assets (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid references households(id) on delete cascade,
  type asset_type not null,
  name text not null,
  value numeric(14,2) not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table liabilities (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid references households(id) on delete cascade,
  type liability_type not null,
  name text not null,
  original_amount numeric(14,2),
  remaining_amount numeric(14,2) not null,
  monthly_payment numeric(12,2),
  interest_rate numeric(5,2),
  due_day int,          -- giorno del mese scadenza rata (per calendario)
  end_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- snapshot mensile del patrimonio netto (per grafico storico)
create table net_worth_snapshots (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid references households(id) on delete cascade,
  date date not null,
  total_assets numeric(14,2) not null,
  total_liabilities numeric(14,2) not null,
  net_worth numeric(14,2) not null,
  liquidity numeric(14,2) not null,
  investments_value numeric(14,2) not null,
  created_at timestamptz not null default now(),
  unique (household_id, date)
);

-- ------------------------------------------------------------
-- 9. OBIETTIVI (goals)
-- ------------------------------------------------------------

create table goals (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid references households(id) on delete cascade,
  name text not null,
  target_amount numeric(14,2) not null,
  current_amount numeric(14,2) not null default 0,
  target_date date,
  icon text,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table goal_contributions ( -- storico versamenti verso un obiettivo
  id uuid primary key default uuid_generate_v4(),
  goal_id uuid references goals(id) on delete cascade,
  amount numeric(12,2) not null,
  date date not null,
  notes text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 10. BUDGET mensile per categoria
-- ------------------------------------------------------------

create table budgets (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid references households(id) on delete cascade,
  category_id uuid references categories(id) on delete cascade,
  month int not null,   -- 1-12
  year int not null,
  amount numeric(12,2) not null,
  created_at timestamptz not null default now(),
  unique (household_id, category_id, month, year)
);

-- ------------------------------------------------------------
-- 11. CALENDARIO / SCADENZE
-- ------------------------------------------------------------

create table deadlines (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid references households(id) on delete cascade,
  title text not null,
  category text,               -- Mutuo/Bolletta/Assicurazione/PAC/Abbonamento
  amount numeric(12,2),
  due_date date not null,
  recurrence_id uuid references recurrences(id) on delete set null,
  related_liability_id uuid references liabilities(id) on delete cascade,
  notify_days_before int default 3,
  is_paid boolean default false,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- INDICI utili
-- ------------------------------------------------------------

create index idx_incomes_household_date on incomes(household_id, date);
create index idx_expenses_household_date on expenses(household_id, date);
create index idx_expenses_category on expenses(category_id);
create index idx_investments_household on investments(household_id);
create index idx_deadlines_household_date on deadlines(household_id, due_date);
create index idx_goals_household on goals(household_id);

-- ------------------------------------------------------------
-- RLS — ogni membro vede/scrive solo i dati del proprio household
-- ------------------------------------------------------------

alter table incomes enable row level security;
alter table expenses enable row level security;
alter table home_expenses enable row level security;
alter table investments enable row level security;
alter table investment_snapshots enable row level security;
alter table investment_cashflows enable row level security;
alter table assets enable row level security;
alter table liabilities enable row level security;
alter table net_worth_snapshots enable row level security;
alter table goals enable row level security;
alter table goal_contributions enable row level security;
alter table budgets enable row level security;
alter table deadlines enable row level security;
alter table categories enable row level security;
alter table recurrences enable row level security;
alter table profiles enable row level security;

create or replace function fn_current_household() returns uuid as $$
  select household_id from profiles where id = auth.uid();
$$ language sql stable;

-- Policy generica riutilizzata per ogni tabella con household_id
-- (esempio per "expenses"; la stessa va replicata per le altre tabelle)
create policy "household_select" on expenses for select
  using (household_id = fn_current_household());
create policy "household_insert" on expenses for insert
  with check (household_id = fn_current_household());
create policy "household_update" on expenses for update
  using (household_id = fn_current_household());
create policy "household_delete" on expenses for delete
  using (household_id = fn_current_household());

-- Ripetere le 4 policy sopra (adattando il nome tabella) per:
-- incomes, home_expenses, investments, investment_snapshots,
-- investment_cashflows, assets, liabilities, net_worth_snapshots,
-- goals, goal_contributions, budgets, deadlines, categories, recurrences

create policy "profiles_select_household" on profiles for select
  using (household_id = fn_current_household());

-- Un utente può creare/aggiornare SOLO il proprio profilo (id = auth.uid()).
-- Necessaria per il flusso di signup, dove il profilo viene creato dal client
-- subito dopo la registrazione.
create policy "profiles_insert_own" on profiles for insert
  with check (id = auth.uid());

create policy "profiles_update_own" on profiles for update
  using (id = auth.uid());
