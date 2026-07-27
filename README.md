# base-token-discovery

A production-ready standalone token discovery microservice for the Base blockchain.

## Overview

`base-token-discovery` discovers, filters, ranks, caches, and serves high-quality Base trading pairs and tokens through a REST API and library exports. It is built to support future multi-chain expansion with chain adapters, provider interfaces, and pluggable cache providers.

## Features

- Discover Base trading pairs from DexScreener
- Fallback to CoinGecko when primary API fails
- Modular discovery pipeline with filters and ranking
- File-based cache with pluggable cache provider abstraction
- REST endpoints for tokens, pairs, stats, and refresh
- Library exports for embedding into other applications
- Validation with Zod
- Structured logging with Pino
- Scheduled refresh every 10 minutes
- Fully tested with Vitest and Supertest

## Architecture

- `src/api` contains HTTP clients and API providers
- `src/discovery` contains discovery orchestration and helper classes
- `src/filters` contains pair and token validation filters
- `src/ranking` computes discovery scores
- `src/cache` manages caching abstraction and persistence
- `src/services` exposes business operations to routers and library consumers
- `src/routes` contains Express route definitions with validation
- `src/utils` includes reusable helpers and error types
- `src/config` centralizes runtime configuration

## Installation

```bash
npm install
```

## Configuration

Copy `.env.example` to `.env` and update values.

Required settings:

- `PORT`: network port for Express
- `CACHE_INTERVAL`: cache refresh interval in milliseconds
- `MIN_LIQUIDITY`: minimum liquidity threshold for pairs
- `MIN_VOLUME`: minimum 24h volume threshold for pairs
- `LOG_LEVEL`: log level for Pino
- `COINGECKO_API_KEY`: optional CoinGecko API key
- `DEXSCREENER_BASE_URL`: DexScreener Base chain endpoint

## Folder structure

```text
src/
  api/
  cache/
  config/
  discovery/
  filters/
  ranking/
  routes/
  services/
  types/
  utils/
  index.ts
  server.ts

data/
tests/
```

## Running

```bash
npm run build
npm start
```

For development:

```bash
npm run dev
```

## Testing

```bash
npm test
```

## REST API

- `GET /tokens`
- `GET /pairs`
- `GET /stats`
- `GET /token/:address`
- `GET /pair/:address`
- `POST /refresh`

All endpoints return JSON and use proper HTTP status codes.

## Library usage

```ts
import discovery from '@base/token-discovery';

const tokens = await discovery.getTokens();
const pair = await discovery.getPair('0x...');
await discovery.refresh();
```

## Caching

The service persists discovery results to `data/` files via `FileCache`. A future Redis provider can be added by implementing `CacheProvider` and swapping the dependency in `CacheManager`.

## Logging

Logs are emitted with Pino and include discovery start/end, retries, cache writes, and errors.

## Discovery pipeline

1. Query DexScreener for Base pairs
2. Fallback to CoinGecko when DexScreener is unavailable
3. Normalize pair and token data
4. Deduplicate and validate addresses
5. Apply liquidity, volume, scam, and DEX filters
6. Rank results using configurable weights
7. Cache tokens, pairs, and stats

## Future extension

- Add Ethereum, Arbitrum, Optimism, Polygon, BNB Chain, Avalanche adapters
- Add Redis cache provider and distributed coordination
- Add additional DEX strategy recognizers
- Add pagination, filtering, and search to REST API

## Contributing

Contributions are welcome. Please open issues or pull requests for bug fixes, new adapters, or caching enhancements.

## License

MIT
