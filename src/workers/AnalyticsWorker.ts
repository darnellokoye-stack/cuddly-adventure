import { Worker } from 'bullmq';
import { QueueNames } from '../queues/QueueNames.js';
import { getRedisConnectionOptions } from '../utils/redisClient.js';
import { logger } from '../utils/logger.js';
import { queueMetrics } from '../metrics/PrometheusMetrics.js';

export class AnalyticsWorker {
  private worker?: Worker;

  async start(): Promise<void> {
    this.worker = new Worker(
      QueueNames.ANALYTICS_GENERATION,
      async (job) => {
        logger.info({ jobId: job.id }, 'Running analytics generation (stub)');
        // TODO: implement analytics processing
        return { ok: true };
      },
      { connection: getRedisConnectionOptions() }
    );

    this.worker.on('completed', () => queueMetrics.jobsCompleted.inc());
    this.worker.on('failed', () => queueMetrics.jobsFailed.inc());

    logger.info('Analytics worker started');
  }

  async stop(): Promise<void> {
    await this.worker?.close();
    logger.info('Analytics worker stopped');
  }
}
