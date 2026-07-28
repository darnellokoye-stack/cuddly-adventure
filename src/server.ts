import express, { Application, NextFunction, Request, Response } from 'express';
import tokensRouter from './routes/tokens.js';
import pairsRouter from './routes/pairs.js';
import statsRouter from './routes/stats.js';
import refreshRouter from './routes/refresh.js';
import discoveryRouter from './routes/discovery.js';
import { config } from './config/config.js';
import { logger } from './utils/logger.js';
import { DiscoveryEngine } from './discovery/DiscoveryEngine.js';
import { DiscoveryScheduler } from './discovery/DiscoveryScheduler.js';

export function createApp(): Application {
  const app = express();

  app.use(express.json());
  app.use('/tokens', tokensRouter);
  app.use('/pairs', pairsRouter);
  app.use('/stats', statsRouter);
  app.use('/refresh', refreshRouter);
  app.use('/discovery', discoveryRouter);

  app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    logger.error({ err, path: req.path }, 'Unhandled request error');
    const message = err instanceof Error ? err.message : 'Internal server error';
    res.status(500).json({ error: message });
    next();
  });

  return app;
}

const app = createApp();

const startupEngine = new DiscoveryEngine();
const scheduler = new DiscoveryScheduler(startupEngine);

if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, async () => {
    logger.info({ port: config.port }, 'Server started');
    scheduler.start();
    try {
      await startupEngine.refresh();
    } catch (error) {
      logger.error({ error }, 'Initial discovery failed, the service will continue to run');
    }
  });
}

export default app;
