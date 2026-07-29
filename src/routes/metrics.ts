import { Router } from 'express';
import { getPrometheusMetrics, getPrometheusContentType } from '../metrics/PrometheusMetrics.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const metrics = await getPrometheusMetrics();
    res.setHeader('Content-Type', getPrometheusContentType());
    res.send(metrics);
  } catch (error) {
    next(error);
  }
});

export default router;
