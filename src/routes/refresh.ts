import { Router } from 'express';
import { DiscoveryService } from '../services/DiscoveryService.js';

const router = Router();
const discoveryService = new DiscoveryService();

router.post('/', async (req, res, next) => {
  try {
    const payload = await discoveryService.refresh();
    res.status(202).json({ message: 'Discovery refresh triggered', payload });
  } catch (error) {
    next(error);
  }
});

export default router;
