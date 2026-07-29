import { Queue } from 'bullmq';
import { getRedisConnectionOptions } from '../utils/redisClient.js';
import { QueueNames } from './QueueNames.js';

function createQueue(name: string) {
  return new Queue(name, { connection: getRedisConnectionOptions() });
}

export const SecurityQueue = createQueue(QueueNames.SECURITY_ANALYSIS);
export const SnapshotQueue = createQueue(QueueNames.HISTORICAL_SNAPSHOT);
export const AnalyticsQueue = createQueue(QueueNames.ANALYTICS_GENERATION);
export const OpportunityQueue = createQueue(QueueNames.OPPORTUNITY_SCORING);
export const CacheMaintenanceQueue = createQueue(QueueNames.CACHE_MAINTENANCE);

export async function enqueueSecurityAnalysis(payload: unknown) {
  const job = await SecurityQueue.add('security-analysis', payload, { removeOnComplete: true });
  return job.id;
}

export async function enqueueHistoricalSnapshot(payload: unknown) {
  const job = await SnapshotQueue.add('historical-snapshot', payload, { removeOnComplete: true });
  return job.id;
}

export async function enqueueAnalyticsGeneration(payload: unknown) {
  const job = await AnalyticsQueue.add('analytics-generation', payload, { removeOnComplete: true });
  return job.id;
}

export async function enqueueOpportunityScoring(payload: unknown) {
  const job = await OpportunityQueue.add('opportunity-scoring', payload, { removeOnComplete: true });
  return job.id;
}

export async function enqueueCacheMaintenance(payload: unknown) {
  const job = await CacheMaintenanceQueue.add('cache-maintenance', payload, { removeOnComplete: true });
  return job.id;
}
