import { Router } from 'express';
import { MetricsCollector } from '../metrics/MetricsCollector.js';

const router = Router();
const metricsCollector = new MetricsCollector();

/**
 * Get detailed metrics as JSON.
 */
router.get('/detailed', async (req, res, next) => {
  try {
    const metrics = metricsCollector.getAllMetrics();
    res.json(metrics);
  } catch (error) {
    next(error);
  }
});

/**
 * Get duration statistics.
 */
router.get('/duration', async (req, res, next) => {
  try {
    const stats = metricsCollector.getDurationStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

/**
 * Get discovery metrics.
 */
router.get('/discovery', async (req, res, next) => {
  try {
    const metrics = metricsCollector.getDiscoveryMetrics();
    res.json(metrics);
  } catch (error) {
    next(error);
  }
});

/**
 * Get metrics in Prometheus format.
 */
router.get('/prometheus', async (req, res, next) => {
  try {
    const prometheus = metricsCollector.toPrometheusFormat();
    res.type('text/plain').send(prometheus);
  } catch (error) {
    next(error);
  }
});

/**
 * Reset metrics.
 */
router.post('/reset', async (req, res, next) => {
  try {
    metricsCollector.reset();
    res.json({ message: 'Metrics reset' });
  } catch (error) {
    next(error);
  }
});

export { metricsCollector };
export default router;
