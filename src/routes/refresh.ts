import { Router } from 'express';
import { enqueueDiscoveryRefresh } from '../queues/DiscoveryQueue.js';

const router = Router();

router.post('/', async (_req, res, next) => {
  try {
    const jobId = await enqueueDiscoveryRefresh();
    res.status(202).json({ message: 'Discovery refresh queued', jobId });
  } catch (error) {
    next(error);
  }
});

export default router;
