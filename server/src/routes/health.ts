import { Router } from 'express';
import { isDatabaseAvailable } from '../lib/prisma.js';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  let database = 'ok';
  try {
    await isDatabaseAvailable();
  } catch {
    database = 'unavailable';
  }

  const healthy = database === 'ok';
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    service: 'nova-backend',
    database,
    timestamp: new Date().toISOString(),
  });
});
