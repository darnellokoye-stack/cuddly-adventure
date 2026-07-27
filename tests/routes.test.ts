import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import fs from 'fs/promises';
import path from 'path';
import app from '../src/server.js';

const dataPath = path.join(process.cwd(), 'data');
const payload = {
  version: '1.0',
  timestamp: new Date().toISOString(),
  data: []
};

beforeAll(async () => {
  await fs.mkdir(dataPath, { recursive: true });
  await fs.writeFile(path.join(dataPath, 'tokens.json'), JSON.stringify(payload, null, 2), 'utf-8');
  await fs.writeFile(path.join(dataPath, 'pairs.json'), JSON.stringify(payload, null, 2), 'utf-8');
  await fs.writeFile(
    path.join(dataPath, 'stats.json'),
    JSON.stringify({ ...payload, data: { discoveredPairs: 0, discoveredTokens: 0, minLiquidity: 5000, minVolume: 1000, lastRefreshed: new Date().toISOString() } }, null, 2),
    'utf-8'
  );
  await fs.writeFile(path.join(dataPath, 'lastUpdate.json'), JSON.stringify({ ...payload, data: { timestamp: new Date().toISOString() } }, null, 2), 'utf-8');
});

afterAll(async () => {
  await fs.rm(path.join(dataPath, 'tokens.json'), { force: true });
  await fs.rm(path.join(dataPath, 'pairs.json'), { force: true });
  await fs.rm(path.join(dataPath, 'stats.json'), { force: true });
  await fs.rm(path.join(dataPath, 'lastUpdate.json'), { force: true });
});

describe('REST API routes', () => {
  it('returns statistics from /stats', async () => {
    const response = await request(app).get('/stats');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('discoveredPairs');
  });

  it('returns 404 for unknown pair address', async () => {
    const response = await request(app).get('/pairs/0x0000000000000000000000000000000000000000');
    expect(response.status).toBe(404);
  });

  it('returns 404 for unknown token address', async () => {
    const response = await request(app).get('/tokens/0x0000000000000000000000000000000000000000');
    expect(response.status).toBe(404);
  });
});
