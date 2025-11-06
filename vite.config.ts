/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    projects: ['apps/*'],
  },
  build: {
    target: 'esnext',
    sourcemap: true,
  },
  worker: {
    format: 'es',
  },
  optimizeDeps: {},
});
