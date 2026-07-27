/**
 * Cache provider abstraction.
 */
export interface CacheProvider {
  read<T>(key: string): Promise<T | null>;
  write<T>(key: string, value: T): Promise<void>;
  exists(key: string): Promise<boolean>;
}
