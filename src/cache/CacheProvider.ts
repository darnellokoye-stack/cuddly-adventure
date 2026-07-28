import { CachePayload } from '../types/Cache.js';

/**
 * Cache provider abstraction.
 */
export interface CacheProvider {
  read<T>(key: string): Promise<T | null>;
  readPayload<T>(key: string): Promise<CachePayload<T> | null>;
  write<T>(key: string, value: T): Promise<void>;
  exists(key: string): Promise<boolean>;
}
