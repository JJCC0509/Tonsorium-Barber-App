import { z } from 'zod';

export const catalogQuerySchema = z.object({
  shop_id: z.string().uuid('El parametro shop_id no es un UUID valido.').optional(),
  service_id: z.string().uuid('El parametro service_id no es un UUID valido.').optional(),
});

export type CatalogQuery = z.infer<typeof catalogQuerySchema>;
