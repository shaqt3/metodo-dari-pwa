-- =========================================================
-- El Método Dari — Contenido completo (parte 3)
-- Pega TODO este archivo en Supabase > SQL Editor > New query
-- y dale a "Run". Es seguro ejecutarlo aunque ya hayas corrido
-- setup.sql y setup2.sql antes: no duplica ni borra nada,
-- solo añade lo que falte.
-- =========================================================

do $$
declare
  v_routine_id uuid;
  v_day_id uuid;
  v_diet_id uuid;
begin

  -- ============ Restricciones para poder insertar sin duplicar ============
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

  -- ============ EJERCICIOS (43 en total) ============
  insert into public.exercise_library (name, category, muscle_group, pattern, description) values
    ('Sentadilla', 'funcional', 'Piernas', 'squat', 'Baja flexionando rodillas y cadera, espalda recta, y sube de forma controlada.'),
    ('Zancada', 'funcional', 'Piernas', 'squat', 'Da un paso al frente y flexiona ambas rodillas hasta 90°, alterna piernas.'),
    ('Flexiones', 'funcional', 'Pecho / Brazos', 'press', 'Cuerpo recto apoyado en manos y pies, baja el pecho al suelo y empuja hacia arriba.'),
    ('Plancha', 'funcional', 'Core', 'core', 'Mantén el cuerpo recto apoyado en antebrazos y pies, aprieta el abdomen.'),
    ('Burpees', 'funcional', 'Cuerpo completo', 'cardio', 'Agáchate, extiende las piernas atrás, haz una flexión, salta a pies y salta arriba.'),
    ('Jumping jacks', 'funcional', 'Cardio', 'cardio', 'Salta abriendo piernas y brazos a la vez, y vuelve a la posición inicial.'),
    ('Escaladores (mountain climbers)', 'funcional', 'Core / Cardio', 'cardio', 'En posición de plancha, lleva las rodillas al pecho alternando rápido.'),
    ('Swing con kettlebell', 'funcional', 'Cadera / Espalda', 'pull', 'Balancea la kettlebell entre las piernas y empuja con la cadera hacia adelante.'),
    ('Plancha lateral', 'funcional', 'Core', 'core', 'Apoyado de lado sobre el antebrazo, mantén el cuerpo recto y alineado.'),
    ('Superman', 'funcional', 'Espalda baja', 'core', 'Tumbado boca abajo, eleva brazos y piernas a la vez manteniendo unos segundos.'),
    ('Puente de glúteo', 'funcional', 'Glúteo', 'squat', 'Tumbado boca arriba, eleva la cadera apretando el glúteo arriba.'),
    ('Sentadilla búlgara', 'funcional', 'Piernas', 'squat', 'Con un pie apoyado atrás elevado, flexiona la pierna delantera hasta 90°.'),
    ('Zancada con salto', 'funcional', 'Piernas / Cardio', 'cardio', 'Alterna zancadas dando un pequeño salto entre cada cambio de pierna.'),
    ('Skipping', 'funcional', 'Cardio', 'cardio', 'Corre elevando las rodillas al pecho en el sitio, a ritmo constante.'),
    ('Saltos al cajón (box jump)', 'funcional', 'Piernas / Cardio', 'cardio', 'Salta con ambos pies encima de un cajón o superficie elevada y baja con control.'),
    ('Remo invertido', 'funcional', 'Espalda', 'pull', 'Colgado bajo una barra, tira del cuerpo hacia arriba manteniendo el cuerpo recto.'),
    ('Dominadas', 'funcional', 'Espalda / Brazos', 'pull', 'Cuelga de una barra y tira del cuerpo hasta que la barbilla la supere.'),
    ('Fondos en banco (dips)', 'funcional', 'Tríceps / Pecho', 'press', 'Apoyado de espaldas en un banco, flexiona los codos bajando el cuerpo y empuja arriba.'),
    ('Abdominales bicicleta', 'funcional', 'Core', 'core', 'Tumbado, alterna llevar el codo contrario a la rodilla que se flexiona.'),
    ('Elevación de piernas', 'funcional', 'Core', 'core', 'Tumbado boca arriba, eleva las piernas rectas hasta 90° y baja con control.'),
    ('Battle ropes', 'funcional', 'Cuerpo completo', 'cardio', 'Genera olas con las cuerdas alternando o a la vez con ambos brazos.'),
    ('Sprints', 'funcional', 'Cardio', 'cardio', 'Corre a máxima intensidad durante tramos cortos con descanso entre ellos.'),
    ('Escalador lateral', 'funcional', 'Core / Cardio', 'cardio', 'En plancha, lleva la rodilla hacia el codo del mismo lado alternando.'),
    ('Press de banca', 'maquinas', 'Pecho', 'press', 'Tumbado en el banco, baja la barra al pecho y empuja hacia arriba.'),
    ('Press de hombro', 'maquinas', 'Hombros', 'press', 'Sentado, empuja el peso hacia arriba por encima de la cabeza.'),
    ('Curl de bíceps', 'maquinas', 'Bíceps', 'pull', 'De pie, flexiona el codo llevando el peso hacia el hombro.'),
    ('Jalón al pecho (lat pulldown)', 'maquinas', 'Espalda', 'pull', 'Sentado, tira de la barra hacia el pecho llevando los codos abajo.'),
    ('Remo en máquina', 'maquinas', 'Espalda', 'pull', 'Tira de las asas hacia el abdomen manteniendo la espalda recta.'),
    ('Prensa de piernas', 'maquinas', 'Piernas', 'squat', 'Empuja la plataforma extendiendo las piernas de forma controlada.'),
    ('Extensión de cuádriceps', 'maquinas', 'Piernas', 'squat', 'Sentado, extiende las piernas levantando el peso con los pies.'),
    ('Máquina de remo (cardio)', 'maquinas', 'Cuerpo completo', 'cardio', 'Empuja con las piernas y tira con los brazos de forma coordinada.'),
    ('Peso muerto con barra', 'maquinas', 'Espalda baja / Piernas', 'squat', 'Con la barra en el suelo, flexiona cadera y rodillas y levanta manteniendo la espalda recta.'),
    ('Sentadilla con barra', 'maquinas', 'Piernas', 'squat', 'Con la barra apoyada en la espalda alta, baja flexionando rodillas y cadera.'),
    ('Press inclinado', 'maquinas', 'Pecho superior', 'press', 'En banco inclinado, baja la barra o mancuernas al pecho y empuja arriba.'),
    ('Press declinado', 'maquinas', 'Pecho inferior', 'press', 'En banco declinado, baja el peso al pecho y empuja arriba.'),
    ('Elevaciones laterales', 'maquinas', 'Hombros', 'press', 'De pie con mancuernas, eleva los brazos a los lados hasta la altura del hombro.'),
    ('Face pull', 'maquinas', 'Espalda alta / Hombros', 'pull', 'Con polea a la altura de la cara, tira llevando los codos hacia atrás.'),
    ('Hip thrust en máquina', 'maquinas', 'Glúteo', 'squat', 'Con la espalda apoyada en el banco, empuja la cadera hacia arriba con peso.'),
    ('Press militar en multipower', 'maquinas', 'Hombros', 'press', 'De pie, empuja la barra guiada hacia arriba por encima de la cabeza.'),
    ('Gemelos en máquina', 'maquinas', 'Gemelos', 'squat', 'De pie o sentado, eleva los talones venciendo la resistencia de la máquina.'),
    ('Máquina de aductores', 'maquinas', 'Piernas (interior)', 'squat', 'Sentado, junta las piernas venciendo la resistencia de la máquina.'),
    ('Máquina de abductores', 'maquinas', 'Piernas (exterior)', 'squat', 'Sentado, separa las piernas venciendo la resistencia de la máquina.'),
    ('Máquina de trapecio (encogimientos)', 'maquinas', 'Trapecio', 'pull', 'De pie con peso en las manos, eleva los hombros hacia las orejas.')
  on conflict (name) do nothing;

  -- ============ ALIMENTOS (73 en total) ============
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

  -- ============ RETOS (10 listos para usar) ============
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

  -- ============ DIETAS DE EJEMPLO ============
  -- Dieta 1: Mantenimiento
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

  -- Dieta 2: Alta en proteína
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

  -- Dieta 3: Pérdida de peso
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

  -- Dieta 4: Vegetariana
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

  -- ============ PLANES DE RUTINA DE EJEMPLO ============
  -- Plan 1: Full body 3 días (máquinas y pesas)
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

  -- Plan 2: Funcional en casa
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
-- LISTO. Puedes volver a ejecutar este archivo entero cuando
-- quieras sin miedo: no duplicará nada de lo que ya exista.
-- =========================================================
