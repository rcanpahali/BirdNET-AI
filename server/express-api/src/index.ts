import './db/client';
import { createApp } from './app';
import { config } from './config';
import { logger } from './logger';

const app = createApp();

app.listen(config.port, () => {
  logger.info(`Express API listening on port ${config.port} -> ${config.birdnetApiUrl}`);
});
