-- =========================================================
-- El Método Dari — Configuración de base de datos
-- Pega TODO este archivo en Supabase > SQL Editor > New query
-- y dale a "Run". Se puede ejecutar de una sola vez.
-- =========================================================

-- Lista de entrenadoras/es con permisos de administrador.
-- Si algún día cambias o añades entrenadores, edita esta lista
-- y vuelve a ejecutar SOLO este bloque (create or replace function).
create or replace function public.is_trainer()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'email', '') in (
    'darinelarias22@gmail.com',
    'angeddgg@gmail.com'
  );
$$;

-- =========================================================
-- RUTINAS
-- =========================================================
create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade, -- null = para todos
  title text not null,
  type text not null check (type in ('funcional', 'maquinas', 'pesas', 'cardio')),
  zone text,
  youtube_url text,
  notes text,
  created_by text not null,
  created_at timestamptz not null default now()
);

alter table public.routines enable row level security;

drop policy if exists "routines_select" on public.routines;
create policy "routines_select" on public.routines
  for select using (
    user_id = auth.uid() or user_id is null or public.is_trainer()
  );

drop policy if exists "routines_insert" on public.routines;
create policy "routines_insert" on public.routines
  for insert with check (public.is_trainer());

drop policy if exists "routines_update" on public.routines;
create policy "routines_update" on public.routines
  for update using (public.is_trainer());

drop policy if exists "routines_delete" on public.routines;
create policy "routines_delete" on public.routines
  for delete using (public.is_trainer());

-- =========================================================
-- RETOS
-- =========================================================
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  location text not null check (location in ('gym', 'home', 'ambos')),
  created_by text not null,
  created_at timestamptz not null default now()
);

alter table public.challenges enable row level security;

drop policy if exists "challenges_select" on public.challenges;
create policy "challenges_select" on public.challenges
  for select using (auth.role() = 'authenticated');

drop policy if exists "challenges_insert" on public.challenges;
create policy "challenges_insert" on public.challenges
  for insert with check (public.is_trainer());

drop policy if exists "challenges_delete" on public.challenges;
create policy "challenges_delete" on public.challenges
  for delete using (public.is_trainer());

-- =========================================================
-- ENTREGAS DE RETOS (con foto opcional)
-- =========================================================
create table if not exists public.challenge_submissions (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid references public.challenges(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  photo_url text,
  note text,
  completed_at timestamptz not null default now()
);

alter table public.challenge_submissions enable row level security;

drop policy if exists "submissions_select" on public.challenge_submissions;
create policy "submissions_select" on public.challenge_submissions
  for select using (user_id = auth.uid() or public.is_trainer());

drop policy if exists "submissions_insert" on public.challenge_submissions;
create policy "submissions_insert" on public.challenge_submissions
  for insert with check (user_id = auth.uid());

-- =========================================================
-- REGISTRO DE ENTRENAMIENTOS (peso levantado / distancia)
-- =========================================================
create table if not exists public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  log_date date not null default current_date,
  kind text not null check (kind in ('peso', 'cardio')),
  weight_kg numeric,
  distance_km numeric,
  created_at timestamptz not null default now()
);

alter table public.workout_logs enable row level security;

drop policy if exists "logs_select" on public.workout_logs;
create policy "logs_select" on public.workout_logs
  for select using (user_id = auth.uid() or public.is_trainer());

drop policy if exists "logs_insert" on public.workout_logs;
create policy "logs_insert" on public.workout_logs
  for insert with check (user_id = auth.uid());

-- =========================================================
-- LISTO. Después de ejecutar esto, ve a Storage y crea un
-- bucket público llamado "challenge-photos" (ver instrucciones
-- aparte) para que se puedan subir fotos de los retos.
-- =========================================================
