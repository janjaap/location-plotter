import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@components': path.join(__dirname, './src/components'),
      '@hooks': path.join(__dirname, './src/hooks'),
      '@lib': path.join(__dirname, './src/lib'),
      '@providers': path.join(__dirname, './src/providers'),
      '@types': path.join(__dirname, './src/types'),
    },
  },
});
