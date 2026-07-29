import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { DiscoveryService } from '../services/DiscoveryService.js';
import { Pair } from '../types/Pair.js';
import { validateSchema } from '../utils/validator.js';

const router = Router();
const discoveryService = new DiscoveryService();

// Pagination schema
const paginationSchema = z.object({
  page: z.string().regex(/\d+/).optional(),
  limit: z.string().regex(/\d+/).optional(),
  sortBy: z.enum(['score', 'liquidity', 'volume24h', 'lastUpdated']).optional(),
  order: z.enum(['asc', 'desc']).optional()
});

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

function paginate<T>(items: T[], page: number = 1, limit: number = 50): PaginatedResponse<T> {
  const start = (page - 1) * limit;
  const end = start + limit;
  return {
    items: items.slice(start, end),
    total: items.length,
    page,
    limit,
    pages: Math.ceil(items.length / limit)
  };
}

function sortPairs(pairs: Pair[], sortBy: string = 'score', order: string = 'desc'): Pair[] {
  const sorted = [...pairs];
  const isAsc = order === 'asc';
  sorted.sort((a, b) => {
    const aVal = (a as any)[sortBy] ?? 0;
    const bVal = (b as any)[sortBy] ?? 0;
    return isAsc ? aVal - bVal : bVal - aVal;
  });
  return sorted;
}

// GET /metrics - Discovery and provider metrics
router.get('/metrics', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const metrics = await discoveryService.getMetrics();
    res.json(metrics);
  } catch (error) {
    next(error);
  }
});

// GET /delta - Latest delta snapshot
router.get('/delta', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const delta = await discoveryService.getDelta();
    res.json(delta ?? {});
  } catch (error) {
    next(error);
  }
});

// GET /opportunities - Latest opportunity analysis
router.get('/opportunities', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const opportunities = await discoveryService.getOpportunities();
    res.json(opportunities);
  } catch (error) {
    next(error);
  }
});

// GET /pairs/filtered - Filtered and paginated pairs
router.get('/pairs/filtered', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = validateSchema(paginationSchema, req.query) as z.infer<typeof paginationSchema>;
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(500, Math.max(1, Number(query.limit ?? 50)));
    const sortBy = query.sortBy ?? 'score';
    const order = query.order ?? 'desc';

    let pairs = await discoveryService.getPairs();
    pairs = sortPairs(pairs, sortBy, order);
    const result = paginate(pairs, page, limit);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /tokens/filtered - Filtered and paginated tokens
router.get('/tokens/filtered', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = validateSchema(paginationSchema, req.query) as z.infer<typeof paginationSchema>;
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(500, Math.max(1, Number(query.limit ?? 50)));

    let tokens = await discoveryService.getTokens();
    const result = paginate(tokens, page, limit);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
