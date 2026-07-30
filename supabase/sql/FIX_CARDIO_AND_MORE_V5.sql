-- =========================================================
-- El Método Dari — Cardio + fotos + más contenido (v5)
-- Pega esto en Supabase > SQL Editor > New query > Run.
-- =========================================================

-- ============ Categoría "cardio" + columna de foto ============
alter table public.exercise_library drop constraint if exists exercise_library_category_check;
alter table public.exercise_library add constraint exercise_library_category_check
  check (category in ('funcional', 'cardio', 'maquinas'));

alter table public.exercise_library add column if not exists photo_url text;

-- Algunos ejercicios ya existentes encajan mejor como "cardio"
update public.exercise_library set category = 'cardio' where name in
  ('Burpees', 'Jumping jacks', 'Escaladores (mountain climbers)', 'Sprints',
   'Escalador lateral', 'Skipping', 'Máquina de remo (cardio)');

-- ============ 8 ejercicios de cardio nuevos ============
insert into public.exercise_library (name, category, muscle_group, pattern, description) values
  ('Correr', 'cardio', 'Cardio', 'cardio', 'Corre a un ritmo constante que te permita mantener la respiración controlada. Aumenta la velocidad progresivamente si quieres más intensidad.'),
  ('Cinta de correr', 'cardio', 'Cardio', 'cardio', 'Ajusta la velocidad e inclinación de la cinta según tu nivel. Mantén una postura erguida sin agarrarte a las barras todo el tiempo.'),
  ('Bicicleta estática', 'cardio', 'Piernas / Cardio', 'squat', 'Ajusta el sillín a la altura de tu cadera y pedalea a un ritmo constante, aumentando la resistencia si quieres más intensidad.'),
  ('Elíptica', 'cardio', 'Cuerpo completo', 'cardio', 'Mueve piernas y brazos de forma coordinada sobre la máquina, manteniendo la espalda recta durante todo el recorrido.'),
  ('Comba (salto de cuerda)', 'cardio', 'Cardio', 'jump', 'Salta con ambos pies a la vez mientras giras la cuerda con las muñecas, manteniendo un ritmo constante.'),
  ('Natación', 'cardio', 'Cuerpo completo', 'cardio', 'Nada al estilo que prefieras manteniendo una respiración controlada y una técnica constante durante el recorrido.'),
  ('Escaladora (stair climber)', 'cardio', 'Piernas / Cardio', 'squat', 'Sube escalones de forma continua en la máquina, apoyándote lo mínimo posible en las barras laterales.'),
  ('Spinning', 'cardio', 'Piernas / Cardio', 'squat', 'Pedalea siguiendo el ritmo de la clase o tu propio plan, alternando tramos sentado y de pie según la intensidad.')
on conflict (name) do nothing;

-- ============ 8 dietas: nos aseguramos de que existan (por si acaso) ============
insert into public.diets (title, notes, created_by) values
  ('Dieta ejemplo - Mantenimiento', 'Plan base de ejemplo, ajustable por comida.', 'sistema'),
  ('Dieta ejemplo - Alta en proteína', 'Plan orientado a entrenamiento de fuerza.', 'sistema'),
  ('Dieta ejemplo - Pérdida de peso', 'Plan con déficit calórico moderado, saciante y equilibrado.', 'sistema'),
  ('Dieta ejemplo - Vegetariana', 'Plan sin carne ni pescado, con proteína vegetal.', 'sistema'),
  ('Dieta ejemplo - Mediterránea', 'Plan equilibrado con aceite de oliva, pescado y legumbres.', 'sistema'),
  ('Dieta ejemplo - Cetogénica', 'Plan bajo en carbohidratos y alto en grasas saludables.', 'sistema'),
  ('Dieta ejemplo - Sin gluten', 'Plan pensado para personas con intolerancia al gluten o celiaquía.', 'sistema'),
  ('Dieta ejemplo - Sin lactosa', 'Plan sin lácteos, apto para intolerancia a la lactosa.', 'sistema')
on conflict (title) do nothing;

-- ============ 3 dietas más ============
do $$
declare
  v_diet_id uuid;
