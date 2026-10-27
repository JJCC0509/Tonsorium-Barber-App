import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { getMeHandler, updateMeHandler } from './me.controller';
import { updateMeSchema } from './me.schemas';

export const meRouter = Router();

meRouter.use(requireAuth);
meRouter.get('/', getMeHandler);
meRouter.put('/', validate({ body: updateMeSchema }), updateMeHandler);
