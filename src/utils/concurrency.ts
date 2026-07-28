/**
 * Map input values through an async mapper with a maximum concurrency.
 */
export async function mapWithConcurrency<T, U>(
  inputs: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<U>
): Promise<U[]> {
  const results: U[] = new Array(inputs.length);
  let currentIndex = 0;

  async function worker(): Promise<void> {
    while (currentIndex < inputs.length) {
      const index = currentIndex;
      currentIndex += 1;
      results[index] = await mapper(inputs[index], index);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, inputs.length) }, () => worker());
  await Promise.all(workers);
  return results;
}
