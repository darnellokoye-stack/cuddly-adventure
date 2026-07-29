import { Queue } from 'bullmq';
import { getRedisConnectionOptions } from '../utils/redisClient.js';
import { QueueNames } from './QueueNames.js';

let discoveryQueue: Queue | null = null;

function getDiscoveryQueue(): Queue {
  if (!discoveryQueue) {
    discoveryQueue = new Queue(QueueNames.DISCOVERY_REFRESH, {
      connection: getRedisConnectionOptions()
    });
  }
  return discoveryQueue;
}

export async function enqueueDiscoveryRefresh(payload: Record<string, unknown> = {}): Promise<string> {
  const queue = getDiscoveryQueue();
  const job = await queue.add('api-triggered-discovery-refresh', payload, {
    removeOnComplete: true,
    removeOnFail: false,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    }
  });
  return job.id as string;
}
