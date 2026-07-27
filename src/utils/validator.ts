import { z } from 'zod';

/**
 * Validate runtime objects using a Zod schema.
 */
export function validateSchema<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new Error(result.error.message);
  }
  return result.data;
}
