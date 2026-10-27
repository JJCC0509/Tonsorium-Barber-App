/**
 * Mapeo centralizado de filas de Supabase -> objetos publicos de la API.
 * Garantiza que nunca se filtre `password_hash` ni columnas internas y que la
 * forma de cada JSON coincida con el contrato de la seccion 3 del prompt.
 */

// --- Usuario ---------------------------------------------------------------

export interface PublicUser {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  preferred_shop_id: string | null;
  favorite_style: string | null;
  notifications_enabled: boolean;
  points: number;
  created_at: string;
}

/** Filas devueltas por public.users (sin `password_hash`). */
export type UserRow = PublicUser;

export const USER_COLUMNS =
  'id, email, full_name, phone, preferred_shop_id, favorite_style, notifications_enabled, points, created_at';

export function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    phone: row.phone,
    preferred_shop_id: row.preferred_shop_id,
    favorite_style: row.favorite_style,
    notifications_enabled: row.notifications_enabled,
    points: row.points,
    created_at: row.created_at,
  };
}

// --- Catalogo --------------------------------------------------------------

export interface ShopSummary {
  id: string;
  name: string;
  address: string | null;
}

export interface BarberSummary {
  id: string;
  name: string;
  shop_id: string;
  shop_name: string | null;
  experience_years: number;
  rating: number;
}

export interface ServiceSummary {
  id: string;
  name: string;
  description: string | null;
  price_cop: number;
  duration_minutes: number;
}

export type AppointmentStatus = 'confirmed' | 'completed' | 'cancelled';

// --- Citas -----------------------------------------------------------------

/** Fila con recursos anidados resueltos por PostgREST. */
export interface AppointmentRow {
  id: string;
  status: AppointmentStatus;
  scheduled_at: string;
  price_cop: number;
  shop: { id: string; name: string; address: string | null } | null;
  barber: { id: string; name: string } | null;
  service: { id: string; name: string; duration_minutes: number } | null;
}

export interface AppointmentDto {
  id: string;
  status: AppointmentStatus;
  scheduled_at: string;
  price_cop: number;
  shop: { id: string; name: string; address: string | null };
  barber: { id: string; name: string };
  service: { id: string; name: string; duration_minutes: number };
}

/** Seleccion de PostgREST con las relaciones de una cita resueltas en una sola consulta. */
export const APPOINTMENT_COLUMNS =
  'id, status, scheduled_at, price_cop, ' +
  'shop:shops ( id, name, address ), ' +
  'barber:barbers ( id, name ), ' +
  'service:services ( id, name, duration_minutes )';

export function toAppointment(row: AppointmentRow): AppointmentDto {
  return {
    id: row.id,
    status: row.status,
    scheduled_at: row.scheduled_at,
    price_cop: row.price_cop,
    shop: {
      id: row.shop?.id ?? '',
      name: row.shop?.name ?? '',
      address: row.shop?.address ?? null,
    },
    barber: {
      id: row.barber?.id ?? '',
      name: row.barber?.name ?? '',
    },
    service: {
      id: row.service?.id ?? '',
      name: row.service?.name ?? '',
      duration_minutes: row.service?.duration_minutes ?? 0,
    },
  };
}
