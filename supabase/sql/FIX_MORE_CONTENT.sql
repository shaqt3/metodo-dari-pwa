-- =========================================================
-- El Método Dari — Ampliación de contenido (v2)
-- Pega esto en Supabase > SQL Editor > New query > Run.
-- Seguro de re-ejecutar: usa "on conflict do nothing" y
-- comprobaciones antes de insertar en todo momento.
-- =========================================================

-- ============ Animaciones más específicas por ejercicio ============
alter table public.exercise_library drop constraint if exists exercise_library_pattern_check;
alter table public.exercise_library add constraint exercise_library_pattern_check
  check (pattern in ('squat', 'lunge', 'press', 'pull', 'core', 'cardio', 'jump'));

update public.exercise_library set pattern = 'lunge' where name in ('Zancada', 'Sentadilla búlgara');
update public.exercise_library set pattern = 'jump' where name in
  ('Jumping jacks', 'Zancada con salto', 'Saltos al cajón (box jump)', 'Skipping');

-- ============ Día de la semana en cada alimento de la dieta ============
alter table public.diet_items add column if not exists day_number int not null default 1
  check (day_number between 1 and 7);

do $$
declare
  v_diet_id uuid;
begin

  -- Repartimos los alimentos ya existentes (día 1) también en los
  -- otros 6 días de la semana, para que cada dieta cubra la semana
  -- completa (puedes personalizar cada día después desde la app).
  for v_diet_id in select id from public.diets loop
    if (select count(distinct day_number) from public.diet_items where diet_id = v_diet_id) = 1 then
      insert into public.diet_items (diet_id, day_number, meal_label, food_id, quantity_g, order_index)
      select v_diet_id, d.day_num, di.meal_label, di.food_id, di.quantity_g, di.order_index
      from public.diet_items di
      cross join generate_series(2, 7) as d(day_num)
      where di.diet_id = v_diet_id and di.day_number = 1;
    end if;
  end loop;

  -- ============ 2 plantillas de dieta más ============
  insert into public.diets (title, notes, created_by) values
    ('Dieta ejemplo - Mediterránea', 'Plan equilibrado con aceite de oliva, pescado y legumbres.', 'sistema')
    on conflict (title) do nothing;
  select id into v_diet_id from public.diets where title = 'Dieta ejemplo - Mediterránea';
  if not exists (select 1 from public.diet_items where diet_id = v_diet_id) then
    insert into public.diet_items (diet_id, day_number, meal_label, food_id, quantity_g, order_index)
    select v_diet_id, d.day_num, x.meal_label, x.food_id, x.quantity_g, x.order_index
    from generate_series(1, 7) as d(day_num)
    cross join (
      select 'Desayuno' as meal_label, id as food_id, 40::numeric as quantity_g, 1 as order_index from public.foods where name = 'Pan integral (rebanada)'
      union all select 'Desayuno', id, 1, 2 from public.foods where name = 'Aguacate (medio)'
      union all select 'Comida', id, 150, 3 from public.foods where name = 'Merluza (100g)'
      union all select 'Comida', id, 100, 4 from public.foods where name = 'Lentejas cocidas (100g)'
      union all select 'Comida', id, 10, 5 from public.foods where name = 'Aceite de oliva (1 cda)'
      union all select 'Merienda', id, 1, 6 from public.foods where name = 'Naranja (unidad)'
      union all select 'Cena', id, 150, 7 from public.foods where name = 'Salmón (100g)'
      union all select 'Cena', id, 100, 8 from public.foods where name = 'Tomate (unidad)'
    ) as x;
  end if;

  insert into public.diets (title, notes, created_by) values
    ('Dieta ejemplo - Cetogénica', 'Plan bajo en carbohidratos y alto en grasas saludables.', 'sistema')
    on conflict (title) do nothing;
  select id into v_diet_id from public.diets where title = 'Dieta ejemplo - Cetogénica';
  if not exists (select 1 from public.diet_items where diet_id = v_diet_id) then
    insert into public.diet_items (diet_id, day_number, meal_label, food_id, quantity_g, order_index)
    select v_diet_id, d.day_num, x.meal_label, x.food_id, x.quantity_g, x.order_index
    from generate_series(1, 7) as d(day_num)
    cross join (
      select 'Desayuno' as meal_label, id as food_id, 2::numeric as quantity_g, 1 as order_index from public.foods where name = 'Huevo (unidad)'
      union all select 'Desayuno', id, 1, 2 from public.foods where name = 'Aguacate (medio)'
      union all select 'Comida', id, 150, 3 from public.foods where name = 'Ternera magra (100g)'
      union all select 'Comida', id, 100, 4 from public.foods where name = 'Espinacas (100g)'
      union all select 'Merienda', id, 30, 5 from public.foods where name = 'Nueces (30g)'
      union all select 'Cena', id, 150, 6 from public.foods where name = 'Salmón (100g)'
      union all select 'Cena', id, 100, 7 from public.foods where name = 'Champiñones (100g)'
    ) as x;
  end if;

end $$;

-- ============ 2 planes de rutina más ============
do $$
declare
  v_routine_id uuid;
  v_day_id uuid;
