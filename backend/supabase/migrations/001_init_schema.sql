-- 001_init_schema.sql
-- Tonsorium Barber App — esquema base
-- Aplicar en Supabase (SQL Editor) o vía `supabase db push`.

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ---------------------------------------------------------------------------
-- Catálogos
-- ---------------------------------------------------------------------------

create table public.shops (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  address    text,
  created_at timestamptz not null default now()
);

create table public.barbers (
  id               uuid primary key default gen_random_uuid(),
  shop_id          uuid not null references public.shops(id) on delete cascade,
  name             text not null,
  experience_years integer not null default 0 check (experience_years >= 0),
  rating           numeric(2,1) not null default 5.0 check (rating >= 0 and rating <= 5),
  active           boolean not null default true,
  created_at       timestamptz not null default now(),
  unique (shop_id, name)
);

create table public.services (
  id               uuid primary key default gen_random_uuid(),
  name             text not null unique,
  description      text,
  price_cop        integer not null check (price_cop >= 0),
  duration_minutes integer not null check (duration_minutes > 0),
  active           boolean not null default true,
  created_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Usuarios y citas
-- ---------------------------------------------------------------------------

create table public.users (
  id                    uuid primary key default gen_random_uuid(),
  email                 citext not null unique,
  password_hash         text not null,
  full_name             text not null,
  phone                 text,
  role                  text not null default 'client' check (role in ('client','admin')),
  points                integer not null default 0 check (points >= 0),
  preferred_shop_id     uuid references public.shops(id) on delete set null,
  favorite_style        text,
  notifications_enabled boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create table public.appointments (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  shop_id      uuid not null references public.shops(id),
  barber_id    uuid not null references public.barbers(id),
  service_id   uuid not null references public.services(id),
  scheduled_at timestamptz not null,
  status       text not null default 'confirmed'
                 check (status in ('confirmed','completed','cancelled')),
  price_cop    integer not null check (price_cop >= 0),  -- copia del precio al momento de reservar
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Impide que un barbero tenga dos citas activas en el mismo horario.
create unique index appointments_no_double_booking
  on public.appointments (barber_id, scheduled_at)
  where status <> 'cancelled';

create index appointments_user_idx on public.appointments (user_id, scheduled_at desc);

-- ---------------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_users_updated before update on public.users
  for each row execute function public.set_updated_at();

create trigger trg_appointments_updated before update on public.appointments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Habilitada SIN políticas: `anon` y `authenticated` no pueden leer ni escribir.
-- Solo el backend con `service_role` (BYPASSRLS) accede a los datos.
-- ---------------------------------------------------------------------------

alter table public.shops        enable row level security;
alter table public.barbers      enable row level security;
alter table public.services     enable row level security;
alter table public.users        enable row level security;
alter table public.appointments enable row level security;
