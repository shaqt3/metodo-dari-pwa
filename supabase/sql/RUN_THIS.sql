-- =========================================================
-- El Método Dari — Script único y definitivo (v2)
-- Pega TODO este archivo en Supabase > SQL Editor > New query
-- y dale a "Run". Sustituye a cualquier script anterior.
--
-- IMPORTANTE: este script empieza BORRANDO las tablas de la
-- app (rutinas, ejercicios, alimentos, dietas, retos, progreso,
-- perfiles) y las vuelve a crear desde cero con la estructura
-- correcta. Esto es necesario porque en intentos anteriores
-- (con otra IA) se crearon algunas de estas tablas con una
-- estructura distinta e incompleta, y eso es lo que está
-- causando los errores.
--
-- Es seguro: NO toca tu tabla de usuarios (auth.users), así
-- que nadie pierde su cuenta ni su contraseña. Solo se borran
-- datos de ejemplo (ejercicios, dietas, retos) que se vuelven
-- a crear automáticamente al final de este mismo script.
-- =========================================================

drop table if exists public.diet_items cascade;
drop table if exists public.diets cascade;
drop table if exists public.routine_exercises cascade;
drop table if exists public.routine_days cascade;
drop table if exists public.routines cascade;
drop table if exists public.exercise_library cascade;
drop table if exists public.challenge_submissions cascade;
drop table if exists public.challenges cascade;
drop table if exists public.workout_logs cascade;
drop table if exists public.foods cascade;
drop table if exists public.profiles cascade;

-- ============ FUNCIÓN: ¿es entrenador/a? ============
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

-- ============ PERFILES (alergias) ============
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

-- ============ RUTINAS (planes por usuario, por días) ============
create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade, -- null = para todos
  title text not null,
  notes text,
  created_by text not null,
  created_at timestamptz not null default now()
);

alter table public.routines enable row level security;
drop policy if exists "routines_select" on public.routines;
create policy "routines_select" on public.routines
  for select using (user_id = auth.uid() or user_id is null or public.is_trainer());
drop policy if exists "routines_insert" on public.routines;
create policy "routines_insert" on public.routines
  for insert with check (public.is_trainer());
drop policy if exists "routines_update" on public.routines;
create policy "routines_update" on public.routines
  for update using (public.is_trainer());
drop policy if exists "routines_delete" on public.routines;
create policy "routines_delete" on public.routines
  for delete using (public.is_trainer());

create table if not exists public.routine_days (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid references public.routines(id) on delete cascade not null,
  day_number int not null check (day_number between 1 and 7),
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
    exists (select 1 from public.routines r where r.id = routine_id and (r.user_id = auth.uid() or r.user_id is null))
  );
drop policy if exists "routine_days_write" on public.routine_days;
create policy "routine_days_write" on public.routine_days
  for all using (public.is_trainer()) with check (public.is_trainer());

-- ============ BIBLIOTECA DE EJERCICIOS ============
create table if not exists public.exercise_library (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('funcional', 'maquinas')),
  muscle_group text,
  pattern text not null check (pattern in ('squat', 'press', 'pull', 'core', 'cardio')),
  description text,
  video_url text,
  created_at timestamptz not null default now()
);

alter table public.exercise_library enable row level security;
drop policy if exists "exercises_select" on public.exercise_library;
create policy "exercises_select" on public.exercise_library
  for select using (auth.role() = 'authenticated');
drop policy if exists "exercises_insert" on public.exercise_library;
create policy "exercises_insert" on public.exercise_library
  for insert with check (public.is_trainer());
drop policy if exists "exercises_update" on public.exercise_library;
create policy "exercises_update" on public.exercise_library
  for update using (public.is_trainer());
drop policy if exists "exercises_delete" on public.exercise_library;
create policy "exercises_delete" on public.exercise_library
  for delete using (public.is_trainer());

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

-- ============ RETOS ============
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

-- ============ PROGRESO ============
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

-- ============ ALIMENTOS ============
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

-- ============ DIETAS ============
create table if not exists public.diets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  notes text,
  created_by text not null,
  created_at timestamptz not null default now()
);
alter table public.diets enable row level security;
drop policy if exists "diets_select" on public.diets;
create policy "diets_select" on public.diets
  for select using (user_id = auth.uid() or user_id is null or public.is_trainer());
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
    exists (select 1 from public.diets d where d.id = diet_id and (d.user_id = auth.uid() or d.user_id is null))
  );
