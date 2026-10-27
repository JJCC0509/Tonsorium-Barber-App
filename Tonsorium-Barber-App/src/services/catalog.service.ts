import { apiRequest } from './apiClient';
import type { CatalogResponse } from '../types/api';

/** GET /catalog */
export function fetchCatalog(filters?: { shop_id?: string; service_id?: string }): Promise<CatalogResponse> {
  return apiRequest<CatalogResponse>('/catalog', { query: filters });
}