begin

  insert into public.diets (title, notes, created_by) values
    ('Dieta ejemplo - Volumen', 'Superávit calórico para ganar masa muscular.', 'sistema')
    on conflict (title) do nothing;
  select id into v_diet_id from public.diets where title = 'Dieta ejemplo - Volumen';
  if not exists (select 1 from public.diet_items where diet_id = v_diet_id) then
    insert into public.diet_items (diet_id, day_number, meal_label, food_id, quantity_g, order_index)
    select v_diet_id, d.day_num, x.meal_label, x.food_id, x.quantity_g, x.order_index
    from generate_series(1, 7) as d(day_num)
    cross join (
      select 'Desayuno' as meal_label, id as food_id, 80::numeric as quantity_g, 1 as order_index from public.foods where name = 'Avena (50g)'
      union all select 'Desayuno', id, 1, 2 from public.foods where name = 'Plátano (unidad)'
      union all select 'Desayuno', id, 30, 3 from public.foods where name = 'Mantequilla de cacahuete (15g)'
      union all select 'Comida', id, 200, 4 from public.foods where name = 'Pechuga de pollo (100g)'
      union all select 'Comida', id, 200, 5 from public.foods where name = 'Arroz blanco cocido (100g)'
      union all select 'Merienda', id, 150, 6 from public.foods where name = 'Yogur griego (150g)'
      union all select 'Merienda', id, 30, 7 from public.foods where name = 'Avellanas (30g)'
      union all select 'Cena', id, 200, 8 from public.foods where name = 'Ternera magra (100g)'
      union all select 'Cena', id, 150, 9 from public.foods where name = 'Batata / boniato cocido (100g)'
    ) as x;
  end if;

  insert into public.diets (title, notes, created_by) values
    ('Dieta ejemplo - Definición', 'Déficit calórico marcado, alta en proteína para preservar músculo.', 'sistema')
    on conflict (title) do nothing;
  select id into v_diet_id from public.diets where title = 'Dieta ejemplo - Definición';
  if not exists (select 1 from public.diet_items where diet_id = v_diet_id) then
    insert into public.diet_items (diet_id, day_number, meal_label, food_id, quantity_g, order_index)
    select v_diet_id, d.day_num, x.meal_label, x.food_id, x.quantity_g, x.order_index
    from generate_series(1, 7) as d(day_num)
    cross join (
      select 'Desayuno' as meal_label, id as food_id, 2::numeric as quantity_g, 1 as order_index from public.foods where name = 'Huevo (unidad)'
      union all select 'Comida', id, 150, 2 from public.foods where name = 'Pechuga de pollo (100g)'
      union all select 'Comida', id, 100, 3 from public.foods where name = 'Brócoli cocido (100g)'
      union all select 'Merienda', id, 125, 4 from public.foods where name = 'Yogur natural (125g)'
      union all select 'Cena', id, 150, 5 from public.foods where name = 'Merluza (100g)'
      union all select 'Cena', id, 100, 6 from public.foods where name = 'Espinacas (100g)'
    ) as x;
  end if;

  insert into public.diets (title, notes, created_by) values
    ('Dieta ejemplo - Sin marisco ni pescado', 'Plan pensado para alergia al pescado y al marisco.', 'sistema')
    on conflict (title) do nothing;
  select id into v_diet_id from public.diets where title = 'Dieta ejemplo - Sin marisco ni pescado';
  if not exists (select 1 from public.diet_items where diet_id = v_diet_id) then
    insert into public.diet_items (diet_id, day_number, meal_label, food_id, quantity_g, order_index)
    select v_diet_id, d.day_num, x.meal_label, x.food_id, x.quantity_g, x.order_index
    from generate_series(1, 7) as d(day_num)
    cross join (
      select 'Desayuno' as meal_label, id as food_id, 50::numeric as quantity_g, 1 as order_index from public.foods where name = 'Avena (50g)'
      union all select 'Desayuno', id, 1, 2 from public.foods where name = 'Plátano (unidad)'
      union all select 'Comida', id, 150, 3 from public.foods where name = 'Pechuga de pollo (100g)'
      union all select 'Comida', id, 150, 4 from public.foods where name = 'Quinoa cocida (100g)'
      union all select 'Merienda', id, 30, 5 from public.foods where name = 'Almendras (30g)'
      union all select 'Cena', id, 150, 6 from public.foods where name = 'Ternera magra (100g)'
      union all select 'Cena', id, 100, 7 from public.foods where name = 'Judías verdes (100g)'
    ) as x;
  end if;

end $$;

-- ============ 3 rutinas más ============
do $$
declare
  v_routine_id uuid;
  v_day_id uuid;
