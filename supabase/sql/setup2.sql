-- =========================================================
-- El Método Dari — Ampliación de base de datos (parte 2)
-- Pega TODO este archivo en Supabase > SQL Editor > New query
-- y dale a "Run". Requiere haber ejecutado antes setup.sql.
-- =========================================================

-- =========================================================
-- PERFILES (para guardar alergias de cada usuario)
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  allergies text[] default '{}',
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (id = auth.uid() or public.is_trainer());

drop policy if exists "profiles_upsert" on public.profiles;
create policy "profiles_upsert" on public.profiles
  for insert with check (id = auth.uid() or public.is_trainer());

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles
  for update using (id = auth.uid() or public.is_trainer());

-- =========================================================
-- BIBLIOTECA DE EJERCICIOS (funcionales y de máquinas/pesas)
-- =========================================================
create table if not exists public.exercise_library (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('funcional', 'maquinas')),
  muscle_group text,
  pattern text not null check (
    pattern in ('squat', 'press', 'pull', 'core', 'cardio')
  ),
  description text,
  created_at timestamptz not null default now()
);

alter table public.exercise_library enable row level security;

drop policy if exists "exercises_select" on public.exercise_library;
create policy "exercises_select" on public.exercise_library
  for select using (auth.role() = 'authenticated');

drop policy if exists "exercises_insert" on public.exercise_library;
create policy "exercises_insert" on public.exercise_library
  for insert with check (public.is_trainer());

drop policy if exists "exercises_delete" on public.exercise_library;
create policy "exercises_delete" on public.exercise_library
  for delete using (public.is_trainer());

-- Sembramos una biblioteca inicial (8 funcionales + 8 de máquinas/pesas)
insert into public.exercise_library (name, category, muscle_group, pattern, description)
select * from (values
  ('Sentadilla', 'funcional', 'Piernas', 'squat', 'Baja flexionando rodillas y cadera, espalda recta, y sube de forma controlada.'),
  ('Zancada', 'funcional', 'Piernas', 'squat', 'Da un paso al frente y flexiona ambas rodillas hasta 90°, alterna piernas.'),
  ('Flexiones', 'funcional', 'Pecho / Brazos', 'press', 'Cuerpo recto apoyado en manos y pies, baja el pecho al suelo y empuja hacia arriba.'),
  ('Plancha', 'funcional', 'Core', 'core', 'Mantén el cuerpo recto apoyado en antebrazos y pies, aprieta el abdomen.'),
  ('Burpees', 'funcional', 'Cuerpo completo', 'cardio', 'Agáchate, extiende las piernas atrás, haz una flexión, salta a pies y salta arriba.'),
  ('Jumping jacks', 'funcional', 'Cardio', 'cardio', 'Salta abriendo piernas y brazos a la vez, y vuelve a la posición inicial.'),
  ('Escaladores (mountain climbers)', 'funcional', 'Core / Cardio', 'cardio', 'En posición de plancha, lleva las rodillas al pecho alternando rápido.'),
  ('Swing con kettlebell', 'funcional', 'Cadera / Espalda', 'pull', 'Balancea la kettlebell entre las piernas y empuja con la cadera hacia adelante.'),
  ('Press de banca', 'maquinas', 'Pecho', 'press', 'Tumbado en el banco, baja la barra al pecho y empuja hacia arriba.'),
  ('Press de hombro', 'maquinas', 'Hombros', 'press', 'Sentado, empuja el peso hacia arriba por encima de la cabeza.'),
  ('Curl de bíceps', 'maquinas', 'Bíceps', 'pull', 'De pie, flexiona el codo llevando el peso hacia el hombro.'),
  ('Jalón al pecho (lat pulldown)', 'maquinas', 'Espalda', 'pull', 'Sentado, tira de la barra hacia el pecho llevando los codos abajo.'),
  ('Remo en máquina', 'maquinas', 'Espalda', 'pull', 'Tira de las asas hacia el abdomen manteniendo la espalda recta.'),
  ('Prensa de piernas', 'maquinas', 'Piernas', 'squat', 'Empuja la plataforma extendiendo las piernas de forma controlada.'),
  ('Extensión de cuádriceps', 'maquinas', 'Piernas', 'squat', 'Sentado, extiende las piernas levantando el peso con los pies.'),
  ('Máquina de remo (cardio)', 'maquinas', 'Cuerpo completo', 'cardio', 'Empuja con las piernas y tira con los brazos de forma coordinada.')
) as v(name, category, muscle_group, pattern, description)
where not exists (select 1 from public.exercise_library);

