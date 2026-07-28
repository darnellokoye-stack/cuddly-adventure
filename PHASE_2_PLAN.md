# Phase 2: Market Intelligence Engine - Implementation Plan

## Architecture Overview

### Current State
- Single provider model (DexScreener)
- Basic token/pair discovery
- Simple scoring based on liquidity, volume, age
- File-based caching
- Minimal HTTP client with retry logic
- No security integration
- No historical tracking
- Basic REST API

### Target State
- Multi-provider architecture with failover
- Provider management and health checking
- Enhanced data models with protocol, security, and holder data
- Market Opportunity Score (arbitrage-focused, not popularity)
- Historical tracking and change detection
- Security provider integration (GoPlus, Honeypot)
- Smart caching with TTL and invalidation
- Rich REST API with filtering, pagination, sorting
- Internal event system for discovery changes
- Metrics collection
- Comprehensive test coverage

## Implementation Phases

### Phase 2A: Provider Architecture (Critical Path)
1. Design provider abstraction
2. Create provider registry and manager
3. Implement health checking and failover
4. Refactor DexScreener client
5. Implement GeckoTerminal provider

### Phase 2B: Data Models (Foundational)
1. Migrate and extend Pair model
2. Migrate and extend Token model
3. Create backward-compatible schemas
4. Add serialization/validation

### Phase 2C: Discovery Improvements (Engine)
1. Multi-source provider merging
2. Detection engine (new pools, spikes, etc)
3. Historical tracking
4. Event system

### Phase 2D: Scoring & Security (Market Logic)
1. New Market Opportunity Score
2. GoPlus security integration
3. Honeypot.is integration
4. Risk scoring

### Phase 2E: API & Caching (Exposure)
1. Expand REST API
2. Implement filtering/pagination
3. Improve caching strategy
4. Cache invalidation

### Phase 2F: Metrics & Testing (Observability)
1. Metrics collection
2. Test expansion
3. Documentation

## Key Design Decisions

### 1. Provider Abstraction
```
DiscoveryProvider (existing interface)
  └─ ProviderRegistry (NEW)
       ├─ DexScreenerProvider
       ├─ GeckoTerminalProvider
       ├─ AerodromeProvider
       └─ ...

ProviderManager (NEW)
  ├─ Health checking
  ├─ Retry logic
  ├─ Priority ordering
  ├─ Statistics
  └─ Failover logic
```

### 2. Data Model Evolution
**Pair** - from:
```typescript
{
  pairAddress, dex, baseToken, quoteToken, chain,
  liquidity, volume24h, priceUsd, txns24h, score, lastUpdated
}
```

To:
```typescript
{
  // existing fields
  pairAddress, dex, baseToken, quoteToken, chain,
  liquidity, volume24h, priceUsd, txns24h, score, lastUpdated,
  
  // new fields
  router?, factory?, poolAddress?, 
  reserve0?, reserve1?, feeTier?,
  protocol?, liquiditySource?,
  createdAtBlock?, discoveredAt?,
  previousScore?, scoreChange?,
  riskLevel?, securityStatus?
}
```

**Token** - from:
```typescript
{
  symbol, name, address, chain, decimals,
  priceUsd, liquidityUsd, volume24h, fdv, marketCap,
  exchanges[], pairs[], score, lastUpdated
}
```

To:
```typescript
{
  // existing fields
  symbol, name, address, chain, decimals,
  priceUsd, liquidityUsd, volume24h, fdv, marketCap,
  exchanges[], pairs[], score, lastUpdated,
  
  // new fields
  holderCount?, creatorAddress?, deployerAddress?,
  verificationStatus?, tokenAge?, 
  buyTax?, sellTax?,
  lpLockStatus?, lpLockExpiry?,
  circulatingSupply?, totalSupply?,
  riskScore?, securityIssues?[], honeypotRisk?
  blacklistStatus?, tradingRestrictions?
}
```

### 3. Historical Tracking
Store lightweight snapshots per refresh cycle:
```
{
  timestamp,
  pairAddress,
  liquidity, volume24h, price, score
}
```

### 4. Market Opportunity Score
Replace popularity scoring with arbitrage-focused scoring:
- Liquidity depth
- Volume consistency
- Route availability (DEX coverage)
- Pool count and diversity
- Volatility
- Token age and maturity
- Holder growth rate
- Trading restrictions
- Gas efficiency

