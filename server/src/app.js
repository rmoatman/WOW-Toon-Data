import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import env, { isProd } from './config/env.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';

export function createApp() {
  const app = express();

  // Render terminates TLS at its proxy; trust it so secure cookies and
  // rate-limiter IP detection work correctly.
  if (isProd) app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.clientUrls,
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());
  app.use(morgan(isProd ? 'combined' : 'dev'));

  // Routes
  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter);

  // API 404
  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Centralized error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error('[error]', err);
    const status = err.status || 500;
    res.status(status).json({
      error: status === 500 ? 'Internal server error' : err.message,
    });
  });

  return app;
}
