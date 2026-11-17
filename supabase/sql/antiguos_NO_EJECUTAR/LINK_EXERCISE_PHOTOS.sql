-- =========================================================
-- El Método Dari — Conectar fotos del muñeco a los ejercicios
-- Pega esto en Supabase > SQL Editor > New query > Run.
--
-- IMPORTANTE: esto asume que ya has creado el bucket público
-- "exercise-photos" y subido ahí los 7 archivos con estos
-- nombres exactos: flexion.png, peso-muerto.png, plancha.png,
-- press.png, remo.png, sentadilla.png, zancada.png
-- =========================================================

update public.exercise_library
set photo_url = 'https://cscdbalslyyfucutekxa.supabase.co/storage/v1/object/public/exercise-photos/flexion.png'
where name = 'Flexiones';

update public.exercise_library
set photo_url = 'https://cscdbalslyyfucutekxa.supabase.co/storage/v1/object/public/exercise-photos/peso-muerto.png'
where name = 'Peso muerto con barra';

update public.exercise_library
set photo_url = 'https://cscdbalslyyfucutekxa.supabase.co/storage/v1/object/public/exercise-photos/plancha.png'
where name = 'Plancha';

update public.exercise_library
set photo_url = 'https://cscdbalslyyfucutekxa.supabase.co/storage/v1/object/public/exercise-photos/press.png'
where name = 'Press de hombro';

update public.exercise_library
set photo_url = 'https://cscdbalslyyfucutekxa.supabase.co/storage/v1/object/public/exercise-photos/remo.png'
where name = 'Remo en máquina';

update public.exercise_library
set photo_url = 'https://cscdbalslyyfucutekxa.supabase.co/storage/v1/object/public/exercise-photos/sentadilla.png'
where name = 'Sentadilla';

update public.exercise_library
set photo_url = 'https://cscdbalslyyfucutekxa.supabase.co/storage/v1/object/public/exercise-photos/zancada.png'
where name = 'Zancada';

-- =========================================================
-- LISTO. Comprueba en la app (pestaña Ejercicios) que estos
-- 7 ejercicios ahora muestran la foto en vez del icono.
-- =========================================================
