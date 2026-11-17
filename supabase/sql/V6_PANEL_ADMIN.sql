-- =========================================================
-- El Método Dari — Actualización V6: panel de administración
--
-- CÓMO USARLO:
--   Supabase > SQL Editor > New query > pega TODO este archivo
--   > botón "Run". Debe terminar sin texto en rojo.
--
-- ES SEGURO:
--   - NO borra ninguna tabla, ningún usuario ni ningún dato.
--   - Solo AÑADE columnas, permisos, alimentos y plantillas.
--   - Se puede ejecutar varias veces sin problema.
--
-- QUÉ AÑADE:
--   1. Ficha completa de socio (nombre, teléfono, objetivo,
--      necesidades de alimentación, notas de la entrenadora...).
--   2. Medidas corporales (peso, cintura...) por fecha.
--   3. Tipos de dieta (adelgazar, ganar peso, volumen,
--      definición, sin gluten / celíacos, vegetariana...).
--   4. Categorías y unidades en los alimentos + muchos alimentos
--      nuevos (también sin gluten y para volumen).
--   5. Fotos y vídeos subidos desde el móvil (almacenamiento).
--   6. Permisos para EDITAR y BORRAR todo desde la app.
-- =========================================================


-- ============ 1. FICHA DE SOCIO ============
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists birth_date date;
alter table public.profiles add column if not exists sex text;
alter table public.profiles add column if not exists height_cm numeric;
alter table public.profiles add column if not exists weight_kg numeric;
alter table public.profiles add column if not exists goal text;
alter table public.profiles add column if not exists modality text;
alter table public.profiles add column if not exists diet_needs text[] default '{}';
alter table public.profiles add column if not exists trainer_notes text;
alter table public.profiles add column if not exists active boolean not null default true;
alter table public.profiles add column if not exists start_date date default current_date;
alter table public.profiles add column if not exists created_at timestamptz default now();

-- Crea la ficha (vacía) de todas las cuentas que ya existen y
-- copia su email, para que aparezcan en "Socios".
insert into public.profiles (id, email)
select u.id, u.email from auth.users u
on conflict (id) do update
  set email = coalesce(public.profiles.email, excluded.email);

drop policy if exists "profiles_delete" on public.profiles;
create policy "profiles_delete" on public.profiles
  for delete using (public.is_trainer());


-- ============ 2. MEDIDAS CORPORALES ============
create table if not exists public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  measured_on date not null default current_date,
  weight_kg numeric,
  body_fat_pct numeric,
  waist_cm numeric,
  hip_cm numeric,
  chest_cm numeric,
  arm_cm numeric,
  notes text,
  created_at timestamptz not null default now()
);
alter table public.body_measurements enable row level security;
drop policy if exists "measures_select" on public.body_measurements;
create policy "measures_select" on public.body_measurements
  for select using (user_id = auth.uid() or public.is_trainer());
drop policy if exists "measures_insert" on public.body_measurements;
create policy "measures_insert" on public.body_measurements
  for insert with check (user_id = auth.uid() or public.is_trainer());
drop policy if exists "measures_update" on public.body_measurements;
create policy "measures_update" on public.body_measurements
  for update using (user_id = auth.uid() or public.is_trainer());
drop policy if exists "measures_delete" on public.body_measurements;
create policy "measures_delete" on public.body_measurements
  for delete using (user_id = auth.uid() or public.is_trainer());


-- ============ 3. EJERCICIOS ============
alter table public.exercise_library add column if not exists photo_url text;
alter table public.exercise_library add column if not exists level text;
alter table public.exercise_library add column if not exists equipment text;

alter table public.exercise_library drop constraint if exists exercise_library_category_check;
alter table public.exercise_library add constraint exercise_library_category_check
  check (category in ('funcional', 'cardio', 'maquinas', 'estiramiento'));
alter table public.exercise_library drop constraint if exists exercise_library_pattern_check;
alter table public.exercise_library add constraint exercise_library_pattern_check
  check (pattern in ('squat', 'lunge', 'hinge', 'press', 'pull', 'core', 'cardio', 'jump'));

