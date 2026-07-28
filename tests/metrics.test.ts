import { describe, it, expect, beforeEach } from 'vitest';
import { MetricsCollector } from '../src/metrics/MetricsCollector.js';

describe('MetricsCollector', () => {
  let collector: MetricsCollector;

  beforeEach(() => {
    collector = new MetricsCollector();
  });

  it('should record discovery runs', () => {
    collector.recordDiscoveryRun(1000, 100, 50, 10);

    const metrics = collector.getDiscoveryMetrics();
    expect(metrics.totalRuns).toBe(1);
    expect(metrics.lastRunDurationMs).toBe(1000);
    expect(metrics.pairDiscoveredCount).toBe(100);
    expect(metrics.tokenDiscoveredCount).toBe(50);
    expect(metrics.filterDropCount).toBe(10);
  });

  it('should calculate average duration', () => {
    collector.recordDiscoveryRun(1000, 100, 50);
    collector.recordDiscoveryRun(2000, 150, 75);
    collector.recordDiscoveryRun(1500, 120, 60);

    const metrics = collector.getDiscoveryMetrics();
    const expectedAvg = (1000 + 2000 + 1500) / 3;
    expect(metrics.averageRunDurationMs).toBeCloseTo(expectedAvg);
  });

  it('should get duration statistics', () => {
    collector.recordDiscoveryRun(100, 10, 5);
    collector.recordDiscoveryRun(200, 20, 10);
    collector.recordDiscoveryRun(300, 30, 15);
    collector.recordDiscoveryRun(400, 40, 20);
    collector.recordDiscoveryRun(500, 50, 25);

    const stats = collector.getDurationStats();
    expect(stats.min).toBe(100);
    expect(stats.max).toBe(500);
    expect(stats.avg).toBeCloseTo(300);
    expect(stats.p50).toBeGreaterThanOrEqual(100);
    expect(stats.p50).toBeLessThanOrEqual(500);
  });

  it('should export Prometheus format', () => {
    collector.recordDiscoveryRun(1500, 100, 50);

    const prometheus = collector.toPrometheusFormat();
    expect(prometheus).toContain('discovery_total_runs');
    expect(prometheus).toContain('discovery_last_run_duration_ms');
    expect(prometheus).toContain('discovery_pairs_count');
    expect(prometheus).toContain('cache_hits_total');
    expect(prometheus).toContain('TYPE');
  });

  it('should reset metrics', () => {
    collector.recordDiscoveryRun(1000, 100, 50);
    expect(collector.getDiscoveryMetrics().totalRuns).toBe(1);

    collector.reset();
    expect(collector.getDiscoveryMetrics().totalRuns).toBe(0);
  });

  it('should track multiple runs and maintain history', () => {
    for (let i = 1; i <= 5; i++) {
      collector.recordDiscoveryRun(i * 1000, i * 100, i * 50);
    }

    const metrics = collector.getDiscoveryMetrics();
    expect(metrics.totalRuns).toBe(5);
    expect(metrics.lastRunDurationMs).toBe(5000);

    const stats = collector.getDurationStats();
    expect(stats.min).toBe(1000);
    expect(stats.max).toBe(5000);
  });
});
