-- 002_points_and_stats.sql
-- Reglas de negocio dentro de la base de datos:
--   * 25 puntos por cada corte completado (y su reverso).
--   * Estadísticas del perfil calculadas en la base, nunca en el cliente.

-- ---------------------------------------------------------------------------
-- Puntos: se suman cuando una cita pasa a 'completed' y se revierten si deja
-- de estarlo. Funciona tanto en INSERT como en UPDATE de status, de modo que
-- el seed también genera los puntos correctos.
-- ---------------------------------------------------------------------------

create or replace function public.sync_user_points() returns trigger
language plpgsql as $$
declare
  delta integer := 0;
begin
  if tg_op = 'INSERT' then
    if new.status = 'completed' then
      delta := 25;
    end if;
  else
    if new.status = 'completed' and old.status is distinct from 'completed' then
      delta := 25;
    elsif old.status = 'completed' and new.status is distinct from 'completed' then
      delta := -25;
    end if;
  end if;

  if delta <> 0 then
    update public.users
       set points = greatest(points + delta, 0)
     where id = new.user_id;
  end if;

  return new;
end;
$$;

create trigger trg_appointments_points
  after insert or update of status on public.appointments
  for each row execute function public.sync_user_points();

-- ---------------------------------------------------------------------------
-- Estadísticas del perfil (usadas por GET /api/v1/me)
-- ---------------------------------------------------------------------------

create or replace function public.get_user_stats(p_user_id uuid)
returns table (cuts_done integer, points integer, rating numeric)
language sql stable as $$
  select
    (select count(*)::int
       from public.appointments a
      where a.user_id = p_user_id
        and a.status = 'completed'),
    (select u.points
       from public.users u
      where u.id = p_user_id),
    (select coalesce(round(avg(b.rating), 1), 5.0)
       from public.appointments a
       join public.barbers b on b.id = a.barber_id
      where a.user_id = p_user_id
        and a.status = 'completed');
$$;
