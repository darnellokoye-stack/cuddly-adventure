import { Router } from 'express';
import { z } from 'zod';
import { TokenService } from '../services/TokenService.js';
import { validateSchema } from '../utils/validator.js';

const router = Router();
const tokenService = new TokenService();

const addressSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/)
});

router.get('/', async (req, res, next) => {
  try {
    const tokens = await tokenService.list();
    res.json(tokens);
  } catch (error) {
    next(error);
  }
});

router.get('/:address', async (req, res, next) => {
  try {
    const params = validateSchema(addressSchema, req.params);
    const token = await tokenService.find(params.address);
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }
    res.json(token);
  } catch (error) {
    next(error);
  }
});

export default router;
