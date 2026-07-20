import cors from 'cors';
import express from 'express';
import pinoHttp from 'pino-http';
import { config } from './config';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { logger } from './logger';
import { router } from './routes';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: config.corsOrigins }));
  app.use(pinoHttp({ logger }));
  app.use(router);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