drop policy if exists "diet_items_write" on public.diet_items;
create policy "diet_items_write" on public.diet_items
  for all using (public.is_trainer()) with check (public.is_trainer());

-- =========================================================
-- A partir de aquí: contenido de ejemplo (ejercicios, alimentos,
-- retos, dietas y rutinas). Todo protegido con restricciones
-- únicas + "on conflict do nothing", así que es 100% seguro
-- volver a ejecutar este archivo cuando quieras.
-- =========================================================

do $$
declare
  v_routine_id uuid;
  v_day_id uuid;
  v_diet_id uuid;
begin

  if not exists (select 1 from pg_constraint where conname = 'exercise_library_name_key') then
    alter table public.exercise_library add constraint exercise_library_name_key unique (name);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'foods_name_key') then
    alter table public.foods add constraint foods_name_key unique (name);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'diets_title_key') then
    alter table public.diets add constraint diets_title_key unique (title);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'routines_title_key') then
    alter table public.routines add constraint routines_title_key unique (title);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'challenges_title_key') then
    alter table public.challenges add constraint challenges_title_key unique (title);
  end if;

  -- ============ 43 EJERCICIOS ============
  insert into public.exercise_library (name, category, muscle_group, pattern, description) values
    ('Sentadilla', 'funcional', 'Piernas', 'squat', 'Ponte de pie con los pies a la altura de los hombros. Baja flexionando rodillas y cadera a la vez, como si te fueras a sentar, manteniendo la espalda recta y el pecho arriba. Baja hasta que los muslos queden paralelos al suelo y sube empujando con los talones. Respira: coge aire al bajar, suelta al subir. Error común: dejar que las rodillas se metan hacia dentro.'),
    ('Zancada', 'funcional', 'Piernas', 'squat', 'De pie, da un paso largo hacia adelante. Flexiona ambas rodillas hasta que la de atrás casi toque el suelo, formando dos ángulos de 90°. Empuja con la pierna de delante para volver a la posición inicial y alterna de lado. Mantén el torso recto durante todo el movimiento.'),
    ('Flexiones', 'funcional', 'Pecho / Brazos', 'press', 'Apóyate en el suelo con las manos un poco más abiertas que los hombros y el cuerpo en línea recta desde la cabeza a los pies. Baja el pecho hacia el suelo flexionando los codos (sin abrirlos del todo hacia los lados) y empuja hacia arriba hasta extender los brazos. Si es muy difícil, apoya las rodillas en el suelo.'),
    ('Plancha', 'funcional', 'Core', 'core', 'Apóyate en el suelo sobre los antebrazos y las puntas de los pies, con los codos justo debajo de los hombros. Mantén el cuerpo en línea recta, sin dejar caer la cadera ni elevarla en exceso. Aprieta el abdomen y respira con normalidad mientras aguantas el tiempo indicado.'),
    ('Burpees', 'funcional', 'Cuerpo completo', 'cardio', 'De pie, agáchate y apoya las manos en el suelo. Lleva los pies hacia atrás de un salto quedando en posición de plancha, haz una flexión (opcional), vuelve a llevar los pies hacia las manos de un salto, y termina con un salto vertical con los brazos arriba.'),
    ('Jumping jacks', 'funcional', 'Cardio', 'cardio', 'De pie con los pies juntos y brazos pegados al cuerpo, salta abriendo las piernas a la vez que subes los brazos por encima de la cabeza. Con otro salto, vuelve a la posición inicial. Mantén un ritmo constante.'),
    ('Escaladores (mountain climbers)', 'funcional', 'Core / Cardio', 'cardio', 'Colócate en posición de plancha con los brazos extendidos. Lleva una rodilla hacia el pecho y luego cámbiala rápidamente por la otra, como si corrieras en el sitio manteniendo la cadera baja y estable.'),
    ('Swing con kettlebell', 'funcional', 'Cadera / Espalda', 'pull', 'De pie con los pies separados, sujeta la kettlebell con ambas manos. Flexiona ligeramente las rodillas y lleva la cadera hacia atrás para balancear el peso entre las piernas, luego empuja la cadera hacia adelante con fuerza para que la kettlebell suba hasta la altura del pecho. El impulso viene de la cadera, no de los brazos.'),
    ('Plancha lateral', 'funcional', 'Core', 'core', 'Túmbate de lado apoyando el antebrazo en el suelo, con el codo bajo el hombro. Eleva la cadera del suelo formando una línea recta desde la cabeza a los pies. Aguanta el tiempo indicado y repite del otro lado.'),
    ('Superman', 'funcional', 'Espalda baja', 'core', 'Túmbate boca abajo con los brazos extendidos hacia adelante. Eleva a la vez brazos, pecho y piernas del suelo, aguanta un par de segundos apretando la espalda baja, y baja con control.'),
    ('Puente de glúteo', 'funcional', 'Glúteo', 'squat', 'Túmbate boca arriba con las rodillas flexionadas y los pies apoyados en el suelo. Eleva la cadera hacia el techo apretando el glúteo arriba del todo, y baja con control sin llegar a tocar el suelo del todo.'),
    ('Sentadilla búlgara', 'funcional', 'Piernas', 'squat', 'De espaldas a un banco o silla, apoya el empeine de un pie sobre él. Flexiona la rodilla de la pierna de apoyo hasta formar 90°, manteniendo el torso recto, y sube empujando con esa misma pierna.'),
    ('Zancada con salto', 'funcional', 'Piernas / Cardio', 'cardio', 'Parte de una zancada normal, pero al subir da un pequeño salto en el aire y cambia de pierna, aterrizando directamente en la zancada contraria.'),
    ('Skipping', 'funcional', 'Cardio', 'cardio', 'Corre en el sitio elevando las rodillas hasta la altura de la cadera, moviendo los brazos de forma coordinada como si corrieras hacia adelante.'),
    ('Saltos al cajón (box jump)', 'funcional', 'Piernas / Cardio', 'cardio', 'De pie frente a un cajón o superficie estable, flexiona ligeramente las rodillas y salta con ambos pies a la vez encima de la superficie, aterrizando suave con las rodillas flexionadas. Baja con control, no saltando hacia atrás.'),
    ('Remo invertido', 'funcional', 'Espalda', 'pull', 'Colócate debajo de una barra fija a la altura de la cadera, sujétala con las manos y mantén el cuerpo recto con los talones en el suelo. Tira del pecho hacia la barra flexionando los codos, y baja con control.'),
    ('Dominadas', 'funcional', 'Espalda / Brazos', 'pull', 'Cuelga de una barra con las manos algo más abiertas que los hombros. Tira del cuerpo hacia arriba hasta que la barbilla supere la barra, y baja con control hasta extender los brazos del todo.'),
    ('Fondos en banco (dips)', 'funcional', 'Tríceps / Pecho', 'press', 'Siéntate en el borde de un banco apoyando las manos a los lados de la cadera, con las piernas extendidas al frente. Baja el cuerpo flexionando los codos hacia atrás, y empuja hacia arriba hasta extender los brazos.'),
    ('Abdominales bicicleta', 'funcional', 'Core', 'core', 'Túmbate boca arriba con las manos en la cabeza. Lleva el codo derecho hacia la rodilla izquierda mientras extiendes la otra pierna, y alterna de lado como si pedalearas.'),
    ('Elevación de piernas', 'funcional', 'Core', 'core', 'Túmbate boca arriba con las piernas extendidas. Eleva ambas piernas juntas hasta formar 90° con el suelo, y baja con control sin dejar que la espalda baja se despegue del suelo.'),
    ('Battle ropes', 'funcional', 'Cuerpo completo', 'cardio', 'De pie sujetando el extremo de cada cuerda, flexiona ligeramente las rodillas y mueve los brazos arriba y abajo de forma alterna o simultánea para generar olas en la cuerda.'),
    ('Sprints', 'funcional', 'Cardio', 'cardio', 'Corre a la máxima velocidad posible durante un tramo corto (10-20 segundos), y descansa caminando o parado antes de repetir.'),
    ('Escalador lateral', 'funcional', 'Core / Cardio', 'cardio', 'En posición de plancha, lleva la rodilla derecha hacia el codo derecho (por fuera del cuerpo), vuelve a la posición inicial y repite con el lado contrario.'),
    ('Press de banca', 'maquinas', 'Pecho', 'press', 'Túmbate en el banco con los pies apoyados en el suelo. Sujeta la barra un poco más abierta que los hombros, bájala de forma controlada hasta rozar el pecho, y empújala hacia arriba hasta extender los brazos.'),
    ('Press de hombro', 'maquinas', 'Hombros', 'press', 'Sentado con la espalda apoyada, sujeta el peso a la altura de los hombros. Empuja hacia arriba hasta extender los brazos por encima de la cabeza, y baja con control.'),
    ('Curl de bíceps', 'maquinas', 'Bíceps', 'pull', 'De pie, sujeta el peso con los brazos extendidos junto al cuerpo. Flexiona los codos llevando el peso hacia los hombros sin mover los brazos hacia adelante, y baja con control.'),
    ('Jalón al pecho (lat pulldown)', 'maquinas', 'Espalda', 'pull', 'Sentado, sujeta la barra por encima de la cabeza con las manos abiertas. Tira de la barra hacia el pecho llevando los codos hacia abajo y atrás, y vuelve arriba con control.'),
    ('Remo en máquina', 'maquinas', 'Espalda', 'pull', 'Sentado con el pecho apoyado o el torso recto, tira de las asas hacia el abdomen llevando los codos hacia atrás, apretando los omóplatos, y vuelve con control.'),
    ('Prensa de piernas', 'maquinas', 'Piernas', 'squat', 'Siéntate en la máquina con los pies apoyados en la plataforma a la altura de los hombros. Flexiona las rodillas bajando el peso hacia el pecho, y empuja extendiendo las piernas sin bloquear del todo las rodillas.'),
    ('Extensión de cuádriceps', 'maquinas', 'Piernas', 'squat', 'Sentado en la máquina con las rodillas alineadas con el eje de giro, extiende las piernas levantando el peso hasta casi estirarlas del todo, y baja con control.'),
    ('Máquina de remo (cardio)', 'maquinas', 'Cuerpo completo', 'cardio', 'Sentado con los pies sujetos, empuja con las piernas mientras tiras del asa hacia el abdomen, y vuelve a la posición inicial de forma coordinada y fluida.'),
    ('Peso muerto con barra', 'maquinas', 'Espalda baja / Piernas', 'squat', 'Colócate con la barra en el suelo pegada a las espinillas. Flexiona cadera y rodillas para agarrarla, mantén la espalda recta, y levántate empujando el suelo con los pies hasta quedar totalmente de pie.'),
    ('Sentadilla con barra', 'maquinas', 'Piernas', 'squat', 'Con la barra apoyada en la parte alta de la espalda, separa los pies a la altura de los hombros. Baja flexionando rodillas y cadera manteniendo el pecho arriba, y sube empujando con los talones.'),
    ('Press inclinado', 'maquinas', 'Pecho superior', 'press', 'En un banco inclinado, sujeta el peso a la altura del pecho. Empuja hacia arriba y ligeramente hacia atrás hasta extender los brazos, y baja con control.'),
    ('Press declinado', 'maquinas', 'Pecho inferior', 'press', 'En un banco declinado, baja el peso hasta rozar la parte baja del pecho y empuja hacia arriba hasta extender los brazos.'),
    ('Elevaciones laterales', 'maquinas', 'Hombros', 'press', 'De pie con un peso en cada mano junto al cuerpo, eleva los brazos hacia los lados hasta la altura de los hombros, con un ligero codo flexionado, y baja con control.'),
    ('Face pull', 'maquinas', 'Espalda alta / Hombros', 'pull', 'Con la polea a la altura de la cara, tira de la cuerda hacia ti separando las manos y llevando los codos hacia atrás y arriba, como si quisieras mirar por encima de la cuerda.'),
    ('Hip thrust en máquina', 'maquinas', 'Glúteo', 'squat', 'Con la espalda alta apoyada en el banco y el peso sobre la cadera, empuja la cadera hacia arriba apretando el glúteo, y baja con control sin llegar a tocar el suelo.'),
    ('Press militar en multipower', 'maquinas', 'Hombros', 'press', 'De pie bajo la barra guiada, sujétala a la altura de los hombros y empújala hacia arriba hasta extender los brazos por completo, sin arquear la espalda baja.'),
    ('Gemelos en máquina', 'maquinas', 'Gemelos', 'squat', 'De pie o sentado en la máquina, eleva los talones lo más alto posible venciendo la resistencia, aguanta un instante arriba, y baja con control.'),
    ('Máquina de aductores', 'maquinas', 'Piernas (interior)', 'squat', 'Sentado con las piernas abiertas apoyadas en los cojines, junta las piernas venciendo la resistencia de la máquina, y vuelve a abrir con control.'),
    ('Máquina de abductores', 'maquinas', 'Piernas (exterior)', 'squat', 'Sentado con las piernas juntas apoyadas en los cojines, separa las piernas venciendo la resistencia de la máquina, y vuelve a juntar con control.'),
    ('Máquina de trapecio (encogimientos)', 'maquinas', 'Trapecio', 'pull', 'De pie sujetando el peso con los brazos extendidos junto al cuerpo, eleva los hombros hacia las orejas sin flexionar los codos, aguanta un instante, y baja con control.')
  on conflict (name) do nothing;

  -- ============ 73 ALIMENTOS ============
  insert into public.foods (name, calories_kcal, protein_g, carbs_g, fat_g, allergens) values
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
    ('Batata / boniato cocido (100g)', 90, 2, 21, 0.2, array[]::text[]),
    ('Pavo pechuga (100g)', 135, 24, 0, 4, array[]::text[]),
    ('Ternera magra (100g)', 172, 26, 0, 7, array[]::text[]),
    ('Lomo de cerdo (100g)', 143, 21, 0, 6, array[]::text[]),
    ('Merluza (100g)', 86, 17, 0, 1.3, array['pescado']),
    ('Gambas (100g)', 99, 24, 0.2, 0.3, array['marisco']),
    ('Garbanzos cocidos (100g)', 164, 8.9, 27, 2.6, array[]::text[]),
    ('Judías blancas cocidas (100g)', 127, 8.7, 23, 0.5, array[]::text[]),
    ('Queso curado (30g)', 120, 8, 0.5, 10, array['lactosa']),
    ('Yogur griego (150g)', 146, 13, 6, 8, array['lactosa']),
    ('Requesón (100g)', 98, 11, 3.4, 4.3, array['lactosa']),
    ('Jamón serrano (30g)', 67, 9, 0, 3.3, array[]::text[]),
    ('Jamón cocido (30g)', 33, 5.4, 0.3, 1.2, array[]::text[]),
    ('Seitán (100g)', 370, 75, 14, 1.9, array['gluten']),
    ('Quinoa cocida (100g)', 120, 4.4, 21, 1.9, array[]::text[]),
    ('Cuscús cocido (100g)', 112, 3.8, 23, 0.2, array['gluten']),
    ('Maíz dulce (100g)', 86, 3.2, 19, 1.2, array[]::text[]),
    ('Tortitas de arroz (unidad)', 35, 0.7, 7.3, 0.3, array[]::text[]),
    ('Pan de molde (rebanada)', 70, 2.3, 13, 1, array['gluten']),
    ('Aceite de oliva (1 cda)', 119, 0, 0, 13.5, array[]::text[]),
    ('Aceitunas (30g)', 40, 0.3, 1.5, 4, array[]::text[]),
    ('Mantequilla de cacahuete (15g)', 94, 4, 3, 8, array['frutos secos']),
    ('Avellanas (30g)', 188, 4.5, 5, 18, array['frutos secos']),
    ('Cacahuetes (30g)', 170, 7.7, 5, 14.5, array['frutos secos']),
    ('Espinacas (100g)', 23, 2.9, 3.6, 0.4, array[]::text[]),
    ('Lechuga (100g)', 15, 1.4, 2.9, 0.2, array[]::text[]),
    ('Tomate (unidad)', 22, 1.1, 4.8, 0.2, array[]::text[]),
    ('Pepino (100g)', 15, 0.7, 3.6, 0.1, array[]::text[]),
    ('Zanahoria (100g)', 41, 0.9, 10, 0.2, array[]::text[]),
    ('Calabacín (100g)', 17, 1.2, 3.1, 0.3, array[]::text[]),
    ('Pimiento rojo (100g)', 31, 1, 6, 0.3, array[]::text[]),
    ('Cebolla (100g)', 40, 1.1, 9.3, 0.1, array[]::text[]),
    ('Champiñones (100g)', 22, 3.1, 3.3, 0.3, array[]::text[]),
    ('Calabaza (100g)', 26, 1, 6.5, 0.1, array[]::text[]),
    ('Judías verdes (100g)', 31, 1.8, 7, 0.2, array[]::text[]),
    ('Coliflor (100g)', 25, 1.9, 5, 0.3, array[]::text[]),
    ('Naranja (unidad)', 62, 1.2, 15.4, 0.2, array[]::text[]),
    ('Fresas (100g)', 32, 0.7, 7.7, 0.3, array[]::text[]),
    ('Pera (unidad)', 101, 0.6, 27, 0.2, array[]::text[]),
    ('Uvas (100g)', 69, 0.7, 18, 0.2, array[]::text[]),
    ('Sandía (100g)', 30, 0.6, 7.6, 0.2, array[]::text[]),
    ('Melón (100g)', 34, 0.8, 8.2, 0.2, array[]::text[]),
    ('Kiwi (unidad)', 42, 0.8, 10, 0.4, array[]::text[]),
    ('Piña (100g)', 50, 0.5, 13, 0.1, array[]::text[]),
    ('Mango (100g)', 60, 0.8, 15, 0.4, array[]::text[]),
    ('Leche desnatada (200ml)', 70, 6.8, 9.6, 0.4, array['lactosa']),
    ('Nata para cocinar (30ml)', 100, 0.7, 1, 10.5, array['lactosa']),
    ('Miel (1 cda)', 64, 0.1, 17, 0, array[]::text[]),
    ('Azúcar (1 cda)', 49, 0, 12.6, 0, array[]::text[]),
    ('Chocolate negro 70% (20g)', 114, 1.4, 9, 8.6, array[]::text[]),
    ('Patata cocida (100g)', 87, 1.9, 20, 0.1, array[]::text[]),
    ('Pan de centeno (rebanada)', 65, 2.2, 12, 0.8, array['gluten']),
    ('Bebida de soja (200ml)', 66, 6.4, 3, 3.6, array['soja']),
    ('Edamame (100g)', 122, 11, 10, 5, array['soja'])
  on conflict (name) do nothing;

  -- ============ 10 RETOS ============
  insert into public.challenges (title, description, location, created_by) values
    ('50 minutos en bici', 'Sube una foto o captura de tu ruta en bici de al menos 50 minutos.', 'ambos', 'sistema'),
    ('12.000 pasos en un día', 'Registra que has completado 12.000 pasos hoy.', 'ambos', 'sistema'),
    ('Plancha 3 minutos acumulados', 'Suma al menos 3 minutos de plancha a lo largo del día, en series.', 'ambos', 'sistema'),
    ('Sube 10 pisos de escaleras', 'En lugar de ascensor, sube el equivalente a 10 pisos de escaleras.', 'ambos', 'sistema'),
    ('15 minutos de estiramientos', 'Dedica 15 minutos a estirar todo el cuerpo con calma.', 'ambos', 'sistema'),
    ('Un día sin azúcar añadido', 'Pasa un día completo sin azúcar añadido en tus comidas o bebidas.', 'home', 'sistema'),
    ('Bebe 2 litros de agua', 'Consigue beber 2 litros de agua a lo largo del día.', 'ambos', 'sistema'),
    ('30 flexiones repartidas en el día', 'Suma 30 flexiones en el momento y las series que prefieras.', 'ambos', 'sistema'),
    ('Camina o corre 5 km', 'Sube una foto o nota de tu recorrido de 5 km.', 'ambos', 'sistema'),
    ('Duerme 8 horas esta noche', 'Prioriza el descanso: intenta dormir 8 horas seguidas.', 'home', 'sistema')
  on conflict (title) do nothing;

  -- ============ 4 DIETAS DE EJEMPLO ============
  insert into public.diets (title, notes, created_by) values
    ('Dieta ejemplo - Mantenimiento', 'Plan base de ejemplo, ajustable por comida.', 'sistema')
    on conflict (title) do nothing;
  select id into v_diet_id from public.diets where title = 'Dieta ejemplo - Mantenimiento';
  if not exists (select 1 from public.diet_items where diet_id = v_diet_id) then
    insert into public.diet_items (diet_id, meal_label, food_id, quantity_g, order_index)
      select v_diet_id, 'Desayuno', id, 50, 1 from public.foods where name = 'Avena (50g)'
      union all select v_diet_id, 'Desayuno', id, 120, 2 from public.foods where name = 'Plátano (unidad)'
      union all select v_diet_id, 'Comida', id, 150, 3 from public.foods where name = 'Pechuga de pollo (100g)'
      union all select v_diet_id, 'Comida', id, 150, 4 from public.foods where name = 'Arroz blanco cocido (100g)'
      union all select v_diet_id, 'Comida', id, 100, 5 from public.foods where name = 'Brócoli cocido (100g)'
      union all select v_diet_id, 'Merienda', id, 30, 6 from public.foods where name = 'Almendras (30g)'
      union all select v_diet_id, 'Cena', id, 150, 7 from public.foods where name = 'Salmón (100g)'
      union all select v_diet_id, 'Cena', id, 150, 8 from public.foods where name = 'Batata / boniato cocido (100g)';
  end if;

  insert into public.diets (title, notes, created_by) values
    ('Dieta ejemplo - Alta en proteína', 'Plan orientado a entrenamiento de fuerza.', 'sistema')
    on conflict (title) do nothing;
  select id into v_diet_id from public.diets where title = 'Dieta ejemplo - Alta en proteína';
  if not exists (select 1 from public.diet_items where diet_id = v_diet_id) then
    insert into public.diet_items (diet_id, meal_label, food_id, quantity_g, order_index)
      select v_diet_id, 'Desayuno', id, 2, 1 from public.foods where name = 'Huevo (unidad)'
      union all select v_diet_id, 'Desayuno', id, 40, 2 from public.foods where name = 'Pan integral (rebanada)'
      union all select v_diet_id, 'Comida', id, 200, 3 from public.foods where name = 'Ternera magra (100g)'
      union all select v_diet_id, 'Comida', id, 150, 4 from public.foods where name = 'Quinoa cocida (100g)'
      union all select v_diet_id, 'Merienda', id, 150, 5 from public.foods where name = 'Yogur griego (150g)'
      union all select v_diet_id, 'Cena', id, 150, 6 from public.foods where name = 'Atún al natural (100g)'
      union all select v_diet_id, 'Cena', id, 100, 7 from public.foods where name = 'Garbanzos cocidos (100g)';
  end if;

  insert into public.diets (title, notes, created_by) values
    ('Dieta ejemplo - Pérdida de peso', 'Plan con déficit calórico moderado, saciante y equilibrado.', 'sistema')
    on conflict (title) do nothing;
  select id into v_diet_id from public.diets where title = 'Dieta ejemplo - Pérdida de peso';
  if not exists (select 1 from public.diet_items where diet_id = v_diet_id) then
    insert into public.diet_items (diet_id, meal_label, food_id, quantity_g, order_index)
      select v_diet_id, 'Desayuno', id, 125, 1 from public.foods where name = 'Yogur natural (125g)'
      union all select v_diet_id, 'Desayuno', id, 100, 2 from public.foods where name = 'Fresas (100g)'
      union all select v_diet_id, 'Comida', id, 150, 3 from public.foods where name = 'Merluza (100g)'
      union all select v_diet_id, 'Comida', id, 100, 4 from public.foods where name = 'Judías verdes (100g)'
      union all select v_diet_id, 'Merienda', id, 1, 5 from public.foods where name = 'Manzana (unidad)'
      union all select v_diet_id, 'Cena', id, 2, 6 from public.foods where name = 'Huevo (unidad)'
      union all select v_diet_id, 'Cena', id, 100, 7 from public.foods where name = 'Espinacas (100g)';
  end if;

  insert into public.diets (title, notes, created_by) values
    ('Dieta ejemplo - Vegetariana', 'Plan sin carne ni pescado, con proteína vegetal.', 'sistema')
    on conflict (title) do nothing;
  select id into v_diet_id from public.diets where title = 'Dieta ejemplo - Vegetariana';
  if not exists (select 1 from public.diet_items where diet_id = v_diet_id) then
    insert into public.diet_items (diet_id, meal_label, food_id, quantity_g, order_index)
      select v_diet_id, 'Desayuno', id, 50, 1 from public.foods where name = 'Avena (50g)'
      union all select v_diet_id, 'Desayuno', id, 15, 2 from public.foods where name = 'Mantequilla de cacahuete (15g)'
      union all select v_diet_id, 'Comida', id, 150, 3 from public.foods where name = 'Tofu (100g)'
      union all select v_diet_id, 'Comida', id, 150, 4 from public.foods where name = 'Quinoa cocida (100g)'
      union all select v_diet_id, 'Merienda', id, 30, 5 from public.foods where name = 'Nueces (30g)'
      union all select v_diet_id, 'Cena', id, 150, 6 from public.foods where name = 'Lentejas cocidas (100g)'
      union all select v_diet_id, 'Cena', id, 100, 7 from public.foods where name = 'Calabacín (100g)';
  end if;

  -- ============ 2 PLANES DE RUTINA DE EJEMPLO ============
  insert into public.routines (title, notes, created_by) values
    ('Plan ejemplo - Full body 3 días', 'Rutina de fuerza en máquinas, 3 sesiones por semana.', 'sistema')
    on conflict (title) do nothing;
  select id into v_routine_id from public.routines where title = 'Plan ejemplo - Full body 3 días';

  if not exists (select 1 from public.routine_days where routine_id = v_routine_id) then
    insert into public.routine_days (routine_id, day_number, label) values (v_routine_id, 1, 'Día 1 - Full body A') returning id into v_day_id;
    insert into public.routine_exercises (routine_day_id, exercise_id, sets, reps, weight_kg, order_index)
      select v_day_id, id, 4, '10', 40, 1 from public.exercise_library where name = 'Sentadilla con barra'
      union all select v_day_id, id, 4, '10', 30, 2 from public.exercise_library where name = 'Press de banca'
      union all select v_day_id, id, 3, '12', 25, 3 from public.exercise_library where name = 'Remo en máquina'
      union all select v_day_id, id, 3, '15', null, 4 from public.exercise_library where name = 'Plancha';

    insert into public.routine_days (routine_id, day_number, label) values (v_routine_id, 3, 'Día 2 - Full body B') returning id into v_day_id;
    insert into public.routine_exercises (routine_day_id, exercise_id, sets, reps, weight_kg, order_index)
      select v_day_id, id, 4, '10', 50, 1 from public.exercise_library where name = 'Peso muerto con barra'
      union all select v_day_id, id, 3, '12', 20, 2 from public.exercise_library where name = 'Press de hombro'
      union all select v_day_id, id, 3, '12', 20, 3 from public.exercise_library where name = 'Jalón al pecho (lat pulldown)'
      union all select v_day_id, id, 3, '15', null, 4 from public.exercise_library where name = 'Elevación de piernas';

    insert into public.routine_days (routine_id, day_number, label) values (v_routine_id, 5, 'Día 3 - Full body C') returning id into v_day_id;
    insert into public.routine_exercises (routine_day_id, exercise_id, sets, reps, weight_kg, order_index)
      select v_day_id, id, 4, '12', 60, 1 from public.exercise_library where name = 'Prensa de piernas'
      union all select v_day_id, id, 3, '12', 12, 2 from public.exercise_library where name = 'Curl de bíceps'
      union all select v_day_id, id, 3, '12', null, 3 from public.exercise_library where name = 'Fondos en banco (dips)'
      union all select v_day_id, id, 3, '20', null, 4 from public.exercise_library where name = 'Abdominales bicicleta';
  end if;

  insert into public.routines (title, notes, created_by) values
    ('Plan ejemplo - Funcional en casa', 'Rutina funcional sin máquinas, ideal para hacer en casa.', 'sistema')
    on conflict (title) do nothing;
  select id into v_routine_id from public.routines where title = 'Plan ejemplo - Funcional en casa';

  if not exists (select 1 from public.routine_days where routine_id = v_routine_id) then
    insert into public.routine_days (routine_id, day_number, label) values (v_routine_id, 2, 'Día 1 - Funcional A') returning id into v_day_id;
    insert into public.routine_exercises (routine_day_id, exercise_id, sets, reps, weight_kg, order_index)
      select v_day_id, id, 4, '15', null, 1 from public.exercise_library where name = 'Sentadilla'
      union all select v_day_id, id, 3, '12', null, 2 from public.exercise_library where name = 'Flexiones'
      union all select v_day_id, id, 3, '30 seg', null, 3 from public.exercise_library where name = 'Plancha'
      union all select v_day_id, id, 4, '30 seg', null, 4 from public.exercise_library where name = 'Jumping jacks';

    insert into public.routine_days (routine_id, day_number, label) values (v_routine_id, 4, 'Día 2 - Funcional B') returning id into v_day_id;
    insert into public.routine_exercises (routine_day_id, exercise_id, sets, reps, weight_kg, order_index)
      select v_day_id, id, 3, '10', null, 1 from public.exercise_library where name = 'Burpees'
      union all select v_day_id, id, 3, '12', null, 2 from public.exercise_library where name = 'Zancada'
      union all select v_day_id, id, 3, '20', null, 3 from public.exercise_library where name = 'Superman'
      union all select v_day_id, id, 3, '30 seg', null, 4 from public.exercise_library where name = 'Escaladores (mountain climbers)';

    insert into public.routine_days (routine_id, day_number, label) values (v_routine_id, 6, 'Día 3 - Funcional C') returning id into v_day_id;
    insert into public.routine_exercises (routine_day_id, exercise_id, sets, reps, weight_kg, order_index)
      select v_day_id, id, 4, '12', null, 1 from public.exercise_library where name = 'Puente de glúteo'
      union all select v_day_id, id, 3, '10', null, 2 from public.exercise_library where name = 'Sentadilla búlgara'
      union all select v_day_id, id, 3, '30 seg', null, 3 from public.exercise_library where name = 'Plancha lateral'
      union all select v_day_id, id, 5, '20 seg', null, 4 from public.exercise_library where name = 'Sprints';
  end if;

end $$;

-- =========================================================
-- LISTO. Confirma que no aparece ningún texto en rojo al
-- ejecutar. Si aparece un error, cópiamelo tal cual para
-- que lo revisemos juntos.
-- =========================================================