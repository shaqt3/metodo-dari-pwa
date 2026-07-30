-- =========================================================
-- El Método Dari — Ampliación de contenido (v3)
-- Pega esto en Supabase > SQL Editor > New query > Run.
-- Seguro de re-ejecutar las veces que quieras.
-- =========================================================

-- ============ Nuevo patrón de animación: bisagra de cadera ============
alter table public.exercise_library drop constraint if exists exercise_library_pattern_check;
alter table public.exercise_library add constraint exercise_library_pattern_check
  check (pattern in ('squat', 'lunge', 'hinge', 'press', 'pull', 'core', 'cardio', 'jump'));

update public.exercise_library set pattern = 'hinge' where name in
  ('Peso muerto con barra', 'Swing con kettlebell', 'Puente de glúteo', 'Hip thrust en máquina');
update public.exercise_library set pattern = 'jump' where name = 'Burpees';
update public.exercise_library set pattern = 'pull' where name = 'Máquina de remo (cardio)';

-- ============ Arreglo robusto: dietas completas toda la semana ============
-- Revisa día a día (2 a 7): si ese día no tiene alimentos pero el día 1
-- sí, copia los alimentos del día 1. Es seguro repetirlo: si un día ya
-- tiene contenido, no lo toca ni lo duplica.
do $$
declare
  v_diet_id uuid;
  v_day int;
begin
  for v_diet_id in select id from public.diets loop
    for v_day in 2..7 loop
      if not exists (select 1 from public.diet_items where diet_id = v_diet_id and day_number = v_day)
         and exists (select 1 from public.diet_items where diet_id = v_diet_id and day_number = 1) then
        insert into public.diet_items (diet_id, day_number, meal_label, food_id, quantity_g, order_index)
        select v_diet_id, v_day, meal_label, food_id, quantity_g, order_index
        from public.diet_items
        where diet_id = v_diet_id and day_number = 1;
      end if;
    end loop;
  end loop;
end $$;

-- ============ 2 dietas para intolerancias / alergias ============
do $$
declare
  v_diet_id uuid;
