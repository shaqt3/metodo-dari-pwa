-- =========================================================
-- El Método Dari — Actualización V7
--
-- CÓMO USARLO: Supabase > SQL Editor > New query > pega TODO
-- este archivo > "Run". Debe salir "Success".
--
-- ES SEGURO: no borra ningún dato. Se puede ejecutar varias veces.
--
-- QUÉ AÑADE:
--   1. Los socios aparecen en "Socios" en cuanto se crea su cuenta.
--   2. Fotos de progreso PRIVADAS (solo las ven el socio y la
--      entrenadora).
--   3. Adjuntar una foto o PDF a cada dieta.
--   4. La entrenadora puede apuntar entrenamientos en nombre de
--      un socio (útil en la vista "Ver como socio").
-- =========================================================


-- ============ 1. SOCIOS AUTOMÁTICOS ============
insert into public.profiles (id, email)
select u.id, u.email from auth.users u
on conflict (id) do update set email = coalesce(public.profiles.email, excluded.email);

create or replace function public.dari_nuevo_socio()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    insert into public.profiles (id, email) values (new.id, new.email)
    on conflict (id) do nothing;
  exception when others then
    null; -- si algo falla, el registro del usuario sigue funcionando
  end;
  return new;
end $$;

drop trigger if exists dari_nuevo_socio on auth.users;
create trigger dari_nuevo_socio after insert on auth.users
for each row execute function public.dari_nuevo_socio();


-- ============ 2. FOTOS DE PROGRESO ============
create table if not exists public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  taken_on date not null default current_date,
  storage_path text not null,
  note text,
  created_at timestamptz not null default now()
);
alter table public.progress_photos enable row level security;

drop policy if exists "pphotos_select" on public.progress_photos;
create policy "pphotos_select" on public.progress_photos
  for select using (user_id = auth.uid() or public.is_trainer());
drop policy if exists "pphotos_insert" on public.progress_photos;
create policy "pphotos_insert" on public.progress_photos
  for insert with check (user_id = auth.uid() or public.is_trainer());
drop policy if exists "pphotos_update" on public.progress_photos;
create policy "pphotos_update" on public.progress_photos
  for update using (user_id = auth.uid() or public.is_trainer());
drop policy if exists "pphotos_delete" on public.progress_photos;
create policy "pphotos_delete" on public.progress_photos
  for delete using (user_id = auth.uid() or public.is_trainer());

grant select, insert, update, delete on public.progress_photos to authenticated;

-- Almacén PRIVADO: las fotos no tienen enlace público.
insert into storage.buckets (id, name, public, file_size_limit)
values ('progress-photos', 'progress-photos', false, 20971520)
on conflict (id) do update set public = false;

drop policy if exists "dari_pphotos_read" on storage.objects;
create policy "dari_pphotos_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'progress-photos'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.is_trainer()));

drop policy if exists "dari_pphotos_upload" on storage.objects;
create policy "dari_pphotos_upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'progress-photos'
              and ((storage.foldername(name))[1] = auth.uid()::text or public.is_trainer()));

drop policy if exists "dari_pphotos_delete" on storage.objects;
create policy "dari_pphotos_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'progress-photos'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.is_trainer()));


-- ============ 3. ADJUNTOS EN DIETAS ============
alter table public.diets add column if not exists attachment_url text;


-- ============ 4. ENTRENADORA APUNTA POR UN SOCIO ============
drop policy if exists "logs_insert" on public.workout_logs;
create policy "logs_insert" on public.workout_logs
  for insert with check (user_id = auth.uid() or public.is_trainer());
drop policy if exists "logs_update" on public.workout_logs;
create policy "logs_update" on public.workout_logs
  for update using (user_id = auth.uid() or public.is_trainer());


-- LISTO. Si ves "Success. No rows returned", todo ha ido bien.
