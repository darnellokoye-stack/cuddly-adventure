import { Router } from 'express';
import { config } from '../config/config.js';
import { getRedisClient } from '../utils/redisClient.js';

const router = Router();

router.get('/live', (_req, res) => {
  res.status(200).json({ status: 'alive', service: 'base-token-discovery' });
});

router.get('/ready', async (_req, res) => {
  let ready = true;
  const details: Record<string, unknown> = { cacheProvider: config.cacheProvider };

  if (config.cacheProvider === 'redis') {
    const client = getRedisClient();
    details.redisStatus = client.status;
    if (client.status !== 'ready') {
      try {
        await client.ping();
        details.redisStatus = client.status;
      } catch (error) {
        ready = false;
        details.redisError = (error as Error).message;
      }
    }
  }

  if (ready) {
    res.status(200).json({ status: 'ready', ...details });
  } else {
    res.status(503).json({ status: 'unavailable', ...details });
  }
});

export default router;
