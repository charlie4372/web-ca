import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

import './config/database.js';

const app = createApp();

app.listen(env.PORT, () => {
  logger.info(`API server running on http://localhost:${env.PORT}`);
});
