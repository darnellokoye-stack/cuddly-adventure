import { Worker } from 'bullmq';
import { QueueNames } from '../queues/QueueNames.js';
import { getRedisConnectionOptions } from '../utils/redisClient.js';
import { logger } from '../utils/logger.js';
import { queueMetrics } from '../metrics/PrometheusMetrics.js';

export class SnapshotWorker {
  private worker?: Worker;

  async start(): Promise<void> {
    this.worker = new Worker(
      QueueNames.HISTORICAL_SNAPSHOT,
      async (job) => {
        logger.info({ jobId: job.id }, 'Running historical snapshot (stub)');
        // TODO: persist historical snapshots
        return { ok: true };
      },
      { connection: getRedisConnectionOptions() }
    );

    this.worker.on('completed', () => queueMetrics.jobsCompleted.inc());
    this.worker.on('failed', () => queueMetrics.jobsFailed.inc());

    logger.info('Snapshot worker started');
  }

  async stop(): Promise<void> {
    await this.worker?.close();
    logger.info('Snapshot worker stopped');
  }
}
