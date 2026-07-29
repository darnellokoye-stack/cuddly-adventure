import { EventEmitter } from 'events';
import { AnyDiscoveryEvent, DiscoveryEventType } from '../types/Events.js';
import { logger } from '../utils/logger.js';

/**
 * Event listener callback.
 */
export type EventListener = (event: AnyDiscoveryEvent) => void;

/**
 * Internal event bus for discovery-related events.
 * Used to signal new discoveries, changes, and failures.
 */
export class DiscoveryEventBus extends EventEmitter {
  private static instance: DiscoveryEventBus;

  constructor() {
    super();
    this.setMaxListeners(20);
  }

  /**
   * Get singleton instance.
   */
  static getInstance(): DiscoveryEventBus {
    if (!this.instance) {
      this.instance = new DiscoveryEventBus();
    }
    return this.instance;
  }

  /**
   * Emit an event.
   */
  emit(event: AnyDiscoveryEvent): boolean;
  emit(eventName: string | symbol, ...args: unknown[]): boolean;
  emit(eventName: string | symbol | AnyDiscoveryEvent, ...args: unknown[]): boolean {
    if (typeof eventName === 'string' || typeof eventName === 'symbol') {
      return super.emit(eventName, ...args);
    }

    const event = eventName as AnyDiscoveryEvent;
    logger.trace(
      { eventType: event.type, timestamp: event.timestamp },
      'Event emitted'
    );
    super.emit(event.type, event);
    return super.emit('*', event);
  }

  /**
   * Listen for specific event type.
   */
  on(eventType: DiscoveryEventType, listener: EventListener): this {
    return super.on(eventType, listener);
  }

  /**
   * Listen for any event.
   */
  onAny(listener: EventListener): this {
    return super.on('*', listener);
  }

  /**
   * Listen once for specific event type.
   */
  once(eventType: DiscoveryEventType, listener: EventListener): this {
    return super.once(eventType, listener);
  }

  /**
   * Remove listener.
   */
  off(eventType: DiscoveryEventType, listener: EventListener): this {
    return super.off(eventType, listener);
  }

  /**
   * Clear all listeners.
   */
  clear(): void {
    this.removeAllListeners();
  }
}
