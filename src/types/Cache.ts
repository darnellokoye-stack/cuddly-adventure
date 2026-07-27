/**
 * Cache payload for persistent storage.
 */
export interface CachePayload<T> {
  version: string;
  timestamp: string;
  data: T;
}
