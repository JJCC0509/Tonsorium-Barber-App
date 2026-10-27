import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { getCatalogHandler } from './catalog.controller';
import { catalogQuerySchema } from './catalog.schemas';

export const catalogRouter = Router();

catalogRouter.get('/', validate({ query: catalogQuerySchema }), getCatalogHandler);
