import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env';

/**
 * Cliente singleton de Supabase con la `service_role` key.
 * Es el UNICO lugar donde el backend accede a la base de datos: la clave
 * jamas se expone a la app movil ni se registra en logs.
 */
export const supabase: SupabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
