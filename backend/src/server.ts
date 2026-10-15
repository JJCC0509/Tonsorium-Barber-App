import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { notFoundMiddleware } from './middlewares/not-found.middleware.js';
import router from './routes/index.js';

// Exporta createApp para facilitar pruebas y arranque.
export function createApp(): express.Express {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json());

  app.use('/api/v1', router);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);
  return app;
}
