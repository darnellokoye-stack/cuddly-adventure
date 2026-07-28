import { BaseProvider } from './BaseProvider.js';
import { logger } from '../../utils/logger.js';

/**
 * Registry for managing discovery providers.
 * Allows dynamic provider registration and lookup.
 */
export class ProviderRegistry {
  private providers = new Map<string, BaseProvider>();

  /**
   * Register a provider.
   */
  register(provider: BaseProvider): void {
    this.providers.set(provider.getId(), provider);
    logger.debug({ providerId: provider.getId(), name: provider.getName() }, 'Provider registered');
  }

  /**
   * Unregister a provider.
   */
  unregister(providerId: string): void {
    this.providers.delete(providerId);
    logger.debug({ providerId }, 'Provider unregistered');
  }

  /**
   * Get a provider by ID.
   */
  get(providerId: string): BaseProvider | undefined {
    return this.providers.get(providerId);
  }

  /**
   * Get all registered providers.
   */
  getAll(): BaseProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get provider IDs ordered by priority (registration order).
   */
  getProviderIds(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Check if a provider is registered.
   */
  has(providerId: string): boolean {
    return this.providers.has(providerId);
  }

  /**
   * Clear all providers.
   */
  clear(): void {
    this.providers.clear();
  }
}
