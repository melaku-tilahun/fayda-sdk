import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.js'],
  format: ['cjs', 'esm'],
  dts: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['jose', 'axios'],
});