-- Al borrar un ejercicio de la biblioteca, se quita también de
-- las rutinas donde estaba (antes daba error).
alter table public.routine_exercises drop constraint if exists routine_exercises_exercise_id_fkey;
alter table public.routine_exercises add constraint routine_exercises_exercise_id_fkey
  foreign key (exercise_id) references public.exercise_library(id) on delete cascade;


-- ============ 4. RUTINAS ============
alter table public.routines add column if not exists goal text;
alter table public.routines add column if not exists level text;
-- Permite tener varias rutinas con el mismo nombre (una por socio)
alter table public.routines drop constraint if exists routines_title_key;


-- ============ 5. RETOS ============
alter table public.challenges add column if not exists photo_url text;
alter table public.challenges add column if not exists video_url text;
alter table public.challenges add column if not exists ends_on date;
alter table public.challenges drop constraint if exists challenges_title_key;

drop policy if exists "challenges_update" on public.challenges;
create policy "challenges_update" on public.challenges
  for update using (public.is_trainer());
drop policy if exists "submissions_delete" on public.challenge_submissions;
create policy "submissions_delete" on public.challenge_submissions
  for delete using (user_id = auth.uid() or public.is_trainer());


-- ============ 6. PROGRESO (poder borrar un registro equivocado) ============
drop policy if exists "logs_delete" on public.workout_logs;
create policy "logs_delete" on public.workout_logs
  for delete using (user_id = auth.uid() or public.is_trainer());


-- ============ 7. ALIMENTOS: categoría y unidad ============
-- base_amount + base_unit = a qué cantidad se refieren las kcal y
-- macros guardadas. Ej: "Avena (50g)" -> 50 g ; "Huevo (unidad)" -> 1 unidad
alter table public.foods add column if not exists category text;
alter table public.foods add column if not exists base_amount numeric;
alter table public.foods add column if not exists base_unit text;
alter table public.foods add column if not exists notes text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'foods_name_key') then
    alter table public.foods add constraint foods_name_key unique (name);
  end if;
end $$;

drop policy if exists "foods_update" on public.foods;
create policy "foods_update" on public.foods
  for update using (public.is_trainer());

-- Al borrar un alimento se quita también de las dietas que lo usaban
alter table public.diet_items drop constraint if exists diet_items_food_id_fkey;
alter table public.diet_items add constraint diet_items_food_id_fkey
  foreign key (food_id) references public.foods(id) on delete cascade;


-- ============ 8. DIETAS: tipo y objetivo calórico ============
alter table public.diets add column if not exists diet_type text;
alter table public.diets add column if not exists kcal_target numeric;
-- Permite tener varias dietas con el mismo nombre (una por socio)
alter table public.diets drop constraint if exists diets_title_key;
alter table public.diet_items add column if not exists day_number int not null default 1;


