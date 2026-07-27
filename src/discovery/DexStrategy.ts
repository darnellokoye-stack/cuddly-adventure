/**
 * Strategy contract for DEX recognition.
 */
export interface DexRecognitionStrategy {
  label: string;
  supports(rawDexId: string): boolean;
}

/**
 * Base strategy implementation to simplify label handling.
 */
export abstract class BaseDexStrategy implements DexRecognitionStrategy {
  abstract label: string;

  abstract supports(rawDexId: string): boolean;
}
