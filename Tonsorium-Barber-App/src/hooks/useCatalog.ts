import { useCallback, useEffect, useState } from 'react';
import { toErrorMessage } from '../services/apiClient';
import { fetchCatalog } from '../services/catalog.service';
import type { Barber, Service, Shop } from '../types/api';

interface UseCatalogResult {
  shops: Shop[];
  barbers: Barber[];
  services: Service[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/** Catalogo real desde `GET /catalog` (barberias, barberos y servicios activos). */
export function useCatalog(): UseCatalogResult {
  const [shops, setShops] = useState<Shop[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const catalog = await fetchCatalog();
      setShops(catalog.shops);
      setBarbers(catalog.barbers);
      setServices(catalog.services);
      setError(null);
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { shops, barbers, services, loading, error, refetch };
}
