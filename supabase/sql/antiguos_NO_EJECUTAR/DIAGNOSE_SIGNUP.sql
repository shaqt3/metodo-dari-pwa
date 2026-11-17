-- =========================================================
-- El Método Dari — Diagnóstico: ¿por qué falla el registro?
-- Pega esto en Supabase > SQL Editor > New query > Run.
-- Esto NO modifica nada, solo consulta.
-- =========================================================

-- 1) ¿Hay algún disparador (trigger) automático al crear un usuario?
select
  trigger_name,
  event_manipulation,
  event_object_schema,
  event_object_table,
  action_statement
from information_schema.triggers
where event_object_schema = 'auth' and event_object_table = 'users';

-- 2) ¿Existe alguna función típica de este tipo de triggers?
select routine_name, routine_schema
from information_schema.routines
where routine_name ilike '%handle_new_user%'
   or routine_name ilike '%new_user%';
