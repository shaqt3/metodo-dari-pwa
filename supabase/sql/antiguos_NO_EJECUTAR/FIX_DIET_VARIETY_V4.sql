-- =========================================================
-- El Método Dari — Variedad real en las dietas + más rutinas (v4)
-- Pega esto en Supabase > SQL Editor > New query > Run.
--
-- Borra los alimentos actuales de las dietas de ejemplo (estaban
-- duplicados, el mismo lunes repetido toda la semana) y los
-- vuelve a crear con 3 combinaciones distintas rotando a lo largo
-- de la semana, para que cada dieta varíe de verdad.
-- =========================================================

delete from public.diet_items
where diet_id in (select id from public.diets where created_by = 'sistema');

-- Nos aseguramos de que las 8 plantillas existan, por si alguna
-- no llegó a crearse en un intento anterior.
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

do $$
declare
  v_diet_id uuid;
begin

  -- ===================== MANTENIMIENTO =====================
  select id into v_diet_id from public.diets where title = 'Dieta ejemplo - Mantenimiento';

  insert into public.diet_items (diet_id, day_number, meal_label, food_id, quantity_g, order_index)
  select v_diet_id, d.day_num, x.meal_label, x.food_id, x.quantity_g, x.order_index
  from unnest(array[1,4,7]) as d(day_num)
  cross join (
    select 'Desayuno' as meal_label, id as food_id, 50::numeric as quantity_g, 1 as order_index from public.foods where name = 'Avena (50g)'
    union all select 'Desayuno', id, 1, 2 from public.foods where name = 'Plátano (unidad)'
    union all select 'Comida', id, 150, 3 from public.foods where name = 'Pechuga de pollo (100g)'
    union all select 'Comida', id, 150, 4 from public.foods where name = 'Arroz blanco cocido (100g)'
    union all select 'Merienda', id, 30, 5 from public.foods where name = 'Almendras (30g)'
    union all select 'Cena', id, 150, 6 from public.foods where name = 'Salmón (100g)'
  ) as x;

  insert into public.diet_items (diet_id, day_number, meal_label, food_id, quantity_g, order_index)
  select v_diet_id, d.day_num, x.meal_label, x.food_id, x.quantity_g, x.order_index
  from unnest(array[2,5]) as d(day_num)
  cross join (
    select 'Desayuno' as meal_label, id as food_id, 2::numeric as quantity_g, 1 as order_index from public.foods where name = 'Huevo (unidad)'
    union all select 'Desayuno', id, 40, 2 from public.foods where name = 'Pan integral (rebanada)'
    union all select 'Comida', id, 150, 3 from public.foods where name = 'Pavo pechuga (100g)'
    union all select 'Comida', id, 100, 4 from public.foods where name = 'Judías verdes (100g)'
    union all select 'Merienda', id, 150, 5 from public.foods where name = 'Yogur griego (150g)'
    union all select 'Cena', id, 150, 6 from public.foods where name = 'Merluza (100g)'
    union all select 'Cena', id, 100, 7 from public.foods where name = 'Patata cocida (100g)'
  ) as x;

  insert into public.diet_items (diet_id, day_number, meal_label, food_id, quantity_g, order_index)
  select v_diet_id, d.day_num, x.meal_label, x.food_id, x.quantity_g, x.order_index
  from unnest(array[3,6]) as d(day_num)
  cross join (
    select 'Desayuno' as meal_label, id as food_id, 125::numeric as quantity_g, 1 as order_index from public.foods where name = 'Yogur natural (125g)'
    union all select 'Desayuno', id, 100, 2 from public.foods where name = 'Fresas (100g)'
    union all select 'Comida', id, 150, 3 from public.foods where name = 'Ternera magra (100g)'
    union all select 'Comida', id, 100, 4 from public.foods where name = 'Calabacín (100g)'
    union all select 'Merienda', id, 1, 5 from public.foods where name = 'Manzana (unidad)'
    union all select 'Cena', id, 150, 6 from public.foods where name = 'Atún al natural (100g)'
    union all select 'Cena', id, 100, 7 from public.foods where name = 'Lechuga (100g)'
  ) as x;

  -- ===================== ALTA EN PROTEÍNA =====================
  select id into v_diet_id from public.diets where title = 'Dieta ejemplo - Alta en proteína';

  insert into public.diet_items (diet_id, day_number, meal_label, food_id, quantity_g, order_index)
  select v_diet_id, d.day_num, x.meal_label, x.food_id, x.quantity_g, x.order_index
  from unnest(array[1,4,7]) as d(day_num)
  cross join (
    select 'Desayuno' as meal_label, id as food_id, 2::numeric as quantity_g, 1 as order_index from public.foods where name = 'Huevo (unidad)'
    union all select 'Desayuno', id, 40, 2 from public.foods where name = 'Pan integral (rebanada)'
    union all select 'Comida', id, 200, 3 from public.foods where name = 'Ternera magra (100g)'
    union all select 'Comida', id, 150, 4 from public.foods where name = 'Quinoa cocida (100g)'
    union all select 'Merienda', id, 150, 5 from public.foods where name = 'Yogur griego (150g)'
    union all select 'Cena', id, 150, 6 from public.foods where name = 'Atún al natural (100g)'
  ) as x;

  insert into public.diet_items (diet_id, day_number, meal_label, food_id, quantity_g, order_index)
  select v_diet_id, d.day_num, x.meal_label, x.food_id, x.quantity_g, x.order_index
  from unnest(array[2,5]) as d(day_num)
  cross join (
    select 'Desayuno' as meal_label, id as food_id, 150::numeric as quantity_g, 1 as order_index from public.foods where name = 'Yogur griego (150g)'
    union all select 'Desayuno', id, 50, 2 from public.foods where name = 'Avena (50g)'
    union all select 'Comida', id, 150, 3 from public.foods where name = 'Pechuga de pollo (100g)'
    union all select 'Comida', id, 150, 4 from public.foods where name = 'Arroz blanco cocido (100g)'
    union all select 'Merienda', id, 30, 5 from public.foods where name = 'Almendras (30g)'
    union all select 'Cena', id, 150, 6 from public.foods where name = 'Salmón (100g)'
    union all select 'Cena', id, 100, 7 from public.foods where name = 'Brócoli cocido (100g)'
  ) as x;

  insert into public.diet_items (diet_id, day_number, meal_label, food_id, quantity_g, order_index)
  select v_diet_id, d.day_num, x.meal_label, x.food_id, x.quantity_g, x.order_index
  from unnest(array[3,6]) as d(day_num)
  cross join (
    select 'Desayuno' as meal_label, id as food_id, 100::numeric as quantity_g, 1 as order_index from public.foods where name = 'Requesón (100g)'
    union all select 'Comida', id, 150, 2 from public.foods where name = 'Merluza (100g)'
    union all select 'Comida', id, 100, 3 from public.foods where name = 'Lentejas cocidas (100g)'
    union all select 'Merienda', id, 30, 4 from public.foods where name = 'Nueces (30g)'
    union all select 'Cena', id, 150, 5 from public.foods where name = 'Ternera magra (100g)'
    union all select 'Cena', id, 100, 6 from public.foods where name = 'Espinacas (100g)'
  ) as x;

  -- ===================== PÉRDIDA DE PESO =====================
  select id into v_diet_id from public.diets where title = 'Dieta ejemplo - Pérdida de peso';

  insert into public.diet_items (diet_id, day_number, meal_label, food_id, quantity_g, order_index)
  select v_diet_id, d.day_num, x.meal_label, x.food_id, x.quantity_g, x.order_index
  from unnest(array[1,4,7]) as d(day_num)
  cross join (
    select 'Desayuno' as meal_label, id as food_id, 125::numeric as quantity_g, 1 as order_index from public.foods where name = 'Yogur natural (125g)'
    union all select 'Desayuno', id, 100, 2 from public.foods where name = 'Fresas (100g)'
    union all select 'Comida', id, 150, 3 from public.foods where name = 'Merluza (100g)'
    union all select 'Comida', id, 100, 4 from public.foods where name = 'Judías verdes (100g)'
    union all select 'Merienda', id, 1, 5 from public.foods where name = 'Manzana (unidad)'
    union all select 'Cena', id, 2, 6 from public.foods where name = 'Huevo (unidad)'
  ) as x;

  insert into public.diet_items (diet_id, day_number, meal_label, food_id, quantity_g, order_index)
  select v_diet_id, d.day_num, x.meal_label, x.food_id, x.quantity_g, x.order_index
  from unnest(array[2,5]) as d(day_num)
  cross join (
    select 'Desayuno' as meal_label, id as food_id, 150::numeric as quantity_g, 1 as order_index from public.foods where name = 'Yogur griego (150g)'
    union all select 'Desayuno', id, 1, 2 from public.foods where name = 'Kiwi (unidad)'
    union all select 'Comida', id, 150, 3 from public.foods where name = 'Pechuga de pollo (100g)'
    union all select 'Comida', id, 100, 4 from public.foods where name = 'Calabacín (100g)'
    union all select 'Merienda', id, 1, 5 from public.foods where name = 'Pera (unidad)'
    union all select 'Cena', id, 150, 6 from public.foods where name = 'Atún al natural (100g)'
    union all select 'Cena', id, 100, 7 from public.foods where name = 'Tomate (unidad)'
  ) as x;

  insert into public.diet_items (diet_id, day_number, meal_label, food_id, quantity_g, order_index)
  select v_diet_id, d.day_num, x.meal_label, x.food_id, x.quantity_g, x.order_index
  from unnest(array[3,6]) as d(day_num)
  cross join (
    select 'Desayuno' as meal_label, id as food_id, 100::numeric as quantity_g, 1 as order_index from public.foods where name = 'Requesón (100g)'
    union all select 'Desayuno', id, 1, 2 from public.foods where name = 'Naranja (unidad)'
    union all select 'Comida', id, 150, 3 from public.foods where name = 'Pavo pechuga (100g)'
    union all select 'Comida', id, 100, 4 from public.foods where name = 'Brócoli cocido (100g)'
    union all select 'Cena', id, 150, 5 from public.foods where name = 'Merluza (100g)'
    union all select 'Cena', id, 100, 6 from public.foods where name = 'Coliflor (100g)'
  ) as x;

  -- ===================== VEGETARIANA =====================
  select id into v_diet_id from public.diets where title = 'Dieta ejemplo - Vegetariana';

  insert into public.diet_items (diet_id, day_number, meal_label, food_id, quantity_g, order_index)
  select v_diet_id, d.day_num, x.meal_label, x.food_id, x.quantity_g, x.order_index
  from unnest(array[1,4,7]) as d(day_num)
  cross join (
    select 'Desayuno' as meal_label, id as food_id, 50::numeric as quantity_g, 1 as order_index from public.foods where name = 'Avena (50g)'
    union all select 'Desayuno', id, 15, 2 from public.foods where name = 'Mantequilla de cacahuete (15g)'
    union all select 'Comida', id, 150, 3 from public.foods where name = 'Tofu (100g)'
    union all select 'Comida', id, 150, 4 from public.foods where name = 'Quinoa cocida (100g)'
    union all select 'Merienda', id, 30, 5 from public.foods where name = 'Nueces (30g)'
    union all select 'Cena', id, 150, 6 from public.foods where name = 'Lentejas cocidas (100g)'
  ) as x;

  insert into public.diet_items (diet_id, day_number, meal_label, food_id, quantity_g, order_index)
  select v_diet_id, d.day_num, x.meal_label, x.food_id, x.quantity_g, x.order_index
  from unnest(array[2,5]) as d(day_num)
  cross join (
    select 'Desayuno' as meal_label, id as food_id, 125::numeric as quantity_g, 1 as order_index from public.foods where name = 'Yogur natural (125g)'
    union all select 'Desayuno', id, 1, 2 from public.foods where name = 'Plátano (unidad)'
    union all select 'Comida', id, 150, 3 from public.foods where name = 'Garbanzos cocidos (100g)'
    union all select 'Comida', id, 150, 4 from public.foods where name = 'Arroz blanco cocido (100g)'
    union all select 'Merienda', id, 30, 5 from public.foods where name = 'Almendras (30g)'
    union all select 'Cena', id, 150, 6 from public.foods where name = 'Tofu (100g)'
    union all select 'Cena', id, 100, 7 from public.foods where name = 'Espinacas (100g)'
  ) as x;

  insert into public.diet_items (diet_id, day_number, meal_label, food_id, quantity_g, order_index)
  select v_diet_id, d.day_num, x.meal_label, x.food_id, x.quantity_g, x.order_index
  from unnest(array[3,6]) as d(day_num)
  cross join (
    select 'Desayuno' as meal_label, id as food_id, 40::numeric as quantity_g, 1 as order_index from public.foods where name = 'Pan integral (rebanada)'
    union all select 'Desayuno', id, 1, 2 from public.foods where name = 'Aguacate (medio)'
    union all select 'Comida', id, 150, 3 from public.foods where name = 'Judías blancas cocidas (100g)'
    union all select 'Comida', id, 150, 4 from public.foods where name = 'Quinoa cocida (100g)'
    union all select 'Merienda', id, 1, 5 from public.foods where name = 'Manzana (unidad)'
    union all select 'Cena', id, 100, 6 from public.foods where name = 'Edamame (100g)'
    union all select 'Cena', id, 100, 7 from public.foods where name = 'Brócoli cocido (100g)'
  ) as x;

  -- ===================== MEDITERRÁNEA =====================
  select id into v_diet_id from public.diets where title = 'Dieta ejemplo - Mediterránea';

  insert into public.diet_items (diet_id, day_number, meal_label, food_id, quantity_g, order_index)
  select v_diet_id, d.day_num, x.meal_label, x.food_id, x.quantity_g, x.order_index
  from unnest(array[1,4,7]) as d(day_num)
  cross join (
    select 'Desayuno' as meal_label, id as food_id, 40::numeric as quantity_g, 1 as order_index from public.foods where name = 'Pan integral (rebanada)'
    union all select 'Desayuno', id, 1, 2 from public.foods where name = 'Aguacate (medio)'
    union all select 'Comida', id, 150, 3 from public.foods where name = 'Merluza (100g)'
    union all select 'Comida', id, 100, 4 from public.foods where name = 'Lentejas cocidas (100g)'
    union all select 'Comida', id, 10, 5 from public.foods where name = 'Aceite de oliva (1 cda)'
    union all select 'Cena', id, 150, 6 from public.foods where name = 'Salmón (100g)'
  ) as x;

  insert into public.diet_items (diet_id, day_number, meal_label, food_id, quantity_g, order_index)
  select v_diet_id, d.day_num, x.meal_label, x.food_id, x.quantity_g, x.order_index
  from unnest(array[2,5]) as d(day_num)
  cross join (
    select 'Desayuno' as meal_label, id as food_id, 125::numeric as quantity_g, 1 as order_index from public.foods where name = 'Yogur natural (125g)'
    union all select 'Desayuno', id, 30, 2 from public.foods where name = 'Nueces (30g)'
    union all select 'Comida', id, 150, 3 from public.foods where name = 'Garbanzos cocidos (100g)'
    union all select 'Comida', id, 100, 4 from public.foods where name = 'Lechuga (100g)'
    union all select 'Merienda', id, 1, 5 from public.foods where name = 'Pera (unidad)'
    union all select 'Cena', id, 150, 6 from public.foods where name = 'Atún al natural (100g)'
    union all select 'Cena', id, 100, 7 from public.foods where name = 'Pimiento rojo (100g)'
  ) as x;

  insert into public.diet_items (diet_id, day_number, meal_label, food_id, quantity_g, order_index)
  select v_diet_id, d.day_num, x.meal_label, x.food_id, x.quantity_g, x.order_index
  from unnest(array[3,6]) as d(day_num)
  cross join (
    select 'Desayuno' as meal_label, id as food_id, 50::numeric as quantity_g, 1 as order_index from public.foods where name = 'Avena (50g)'
    union all select 'Desayuno', id, 1, 2 from public.foods where name = 'Miel (1 cda)'
    union all select 'Comida', id, 150, 3 from public.foods where name = 'Pechuga de pollo (100g)'
    union all select 'Comida', id, 150, 4 from public.foods where name = 'Quinoa cocida (100g)'
    union all select 'Comida', id, 10, 5 from public.foods where name = 'Aceite de oliva (1 cda)'
    union all select 'Cena', id, 150, 6 from public.foods where name = 'Merluza (100g)'
    union all select 'Cena', id, 100, 7 from public.foods where name = 'Calabacín (100g)'
  ) as x;

  -- ===================== CETOGÉNICA =====================
  select id into v_diet_id from public.diets where title = 'Dieta ejemplo - Cetogénica';

  insert into public.diet_items (diet_id, day_number, meal_label, food_id, quantity_g, order_index)
  select v_diet_id, d.day_num, x.meal_label, x.food_id, x.quantity_g, x.order_index
  from unnest(array[1,4,7]) as d(day_num)
  cross join (
    select 'Desayuno' as meal_label, id as food_id, 2::numeric as quantity_g, 1 as order_index from public.foods where name = 'Huevo (unidad)'
    union all select 'Desayuno', id, 1, 2 from public.foods where name = 'Aguacate (medio)'
    union all select 'Comida', id, 150, 3 from public.foods where name = 'Ternera magra (100g)'
    union all select 'Comida', id, 100, 4 from public.foods where name = 'Espinacas (100g)'
    union all select 'Merienda', id, 30, 5 from public.foods where name = 'Nueces (30g)'
    union all select 'Cena', id, 150, 6 from public.foods where name = 'Salmón (100g)'
  ) as x;

  insert into public.diet_items (diet_id, day_number, meal_label, food_id, quantity_g, order_index)
  select v_diet_id, d.day_num, x.meal_label, x.food_id, x.quantity_g, x.order_index
  from unnest(array[2,5]) as d(day_num)
  cross join (
    select 'Desayuno' as meal_label, id as food_id, 30::numeric as quantity_g, 1 as order_index from public.foods where name = 'Queso curado (30g)'
    union all select 'Desayuno', id, 2, 2 from public.foods where name = 'Huevo (unidad)'
    union all select 'Comida', id, 150, 3 from public.foods where name = 'Lomo de cerdo (100g)'
    union all select 'Comida', id, 100, 4 from public.foods where name = 'Brócoli cocido (100g)'
    union all select 'Merienda', id, 30, 5 from public.foods where name = 'Aceitunas (30g)'
    union all select 'Cena', id, 150, 6 from public.foods where name = 'Atún al natural (100g)'
    union all select 'Cena', id, 1, 7 from public.foods where name = 'Aguacate (medio)'
  ) as x;

  insert into public.diet_items (diet_id, day_number, meal_label, food_id, quantity_g, order_index)
  select v_diet_id, d.day_num, x.meal_label, x.food_id, x.quantity_g, x.order_index
  from unnest(array[3,6]) as d(day_num)
  cross join (
    select 'Desayuno' as meal_label, id as food_id, 150::numeric as quantity_g, 1 as order_index from public.foods where name = 'Yogur griego (150g)'
    union all select 'Desayuno', id, 30, 2 from public.foods where name = 'Almendras (30g)'
    union all select 'Comida', id, 150, 3 from public.foods where name = 'Ternera magra (100g)'
    union all select 'Comida', id, 100, 4 from public.foods where name = 'Calabacín (100g)'
    union all select 'Merienda', id, 30, 5 from public.foods where name = 'Nueces (30g)'
    union all select 'Cena', id, 150, 6 from public.foods where name = 'Salmón (100g)'
    union all select 'Cena', id, 100, 7 from public.foods where name = 'Espinacas (100g)'
  ) as x;

  -- ===================== SIN GLUTEN =====================
  select id into v_diet_id from public.diets where title = 'Dieta ejemplo - Sin gluten';

  insert into public.diet_items (diet_id, day_number, meal_label, food_id, quantity_g, order_index)
  select v_diet_id, d.day_num, x.meal_label, x.food_id, x.quantity_g, x.order_index
  from unnest(array[1,4,7]) as d(day_num)
  cross join (
    select 'Desayuno' as meal_label, id as food_id, 2::numeric as quantity_g, 1 as order_index from public.foods where name = 'Huevo (unidad)'
    union all select 'Desayuno', id, 1, 2 from public.foods where name = 'Plátano (unidad)'
    union all select 'Comida', id, 150, 3 from public.foods where name = 'Pechuga de pollo (100g)'
    union all select 'Comida', id, 150, 4 from public.foods where name = 'Quinoa cocida (100g)'
    union all select 'Merienda', id, 30, 5 from public.foods where name = 'Almendras (30g)'
    union all select 'Cena', id, 150, 6 from public.foods where name = 'Merluza (100g)'
  ) as x;

  insert into public.diet_items (diet_id, day_number, meal_label, food_id, quantity_g, order_index)
  select v_diet_id, d.day_num, x.meal_label, x.food_id, x.quantity_g, x.order_index
  from unnest(array[2,5]) as d(day_num)
  cross join (
    select 'Desayuno' as meal_label, id as food_id, 125::numeric as quantity_g, 1 as order_index from public.foods where name = 'Yogur natural (125g)'
    union all select 'Desayuno', id, 1, 2 from public.foods where name = 'Kiwi (unidad)'
    union all select 'Comida', id, 150, 3 from public.foods where name = 'Ternera magra (100g)'
    union all select 'Comida', id, 150, 4 from public.foods where name = 'Arroz blanco cocido (100g)'
    union all select 'Merienda', id, 30, 5 from public.foods where name = 'Nueces (30g)'
    union all select 'Cena', id, 150, 6 from public.foods where name = 'Salmón (100g)'
    union all select 'Cena', id, 100, 7 from public.foods where name = 'Zanahoria (100g)'
  ) as x;

  insert into public.diet_items (diet_id, day_number, meal_label, food_id, quantity_g, order_index)
  select v_diet_id, d.day_num, x.meal_label, x.food_id, x.quantity_g, x.order_index
  from unnest(array[3,6]) as d(day_num)
  cross join (
    select 'Desayuno' as meal_label, id as food_id, 100::numeric as quantity_g, 1 as order_index from public.foods where name = 'Requesón (100g)'
    union all select 'Desayuno', id, 1, 2 from public.foods where name = 'Manzana (unidad)'
    union all select 'Comida', id, 150, 3 from public.foods where name = 'Pavo pechuga (100g)'
    union all select 'Comida', id, 100, 4 from public.foods where name = 'Batata / boniato cocido (100g)'
    union all select 'Merienda', id, 30, 5 from public.foods where name = 'Aceitunas (30g)'
    union all select 'Cena', id, 150, 6 from public.foods where name = 'Atún al natural (100g)'
    union all select 'Cena', id, 100, 7 from public.foods where name = 'Judías verdes (100g)'
  ) as x;

  -- ===================== SIN LACTOSA =====================
  select id into v_diet_id from public.diets where title = 'Dieta ejemplo - Sin lactosa';

  insert into public.diet_items (diet_id, day_number, meal_label, food_id, quantity_g, order_index)
  select v_diet_id, d.day_num, x.meal_label, x.food_id, x.quantity_g, x.order_index
  from unnest(array[1,4,7]) as d(day_num)
  cross join (
    select 'Desayuno' as meal_label, id as food_id, 50::numeric as quantity_g, 1 as order_index from public.foods where name = 'Avena (50g)'
    union all select 'Desayuno', id, 1, 2 from public.foods where name = 'Manzana (unidad)'
    union all select 'Comida', id, 150, 3 from public.foods where name = 'Ternera magra (100g)'
    union all select 'Comida', id, 150, 4 from public.foods where name = 'Arroz blanco cocido (100g)'
    union all select 'Merienda', id, 30, 5 from public.foods where name = 'Nueces (30g)'
    union all select 'Cena', id, 150, 6 from public.foods where name = 'Atún al natural (100g)'
  ) as x;

  insert into public.diet_items (diet_id, day_number, meal_label, food_id, quantity_g, order_index)
  select v_diet_id, d.day_num, x.meal_label, x.food_id, x.quantity_g, x.order_index
  from unnest(array[2,5]) as d(day_num)
  cross join (
    select 'Desayuno' as meal_label, id as food_id, 2::numeric as quantity_g, 1 as order_index from public.foods where name = 'Huevo (unidad)'
    union all select 'Desayuno', id, 1, 2 from public.foods where name = 'Plátano (unidad)'
    union all select 'Comida', id, 150, 3 from public.foods where name = 'Pechuga de pollo (100g)'
    union all select 'Comida', id, 150, 4 from public.foods where name = 'Quinoa cocida (100g)'
    union all select 'Merienda', id, 30, 5 from public.foods where name = 'Almendras (30g)'
    union all select 'Cena', id, 150, 6 from public.foods where name = 'Merluza (100g)'
    union all select 'Cena', id, 100, 7 from public.foods where name = 'Brócoli cocido (100g)'
  ) as x;

  insert into public.diet_items (diet_id, day_number, meal_label, food_id, quantity_g, order_index)
  select v_diet_id, d.day_num, x.meal_label, x.food_id, x.quantity_g, x.order_index
  from unnest(array[3,6]) as d(day_num)
  cross join (
    select 'Desayuno' as meal_label, id as food_id, 40::numeric as quantity_g, 1 as order_index from public.foods where name = 'Pan integral (rebanada)'
    union all select 'Desayuno', id, 1, 2 from public.foods where name = 'Aguacate (medio)'
    union all select 'Comida', id, 150, 3 from public.foods where name = 'Pavo pechuga (100g)'
    union all select 'Comida', id, 100, 4 from public.foods where name = 'Lentejas cocidas (100g)'
    union all select 'Merienda', id, 30, 5 from public.foods where name = 'Aceitunas (30g)'
    union all select 'Cena', id, 150, 6 from public.foods where name = 'Salmón (100g)'
    union all select 'Cena', id, 100, 7 from public.foods where name = 'Espinacas (100g)'
  ) as x;