begin

  insert into public.diets (title, notes, created_by) values
    ('Dieta ejemplo - Sin gluten', 'Plan pensado para personas con intolerancia al gluten o celiaquía.', 'sistema')
    on conflict (title) do nothing;
  select id into v_diet_id from public.diets where title = 'Dieta ejemplo - Sin gluten';
  if not exists (select 1 from public.diet_items where diet_id = v_diet_id) then
    insert into public.diet_items (diet_id, day_number, meal_label, food_id, quantity_g, order_index)
    select v_diet_id, d.day_num, x.meal_label, x.food_id, x.quantity_g, x.order_index
    from generate_series(1, 7) as d(day_num)
    cross join (
      select 'Desayuno' as meal_label, id as food_id, 2::numeric as quantity_g, 1 as order_index from public.foods where name = 'Huevo (unidad)'
      union all select 'Desayuno', id, 1, 2 from public.foods where name = 'Plátano (unidad)'
      union all select 'Comida', id, 150, 3 from public.foods where name = 'Pechuga de pollo (100g)'
      union all select 'Comida', id, 150, 4 from public.foods where name = 'Quinoa cocida (100g)'
      union all select 'Merienda', id, 30, 5 from public.foods where name = 'Almendras (30g)'
      union all select 'Cena', id, 150, 6 from public.foods where name = 'Merluza (100g)'
      union all select 'Cena', id, 100, 7 from public.foods where name = 'Patata cocida (100g)'
    ) as x;
  end if;

  insert into public.diets (title, notes, created_by) values
    ('Dieta ejemplo - Sin lactosa', 'Plan sin lácteos, apto para intolerancia a la lactosa.', 'sistema')
    on conflict (title) do nothing;
  select id into v_diet_id from public.diets where title = 'Dieta ejemplo - Sin lactosa';
  if not exists (select 1 from public.diet_items where diet_id = v_diet_id) then
    insert into public.diet_items (diet_id, day_number, meal_label, food_id, quantity_g, order_index)
    select v_diet_id, d.day_num, x.meal_label, x.food_id, x.quantity_g, x.order_index
    from generate_series(1, 7) as d(day_num)
    cross join (
      select 'Desayuno' as meal_label, id as food_id, 50::numeric as quantity_g, 1 as order_index from public.foods where name = 'Avena (50g)'
      union all select 'Desayuno', id, 1, 2 from public.foods where name = 'Manzana (unidad)'
      union all select 'Comida', id, 150, 3 from public.foods where name = 'Ternera magra (100g)'
      union all select 'Comida', id, 150, 4 from public.foods where name = 'Arroz blanco cocido (100g)'
      union all select 'Merienda', id, 30, 5 from public.foods where name = 'Nueces (30g)'
      union all select 'Cena', id, 150, 6 from public.foods where name = 'Atún al natural (100g)'
      union all select 'Cena', id, 100, 7 from public.foods where name = 'Judías verdes (100g)'
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
    ('Plan ejemplo - Espalda y core', 'Enfocado en espalda y estabilidad del core, 2 sesiones por semana.', 'sistema')
    on conflict (title) do nothing;
  select id into v_routine_id from public.routines where title = 'Plan ejemplo - Espalda y core';

  if not exists (select 1 from public.routine_days where routine_id = v_routine_id) then
    insert into public.routine_days (routine_id, day_number, label) values (v_routine_id, 2, 'Día 1 - Espalda') returning id into v_day_id;
    insert into public.routine_exercises (routine_day_id, exercise_id, sets, reps, weight_kg, order_index)
      select v_day_id, id, 4, '8', 40::numeric, 1 from public.exercise_library where name = 'Peso muerto con barra'
      union all select v_day_id, id, 3, '10', 15::numeric, 2 from public.exercise_library where name = 'Jalón al pecho (lat pulldown)'
      union all select v_day_id, id, 3, '12', null::numeric, 3 from public.exercise_library where name = 'Remo invertido'
      union all select v_day_id, id, 3, '15', null::numeric, 4 from public.exercise_library where name = 'Face pull';

    insert into public.routine_days (routine_id, day_number, label) values (v_routine_id, 5, 'Día 2 - Core') returning id into v_day_id;
    insert into public.routine_exercises (routine_day_id, exercise_id, sets, reps, weight_kg, order_index)
      select v_day_id, id, 3, '40 seg', null::numeric, 1 from public.exercise_library where name = 'Plancha'
      union all select v_day_id, id, 3, '30 seg', null::numeric, 2 from public.exercise_library where name = 'Plancha lateral'
      union all select v_day_id, id, 3, '20', null::numeric, 3 from public.exercise_library where name = 'Abdominales bicicleta'
      union all select v_day_id, id, 3, '15', null::numeric, 4 from public.exercise_library where name = 'Superman';
  end if;

  insert into public.routines (title, notes, created_by) values
    ('Plan ejemplo - Iniciación', 'Rutina suave para empezar, 2 sesiones por semana, sin material.', 'sistema')
    on conflict (title) do nothing;
  select id into v_routine_id from public.routines where title = 'Plan ejemplo - Iniciación';

  if not exists (select 1 from public.routine_days where routine_id = v_routine_id) then
    insert into public.routine_days (routine_id, day_number, label) values (v_routine_id, 1, 'Día 1 - Cuerpo completo suave') returning id into v_day_id;
    insert into public.routine_exercises (routine_day_id, exercise_id, sets, reps, weight_kg, order_index)
      select v_day_id, id, 3, '10', null::numeric, 1 from public.exercise_library where name = 'Sentadilla'
      union all select v_day_id, id, 3, '8', null::numeric, 2 from public.exercise_library where name = 'Flexiones'
      union all select v_day_id, id, 3, '20 seg', null::numeric, 3 from public.exercise_library where name = 'Plancha'
      union all select v_day_id, id, 3, '12', null::numeric, 4 from public.exercise_library where name = 'Puente de glúteo';

    insert into public.routine_days (routine_id, day_number, label) values (v_routine_id, 4, 'Día 2 - Cardio suave') returning id into v_day_id;
    insert into public.routine_exercises (routine_day_id, exercise_id, sets, reps, weight_kg, order_index)
      select v_day_id, id, 3, '30 seg', null::numeric, 1 from public.exercise_library where name = 'Jumping jacks'
      union all select v_day_id, id, 3, '10', null::numeric, 2 from public.exercise_library where name = 'Zancada'
      union all select v_day_id, id, 3, '20 seg', null::numeric, 3 from public.exercise_library where name = 'Skipping';
  end if;

end $$;

-- ============ 6 retos más ============
insert into public.challenges (title, description, location, created_by) values
  ('Levanta el peso de un coche', 'Suma en total 1.200 kg levantados entre todos tus registros de esta semana.', 'ambos', 'sistema'),
  ('20 minutos de bici estática', 'Sube una foto o nota de al menos 20 minutos de bici en el gimnasio.', 'gym', 'sistema'),
  ('Un mes sin alcohol', 'Pasa 30 días sin consumir alcohol.', 'home', 'sistema'),
  ('Reto de la escalera', 'Sube y baja escaleras durante 5 minutos seguidos.', 'ambos', 'sistema'),
  ('Prepara tu comida de la semana', 'Deja lista la comida (meal prep) para al menos 3 días.', 'home', 'sistema'),
  ('Entrena con un amigo', 'Haz una sesión de entrenamiento acompañado de alguien más.', 'ambos', 'sistema')
on conflict (title) do nothing;

-- =========================================================
-- LISTO.
-- =========================================================
