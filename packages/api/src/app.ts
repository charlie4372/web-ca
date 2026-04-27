import express from 'express';
import session from 'express-session';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { SQLiteSessionStore } from './middleware/session-store.js';
import { errorHandler } from './middleware/error-handler.js';
import routes from './routes/index.js';

export function createApp() {
  const app = express();

  if (env.TRUST_PROXY) app.set('trust proxy', 1);

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(pinoHttp({ logger }));

  const secureCookies = env.SECURE_COOKIES === 'auto'
    ? env.NODE_ENV === 'production'
    : env.SECURE_COOKIES === 'true';

  app.use(
    session({
      name: 'sid',
      store: new SQLiteSessionStore(),
      secret: env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: secureCookies,
        sameSite: 'strict',
        maxAge: 8 * 60 * 60 * 1000,
      },
    })
  );

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: 'RATE_LIMITED', message: 'Too many login attempts' } },
  });
  app.use('/api/v1/auth/login', loginLimiter);

  app.use('/api/v1', routes);

  const uiDist = resolve(import.meta.dirname, '../../ui/dist');
  if (existsSync(uiDist)) {
    app.use(express.static(uiDist));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(resolve(uiDist, 'index.html'));
    });
  }

  app.use(errorHandler);

  return app;
}