end $$;

-- =========================================================
-- 2 planes de rutina más
-- =========================================================
do $$
declare
  v_routine_id uuid;
  v_day_id uuid;
begin

  insert into public.routines (title, notes, created_by) values
    ('Plan ejemplo - Brazos y hombros', 'Enfocado en brazos y hombros, 2 sesiones por semana.', 'sistema')
    on conflict (title) do nothing;
  select id into v_routine_id from public.routines where title = 'Plan ejemplo - Brazos y hombros';

  if not exists (select 1 from public.routine_days where routine_id = v_routine_id) then
    insert into public.routine_days (routine_id, day_number, label) values (v_routine_id, 2, 'Día 1 - Brazos') returning id into v_day_id;
    insert into public.routine_exercises (routine_day_id, exercise_id, sets, reps, weight_kg, order_index)
      select v_day_id, id, 4, '12', 12::numeric, 1 from public.exercise_library where name = 'Curl de bíceps'
      union all select v_day_id, id, 3, '12', null::numeric, 2 from public.exercise_library where name = 'Fondos en banco (dips)'
      union all select v_day_id, id, 3, '10', null::numeric, 3 from public.exercise_library where name = 'Dominadas';

    insert into public.routine_days (routine_id, day_number, label) values (v_routine_id, 5, 'Día 2 - Hombros') returning id into v_day_id;
    insert into public.routine_exercises (routine_day_id, exercise_id, sets, reps, weight_kg, order_index)
      select v_day_id, id, 4, '10', 20::numeric, 1 from public.exercise_library where name = 'Press de hombro'
      union all select v_day_id, id, 3, '12', 8::numeric, 2 from public.exercise_library where name = 'Elevaciones laterales'
      union all select v_day_id, id, 3, '15', null::numeric, 3 from public.exercise_library where name = 'Face pull';
  end if;

  insert into public.routines (title, notes, created_by) values
    ('Plan ejemplo - Glúteo y pierna', 'Enfocado en glúteo y pierna, 2 sesiones por semana.', 'sistema')
    on conflict (title) do nothing;
  select id into v_routine_id from public.routines where title = 'Plan ejemplo - Glúteo y pierna';

  if not exists (select 1 from public.routine_days where routine_id = v_routine_id) then
    insert into public.routine_days (routine_id, day_number, label) values (v_routine_id, 1, 'Día 1 - Glúteo') returning id into v_day_id;
    insert into public.routine_exercises (routine_day_id, exercise_id, sets, reps, weight_kg, order_index)
      select v_day_id, id, 4, '12', 30::numeric, 1 from public.exercise_library where name = 'Hip thrust en máquina'
      union all select v_day_id, id, 3, '15', null::numeric, 2 from public.exercise_library where name = 'Puente de glúteo'
      union all select v_day_id, id, 3, '10', null::numeric, 3 from public.exercise_library where name = 'Sentadilla búlgara';

    insert into public.routine_days (routine_id, day_number, label) values (v_routine_id, 4, 'Día 2 - Pierna completa') returning id into v_day_id;
    insert into public.routine_exercises (routine_day_id, exercise_id, sets, reps, weight_kg, order_index)
      select v_day_id, id, 4, '10', 50::numeric, 1 from public.exercise_library where name = 'Sentadilla con barra'
      union all select v_day_id, id, 3, '15', 60::numeric, 2 from public.exercise_library where name = 'Prensa de piernas'
      union all select v_day_id, id, 3, '15', 15::numeric, 3 from public.exercise_library where name = 'Extensión de cuádriceps'
      union all select v_day_id, id, 3, '15', null::numeric, 4 from public.exercise_library where name = 'Gemelos en máquina';
  end if;

end $$;

-- =========================================================
-- LISTO.
-- =========================================================
