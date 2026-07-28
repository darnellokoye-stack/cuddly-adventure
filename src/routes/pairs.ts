import { Router } from 'express';
import { z } from 'zod';
import { PairService } from '../services/PairService.js';
import { validateSchema } from '../utils/validator.js';
import { PairQueryBuilder, QueryParams } from '../utils/PairQueryBuilder.js';

const router = Router();
const pairService = new PairService();

const addressSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/)
});

const querySchema = z.object({
  chain: z.string().optional(),
  dex: z.string().optional(),
  minLiquidity: z.coerce.number().nonnegative().optional(),
  maxLiquidity: z.coerce.number().nonnegative().optional(),
  minVolume: z.coerce.number().nonnegative().optional(),
  maxVolume: z.coerce.number().nonnegative().optional(),
  minScore: z.coerce.number().min(0).max(1).optional(),
  maxScore: z.coerce.number().min(0).max(1).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['liquidity', 'volume', 'score', 'txns', 'price']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().positive().optional(),
  limit: z.coerce.number().positive().max(100).optional()
});

// Get all pairs with filtering, sorting, and pagination
router.get('/', async (req, res, next) => {
  try {
    const query = validateSchema(querySchema, req.query as any);
    const pairs = await pairService.list();
    
    const result = PairQueryBuilder.execute(pairs, query as QueryParams);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get pair by address
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
