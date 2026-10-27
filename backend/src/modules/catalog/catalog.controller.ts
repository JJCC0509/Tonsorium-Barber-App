import type { Request, Response } from 'express';
import type { CatalogQuery } from './catalog.schemas';
import { getCatalog } from './catalog.service';

export async function getCatalogHandler(req: Request, res: Response): Promise<void> {
  const catalog = await getCatalog(req.query as unknown as CatalogQuery);

  // El catalogo nunca se cachea: siempre refleja el estado actual de la base.
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json(catalog);
}
