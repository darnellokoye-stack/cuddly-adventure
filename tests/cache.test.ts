import { describe, expect, it } from 'vitest';
import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import { FileCache } from '../src/cache/FileCache.js';

const tempDir = path.join(os.tmpdir(), 'base-token-discovery-test');

describe('FileCache', () => {
  it('writes and reads a value successfully', async () => {
    const cache = new FileCache(tempDir);
    const key = 'cache-test';
    const value = { hello: 'world' };

    await cache.write(key, value);
    const loaded = await cache.read<typeof value>(key);

    expect(loaded).toEqual(value);
    expect(await cache.exists(key)).toBe(true);
  });

  it('returns null for non-existent key', async () => {
    const cache = new FileCache(tempDir);
    expect(await cache.read('missing-key')).toBeNull();
    expect(await cache.exists('missing-key')).toBe(false);
  });
});
