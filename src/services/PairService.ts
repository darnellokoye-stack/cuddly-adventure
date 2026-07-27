import { DiscoveryService } from './DiscoveryService.js';
import { Pair } from '../types/Pair.js';

/**
 * Service for pair retrieval operations.
 */
export class PairService {
  private readonly discovery = new DiscoveryService();

  async list(): Promise<Pair[]> {
    return this.discovery.getPairs();
  }

  async find(address: string): Promise<Pair | null> {
    return this.discovery.getPair(address);
  }
}