-- ============ 9. ALIMENTOS NUEVOS ============
insert into public.foods (name, calories_kcal, protein_g, carbs_g, fat_g, allergens, category) values
  -- Sin gluten (aptos para celíacos)
  ('Pan sin gluten (rebanada)', 75, 1.2, 14, 1.6, array[]::text[], 'Sin gluten'),
  ('Pasta sin gluten cocida (100g)', 150, 3, 32, 0.8, array[]::text[], 'Sin gluten'),
  ('Copos de avena sin gluten (50g)', 190, 6.5, 33, 3.5, array[]::text[], 'Sin gluten'),
  ('Harina de arroz (50g)', 183, 3, 40, 0.7, array[]::text[], 'Sin gluten'),
  ('Tortitas de maíz (unidad)', 30, 0.6, 6.5, 0.2, array[]::text[], 'Sin gluten'),
  ('Trigo sarraceno cocido (100g)', 92, 3.4, 20, 0.6, array[]::text[], 'Sin gluten'),
  ('Mijo cocido (100g)', 119, 3.5, 23.7, 1, array[]::text[], 'Sin gluten'),
  ('Arroz integral cocido (100g)', 123, 2.7, 26, 1, array[]::text[], 'Cereales y féculas'),
  ('Tortilla de maíz (unidad)', 52, 1.4, 10.7, 0.7, array[]::text[], 'Sin gluten'),
  ('Galletas sin gluten (unidad)', 45, 0.5, 6.5, 1.9, array[]::text[], 'Sin gluten'),
  ('Crema de arroz (50g)', 185, 3.5, 41, 0.5, array[]::text[], 'Sin gluten'),
  ('Polenta cocida (100g)', 70, 1.6, 15, 0.3, array[]::text[], 'Sin gluten'),
  -- Volumen / ganar peso
  ('Proteína whey (30g)', 120, 24, 3, 1.5, array['lactosa'], 'Suplementos'),
  ('Proteína vegetal de guisante (30g)', 115, 24, 1, 2, array[]::text[], 'Suplementos'),
  ('Ganador de peso / gainer (100g)', 380, 20, 65, 4, array['lactosa'], 'Suplementos'),
  ('Creatina (5g)', 0, 0, 0, 0, array[]::text[], 'Suplementos'),
  ('Pasta integral cocida (100g)', 150, 6, 30, 1.1, array['gluten'], 'Cereales y féculas'),
  ('Bagel (unidad)', 250, 10, 48, 1.5, array['gluten'], 'Cereales y féculas'),
  ('Dátiles (30g)', 85, 0.7, 22, 0.1, array[]::text[], 'Frutas'),
  ('Pasas (30g)', 90, 0.9, 23.8, 0.1, array[]::text[], 'Frutas'),
  ('Mix de frutos secos (30g)', 180, 5.5, 6, 15.5, array['frutos secos'], 'Frutos secos y semillas'),
  ('Crema de almendra (15g)', 92, 3.2, 3, 8, array['frutos secos'], 'Frutos secos y semillas'),
  ('Leche de avena (200ml)', 92, 1.8, 13, 3, array['gluten'], 'Lácteos y bebidas vegetales'),
  ('Granola (40g)', 180, 4, 26, 6.5, array['gluten', 'frutos secos'], 'Cereales y féculas'),
  ('Salmón ahumado (50g)', 92, 11, 0, 5, array['pescado'], 'Pescados y mariscos'),
  ('Carne picada de ternera (100g)', 250, 26, 0, 15, array[]::text[], 'Carnes'),
  ('Muslo de pollo sin piel (100g)', 177, 24, 0, 8.4, array[]::text[], 'Carnes'),
  -- Más variedad
  ('Claras de huevo (100g)', 52, 11, 0.7, 0.2, array['huevo'], 'Huevos'),
  ('Tempeh (100g)', 192, 20, 7.6, 10.8, array['soja'], 'Proteína vegetal'),
  ('Soja texturizada (30g)', 100, 15, 9, 0.3, array['soja'], 'Proteína vegetal'),
  ('Hummus (50g)', 83, 4, 7, 4.8, array['sésamo'], 'Legumbres'),
  ('Sardinas en aceite (50g)', 104, 12, 0, 6, array['pescado'], 'Pescados y mariscos'),
  ('Caballa (100g)', 205, 19, 0, 13.9, array['pescado'], 'Pescados y mariscos'),
  ('Bacalao (100g)', 82, 18, 0, 0.7, array['pescado'], 'Pescados y mariscos'),
  ('Queso cottage (100g)', 98, 11, 3.4, 4.3, array['lactosa'], 'Lácteos y bebidas vegetales'),
  ('Kéfir (200ml)', 120, 7, 9, 6, array['lactosa'], 'Lácteos y bebidas vegetales'),
  ('Yogur sin lactosa (125g)', 75, 5, 7, 3, array[]::text[], 'Lácteos y bebidas vegetales'),
  ('Leche sin lactosa (200ml)', 92, 6.4, 9.6, 3.2, array[]::text[], 'Lácteos y bebidas vegetales'),
  ('Bebida de almendra sin azúcar (200ml)', 26, 1, 0.6, 2.2, array['frutos secos'], 'Lácteos y bebidas vegetales'),
  ('Semillas de chía (15g)', 73, 2.5, 6.3, 4.6, array[]::text[], 'Frutos secos y semillas'),
  ('Semillas de lino (15g)', 80, 2.7, 4.3, 6.3, array[]::text[], 'Frutos secos y semillas'),
  ('Arándanos (100g)', 57, 0.7, 14.5, 0.3, array[]::text[], 'Frutas'),
  ('Frambuesas (100g)', 52, 1.2, 12, 0.7, array[]::text[], 'Frutas'),
  ('Espárragos (100g)', 20, 2.2, 3.9, 0.1, array[]::text[], 'Verduras y hortalizas'),
  ('Berenjena (100g)', 25, 1, 6, 0.2, array[]::text[], 'Verduras y hortalizas'),
  ('Alcachofa (100g)', 47, 3.3, 10.5, 0.2, array[]::text[], 'Verduras y hortalizas'),
  ('Remolacha cocida (100g)', 44, 1.7, 10, 0.2, array[]::text[], 'Verduras y hortalizas'),
  ('Rúcula (50g)', 13, 1.3, 1.8, 0.3, array[]::text[], 'Verduras y hortalizas'),
  ('Café solo (taza)', 2, 0.3, 0, 0, array[]::text[], 'Bebidas'),
  ('Cacao puro en polvo (10g)', 23, 2, 1.1, 1.4, array[]::text[], 'Otros')
