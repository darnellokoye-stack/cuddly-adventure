import { DiscoveryWorker } from './DiscoveryWorker.js';
import { SecurityWorker } from './SecurityWorker.js';
import { SnapshotWorker } from './SnapshotWorker.js';
import { AnalyticsWorker } from './AnalyticsWorker.js';
import { logger } from '../utils/logger.js';

export async function startAllWorkers(): Promise<() => Promise<void>> {
  const discovery = new DiscoveryWorker();
  const security = new SecurityWorker();
  const snapshot = new SnapshotWorker();
  const analytics = new AnalyticsWorker();

  await Promise.all([discovery.start(), security.start(), snapshot.start(), analytics.start()]);

  logger.info('All workers started');

  return async () => {
    await Promise.all([discovery.stop(), security.stop(), snapshot.stop(), analytics.stop()]);
    logger.info('All workers stopped');
  };
}
