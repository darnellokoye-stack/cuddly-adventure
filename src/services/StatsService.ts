import { DiscoveryService } from './DiscoveryService.js';

/**
 * Service for statistics retrieval operations.
 */
export class StatsService {
  private readonly discovery = new DiscoveryService();

  async summary(): Promise<Record<string, number | string>> {
    return this.discovery.getStats();
  }
}
