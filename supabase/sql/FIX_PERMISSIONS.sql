-- =========================================================
-- El Método Dari — Arreglo de permisos de lectura
-- Pega esto en Supabase > SQL Editor > New query > Run.
-- No borra ni modifica ningún dato, solo corrige el permiso
-- que impedía que la app leyera ejercicios, alimentos y retos
-- aunque los datos ya existieran.
-- =========================================================

drop policy if exists "exercises_select" on public.exercise_library;
create policy "exercises_select" on public.exercise_library
  for select using (auth.uid() is not null);

drop policy if exists "foods_select" on public.foods;
create policy "foods_select" on public.foods
  for select using (auth.uid() is not null);

drop policy if exists "challenges_select" on public.challenges;
create policy "challenges_select" on public.challenges
  for select using (auth.uid() is not null);
