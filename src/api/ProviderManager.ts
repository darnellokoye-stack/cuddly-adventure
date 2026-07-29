import { BaseProvider, NormalizedResponse } from './providers/BaseProvider.js';
import { ProviderRegistry } from './providers/ProviderRegistry.js';
import { logger } from '../utils/logger.js';

/**
 * Provider statistics.
 */
export interface ProviderStats {
  providerId: string;
  name: string;
  healthy: boolean;
  lastChecked: string;
  successCount: number;
  failureCount: number;
  averageLatencyMs: number;
  lastError?: string;
}

/**
 * Options for ProviderManager.
 */
export interface ProviderManagerOptions {
  healthCheckIntervalMs?: number;
  maxRetries?: number;
  timeoutMs?: number;
}

/**
 * Manages discovery providers with health checking, failover, and statistics.
 */
export class ProviderManager {
  private registry: ProviderRegistry;
  private stats = new Map<string, ProviderStats>();
  private healthCheckIntervalMs: number;
  private maxRetries: number;
  private timeoutMs: number;
  private healthCheckTimer?: NodeJS.Timeout;
  private lastHealthCheck = new Map<string, number>();

  constructor(registry: ProviderRegistry, options: ProviderManagerOptions = {}) {
    this.registry = registry;
    this.healthCheckIntervalMs = options.healthCheckIntervalMs ?? 300000; // 5 minutes
    this.maxRetries = options.maxRetries ?? 2;
    this.timeoutMs = options.timeoutMs ?? 15000;

    this.startHealthPolling();

    // Initialize stats for all providers
    for (const provider of this.registry.getAll()) {
      this.stats.set(provider.getId(), {
        providerId: provider.getId(),
        name: provider.getName(),
        healthy: true,
        lastChecked: new Date().toISOString(),
        successCount: 0,
        failureCount: 0,
        averageLatencyMs: 0,
        lastError: undefined
      });
    }
  }

  /**
   * Fetch pairs from all providers, merging results.
   * Retries failed providers and skips unhealthy ones.
   */
  async fetchPairsFromAll(): Promise<NormalizedResponse[]> {
    const results: NormalizedResponse[] = [];
    const providers = this.registry.getAll();

    for (const provider of providers) {
      try {
        const start = Date.now();
        const response = await this.fetchWithRetry(provider);
        const latencyMs = Date.now() - start;

        this.recordSuccess(provider.getId(), latencyMs);
        results.push(response);
      } catch (error) {
        this.recordFailure(provider.getId(), error);
        logger.warn(
          { providerId: provider.getId(), error },
          'Provider failed after retries, continuing with other providers'
        );
      }
    }

    if (results.length === 0) {
      throw new Error('All providers failed');
    }

    return results;
  }

  /**
   * Fetch from the first healthy provider.
   * Falls back to other providers on failure.
   */
  async fetchPairsWithFailover(): Promise<NormalizedResponse> {
    const providers = this.registry.getAll();

    for (const provider of providers) {
      try {
        const start = Date.now();
        const response = await this.fetchWithRetry(provider);
        const latencyMs = Date.now() - start;

        this.recordSuccess(provider.getId(), latencyMs);
        return response;
      } catch (error) {
        this.recordFailure(provider.getId(), error);
        logger.warn(
          { providerId: provider.getId(), error },
          'Provider failed, trying next provider'
        );
        continue;
      }
    }

    throw new Error('All providers failed');
  }

  /**
   * Check health of a provider.
   */
  async checkHealth(providerId: string): Promise<boolean> {
    const provider = this.registry.get(providerId);
    if (!provider) {
      return false;
    }

    try {
      const healthy = await provider.healthCheck();
      const stats = this.stats.get(providerId);
      if (stats) {
        stats.healthy = healthy;
        stats.lastChecked = new Date().toISOString();
      }
      return healthy;
    } catch {
      const stats = this.stats.get(providerId);
      if (stats) {
        stats.healthy = false;
        stats.lastChecked = new Date().toISOString();
      }
      return false;
    }
  }

  /**
   * Check health of all providers.
   */
  async checkAllHealth(): Promise<void> {
    const checks = this.registry.getAll().map((provider) => this.checkHealth(provider.getId()));
    await Promise.allSettled(checks);
  }

  stopHealthPolling(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
      logger.info('Provider health polling stopped');
    }
  }

  private startHealthPolling(): void {
    this.healthCheckTimer = setInterval(async () => {
      try {
        await this.checkAllHealth();
      } catch (error) {
        logger.warn({ error }, 'Provider health polling failed');
      }
    }, this.healthCheckIntervalMs);
    logger.info({ intervalMs: this.healthCheckIntervalMs }, 'Provider health polling started');
  }

  /**
   * Get statistics for a provider.
   */
  getStats(providerId: string): ProviderStats | undefined {
    return this.stats.get(providerId);
  }

  /**
   * Get statistics for all providers.
   */
  getAllStats(): ProviderStats[] {
    return Array.from(this.stats.values());
  }

  /**
   * Get list of healthy provider IDs.
   */
  getHealthyProviders(): string[] {
    return Array.from(this.stats.values())
      .filter((s) => s.healthy)
      .map((s) => s.providerId);
  }

  /**
   * Fetch with exponential backoff retry.
   */
  private async fetchWithRetry(provider: BaseProvider): Promise<NormalizedResponse> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.withTimeout(provider.fetchPairs(), this.timeoutMs);
      } catch (error) {
        lastError = error;
        if (attempt < this.maxRetries) {
          const delayMs = Math.pow(2, attempt) * 100;
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    throw lastError;
  }

  /**
   * Execute promise with timeout.
   */
  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Provider timeout after ${timeoutMs}ms`)), timeoutMs)
      )
    ]);
  }

  /**
   * Record successful provider call.
   */
  private recordSuccess(providerId: string, latencyMs: number): void {
    const stats = this.stats.get(providerId);
    if (!stats) return;

    stats.successCount += 1;
    stats.healthy = true;
    stats.lastChecked = new Date().toISOString();

    // Update exponential moving average of latency
    const alpha = 0.3;
    stats.averageLatencyMs = alpha * latencyMs + (1 - alpha) * stats.averageLatencyMs;

    this.lastHealthCheck.set(providerId, Date.now());
  }

  /**
   * Record failed provider call.
   */
  private recordFailure(providerId: string, error: unknown): void {
    const stats = this.stats.get(providerId);
    if (!stats) return;

    stats.failureCount += 1;
    stats.healthy = false;
    stats.lastError = error instanceof Error ? error.message : String(error);
    stats.lastChecked = new Date().toISOString();
  }
}
