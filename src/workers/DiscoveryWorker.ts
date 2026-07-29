import { QueueEvents, QueueScheduler, Worker } from 'bullmq';
import { config } from '../config/config.js';
import { getRedisConnectionOptions } from '../utils/redisClient.js';
import { DiscoveryService } from '../services/DiscoveryService.js';
import { queueMetrics } from '../metrics/PrometheusMetrics.js';
import { logger } from '../utils/logger.js';
import { QueueNames } from '../queues/QueueNames.js';

export class DiscoveryWorker {
  private worker?: Worker;
  private scheduler?: QueueScheduler;
  private events?: QueueEvents;
  private readonly discoveryService = new DiscoveryService();

  async start(): Promise<void> {
    const connection = getRedisConnectionOptions();

    this.scheduler = new QueueScheduler(QueueNames.DISCOVERY_REFRESH, { connection });
    await this.scheduler.waitUntilReady();

    this.events = new QueueEvents(QueueNames.DISCOVERY_REFRESH, { connection });
    this.attachEventListeners();

    this.worker = new Worker(
      QueueNames.DISCOVERY_REFRESH,
      async (job) => {
        const startTime = Date.now();
        logger.info({ jobId: job.id, name: job.name }, 'Processing discovery queue job');
        const payload = await this.discoveryService.refresh();
        queueMetrics.jobProcessingTimeMs.observe(Date.now() - startTime);
        return payload;
      },
      {
        connection,
        concurrency: config.workerConcurrency,
        lockDuration: 300000
      }
    );

    this.worker.on('completed', (job) => {
      queueMetrics.jobsCompleted.inc();
      logger.info({ jobId: job?.id }, 'Discovery queue job completed');
    });

    this.worker.on('failed', (job, error) => {
      queueMetrics.jobsFailed.inc();
      logger.error({ jobId: job?.id, error }, 'Discovery queue job failed');
    });

    this.worker.on('error', (error) => {
      logger.error({ error }, 'Discovery worker error');
    });

    logger.info({ concurrency: config.workerConcurrency }, 'Discovery worker started');
  }

  private attachEventListeners(): void {
    if (!this.events) {
      return;
    }

    this.events.on('completed', () => {
      queueMetrics.jobsProcessed.inc();
    });

    this.events.on('failed', () => {
      queueMetrics.jobsProcessed.inc();
    });
  }

  async stop(): Promise<void> {
    await this.worker?.close();
    await this.events?.close();
    await this.scheduler?.close();
    logger.info('Discovery worker stopped');
  }
}
