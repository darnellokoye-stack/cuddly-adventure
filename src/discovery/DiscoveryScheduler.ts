import cron from 'node-cron';
import { DiscoveryEngine } from './DiscoveryEngine.js';
import { logger } from '../utils/logger.js';

/**
 * Schedules discovery refresh cycles.
 */
export class DiscoveryScheduler {
  constructor(private readonly engine: DiscoveryEngine) {}

  start(): void {
    logger.info('Scheduling periodic discovery task every 10 minutes');
    cron.schedule('*/10 * * * *', async () => {
      try {
        await this.engine.refresh();
      } catch (error) {
        logger.error({ error }, 'Scheduled discovery refresh failed');
      }
    });
  }
}
