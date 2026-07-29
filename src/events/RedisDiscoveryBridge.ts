import { randomUUID } from 'crypto';
import { DiscoveryEventBus } from './DiscoveryEventBus.js';
import { PubSubChannels } from './PubSubChannels.js';
import { createRedisPubSubMessage, publishRedisMessage, subscribeRedisChannels } from '../utils/redisPubSub.js';
import { logger } from '../utils/logger.js';
import { pubsubMetrics } from '../metrics/PrometheusMetrics.js';
import { AnyDiscoveryEvent } from '../types/Events.js';

const REMOTE_EVENT_FLAG = Symbol('redisRemoteEvent');

export class RedisDiscoveryBridge {
  private readonly instanceId: string;
  private readonly localBus: DiscoveryEventBus;

  constructor(localBus: DiscoveryEventBus) {
    this.localBus = localBus;
    this.instanceId = process.env.INSTANCE_ID ?? randomUUID();

    this.localBus.onAny((event) => {
      if ((event as any)[REMOTE_EVENT_FLAG]) {
        return;
      }

      this.publishLocalEvent(event).catch((error) => {
        logger.warn({ error, eventType: event.type }, 'Failed to publish discovery event to Redis');
      });
    });
  }

  async initialize(): Promise<void> {
    await subscribeRedisChannels([PubSubChannels.DISCOVERY_EVENTS, PubSubChannels.CACHE_INVALIDATION], (channel, payload) => {
      if (channel === PubSubChannels.DISCOVERY_EVENTS) {
        this.handleRemoteDiscoveryEvent(payload);
      }
      if (channel === PubSubChannels.CACHE_INVALIDATION) {
        this.handleCacheInvalidation(payload);
      }
    });
  }

  private async publishLocalEvent(event: AnyDiscoveryEvent): Promise<void> {
    const envelope = createRedisPubSubMessage({ instanceId: this.instanceId, event });
    await publishRedisMessage(PubSubChannels.DISCOVERY_EVENTS, envelope);
    pubsubMetrics.discoveryEventsPublished.inc();
  }

  async publishCacheInvalidation(key: string): Promise<void> {
    const envelope = createRedisPubSubMessage({ instanceId: this.instanceId, key, timestamp: new Date().toISOString() });
    await publishRedisMessage(PubSubChannels.CACHE_INVALIDATION, envelope);
    pubsubMetrics.cacheInvalidationsPublished.inc();
  }

  private handleRemoteDiscoveryEvent(payload: unknown): void {
    const remote = payload as { instanceId: string; event: AnyDiscoveryEvent };
    if (remote.instanceId === this.instanceId) {
      return;
    }
    pubsubMetrics.discoveryEventsReceived.inc();
    const event = Object.assign({}, remote.event, { [REMOTE_EVENT_FLAG]: true });
    this.localBus.emit(event as AnyDiscoveryEvent);
  }

  private handleCacheInvalidation(payload: unknown): void {
    const remote = payload as { instanceId: string; key: string; timestamp: string };
    if (remote.instanceId === this.instanceId) {
      return;
    }
    pubsubMetrics.cacheInvalidationsReceived.inc();
    logger.info({ key: remote.key, timestamp: remote.timestamp }, 'Cache invalidation event received');
  }
}
