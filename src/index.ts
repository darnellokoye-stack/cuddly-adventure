import { DiscoveryService } from './services/DiscoveryService.js';

const discoveryService = new DiscoveryService();

/**
 * Retrieves all discovered tokens.
 */
export async function getTokens() {
  return discoveryService.getTokens();
}

/**
 * Retrieves all discovered pairs.
 */
export async function getPairs() {
  return discoveryService.getPairs();
}

/**
 * Retrieves discovery statistics.
 */
export async function getStats() {
  return discoveryService.getStats();
}

/**
 * Triggers a discovery refresh cycle.
 */
export async function refresh() {
  return discoveryService.refresh();
}

/**
 * Retrieves a single token by address.
 */
export async function getToken(address: string) {
  return discoveryService.getToken(address);
}

/**
 * Retrieves a single pair by address.
 */
export async function getPair(address: string) {
  return discoveryService.getPair(address);
}

export default {
  getTokens,
  getPairs,
  getStats,
  refresh,
  getToken,
  getPair
};
