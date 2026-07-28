import { HttpClient } from '../HttpClient.js';
import { BaseProvider, NormalizedResponse, NormalizedPair } from './BaseProvider.js';
import { logger } from '../../utils/logger.js';

/**
 * GeckoTerminal provider for additional pair discovery.
 * Fetches Base chain data from GeckoTerminal API.
 * 
 * Note: Integrate with actual GeckoTerminal API when credentials available.
 * Currently returns empty pairs to prevent blocking.
 */
export class GeckoTerminalProvider extends BaseProvider {
  private readonly httpClient: HttpClient;
  private readonly baseUrl = 'https://api.geckoterminal.com/api/v2/networks/base';
  private readonly enabled: boolean;

  constructor(httpClient?: HttpClient, enabled: boolean = false) {
    super('geckoterminal', 'GeckoTerminal');
    this.httpClient = httpClient ?? new HttpClient({ timeoutMs: 12000 });
    this.enabled = enabled;
  }

  async fetchPairs(): Promise<NormalizedResponse> {
    if (!this.enabled) {
      logger.trace({ providerId: this.providerId }, 'GeckoTerminal provider disabled');
      return {
        pairs: [],
        providerId: this.providerId,
        fetchedAt: new Date().toISOString()
      };
    }

    try {
      // TODO: Implement actual GeckoTerminal API integration
      // Placeholder for future implementation
      logger.debug(
        { providerId: this.providerId, baseUrl: this.baseUrl },
        'GeckoTerminal provider stub - API integration pending'
      );

      return {
        pairs: [],
        providerId: this.providerId,
        fetchedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.warn({ providerId: this.providerId, error }, 'GeckoTerminal provider fetch failed');
      throw error;
    }
  }

  /**
   * Enable GeckoTerminal provider when API credentials are available.
   */
  enable(): void {
    (this as any).enabled = true;
    logger.info({ providerId: this.providerId }, 'Provider enabled');
  }

  /**
   * Disable GeckoTerminal provider.
   */
  disable(): void {
    (this as any).enabled = false;
  }

  /**
   * Check if provider is enabled.
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}
