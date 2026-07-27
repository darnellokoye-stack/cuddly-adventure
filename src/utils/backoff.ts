/**
 * Calculate exponential backoff delay with jitter.
 */
export function backoff(attempt: number, minMs = 100, maxMs = 2000): number {
  const ceiling = Math.min(maxMs, minMs * 2 ** attempt);
  const jitter = Math.random() * ceiling * 0.25;
  return Math.round(ceiling * 0.75 + jitter);
}
