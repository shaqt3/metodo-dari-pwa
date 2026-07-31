-- =========================================================
-- El Método Dari — Arreglo: quitar el trigger roto de registro
-- Pega esto en Supabase > SQL Editor > New query > Run.
--
-- Esto elimina un disparador (trigger) y una función que
-- quedaron de un intento anterior con otra IA, y que hacían
-- que crear una cuenta nueva fallara con error 500.
-- No toca ninguna tabla de datos ni borra ningún usuario.
-- =========================================================

-- Quita el disparador que se ejecuta al crear un usuario nuevo
-- (puede tener distintos nombres según cómo se creó, probamos los
-- más habituales; los que no existan simplemente se ignoran).
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists handle_new_user on auth.users;
drop trigger if exists trigger_handle_new_user on auth.users;

-- Quita la función que fallaba
drop function if exists public.handle_new_user() cascade;

-- Comprobación final: esto debería devolver 0 filas si ya no
-- queda ningún disparador en la tabla de usuarios.
select trigger_name
from information_schema.triggers
where event_object_schema = 'auth' and event_object_table = 'users';