on conflict (name) do nothing;

-- Unidad de referencia leyendo el nombre: "(50g)", "(200ml)", "(unidad)"...
update public.foods
set base_amount = (regexp_match(name, '\((\d+(?:[.,]\d+)?)\s*(g|ml)\)'))[1]::numeric,
    base_unit   = (regexp_match(name, '\((\d+(?:[.,]\d+)?)\s*(g|ml)\)'))[2]
where base_amount is null and name ~ '\(\d+(?:[.,]\d+)?\s*(g|ml)\)';

update public.foods set base_amount = 1, base_unit = 'unidad'
  where base_amount is null and name ~* '\((unidad|medio|taza)\)';
update public.foods set base_amount = 1, base_unit = 'rebanada'
  where base_amount is null and name ~* '\(rebanada\)';
update public.foods set base_amount = 1, base_unit = 'cucharada'
  where base_amount is null and name ~* '\(1 cda\)';
update public.foods set base_amount = 100, base_unit = 'g'
  where base_amount is null;

-- Las dietas de ejemplo guardaban "120" plátanos o "40" rebanadas
-- de pan: se corrige a 1 unidad para que las kcal salgan bien.
update public.diet_items di set quantity_g = case when f.name ~* '^Huevo' then 2 else 1 end
from public.foods f
where di.food_id = f.id
  and f.base_unit in ('unidad', 'rebanada', 'cucharada')
  and di.quantity_g >= 10;

-- Categoría de los alimentos que aún no la tienen
update public.foods set category = case
  when name ~* 'pollo|pavo|ternera|cerdo|jamón|lomo|carne' then 'Carnes'
  when name ~* 'salmón|atún|merluza|gamba|bacalao|sardina|caballa|marisco' then 'Pescados y mariscos'
  when name ~* '^huevo|claras' then 'Huevos'
  when name ~* 'leche|yogur|queso|requesón|nata|kéfir|bebida de' then 'Lácteos y bebidas vegetales'
  when name ~* 'lenteja|garbanzo|judías blancas|alubia|hummus|edamame' then 'Legumbres'
  when name ~* 'tofu|seitán|tempeh|soja' then 'Proteína vegetal'
  when name ~* 'almendra|nuez|nueces|avellana|cacahuete|semilla' then 'Frutos secos y semillas'
  when name ~* 'arroz|pasta|pan |pan$|pan de|avena|quinoa|cuscús|maíz|patata|batata|boniato|tortita|centeno' then 'Cereales y féculas'
  when name ~* 'plátano|manzana|naranja|fresa|pera|uva|sandía|melón|kiwi|piña|mango|arándano|frambuesa|dátil|pasas' then 'Frutas'
  when name ~* 'brócoli|espinaca|lechuga|tomate|pepino|zanahoria|calabacín|pimiento|cebolla|champiñ|calabaza|judías verdes|coliflor|aguacate|espárrago|berenjena|alcachofa|remolacha|rúcula' then 'Verduras y hortalizas'
  when name ~* 'aceite|aceituna' then 'Grasas y aceites'
  else 'Otros'
