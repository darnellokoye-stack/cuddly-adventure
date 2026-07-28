import { z } from 'zod';
import { Pair } from '../types/Pair.js';
import { PairFilter } from './PairFilter.js';
import { BASE_CHAIN, SUPPORTED_DEXS } from '../config/constants.js';

const ethereumAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);

/**
 * Validates pair fields and rejects invalid entries.
 */
export class ValidationFilter implements PairFilter {
  filter(pair: Pair): boolean {
    const normalizedDex = pair.dex.toLowerCase();
    if (!SUPPORTED_DEXS.includes(normalizedDex as typeof SUPPORTED_DEXS[number])) {
      return false;
    }

    if (!ethereumAddressSchema.safeParse(pair.pairAddress).success) {
      return false;
    }

    if (!ethereumAddressSchema.safeParse(pair.baseToken).success) {
      return false;
    }

    if (!ethereumAddressSchema.safeParse(pair.quoteToken).success) {
      return false;
    }

    // defend against missing/invalid chain values to avoid runtime errors
    const chainValue = typeof pair.chain === 'string' ? pair.chain.toLowerCase() : '';
    if (chainValue !== BASE_CHAIN) {
      return false;
    }

    return true;
  }
}