-- =========================================================
-- RUTINAS (planes por usuario, organizados por días)
-- =========================================================
-- Si ya tenías la tabla "routines" simple de antes, la ampliamos
-- añadiendo la columna que falte (no borra datos existentes).
alter table public.routines add column if not exists title_ok boolean; -- no-op de compatibilidad

create table if not exists public.routine_days (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid references public.routines(id) on delete cascade not null,
  day_number int not null check (day_number between 1 and 7), -- 1=Lunes ... 7=Domingo
  label text not null,
  notes text,
  video_url text,
  created_at timestamptz not null default now()
);

alter table public.routine_days enable row level security;

drop policy if exists "routine_days_select" on public.routine_days;
create policy "routine_days_select" on public.routine_days
  for select using (
    public.is_trainer() or
    exists (
      select 1 from public.routines r
      where r.id = routine_id and (r.user_id = auth.uid() or r.user_id is null)
    )
  );

drop policy if exists "routine_days_write" on public.routine_days;
create policy "routine_days_write" on public.routine_days
  for all using (public.is_trainer()) with check (public.is_trainer());

create table if not exists public.routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_day_id uuid references public.routine_days(id) on delete cascade not null,
  exercise_id uuid references public.exercise_library(id) not null,
  sets int,
  reps text,
  weight_kg numeric,
  notes text,
  order_index int default 0,
  created_at timestamptz not null default now()
);

alter table public.routine_exercises enable row level security;

drop policy if exists "routine_exercises_select" on public.routine_exercises;
create policy "routine_exercises_select" on public.routine_exercises
  for select using (
    public.is_trainer() or
    exists (
      select 1 from public.routine_days d
      join public.routines r on r.id = d.routine_id
      where d.id = routine_day_id and (r.user_id = auth.uid() or r.user_id is null)
    )
  );

drop policy if exists "routine_exercises_write" on public.routine_exercises;
create policy "routine_exercises_write" on public.routine_exercises
  for all using (public.is_trainer()) with check (public.is_trainer());

-- =========================================================
-- ALIMENTACIÓN: biblioteca de alimentos
-- =========================================================
create table if not exists public.foods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  calories_kcal numeric not null,
  protein_g numeric default 0,
  carbs_g numeric default 0,
  fat_g numeric default 0,
  allergens text[] default '{}',
  created_at timestamptz not null default now()
);

alter table public.foods enable row level security;

drop policy if exists "foods_select" on public.foods;
create policy "foods_select" on public.foods
  for select using (auth.role() = 'authenticated');

drop policy if exists "foods_insert" on public.foods;
create policy "foods_insert" on public.foods
  for insert with check (public.is_trainer());

drop policy if exists "foods_delete" on public.foods;
create policy "foods_delete" on public.foods
  for delete using (public.is_trainer());

insert into public.foods (name, calories_kcal, protein_g, carbs_g, fat_g, allergens)
select * from (values
  ('Pechuga de pollo (100g)', 165, 31, 0, 3.6, array[]::text[]),
  ('Arroz blanco cocido (100g)', 130, 2.7, 28, 0.3, array[]::text[]),
  ('Huevo (unidad)', 78, 6.3, 0.6, 5.3, array['huevo']),
  ('Avena (50g)', 190, 6.5, 33, 3.5, array['gluten']),
  ('Salmón (100g)', 208, 20, 0, 13, array['pescado']),
  ('Brócoli cocido (100g)', 35, 2.4, 7, 0.4, array[]::text[]),
  ('Plátano (unidad)', 105, 1.3, 27, 0.4, array[]::text[]),
  ('Yogur natural (125g)', 90, 5, 7, 4.5, array['lactosa']),
  ('Almendras (30g)', 174, 6.4, 6.1, 15, array['frutos secos']),
  ('Pasta cocida (100g)', 158, 5.8, 31, 0.9, array['gluten']),
  ('Atún al natural (100g)', 116, 26, 0, 1, array['pescado']),
  ('Leche entera (200ml)', 122, 6.4, 9.6, 6.6, array['lactosa']),
  ('Pan integral (rebanada)', 80, 4, 14, 1, array['gluten']),
  ('Aguacate (medio)', 160, 2, 8.5, 14.7, array[]::text[]),
  ('Lentejas cocidas (100g)', 116, 9, 20, 0.4, array[]::text[]),
  ('Queso fresco (30g)', 75, 6, 1, 5, array['lactosa']),
  ('Tofu (100g)', 76, 8, 1.9, 4.8, array['soja']),
  ('Nueces (30g)', 196, 4.6, 4, 19.6, array['frutos secos']),
  ('Manzana (unidad)', 95, 0.5, 25, 0.3, array[]::text[]),
  ('Batata / boniato cocido (100g)', 90, 2, 21, 0.2, array[]::text[])
) as v(name, calories_kcal, protein_g, carbs_g, fat_g, allergens)
where not exists (select 1 from public.foods);

