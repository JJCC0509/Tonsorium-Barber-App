import { HttpError } from '../../lib/httpError';
import { supabase } from '../../lib/supabase';
import {
  USER_COLUMNS,
  toPublicUser,
  type PublicUser,
  type ShopSummary,
  type UserRow,
} from '../../lib/mappers';
import type { UpdateMeInput } from './me.schemas';

export interface UserStats {
  cuts_done: number;
  points: number;
  rating: number;
}

export interface MeResponse {
  user: PublicUser;
  preferred_shop: ShopSummary | null;
  stats: UserStats;
}

interface MeRow extends UserRow {
  preferred_shop: ShopSummary | null;
}

/** Usuario + su barberia preferida resuelta en la misma consulta. */
const ME_COLUMNS = `${USER_COLUMNS}, preferred_shop:shops ( id, name, address )`;

async function getUserStats(userId: string, fallbackPoints: number): Promise<UserStats> {
  const { data, error } = await supabase.rpc('get_user_stats', { p_user_id: userId });

  if (error) {
    throw new HttpError(500, 'INTERNAL_ERROR', 'No se pudieron calcular las estadisticas.');
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return { cuts_done: 0, points: fallbackPoints, rating: 5 };
  }

  return {
    cuts_done: Number(row.cuts_done ?? 0),
    points: Number(row.points ?? fallbackPoints),
    rating: Number(row.rating ?? 5),
  };
}

async function buildResponse(row: MeRow): Promise<MeResponse> {
  const stats = await getUserStats(row.id, row.points);
  return {
    user: toPublicUser(row),
    preferred_shop: row.preferred_shop ?? null,
    stats,
  };
}

export async function getMe(userId: string): Promise<MeResponse> {
  const { data, error } = await supabase.from('users').select(ME_COLUMNS).eq('id', userId).maybeSingle();

  if (error) {
    throw new HttpError(500, 'INTERNAL_ERROR', 'No se pudo obtener el perfil.');
  }
  if (!data) {
    throw new HttpError(401, 'UNAUTHORIZED', 'La sesion no es valida.');
  }

  return buildResponse(data as unknown as MeRow);
}

export async function updateMe(userId: string, input: UpdateMeInput): Promise<MeResponse> {
  if (input.preferred_shop_id) {
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id')
      .eq('id', input.preferred_shop_id)
      .maybeSingle();

    if (shopError) {
      throw new HttpError(500, 'INTERNAL_ERROR', 'No se pudo validar la barberia preferida.');
    }
    if (!shop) {
      throw new HttpError(404, 'NOT_FOUND', 'La barberia preferida indicada no existe.');
    }
  }

  const updates: Record<string, unknown> = {};
  if (input.full_name !== undefined) updates.full_name = input.full_name;
  if (input.phone !== undefined) updates.phone = input.phone;
  if (input.preferred_shop_id !== undefined) updates.preferred_shop_id = input.preferred_shop_id;
  if (input.favorite_style !== undefined) updates.favorite_style = input.favorite_style;
  if (input.notifications_enabled !== undefined) updates.notifications_enabled = input.notifications_enabled;

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select(ME_COLUMNS)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, 'INTERNAL_ERROR', 'No se pudo actualizar el perfil.');
  }
  if (!data) {
    throw new HttpError(401, 'UNAUTHORIZED', 'La sesion no es valida.');
  }

  return buildResponse(data as unknown as MeRow);
}
