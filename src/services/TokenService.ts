import { DiscoveryService } from './DiscoveryService.js';
import { Token } from '../types/Token.js';

/**
 * Service for token retrieval operations.
 */
export class TokenService {
  private readonly discovery = new DiscoveryService();

  async list(): Promise<Token[]> {
    return this.discovery.getTokens();
  }

  async find(address: string): Promise<Token | null> {
    return this.discovery.getToken(address);
  }
}
