import { DexRecognitionStrategy, BaseDexStrategy } from './DexStrategy.js';

class ExactMatchStrategy extends BaseDexStrategy {
  constructor(public label: string, private readonly match: string) {
    super();
  }

  supports(rawDexId: string): boolean {
    return rawDexId.toLowerCase() === this.match.toLowerCase();
  }
}

class ContainsStrategy extends BaseDexStrategy {
  constructor(public label: string, private readonly keyword: string) {
    super();
  }

  supports(rawDexId: string): boolean {
    return rawDexId.toLowerCase().includes(this.keyword.toLowerCase());
  }
}

const strategies: DexRecognitionStrategy[] = [
  new ExactMatchStrategy('Aerodrome', 'aerodrome'),
  new ContainsStrategy('Uniswap V3', 'uniswap'),
  new ContainsStrategy('PancakeSwap', 'pancakeswap'),
  new ContainsStrategy('SushiSwap', 'sushiswap'),
  new ContainsStrategy('BaseSwap', 'baseswap'),
  new ContainsStrategy('Alien Base', 'alien base')
];

/**
 * Registry that resolves raw DEX identifiers to normalized labels.
 */
export class DexStrategyRegistry {
  constructor(private readonly strategiesList = strategies) {}

  recognize(rawDexId: string): string {
    const normalized = rawDexId.toLowerCase();
    const strategy = this.strategiesList.find((entry) => entry.supports(normalized));
    return strategy?.label ?? rawDexId;
  }
}
