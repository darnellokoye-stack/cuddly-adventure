import { Worker } from 'bullmq';
import { QueueNames } from '../queues/QueueNames.js';
import { getRedisConnectionOptions } from '../utils/redisClient.js';
import { logger } from '../utils/logger.js';
import { queueMetrics } from '../metrics/PrometheusMetrics.js';

export class SecurityWorker {
  private worker?: Worker;

  async start(): Promise<void> {
    this.worker = new Worker(
      QueueNames.SECURITY_ANALYSIS,
      async (job) => {
        logger.info({ jobId: job.id }, 'Running security analysis (stub)');
        // TODO: integrate actual security clients
        return { ok: true };
      },
      { connection: getRedisConnectionOptions() }
    );

    this.worker.on('completed', () => queueMetrics.jobsCompleted.inc());
    this.worker.on('failed', () => queueMetrics.jobsFailed.inc());

    logger.info('Security worker started');
  }

  async stop(): Promise<void> {
    await this.worker?.close();
    logger.info('Security worker stopped');
  }
}
