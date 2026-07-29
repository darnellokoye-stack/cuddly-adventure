import { Queue } from 'bullmq';
import { logger } from '../utils/logger.js';
import { config } from '../config/config.js';
import { getRedisConnectionOptions } from '../utils/redisClient.js';
import { QueueNames } from '../queues/QueueNames.js';

export class DiscoveryScheduler {
  private readonly queue: Queue;

  constructor() {
    this.queue = new Queue(QueueNames.DISCOVERY_REFRESH, {
      connection: getRedisConnectionOptions()
    });
  }

  async start(): Promise<void> {
    try {
      await this.queue.waitUntilReady();
      logger.info({ cron: config.discoveryCron }, 'Scheduling discovery refresh job');
      await this.queue.add(
        'scheduled-discovery-refresh',
        { forced: false },
        {
          jobId: 'discovery-refresh-scheduled',
          repeat: {
            cron: config.discoveryCron
          },
          removeOnComplete: true,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000
          }
        }
      );
    } catch (error) {
      logger.error({ error }, 'Failed to schedule discovery refresh');
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}
