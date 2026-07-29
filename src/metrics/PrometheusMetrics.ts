import client from 'prom-client';

const register = new client.Registry();
register.setDefaultLabels({ service: 'base-token-discovery' });
client.collectDefaultMetrics({ register, prefix: 'discovery_' });

export const cacheMetrics = {
  cacheReads: new client.Counter({
    name: 'discovery_cache_reads_total',
    help: 'Total cache read operations',
    registers: [register]
  }),
  cacheWrites: new client.Counter({
    name: 'discovery_cache_writes_total',
    help: 'Total cache write operations',
    registers: [register]
  }),
  cacheHits: new client.Counter({
    name: 'discovery_cache_hits_total',
    help: 'Total cache hit counts',
    registers: [register]
  }),
  cacheMisses: new client.Counter({
    name: 'discovery_cache_misses_total',
    help: 'Total cache miss counts',
    registers: [register]
  }),
  cacheLatencyMs: new client.Histogram({
    name: 'discovery_cache_latency_ms',
    help: 'Cache latency in milliseconds',
    buckets: [5, 10, 25, 50, 100, 250, 500, 1000],
    registers: [register]
  }),
  cacheTtlSeconds: new client.Gauge({
    name: 'discovery_cache_ttl_seconds',
    help: 'Configured cache TTL in seconds',
    registers: [register]
  })
};

export const queueMetrics = {
  jobsCompleted: new client.Counter({
    name: 'discovery_queue_jobs_completed_total',
    help: 'Total completed queue jobs',
    registers: [register]
  }),
  jobsFailed: new client.Counter({
    name: 'discovery_queue_jobs_failed_total',
    help: 'Total failed queue jobs',
    registers: [register]
  }),
  jobsProcessed: new client.Counter({
    name: 'discovery_queue_jobs_processed_total',
    help: 'Total processed queue jobs',
    registers: [register]
  }),
  jobProcessingTimeMs: new client.Histogram({
    name: 'discovery_queue_job_processing_time_ms',
    help: 'Queue job processing duration in milliseconds',
    buckets: [50, 100, 250, 500, 1000, 2500, 5000],
    registers: [register]
  })
};

export const pubsubMetrics = {
  messagesPublished: new client.Counter({
    name: 'discovery_pubsub_messages_published_total',
    help: 'Total messages published to pubsub channels',
    registers: [register]
  }),
  messagesReceived: new client.Counter({
    name: 'discovery_pubsub_messages_received_total',
    help: 'Total messages received from pubsub channels',
    registers: [register]
  }),
  discoveryEventsPublished: new client.Counter({
    name: 'discovery_pubsub_discovery_events_published_total',
    help: 'Total discovery events published',
    registers: [register]
  }),
  discoveryEventsReceived: new client.Counter({
    name: 'discovery_pubsub_discovery_events_received_total',
    help: 'Total discovery events received',
    registers: [register]
  }),
  cacheInvalidationsPublished: new client.Counter({
    name: 'discovery_pubsub_cache_invalidations_published_total',
    help: 'Total cache invalidation messages published',
    registers: [register]
  }),
  cacheInvalidationsReceived: new client.Counter({
    name: 'discovery_pubsub_cache_invalidations_received_total',
    help: 'Total cache invalidation messages received',
    registers: [register]
  })
};

export async function getPrometheusMetrics(): Promise<string> {
  return register.metrics();
}

export function getPrometheusContentType(): string {
  return register.contentType;
}