-- =========================================================
-- ALIMENTACIÓN: dietas (planes reutilizables por comida)
-- =========================================================
create table if not exists public.diets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade, -- null = plantilla reutilizable
  title text not null,
  notes text,
  created_by text not null,
  created_at timestamptz not null default now()
);

alter table public.diets enable row level security;

drop policy if exists "diets_select" on public.diets;
create policy "diets_select" on public.diets
  for select using (
    user_id = auth.uid() or user_id is null or public.is_trainer()
  );

drop policy if exists "diets_write" on public.diets;
create policy "diets_write" on public.diets
  for all using (public.is_trainer()) with check (public.is_trainer());

create table if not exists public.diet_items (
  id uuid primary key default gen_random_uuid(),
  diet_id uuid references public.diets(id) on delete cascade not null,
  meal_label text not null,
  food_id uuid references public.foods(id) not null,
  quantity_g numeric not null default 100,
  order_index int default 0
);

alter table public.diet_items enable row level security;

drop policy if exists "diet_items_select" on public.diet_items;
create policy "diet_items_select" on public.diet_items
  for select using (
    public.is_trainer() or
    exists (
      select 1 from public.diets d
      where d.id = diet_id and (d.user_id = auth.uid() or d.user_id is null)
    )
  );

drop policy if exists "diet_items_write" on public.diet_items;
create policy "diet_items_write" on public.diet_items
  for all using (public.is_trainer()) with check (public.is_trainer());

-- Sembramos dos dietas de ejemplo, reutilizables (user_id null)
insert into public.diets (title, notes, created_by)
select 'Dieta ejemplo - Mantenimiento', 'Plan base de ejemplo, ajustable por comida.', 'sistema'
where not exists (select 1 from public.diets where title = 'Dieta ejemplo - Mantenimiento');

insert into public.diets (title, notes, created_by)
select 'Dieta ejemplo - Alta en proteína', 'Plan orientado a entrenamiento de fuerza.', 'sistema'
where not exists (select 1 from public.diets where title = 'Dieta ejemplo - Alta en proteína');

insert into public.diet_items (diet_id, meal_label, food_id, quantity_g, order_index)
select d.id, 'Desayuno', f.id, 60, 1
from public.diets d, public.foods f
where d.title = 'Dieta ejemplo - Mantenimiento' and f.name = 'Avena (50g)'
  and not exists (select 1 from public.diet_items where diet_id = d.id);

insert into public.diet_items (diet_id, meal_label, food_id, quantity_g, order_index)
select d.id, 'Desayuno', f.id, 1, 2
from public.diets d, public.foods f
where d.title = 'Dieta ejemplo - Mantenimiento' and f.name = 'Plátano (unidad)'
  and exists (select 1 from public.diet_items where diet_id = d.id and order_index = 1)
  and not exists (select 1 from public.diet_items where diet_id = d.id and order_index = 2);

insert into public.diet_items (diet_id, meal_label, food_id, quantity_g, order_index)
select d.id, 'Comida', f.id, 150, 3
from public.diets d, public.foods f
where d.title = 'Dieta ejemplo - Mantenimiento' and f.name = 'Pechuga de pollo (100g)'
  and not exists (select 1 from public.diet_items where diet_id = d.id and order_index = 3);

insert into public.diet_items (diet_id, meal_label, food_id, quantity_g, order_index)
select d.id, 'Comida', f.id, 150, 4
from public.diets d, public.foods f
where d.title = 'Dieta ejemplo - Mantenimiento' and f.name = 'Arroz blanco cocido (100g)'
  and not exists (select 1 from public.diet_items where diet_id = d.id and order_index = 4);

-- =========================================================
-- LISTO. No hace falta ejecutar nada más en Storage para esto:
-- la biblioteca de ejercicios usa dibujos animados generados por
-- código, no imágenes subidas.
-- =========================================================
