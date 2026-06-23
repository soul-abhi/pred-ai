import './config/env'; // load env first
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { checkDbConnection } from './db/client';
import { mlHealth } from './services/mlClient.service';
import { apiLimiter } from './middleware/rateLimit.middleware';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth.routes';
import predictRoutes from './routes/predict.routes';
import datasetRoutes from './routes/dataset.routes';
import trainRoutes from './routes/train.routes';
import reportsRoutes from './routes/reports.routes';

const app = express();

// Security headers
app.use(helmet());

// CORS — credentials: true requires an explicit origin, never '*'
app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));

// Body parsing
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Global rate limit (generous, per-route limiters are stricter where needed)
app.use(apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/predict', predictRoutes);
app.use('/api/datasets', datasetRoutes);
app.use('/api/train', trainRoutes);
app.use('/api/reports', reportsRoutes);

// Health — checks real dependencies, not just "I'm alive"
app.get('/api/health', async (_req, res) => {
  const [dbOk, mlStatus] = await Promise.allSettled([
    checkDbConnection(),
    mlHealth(),
  ]);

  const db = dbOk.status === 'fulfilled' && dbOk.value;
  const ml = mlStatus.status === 'fulfilled' ? mlStatus.value : null;

  const healthy = db && ml?.status === 'ok';

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    db,
    ml_service: !!ml,
    model_loaded: ml?.model_loaded ?? false,
    model_version: ml?.model_version ?? null,
  });
});

// Error handler must be last
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`[API] Listening on :${env.PORT} (${env.NODE_ENV})`);
});

export default app;
