import express, { Application, NextFunction, Request, Response } from 'express';
import tokensRouter from './routes/tokens.js';
import pairsRouter from './routes/pairs.js';
import statsRouter from './routes/stats.js';
import refreshRouter from './routes/refresh.js';
import discoveryRouter from './routes/discovery.js';
import healthRouter from './routes/health.js';
import metricsRouter from './routes/metrics.js';
import { config } from './config/config.js';
import { logger } from './utils/logger.js';
import { EventStreamServer } from './streaming/EventStreamServer.js';
import { DiscoveryEventBus } from './events/DiscoveryEventBus.js';
import { ensureRedisConnected } from './utils/redisClient.js';
import { DiscoveryScheduler } from './scheduling/DiscoveryScheduler.js';
import { DiscoveryWorker } from './workers/DiscoveryWorker.js';

export function createApp(): Application {
  const app = express();

  app.use(express.json());
  app.use('/tokens', tokensRouter);
  app.use('/pairs', pairsRouter);
  app.use('/stats', statsRouter);
  app.use('/refresh', refreshRouter);
  app.use('/discovery', discoveryRouter);
  app.use('/health', healthRouter);
  app.use('/metrics', metricsRouter);

  app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    logger.error({ err, path: req.path }, 'Unhandled request error');
    const message = err instanceof Error ? err.message : 'Internal server error';
    res.status(500).json({ error: message });
    next();
  });

  return app;
}

const app = createApp();

const scheduler = config.serviceRole !== 'worker' ? new DiscoveryScheduler() : undefined;
const worker = config.serviceRole !== 'api' ? new DiscoveryWorker() : undefined;
const streamServer = new EventStreamServer(app);
const eventBus = DiscoveryEventBus.getInstance();

eventBus.onAny((event) => {
  streamServer.broadcast(event);
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, async () => {
    logger.info({ port: config.port, serviceRole: config.serviceRole }, 'Server started');
    try {
      await ensureRedisConnected();
    } catch (error) {
      logger.warn({ error }, 'Redis connection during startup failed');
    }
    try {
      await streamServer.start(config.eventStreamPort);
    } catch (error) {
      logger.warn({ error }, 'WebSocket stream failed to start');
    }
    if (scheduler) {
      try {
        await scheduler.start();
      } catch (error) {
        logger.warn({ error }, 'Discovery scheduler failed to start');
      }
    }
    if (worker) {
      try {
        await worker.start();
      } catch (error) {
        logger.error({ error }, 'Discovery worker failed to start');
      }
    }
  });

  const shutdown = async () => {
    logger.info('Graceful shutdown initiated');
    if (scheduler) {
      try {
        await scheduler.close();
      } catch (error) {
        logger.warn({ error }, 'Scheduler close failed');
      }
    }

    if (worker) {
      try {
        await worker.stop();
      } catch (error) {
        logger.warn({ error }, 'Worker stop failed');
      }
    }

    try {
      await streamServer.stop();
    } catch (error) {
      logger.warn({ error }, 'WebSocket stream stop failed');
    }

    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

export default app;