begin

  insert into public.routines (title, notes, created_by) values
    ('Plan ejemplo - Cardio 3 días', 'Enfocado en resistencia cardiovascular, 3 sesiones por semana.', 'sistema')
    on conflict (title) do nothing;
  select id into v_routine_id from public.routines where title = 'Plan ejemplo - Cardio 3 días';
  if not exists (select 1 from public.routine_days where routine_id = v_routine_id) then
    insert into public.routine_days (routine_id, day_number, label) values (v_routine_id, 1, 'Día 1 - Carrera continua') returning id into v_day_id;
    insert into public.routine_exercises (routine_day_id, exercise_id, sets, reps, weight_kg, order_index)
      select v_day_id, id, 1, '30 min', null::numeric, 1 from public.exercise_library where name = 'Correr';

    insert into public.routine_days (routine_id, day_number, label) values (v_routine_id, 3, 'Día 2 - Bici y elíptica') returning id into v_day_id;
    insert into public.routine_exercises (routine_day_id, exercise_id, sets, reps, weight_kg, order_index)
      select v_day_id, id, 1, '20 min', null::numeric, 1 from public.exercise_library where name = 'Bicicleta estática'
      union all select v_day_id, id, 1, '15 min', null::numeric, 2 from public.exercise_library where name = 'Elíptica';

    insert into public.routine_days (routine_id, day_number, label) values (v_routine_id, 5, 'Día 3 - Intervalos') returning id into v_day_id;
    insert into public.routine_exercises (routine_day_id, exercise_id, sets, reps, weight_kg, order_index)
      select v_day_id, id, 8, '20 seg', null::numeric, 1 from public.exercise_library where name = 'Sprints'
      union all select v_day_id, id, 4, '1 min', null::numeric, 2 from public.exercise_library where name = 'Comba (salto de cuerda)';
  end if;

  insert into public.routines (title, notes, created_by) values
    ('Plan ejemplo - Pecho y tríceps', 'Enfocado en pecho y tríceps, 2 sesiones por semana.', 'sistema')
    on conflict (title) do nothing;
  select id into v_routine_id from public.routines where title = 'Plan ejemplo - Pecho y tríceps';
  if not exists (select 1 from public.routine_days where routine_id = v_routine_id) then
    insert into public.routine_days (routine_id, day_number, label) values (v_routine_id, 2, 'Día 1 - Pecho') returning id into v_day_id;
    insert into public.routine_exercises (routine_day_id, exercise_id, sets, reps, weight_kg, order_index)
      select v_day_id, id, 4, '10', 35::numeric, 1 from public.exercise_library where name = 'Press de banca'
      union all select v_day_id, id, 3, '10', 15::numeric, 2 from public.exercise_library where name = 'Press inclinado'
      union all select v_day_id, id, 3, '12', null::numeric, 3 from public.exercise_library where name = 'Flexiones';

    insert into public.routine_days (routine_id, day_number, label) values (v_routine_id, 5, 'Día 2 - Tríceps') returning id into v_day_id;
    insert into public.routine_exercises (routine_day_id, exercise_id, sets, reps, weight_kg, order_index)
      select v_day_id, id, 3, '12', null::numeric, 1 from public.exercise_library where name = 'Fondos en banco (dips)'
      union all select v_day_id, id, 3, '15', 10::numeric, 2 from public.exercise_library where name = 'Press declinado';
  end if;

  insert into public.routines (title, notes, created_by) values
    ('Plan ejemplo - Mixto 4 días', 'Combina fuerza, funcional y cardio a lo largo de la semana.', 'sistema')
    on conflict (title) do nothing;
  select id into v_routine_id from public.routines where title = 'Plan ejemplo - Mixto 4 días';
  if not exists (select 1 from public.routine_days where routine_id = v_routine_id) then
    insert into public.routine_days (routine_id, day_number, label) values (v_routine_id, 1, 'Día 1 - Fuerza tren superior') returning id into v_day_id;
    insert into public.routine_exercises (routine_day_id, exercise_id, sets, reps, weight_kg, order_index)
      select v_day_id, id, 4, '10', 30::numeric, 1 from public.exercise_library where name = 'Press de banca'
      union all select v_day_id, id, 3, '10', 20::numeric, 2 from public.exercise_library where name = 'Remo en máquina';

    insert into public.routine_days (routine_id, day_number, label) values (v_routine_id, 2, 'Día 2 - Funcional') returning id into v_day_id;
    insert into public.routine_exercises (routine_day_id, exercise_id, sets, reps, weight_kg, order_index)
      select v_day_id, id, 4, '12', null::numeric, 1 from public.exercise_library where name = 'Sentadilla'
      union all select v_day_id, id, 3, '30 seg', null::numeric, 2 from public.exercise_library where name = 'Plancha';

    insert into public.routine_days (routine_id, day_number, label) values (v_routine_id, 4, 'Día 3 - Fuerza tren inferior') returning id into v_day_id;
    insert into public.routine_exercises (routine_day_id, exercise_id, sets, reps, weight_kg, order_index)
      select v_day_id, id, 4, '10', 50::numeric, 1 from public.exercise_library where name = 'Sentadilla con barra'
      union all select v_day_id, id, 3, '12', 60::numeric, 2 from public.exercise_library where name = 'Prensa de piernas';

    insert into public.routine_days (routine_id, day_number, label) values (v_routine_id, 6, 'Día 4 - Cardio') returning id into v_day_id;
    insert into public.routine_exercises (routine_day_id, exercise_id, sets, reps, weight_kg, order_index)
      select v_day_id, id, 1, '25 min', null::numeric, 1 from public.exercise_library where name = 'Correr';
  end if;

end $$;

-- =========================================================
-- LISTO.
-- =========================================================
