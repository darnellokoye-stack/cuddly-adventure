import { describe, expect, it } from 'vitest';
import { mapWithConcurrency } from '../src/utils/concurrency.js';

describe('Concurrency limiter', () => {
  it('limits concurrent mapper executions', async () => {
    let active = 0;
    let maxActive = 0;

    const items = Array.from({ length: 20 }, (_, index) => index);
    await mapWithConcurrency(items, 5, async (item) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 1));
      active -= 1;
      return item * 2;
    });

    expect(maxActive).toBeLessThanOrEqual(5);
  });
});
