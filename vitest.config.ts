import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'socket',
          root: './apps/socket',
          environment: 'node',
          // setupFiles: ['./apps/socket/vitest.config.ts'],
        },
      },
      {
        test: {
          name: 'web',
          root: './apps/web',
          environment: 'jsdom',
          setupFiles: ['./apps/web/vitest.config.ts'],
        },
      },
    ],
  },
});
