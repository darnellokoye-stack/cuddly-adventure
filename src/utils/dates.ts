/**
 * Returns the current UTC timestamp in ISO format.
 */
export function nowIso(): string {
  return new Date().toISOString();
}