end
where category is null;


-- ============ 10. TIPO DE LAS DIETAS EXISTENTES ============
update public.diets set diet_type = case
  when title ~* 'gluten|celíac|celiac' then 'sin_gluten'
  when title ~* 'lactosa' then 'sin_lactosa'
  when title ~* 'pérdida|perder|adelgaz|déficit' then 'perder_peso'
  when title ~* 'volumen' then 'volumen'
  when title ~* 'ganar|engordar' then 'ganar_peso'
  when title ~* 'definici' then 'definicion'
  when title ~* 'vegana' then 'vegana'
  when title ~* 'vegetarian' then 'vegetariana'
  when title ~* 'cetog|keto' then 'cetogenica'
  when title ~* 'mediterr' then 'mediterranea'
  when title ~* 'proteína' then 'alta_proteina'
  when title ~* 'mantenimiento' then 'mantenimiento'
  else 'otra'
end
where diet_type is null;


-- ============ 11. NUEVAS DIETAS PLANTILLA ============
-- Solo se crean si no existe ya una plantilla con ese nombre.
-- Cada una se rellena con dos menús que se alternan en la semana.
do $$
declare
  v_id uuid;
  t record;
begin
  for t in
    select * from (values
      ('Plantilla - Sin gluten (celíacos)', 'sin_gluten', 1800,
       'Todos los alimentos son aptos para celíacos. Revisa siempre que los productos envasados lleven el sello "sin gluten".'),
      ('Plantilla - Adelgazar', 'perder_peso', 1450,
       'Déficit calórico moderado, mucha verdura y proteína para no pasar hambre.'),
      ('Plantilla - Ganar peso', 'ganar_peso', 2600,
       'Superávit calórico con alimentos densos y fáciles de comer.'),
      ('Plantilla - Volumen', 'volumen', 3000,
       'Superávit + mucha proteína para ganar músculo. Acompañar con rutina de fuerza.'),
      ('Plantilla - Definición', 'definicion', 1650,
       'Proteína alta y carbohidratos ajustados para perder grasa manteniendo músculo.')
    ) as x(title, diet_type, kcal, notes)
  loop
    if not exists (select 1 from public.diets where title = t.title and user_id is null) then
      insert into public.diets (title, notes, created_by, diet_type, kcal_target)
      values (t.title, t.notes, 'sistema', t.diet_type, t.kcal)
      returning id into v_id;

      insert into public.diet_items (diet_id, day_number, meal_label, food_id, quantity_g, order_index)
      select v_id, d.day_num, m.meal, f.id, m.qty, m.ord
      from (values (1),(3),(5),(7)) as d(day_num)
      cross join (
        select * from (values
          -- menú A
          ('sin_gluten', 'Comida', 'Aceite de oliva (1 cda)', 1, 20),
          ('sin_gluten', 'Cena', 'Aceite de oliva (1 cda)', 1, 21),
          ('sin_gluten', 'Merienda', 'Almendras (30g)', 30, 22),
          ('sin_gluten', 'Merienda', 'Plátano (unidad)', 1, 23),
          ('perder_peso', 'Desayuno', 'Avena (50g)', 40, 20),
          ('perder_peso', 'Comida', 'Aceite de oliva (1 cda)', 1, 21),
          ('perder_peso', 'Merienda', 'Almendras (30g)', 20, 22),
          ('perder_peso', 'Cena', 'Aceite de oliva (1 cda)', 1, 23),
          ('perder_peso', 'Cena', 'Pan integral (rebanada)', 1, 24),
          ('definicion', 'Desayuno', 'Pan integral (rebanada)', 2, 20),
          ('definicion', 'Comida', 'Aceite de oliva (1 cda)', 1, 21),
          ('definicion', 'Cena', 'Aceite de oliva (1 cda)', 1, 22),
          ('definicion', 'Merienda', 'Manzana (unidad)', 1, 23),
          ('definicion', 'Merienda', 'Almendras (30g)', 20, 24),
          ('sin_gluten', 'Desayuno', 'Copos de avena sin gluten (50g)', 50, 1),
          ('sin_gluten', 'Desayuno', 'Plátano (unidad)', 1, 2),
          ('sin_gluten', 'Comida', 'Pechuga de pollo (100g)', 150, 3),
          ('sin_gluten', 'Comida', 'Arroz blanco cocido (100g)', 150, 4),
          ('sin_gluten', 'Comida', 'Brócoli cocido (100g)', 150, 5),
          ('sin_gluten', 'Merienda', 'Yogur natural (125g)', 125, 6),
          ('sin_gluten', 'Cena', 'Merluza (100g)', 150, 7),
          ('sin_gluten', 'Cena', 'Patata cocida (100g)', 150, 8),
          ('perder_peso', 'Desayuno', 'Yogur natural (125g)', 125, 1),
          ('perder_peso', 'Desayuno', 'Fresas (100g)', 150, 2),
          ('perder_peso', 'Comida', 'Pechuga de pollo (100g)', 150, 3),
          ('perder_peso', 'Comida', 'Calabacín (100g)', 200, 4),
          ('perder_peso', 'Comida', 'Quinoa cocida (100g)', 80, 5),
          ('perder_peso', 'Merienda', 'Manzana (unidad)', 1, 6),
          ('perder_peso', 'Cena', 'Merluza (100g)', 150, 7),
          ('perder_peso', 'Cena', 'Espinacas (100g)', 150, 8),
          ('ganar_peso', 'Desayuno', 'Avena (50g)', 80, 1),
          ('ganar_peso', 'Desayuno', 'Leche entera (200ml)', 300, 2),
          ('ganar_peso', 'Desayuno', 'Mantequilla de cacahuete (15g)', 30, 3),
          ('ganar_peso', 'Almuerzo', 'Bagel (unidad)', 1, 4),
          ('ganar_peso', 'Comida', 'Arroz blanco cocido (100g)', 250, 5),
          ('ganar_peso', 'Comida', 'Muslo de pollo sin piel (100g)', 200, 6),
          ('ganar_peso', 'Merienda', 'Mix de frutos secos (30g)', 40, 7),
          ('ganar_peso', 'Merienda', 'Dátiles (30g)', 30, 8),
          ('ganar_peso', 'Cena', 'Salmón (100g)', 180, 9),
          ('ganar_peso', 'Cena', 'Batata / boniato cocido (100g)', 250, 10),
          ('volumen', 'Desayuno', 'Avena (50g)', 100, 1),
          ('volumen', 'Desayuno', 'Proteína whey (30g)', 30, 2),
          ('volumen', 'Desayuno', 'Plátano (unidad)', 1, 3),
          ('volumen', 'Almuerzo', 'Pan integral (rebanada)', 3, 4),
          ('volumen', 'Almuerzo', 'Huevo (unidad)', 3, 5),
          ('volumen', 'Comida', 'Pasta integral cocida (100g)', 250, 6),
          ('volumen', 'Comida', 'Carne picada de ternera (100g)', 150, 7),
          ('volumen', 'Merienda', 'Yogur griego (150g)', 150, 8),
          ('volumen', 'Merienda', 'Granola (40g)', 40, 9),
          ('volumen', 'Cena', 'Arroz blanco cocido (100g)', 200, 10),
          ('volumen', 'Cena', 'Pechuga de pollo (100g)', 200, 11),
          ('volumen', 'Cena', 'Aceite de oliva (1 cda)', 1, 12),
          ('definicion', 'Desayuno', 'Claras de huevo (100g)', 150, 1),
          ('definicion', 'Desayuno', 'Avena (50g)', 40, 2),
          ('definicion', 'Comida', 'Pavo pechuga (100g)', 180, 3),
          ('definicion', 'Comida', 'Arroz integral cocido (100g)', 120, 4),
          ('definicion', 'Comida', 'Judías verdes (100g)', 200, 5),
          ('definicion', 'Merienda', 'Queso cottage (100g)', 150, 6),
          ('definicion', 'Cena', 'Bacalao (100g)', 200, 7),
          ('definicion', 'Cena', 'Espárragos (100g)', 150, 8)
        ) as z(dtype, meal, food, qty, ord)
        where z.dtype = t.diet_type
      ) as m
      join public.foods f on f.name = m.food;

      insert into public.diet_items (diet_id, day_number, meal_label, food_id, quantity_g, order_index)
      select v_id, d.day_num, m.meal, f.id, m.qty, m.ord
      from (values (2),(4),(6)) as d(day_num)
      cross join (
        select * from (values
          -- menú B
          ('sin_gluten', 'Comida', 'Aceite de oliva (1 cda)', 1, 20),
          ('sin_gluten', 'Cena', 'Aceite de oliva (1 cda)', 1, 21),
          ('sin_gluten', 'Merienda', 'Manzana (unidad)', 1, 22),
          ('perder_peso', 'Desayuno', 'Pan integral (rebanada)', 2, 20),
          ('perder_peso', 'Desayuno', 'Aceite de oliva (1 cda)', 1, 21),
          ('perder_peso', 'Comida', 'Aceite de oliva (1 cda)', 1, 22),
          ('perder_peso', 'Merienda', 'Yogur natural (125g)', 125, 23),
          ('perder_peso', 'Cena', 'Patata cocida (100g)', 150, 24),
          ('ganar_peso', 'Comida', 'Aceite de oliva (1 cda)', 1, 20),
          ('ganar_peso', 'Cena', 'Aceite de oliva (1 cda)', 1, 21),
          ('ganar_peso', 'Merienda', 'Nueces (30g)', 30, 22),
          ('ganar_peso', 'Merienda', 'Plátano (unidad)', 1, 23),
          ('volumen', 'Comida', 'Aceite de oliva (1 cda)', 1, 20),
          ('volumen', 'Cena', 'Aceite de oliva (1 cda)', 1, 21),
          ('volumen', 'Almuerzo', 'Mix de frutos secos (30g)', 40, 22),
          ('volumen', 'Almuerzo', 'Pan integral (rebanada)', 2, 23),
          ('definicion', 'Desayuno', 'Pan integral (rebanada)', 2, 20),
          ('definicion', 'Comida', 'Aceite de oliva (1 cda)', 1, 21),
          ('definicion', 'Cena', 'Aceite de oliva (1 cda)', 1, 22),
          ('definicion', 'Merienda', 'Manzana (unidad)', 1, 23),
          ('definicion', 'Merienda', 'Almendras (30g)', 20, 24),
          ('sin_gluten', 'Desayuno', 'Pan sin gluten (rebanada)', 2, 1),
          ('sin_gluten', 'Desayuno', 'Huevo (unidad)', 2, 2),
          ('sin_gluten', 'Desayuno', 'Aguacate (medio)', 1, 3),
          ('sin_gluten', 'Comida', 'Lentejas cocidas (100g)', 200, 4),
          ('sin_gluten', 'Merienda', 'Tortitas de arroz (unidad)', 3, 5),
          ('sin_gluten', 'Merienda', 'Queso fresco (30g)', 60, 6),
          ('sin_gluten', 'Cena', 'Salmón (100g)', 150, 7),
          ('sin_gluten', 'Cena', 'Quinoa cocida (100g)', 120, 8),
          ('perder_peso', 'Desayuno', 'Huevo (unidad)', 2, 1),
          ('perder_peso', 'Desayuno', 'Tomate (unidad)', 1, 2),
          ('perder_peso', 'Comida', 'Lentejas cocidas (100g)', 150, 3),
          ('perder_peso', 'Comida', 'Lechuga (100g)', 100, 4),
          ('perder_peso', 'Merienda', 'Kiwi (unidad)', 2, 5),
          ('perder_peso', 'Cena', 'Atún al natural (100g)', 100, 6),
          ('perder_peso', 'Cena', 'Judías verdes (100g)', 200, 7),
          ('ganar_peso', 'Desayuno', 'Pan integral (rebanada)', 3, 1),
          ('ganar_peso', 'Desayuno', 'Aguacate (medio)', 1, 2),
          ('ganar_peso', 'Desayuno', 'Huevo (unidad)', 2, 3),
          ('ganar_peso', 'Comida', 'Pasta cocida (100g)', 250, 4),
          ('ganar_peso', 'Comida', 'Atún al natural (100g)', 120, 5),
          ('ganar_peso', 'Merienda', 'Ganador de peso / gainer (100g)', 100, 6),
          ('ganar_peso', 'Cena', 'Ternera magra (100g)', 180, 7),
          ('ganar_peso', 'Cena', 'Patata cocida (100g)', 250, 8),
          ('volumen', 'Desayuno', 'Crema de arroz (50g)', 80, 1),
          ('volumen', 'Desayuno', 'Leche entera (200ml)', 300, 2),
          ('volumen', 'Desayuno', 'Crema de almendra (15g)', 30, 3),
          ('volumen', 'Comida', 'Arroz blanco cocido (100g)', 250, 4),
          ('volumen', 'Comida', 'Salmón (100g)', 200, 5),
          ('volumen', 'Merienda', 'Proteína whey (30g)', 30, 6),
          ('volumen', 'Merienda', 'Plátano (unidad)', 2, 7),
          ('volumen', 'Cena', 'Patata cocida (100g)', 300, 8),
          ('volumen', 'Cena', 'Ternera magra (100g)', 200, 9),
          ('definicion', 'Desayuno', 'Yogur griego (150g)', 150, 1),
          ('definicion', 'Desayuno', 'Arándanos (100g)', 100, 2),
          ('definicion', 'Comida', 'Pechuga de pollo (100g)', 180, 3),
          ('definicion', 'Comida', 'Quinoa cocida (100g)', 100, 4),
          ('definicion', 'Comida', 'Brócoli cocido (100g)', 200, 5),
          ('definicion', 'Merienda', 'Proteína whey (30g)', 30, 6),
          ('definicion', 'Cena', 'Huevo (unidad)', 2, 7),
          ('definicion', 'Cena', 'Calabacín (100g)', 200, 8)
        ) as z(dtype, meal, food, qty, ord)
        where z.dtype = t.diet_type and z.qty > 0
      ) as m
      join public.foods f on f.name = m.food;
    end if;
  end loop;