begin

  insert into public.routines (title, notes, created_by) values
    ('Plan ejemplo - Pérdida de peso', 'Combinación de fuerza y cardio, 3 sesiones por semana.', 'sistema')
    on conflict (title) do nothing;
  select id into v_routine_id from public.routines where title = 'Plan ejemplo - Pérdida de peso';

  if not exists (select 1 from public.routine_days where routine_id = v_routine_id) then
    insert into public.routine_days (routine_id, day_number, label) values (v_routine_id, 1, 'Día 1 - Circuito full body') returning id into v_day_id;
    insert into public.routine_exercises (routine_day_id, exercise_id, sets, reps, weight_kg, order_index)
      select v_day_id, id, 4, '15', null::numeric, 1 from public.exercise_library where name = 'Sentadilla'
      union all select v_day_id, id, 4, '30 seg', null::numeric, 2 from public.exercise_library where name = 'Burpees'
      union all select v_day_id, id, 3, '12', null::numeric, 3 from public.exercise_library where name = 'Flexiones'
      union all select v_day_id, id, 3, '30 seg', null::numeric, 4 from public.exercise_library where name = 'Escaladores (mountain climbers)';

    insert into public.routine_days (routine_id, day_number, label) values (v_routine_id, 3, 'Día 2 - Cardio y core') returning id into v_day_id;
    insert into public.routine_exercises (routine_day_id, exercise_id, sets, reps, weight_kg, order_index)
      select v_day_id, id, 5, '20 seg', null::numeric, 1 from public.exercise_library where name = 'Sprints'
      union all select v_day_id, id, 4, '15', null::numeric, 2 from public.exercise_library where name = 'Zancada con salto'
      union all select v_day_id, id, 3, '20', null::numeric, 3 from public.exercise_library where name = 'Abdominales bicicleta'
      union all select v_day_id, id, 3, '30 seg', null::numeric, 4 from public.exercise_library where name = 'Plancha';

    insert into public.routine_days (routine_id, day_number, label) values (v_routine_id, 5, 'Día 3 - Máquinas + cardio') returning id into v_day_id;
    insert into public.routine_exercises (routine_day_id, exercise_id, sets, reps, weight_kg, order_index)
      select v_day_id, id, 3, '15', 30::numeric, 1 from public.exercise_library where name = 'Prensa de piernas'
      union all select v_day_id, id, 3, '15', 15::numeric, 2 from public.exercise_library where name = 'Remo en máquina'
      union all select v_day_id, id, 1, '10 min', null::numeric, 3 from public.exercise_library where name = 'Máquina de remo (cardio)';
  end if;

  insert into public.routines (title, notes, created_by) values
    ('Plan ejemplo - Fuerza avanzada', 'Rutina de fuerza pesada, 3 sesiones por semana.', 'sistema')
    on conflict (title) do nothing;
  select id into v_routine_id from public.routines where title = 'Plan ejemplo - Fuerza avanzada';

  if not exists (select 1 from public.routine_days where routine_id = v_routine_id) then
    insert into public.routine_days (routine_id, day_number, label) values (v_routine_id, 1, 'Día 1 - Peso muerto y espalda') returning id into v_day_id;
    insert into public.routine_exercises (routine_day_id, exercise_id, sets, reps, weight_kg, order_index)
      select v_day_id, id, 5, '5', 80::numeric, 1 from public.exercise_library where name = 'Peso muerto con barra'
      union all select v_day_id, id, 4, '8', 35::numeric, 2 from public.exercise_library where name = 'Remo en máquina'
      union all select v_day_id, id, 3, '10', 15::numeric, 3 from public.exercise_library where name = 'Máquina de trapecio (encogimientos)';

    insert into public.routine_days (routine_id, day_number, label) values (v_routine_id, 3, 'Día 2 - Sentadilla y piernas') returning id into v_day_id;
    insert into public.routine_exercises (routine_day_id, exercise_id, sets, reps, weight_kg, order_index)
      select v_day_id, id, 5, '5', 70::numeric, 1 from public.exercise_library where name = 'Sentadilla con barra'
      union all select v_day_id, id, 4, '10', 80::numeric, 2 from public.exercise_library where name = 'Prensa de piernas'
      union all select v_day_id, id, 3, '12', 20::numeric, 3 from public.exercise_library where name = 'Extensión de cuádriceps';

    insert into public.routine_days (routine_id, day_number, label) values (v_routine_id, 5, 'Día 3 - Press y hombro') returning id into v_day_id;
    insert into public.routine_exercises (routine_day_id, exercise_id, sets, reps, weight_kg, order_index)
      select v_day_id, id, 5, '5', 60::numeric, 1 from public.exercise_library where name = 'Press de banca'
      union all select v_day_id, id, 4, '8', 25::numeric, 2 from public.exercise_library where name = 'Press militar en multipower'
      union all select v_day_id, id, 3, '12', 8::numeric, 3 from public.exercise_library where name = 'Elevaciones laterales';
  end if;

end $$;

-- ============ 5 retos más ============
insert into public.challenges (title, description, location, created_by) values
  ('100 sentadillas en el día', 'Suma 100 sentadillas repartidas en las series que prefieras.', 'ambos', 'sistema'),
  ('Semana sin faltar', 'Entrena al menos 3 días esta semana sin cortar la racha más de 1 día.', 'ambos', 'sistema'),
  ('1 hora de senderismo', 'Sube una foto de una caminata de al menos 1 hora por la naturaleza.', 'home', 'sistema'),
  ('Reto plancha progresiva', 'Aumenta tu tiempo de plancha respecto a la última vez que la hiciste.', 'ambos', 'sistema'),
  ('Comida casera todo el día', 'Pasa un día entero comiendo solo comida preparada por ti, sin procesados.', 'home', 'sistema')
on conflict (title) do nothing;

-- =========================================================
-- LISTO.
-- =========================================================
