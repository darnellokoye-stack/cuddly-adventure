import { Router } from 'express';
import { StatsService } from '../services/StatsService.js';

const router = Router();
const statsService = new StatsService();

router.get('/', async (req, res, next) => {
  try {
    const stats = await statsService.summary();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

export default router;
