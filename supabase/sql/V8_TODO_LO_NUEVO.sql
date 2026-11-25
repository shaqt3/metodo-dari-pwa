-- =========================================================
-- El Método Dari — Actualización V8
--
-- CÓMO USARLO: Supabase > SQL Editor > New query > pega TODO
-- este archivo > "Run". Debe salir "Success".
--
-- ES SEGURO: no borra ningún dato. Se puede ejecutar varias veces.
-- (Si no ejecutaste V7_FOTOS_Y_MAS.sql, ejecútalo antes.)
--
-- QUÉ AÑADE:
--   1. Series y pesos de cada ejercicio.
--   2. Cuotas y pagos de los socios.
--   3. Mensajes entre socio y entrenadora.
--   4. Revisión semanal del socio.
--   5. Avisos de la entrenadora (a todos o a un socio).
-- =========================================================


-- ============ 1. SERIES Y PESOS ============
create table if not exists public.set_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  exercise_id uuid references public.exercise_library(id) on delete cascade not null,
  log_date date not null default current_date,
  set_number int not null default 1,
  reps numeric,
  weight_kg numeric,
  created_at timestamptz not null default now()
);
create index if not exists set_logs_user_ex on public.set_logs (user_id, exercise_id, log_date desc);
alter table public.set_logs enable row level security;
drop policy if exists "sets_select" on public.set_logs;
create policy "sets_select" on public.set_logs for select using (user_id = auth.uid() or public.is_trainer());
drop policy if exists "sets_insert" on public.set_logs;
create policy "sets_insert" on public.set_logs for insert with check (user_id = auth.uid() or public.is_trainer());
drop policy if exists "sets_update" on public.set_logs;
create policy "sets_update" on public.set_logs for update using (user_id = auth.uid() or public.is_trainer());
drop policy if exists "sets_delete" on public.set_logs;
create policy "sets_delete" on public.set_logs for delete using (user_id = auth.uid() or public.is_trainer());


-- ============ 2. CUOTAS ============
alter table public.profiles add column if not exists monthly_fee numeric;
alter table public.profiles add column if not exists payment_day int;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  period text not null,              -- mes que paga, formato 2026-11
  amount numeric,
  paid_on date not null default current_date,
  method text,
  notes text,
  created_at timestamptz not null default now()
);
alter table public.payments enable row level security;
-- El socio puede VER sus pagos; solo la entrenadora los apunta.
drop policy if exists "payments_select" on public.payments;
create policy "payments_select" on public.payments for select using (user_id = auth.uid() or public.is_trainer());
drop policy if exists "payments_write" on public.payments;
create policy "payments_write" on public.payments for all using (public.is_trainer()) with check (public.is_trainer());


-- ============ 3. MENSAJES ============
-- member_id = el socio de la conversación. Cada socio tiene una
-- conversación con la entrenadora.
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references auth.users(id) on delete cascade not null,
  sender_id uuid references auth.users(id) on delete cascade not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists messages_member on public.messages (member_id, created_at);
alter table public.messages enable row level security;
drop policy if exists "messages_select" on public.messages;
create policy "messages_select" on public.messages for select using (member_id = auth.uid() or public.is_trainer());
drop policy if exists "messages_insert" on public.messages;
create policy "messages_insert" on public.messages for insert
  with check (sender_id = auth.uid() and (member_id = auth.uid() or public.is_trainer()));
drop policy if exists "messages_update" on public.messages;
create policy "messages_update" on public.messages for update using (member_id = auth.uid() or public.is_trainer());
drop policy if exists "messages_delete" on public.messages;
create policy "messages_delete" on public.messages for delete using (sender_id = auth.uid() or public.is_trainer());


-- ============ 4. REVISIÓN SEMANAL ============
create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  checkin_date date not null default current_date,
  weight_kg numeric,
  sleep int,            -- 1 a 5
  energy int,           -- 1 a 5
  hunger int,           -- 1 a 5
  diet_adherence int,   -- 1 a 5
  training_adherence int, -- 1 a 5
  notes text,
  trainer_reply text,
  replied_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.checkins enable row level security;
drop policy if exists "checkins_select" on public.checkins;
create policy "checkins_select" on public.checkins for select using (user_id = auth.uid() or public.is_trainer());
drop policy if exists "checkins_insert" on public.checkins;
create policy "checkins_insert" on public.checkins for insert with check (user_id = auth.uid() or public.is_trainer());
drop policy if exists "checkins_update" on public.checkins;
create policy "checkins_update" on public.checkins for update using (user_id = auth.uid() or public.is_trainer());
drop policy if exists "checkins_delete" on public.checkins;
create policy "checkins_delete" on public.checkins for delete using (user_id = auth.uid() or public.is_trainer());


-- ============ 5. AVISOS ============
-- user_id vacío = aviso para todos los socios.
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  body text,
  created_at timestamptz not null default now()
);
alter table public.announcements enable row level security;
drop policy if exists "ann_select" on public.announcements;
create policy "ann_select" on public.announcements for select
  using (user_id is null or user_id = auth.uid() or public.is_trainer());
drop policy if exists "ann_write" on public.announcements;
create policy "ann_write" on public.announcements for all using (public.is_trainer()) with check (public.is_trainer());

-- Último aviso / mensaje que ha visto cada persona
alter table public.profiles add column if not exists last_seen_announcements timestamptz;


-- ============ PERMISOS ============
grant select, insert, update, delete on
  public.set_logs, public.payments, public.messages, public.checkins, public.announcements
  to authenticated;


-- LISTO. Si ves "Success. No rows returned", todo ha ido bien.
