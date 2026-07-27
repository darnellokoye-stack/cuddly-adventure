import { Router } from 'express';
import { z } from 'zod';
import { PairService } from '../services/PairService.js';
import { validateSchema } from '../utils/validator.js';

const router = Router();
const pairService = new PairService();

const addressSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/)
});

router.get('/', async (req, res, next) => {
  try {
    const pairs = await pairService.list();
    res.json(pairs);
  } catch (error) {
    next(error);
  }
});

router.get('/:address', async (req, res, next) => {
  try {
    const params = validateSchema(addressSchema, req.params);
    const pair = await pairService.find(params.address);
    if (!pair) {
      return res.status(404).json({ error: 'Pair not found' });
    }
    res.json(pair);
  } catch (error) {
    next(error);
  }
});

export default router;
