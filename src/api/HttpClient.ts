import axios, { AxiosInstance } from 'axios';
import { withRetry } from '../utils/retry.js';
import { logger } from '../utils/logger.js';

export interface HttpClientOptions {
  timeoutMs?: number;
}

/**
 * HTTP client wrapper for API requests with retry support.
 */
export class HttpClient {
  private client: AxiosInstance;

  constructor(options: HttpClientOptions = {}) {
    this.client = axios.create({
      timeout: options.timeoutMs ?? 10000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    });
  }

  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    return withRetry(async () => {
      logger.info({ url, params }, 'HTTP GET request');
      const response = await this.client.get<T>(url, { params });
      return response.data;
    });
  }
}
