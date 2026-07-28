import { ProviderStats } from '../api/ProviderManager.js';
import { CacheStats } from '../cache/CacheManager.js';
import { logger } from '../utils/logger.js';

/**
 * Discovery timing metrics.
 */
export interface DiscoveryMetrics {
  totalRuns: number;
  lastRunDurationMs: number;
  averageRunDurationMs: number;
  pairDiscoveredCount: number;
  tokenDiscoveredCount: number;
  filterDropCount: number;
  lastRunAt?: string;
}

/**
 * Application-wide metrics.
 */
export interface ApplicationMetrics {
  timestamp: string;
  discovery: DiscoveryMetrics;
  cache: CacheStats;
  providers: ProviderStats[];
}

/**
 * Metrics collector for monitoring and observability.
 * Tracks provider health, discovery performance, and cache efficiency.
 */
export class MetricsCollector {
  private discoveryMetrics: DiscoveryMetrics = {
    totalRuns: 0,
    lastRunDurationMs: 0,
    averageRunDurationMs: 0,
    pairDiscoveredCount: 0,
    tokenDiscoveredCount: 0,
    filterDropCount: 0
  };

  private runDurations: number[] = [];
  private maxDurationHistorySize = 100; // Keep last 100 runs

  /**
   * Record a discovery run.
   */
  recordDiscoveryRun(
    durationMs: number,
    pairsDiscovered: number,
    tokensDiscovered: number,
    filterDropCount: number = 0
  ): void {
    this.discoveryMetrics.totalRuns += 1;
    this.discoveryMetrics.lastRunDurationMs = durationMs;
    this.discoveryMetrics.pairDiscoveredCount = pairsDiscovered;
    this.discoveryMetrics.tokenDiscoveredCount = tokensDiscovered;
    this.discoveryMetrics.filterDropCount = filterDropCount;
    this.discoveryMetrics.lastRunAt = new Date().toISOString();

    // Keep duration history
    this.runDurations.push(durationMs);
    if (this.runDurations.length > this.maxDurationHistorySize) {
      this.runDurations.shift();
    }

    // Calculate average
    this.discoveryMetrics.averageRunDurationMs =
      this.runDurations.reduce((a, b) => a + b, 0) / this.runDurations.length;

    logger.debug(
      {
        duration: durationMs,
        pairs: pairsDiscovered,
        tokens: tokensDiscovered,
        avgDuration: this.discoveryMetrics.averageRunDurationMs.toFixed(2)
      },
      'Discovery run recorded'
    );
  }

  /**
   * Get current discovery metrics.
   */
  getDiscoveryMetrics(): DiscoveryMetrics {
    return { ...this.discoveryMetrics };
  }

  /**
   * Get all metrics including providers and cache.
   */
  getAllMetrics(providerStats?: ProviderStats[], cacheStats?: CacheStats): ApplicationMetrics {
    return {
      timestamp: new Date().toISOString(),
      discovery: this.getDiscoveryMetrics(),
      cache: cacheStats ?? { hits: 0, misses: 0, staleServes: 0, invalidations: 0, hitRate: 0 },
      providers: providerStats ?? []
    };
  }

  /**
   * Get percentile duration from recorded runs.
   */
  getPercentileDuration(percentile: number): number {
    if (this.runDurations.length === 0) return 0;
    const sorted = [...this.runDurations].sort((a, b) => a - b);
    const index = Math.floor((percentile / 100) * sorted.length);
    return sorted[index];
  }

  /**
   * Get duration statistics.
   */
  getDurationStats(): {
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  } {
    if (this.runDurations.length === 0) {
      return { min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0 };
    }

    const sorted = [...this.runDurations].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / sorted.length,
      p50: this.getPercentileDuration(50),
      p95: this.getPercentileDuration(95),
      p99: this.getPercentileDuration(99)
    };
  }

  /**
   * Reset all metrics.
   */
  reset(): void {
    this.discoveryMetrics = {
      totalRuns: 0,
      lastRunDurationMs: 0,
      averageRunDurationMs: 0,
      pairDiscoveredCount: 0,
      tokenDiscoveredCount: 0,
      filterDropCount: 0
    };
    this.runDurations = [];
  }

  /**
   * Export metrics as Prometheus-compatible text.
   */
  toPrometheusFormat(): string {
    const metrics = this.getMetricsSnapshot();
    const lines: string[] = [];

    // Discovery metrics
    lines.push(`# HELP discovery_total_runs Total discovery runs completed`);
    lines.push(`# TYPE discovery_total_runs counter`);
    lines.push(`discovery_total_runs ${metrics.discovery.totalRuns}`);

    lines.push(`# HELP discovery_last_run_duration_ms Last discovery run duration in milliseconds`);
    lines.push(`# TYPE discovery_last_run_duration_ms gauge`);
    lines.push(`discovery_last_run_duration_ms ${metrics.discovery.lastRunDurationMs}`);

    lines.push(`# HELP discovery_avg_run_duration_ms Average discovery run duration in milliseconds`);
    lines.push(`# TYPE discovery_avg_run_duration_ms gauge`);
    lines.push(`discovery_avg_run_duration_ms ${metrics.discovery.averageRunDurationMs.toFixed(2)}`);

    lines.push(`# HELP discovery_pairs_count Current pair count`);
    lines.push(`# TYPE discovery_pairs_count gauge`);
    lines.push(`discovery_pairs_count ${metrics.discovery.pairDiscoveredCount}`);

    lines.push(`# HELP discovery_tokens_count Current token count`);
    lines.push(`# TYPE discovery_tokens_count gauge`);
    lines.push(`discovery_tokens_count ${metrics.discovery.tokenDiscoveredCount}`);

    // Cache metrics
    lines.push(`# HELP cache_hits_total Total cache hits`);
    lines.push(`# TYPE cache_hits_total counter`);
    lines.push(`cache_hits_total ${metrics.cache.hits}`);

    lines.push(`# HELP cache_misses_total Total cache misses`);
    lines.push(`# TYPE cache_misses_total counter`);
    lines.push(`cache_misses_total ${metrics.cache.misses}`);

    lines.push(`# HELP cache_hit_rate Cache hit rate (0-1)`);
    lines.push(`# TYPE cache_hit_rate gauge`);
    lines.push(`cache_hit_rate ${metrics.cache.hitRate.toFixed(4)}`);

    return lines.join('\n');
  }

  /**
   * Get current metrics snapshot (internal).
   */
  private getMetricsSnapshot(): ApplicationMetrics {
    return this.getAllMetrics();
  }
}
