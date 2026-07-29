import type { Options } from 'tsup';

export default {
  entry: ['src/index.ts', 'src/server.ts'],
  format: ['esm'],
  dts: true,
  outDir: 'dist',
  target: 'es2020',
  clean: true,
  esbuildOptions(options) {
    options.resolveExtensions = ['.ts', '.js'];
  }
} as Options;