### 5. Event System
Internal EventEmitter for:
- NEW_PAIR
- NEW_TOKEN
- LIQUIDITY_SPIKE/DROP
- VOLUME_SPIKE
- HOLDER_GROWTH
- SECURITY_WARNING
- PROVIDER_FAILURE

### 6. Caching Strategy
- Configurable TTL per data type
- Stale-while-revalidate support
- Cache invalidation on events
- Cache warming for high-traffic endpoints

## File Structure

```
src/
├── api/
│   ├── DiscoveryProvider.ts (interface - extend)
│   ├── providers/ (NEW)
│   │   ├── BaseProvider.ts (abstract)
│   │   ├── DexScreenerProvider.ts
│   │   ├── GeckoTerminalProvider.ts
│   │   ├── AerodromeProvider.ts
│   │   └── ProviderRegistry.ts
│   ├── ProviderManager.ts (NEW)
│   ├── security/ (NEW)
│   │   ├── GoPlusSecurityClient.ts
│   │   ├── HoneypotClient.ts
│   │   └── SecurityAggregator.ts
│   └── DexScreenerClient.ts (keep but extend)
│
├── types/
│   ├── Pair.ts (extend)
│   ├── Token.ts (extend)
│   ├── ApiResponses.ts (extend)
│   ├── Events.ts (NEW)
│   └── Metrics.ts (NEW)
│
├── discovery/
│   ├── DiscoveryEngine.ts (extend)
│   ├── DetectionEngine.ts (NEW)
│   ├── HistoricalTracker.ts (NEW)
│   └── ProviderMerger.ts (NEW)
│
├── ranking/
│   ├── MarketOpportunityScore.ts (NEW)
│   └── ScoreCalculator.ts (keep but deprecate)
│
├── events/ (NEW)
│   ├── EventEmitter.ts
│   └── EventListener.ts
│
├── metrics/ (NEW)
│   ├── MetricsCollector.ts
│   └── MetricsService.ts
│
├── security/ (NEW)
│   ├── SecurityScorer.ts
│   └── RiskAssessment.ts
│
├── cache/
│   ├── CacheManager.ts (extend with TTL)
│   └── CacheProvider.ts (interface - extend)
│
└── routes/
    ├── pairs.ts (extend)
    ├── tokens.ts (extend)
    └── search.ts (NEW)

tests/
├── providers/ (NEW)
├── security/ (NEW)
├── detection/ (NEW)
├── historical/ (NEW)
└── ... (expand existing)
```

## Backward Compatibility

- Existing endpoints remain unchanged
- New fields are optional with defaults
- Existing DiscoveryProvider interface is extended, not replaced
- DexScreenerClient continues to work
- Cache abstraction remains generic

## Testing Strategy

- Unit tests per provider
- Provider manager failover scenarios
- Multi-source merging logic
- Scoring algorithm validation
- Security provider integration
- Cache behavior (TTL, invalidation)
- Detection engine accuracy
- API filtering/pagination
- Event emission

## Performance Targets

- Multi-provider discovery < 5s (with fallback)
- Single provider < 2s
- Cache hit rate > 80% for repeated requests
- Scoring < 50ms per pair
- Security check < 100ms per token (cached)
- Full refresh cycle < 30s

## Success Criteria

1. ✅ Multi-source discovery working with failover
2. ✅ Enhanced data models in use
3. ✅ Market Opportunity Score implemented
4. ✅ Security integrations working (or marked as unavailable on API fail)
5. ✅ Historical tracking enabling change detection
6. ✅ Event system triggering on discoveries
7. ✅ Tests passing with Phase 2 coverage
8. ✅ Documentation updated
9. ✅ Build passing
10. ✅ Lint passing
11. ✅ Backward compatibility maintained
12. ✅ No arbitrage execution or WebSockets

## Milestones

- **Milestone 1**: Provider architecture + DexScreener refactored
- **Milestone 2**: GeckoTerminal + multi-source merging working
- **Milestone 3**: Data models extended + historical tracking
- **Milestone 4**: Market Opportunity Score + security APIs
- **Milestone 5**: API, caching, metrics, tests complete
- **Milestone 6**: Documentation, production review