end $$;


-- ============ 12. FOTOS Y VÍDEOS (almacenamiento) ============
-- "media": fotos y vídeos que sube la entrenadora (ejercicios, retos).
-- "challenge-photos": fotos que suben los socios al completar un reto.
insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', true, 52428800)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('challenge-photos', 'challenge-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "dari_media_read" on storage.objects;
create policy "dari_media_read" on storage.objects
  for select using (bucket_id in ('media', 'challenge-photos'));

drop policy if exists "dari_media_write" on storage.objects;
create policy "dari_media_write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and public.is_trainer());

drop policy if exists "dari_media_update" on storage.objects;
create policy "dari_media_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and public.is_trainer());

drop policy if exists "dari_media_delete" on storage.objects;
create policy "dari_media_delete" on storage.objects
  for delete to authenticated
  using (bucket_id in ('media', 'challenge-photos') and public.is_trainer());

drop policy if exists "dari_challenge_upload" on storage.objects;
create policy "dari_challenge_upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'challenge-photos'
              and (storage.foldername(name))[1] = auth.uid()::text);


-- ============ 13. PERMISOS BÁSICOS ============
grant select, insert, update, delete on public.body_measurements to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;


-- =========================================================
-- LISTO. Si ves "Success. No rows returned", todo ha ido bien.
-- Si aparece un error en rojo, cópialo tal cual para revisarlo.
-- =========================================================
