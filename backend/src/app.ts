import cors, { type CorsOptions } from 'cors';
import express, { type Express, type Request, type Response } from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { supabase } from './lib/supabase';
import { errorHandler, notFoundHandler } from './middleware/error';
import { appointmentsRouter } from './modules/appointments/appointments.routes';
import { authRouter } from './modules/auth/auth.routes';
import { catalogRouter } from './modules/catalog/catalog.routes';
import { meRouter } from './modules/me/me.routes';

/** `*` habilita cualquier origen; en produccion se enumeran los permitidos. */
function buildCorsOrigin(raw: string): CorsOptions['origin'] {
  const value = raw.trim();
  if (value === '' || value === '*') {
    return true;
  }
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin: buildCorsOrigin(env.ALLOWED_ORIGINS) }));
  app.use(express.json({ limit: '100kb' }));

  // Endpoint de infraestructura: verifica una consulta real a Supabase.
  app.get('/api/v1/health', async (_req: Request, res: Response): Promise<void> => {
    const timestamp = new Date().toISOString();
    const { error } = await supabase.from('services').select('id', { count: 'exact', head: true });

    if (error) {
      res.status(503).json({ status: 'error', db: 'error', timestamp });
      return;
    }
    res.status(200).json({ status: 'ok', db: 'ok', timestamp });
  });

  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/me', meRouter);
  app.use('/api/v1/catalog', catalogRouter);
  app.use('/api/v1/appointments', appointmentsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
