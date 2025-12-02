import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    projects: [
      {
        test: {
          name: '@milgnss/socket',
          root: './apps/socket',
          environment: 'node',
        },
      },
      {
        test: {
          name: '@milgnss/web',
          root: './apps/web',
          environment: 'jsdom',
        },
      },
      {
        test: {
          name: '@milgnss/utils',
          root: './packages/utils',
          environment: 'jsdom',
        },
      },
    ],
  },
});
