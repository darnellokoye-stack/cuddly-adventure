import { describe, expect, it } from 'vitest';
import { withRetry } from '../src/utils/retry.js';

describe('Retry helper', () => {
  it('retries a failing operation and eventually succeeds', async () => {
    let calls = 0;
    const result = await withRetry(async () => {
      calls += 1;
      if (calls < 2) {
        throw new Error('transient');
      }
      return 'success';
    }, { retries: 2, minTimeoutMs: 1, maxTimeoutMs: 10 });

    expect(result).toBe('success');
    expect(calls).toBe(2);
  });

  it('throws after all retries are exhausted', async () => {
    const operation = async () => {
      throw new Error('permanent');
    };

    await expect(withRetry(operation, { retries: 1, minTimeoutMs: 1, maxTimeoutMs: 5 })).rejects.toThrow('permanent');
  });
});
