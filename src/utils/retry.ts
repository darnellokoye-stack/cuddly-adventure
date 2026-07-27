import { backoff } from './backoff.js';
import { logger } from './logger.js';

export interface RetryOptions {
  retries?: number;
  minTimeoutMs?: number;
  maxTimeoutMs?: number;
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const retries = options.retries ?? 3;
  const minTimeoutMs = options.minTimeoutMs ?? 100;
  const maxTimeoutMs = options.maxTimeoutMs ?? 2000;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        logger.info({ attempt }, 'Retrying operation after failure');
      }
      return await operation();
    } catch (error) {
      lastError = error;
      const delay = backoff(attempt, minTimeoutMs, maxTimeoutMs);
      logger.warn({ attempt, error }, 'Operation failed, waiting before retry');
      if (attempt === retries) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
