import { HttpError } from '../../lib/httpError';
import { supabase } from '../../lib/supabase';
import type { BarberSummary, ServiceSummary, ShopSummary } from '../../lib/mappers';
import type { CatalogQuery } from './catalog.schemas';

export interface CatalogResponse {
  shops: ShopSummary[];
  barbers: BarberSummary[];
  services: ServiceSummary[];
}

interface BarberRow {
  id: string;
  name: string;
  shop_id: string;
  experience_years: number;
  rating: number | string;
  shop: { name: string } | null;
}

/**
 * Devuelve shops, barbers y services activos.
 * Filtros opcionales: `shop_id` filtra los barberos, `service_id` filtra los servicios.
 */
export async function getCatalog(filters: CatalogQuery): Promise<CatalogResponse> {
  let barbersQuery = supabase
    .from('barbers')
    .select('id, name, shop_id, experience_years, rating, shop:shops ( name )')
    .eq('active', true);

  if (filters.shop_id) {
    barbersQuery = barbersQuery.eq('shop_id', filters.shop_id);
  }
  barbersQuery = barbersQuery.order('name', { ascending: true });

  let servicesQuery = supabase
    .from('services')
    .select('id, name, description, price_cop, duration_minutes')
    .eq('active', true);

  if (filters.service_id) {
    servicesQuery = servicesQuery.eq('id', filters.service_id);
  }
  servicesQuery = servicesQuery.order('name', { ascending: true });

  const shopsQuery = supabase
    .from('shops')
    .select('id, name, address')
    .order('name', { ascending: true });

  const [shopsResult, barbersResult, servicesResult] = await Promise.all([
    shopsQuery,
    barbersQuery,
    servicesQuery,
  ]);

  if (shopsResult.error || barbersResult.error || servicesResult.error) {
    throw new HttpError(500, 'INTERNAL_ERROR', 'No se pudo obtener el catalogo.');
  }

  const barbers: BarberSummary[] = ((barbersResult.data ?? []) as unknown as BarberRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    shop_id: row.shop_id,
    shop_name: row.shop?.name ?? null,
    experience_years: row.experience_years,
    rating: Number(row.rating),
  }));

  return {
    shops: (shopsResult.data ?? []) as ShopSummary[],
    barbers,
    services: (servicesResult.data ?? []) as ServiceSummary[],
  };
}
