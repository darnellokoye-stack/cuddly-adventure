import cron, { ScheduledTask } from 'node-cron';
import { DiscoveryEngine } from './DiscoveryEngine.js';
import { logger } from '../utils/logger.js';

/**
 * Schedules discovery refresh cycles.
 */
export class DiscoveryScheduler {
  private task?: ScheduledTask;

  constructor(private readonly engine: DiscoveryEngine) {}

  start(): void {
    logger.info('Scheduling periodic discovery task every 10 minutes');
    this.task = cron.schedule('*/10 * * * *', async () => {
      try {
        await this.engine.refresh();
      } catch (error) {
        logger.error({ error }, 'Scheduled discovery refresh failed');
      }
    });
  }

  stop(): void {
    if (this.task) {
      this.task.stop();
      logger.info('Discovery scheduler stopped');
    }
  }
}
