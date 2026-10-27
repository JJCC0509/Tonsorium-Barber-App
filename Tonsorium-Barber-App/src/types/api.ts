/**
 * Espejo de los JSON que devuelve el backend (`backend/src/lib/mappers.ts` y
 * los `*.service.ts`). Mantener ambos lados sincronizados.
 */

export type AppointmentStatus = 'confirmed' | 'completed' | 'cancelled';

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

export interface UserStats {
  cuts_done: number;
  points: number;
  rating: number;
}

// --- Catalogo --------------------------------------------------------------

export interface Shop {
  id: string;
  name: string;
  address: string | null;
}

export interface Barber {
  id: string;
  name: string;
  shop_id: string;
  shop_name: string | null;
  experience_years: number;
  rating: number;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  price_cop: number;
  duration_minutes: number;
}

export interface CatalogResponse {
  shops: Shop[];
  barbers: Barber[];
  services: Service[];
}

// --- Citas -----------------------------------------------------------------

export interface Appointment {
  id: string;
  status: AppointmentStatus;
  scheduled_at: string;
  price_cop: number;
  shop: { id: string; name: string; address: string | null };
  barber: { id: string; name: string };
  service: { id: string; name: string; duration_minutes: number };
}

export interface CreateAppointmentInput {
  service_id: string;
  barber_id: string;
  scheduled_at: string;
}

// --- Autenticacion y perfil ------------------------------------------------

export interface AuthResponse {
  token: string;
  user: PublicUser;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
  preferred_shop_id?: string;
}

export interface MeResponse {
  user: PublicUser;
  preferred_shop: Shop | null;
  stats: UserStats;
}

export interface UpdateMeInput {
  full_name?: string;
  phone?: string | null;
  preferred_shop_id?: string | null;
  favorite_style?: string | null;
  notifications_enabled?: boolean;
}

// --- Errores ---------------------------------------------------------------

/** Cuerpo de error uniforme del backend: `{ error: { code, message, details } }`. */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
