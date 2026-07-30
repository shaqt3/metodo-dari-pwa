-- =========================================================
-- El Método Dari — Arreglo de permisos de acceso a las tablas
-- Pega esto en Supabase > SQL Editor > New query > Run.
-- No borra ni modifica ningún dato.
--
-- "Permission denied for table X" significa que falta el
-- permiso básico de acceso a la tabla (independiente de las
-- políticas de seguridad por fila que ya configuramos). Este
-- script se lo da a los usuarios con sesión iniciada
-- (authenticated) en todas las tablas de la app.
-- =========================================================

grant usage on schema public to authenticated, anon;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.routines to authenticated;
grant select, insert, update, delete on public.routine_days to authenticated;
grant select, insert, update, delete on public.routine_exercises to authenticated;
grant select, insert, update, delete on public.exercise_library to authenticated;
grant select, insert, update, delete on public.challenges to authenticated;
grant select, insert, update, delete on public.challenge_submissions to authenticated;
grant select, insert, update, delete on public.workout_logs to authenticated;
grant select, insert, update, delete on public.foods to authenticated;
grant select, insert, update, delete on public.diets to authenticated;
grant select, insert, update, delete on public.diet_items to authenticated;

-- Por si en el futuro creas más tablas en el esquema "public",
-- que también reciban estos permisos automáticamente:
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
