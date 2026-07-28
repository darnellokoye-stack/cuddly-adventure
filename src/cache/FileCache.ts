import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { CacheProvider } from './CacheProvider.js';
import { CachePayload } from '../types/Cache.js';
import { logger } from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDirectory = path.join(__dirname, '../../data');

/**
 * File-based cache implementation.
 */
export class FileCache implements CacheProvider {
  constructor(private readonly root = dataDirectory) {}

  async read<T>(key: string): Promise<T | null> {
    const filePath = this.resolvePath(key);
    try {
      const raw = await fs.readFile(filePath, 'utf-8');
      const payload = JSON.parse(raw) as CachePayload<T>;
      return payload.data;
    } catch (error) {
      logger.debug({ filePath, error }, 'Cache read failed, returning null');
      return null;
    }
  }

  async write<T>(key: string, value: T): Promise<void> {
    await fs.mkdir(this.root, { recursive: true });
    const filePath = this.resolvePath(key);
    const payload: CachePayload<T> = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: value
    };
    await fs.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf-8');
  }

  async exists(key: string): Promise<boolean> {
    try {
      const filePath = this.resolvePath(key);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private resolvePath(key: string): string {
    return path.join(this.root, `${key}.json`);
  }
}
