import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig, type Plugin, type PluginOption } from 'vite';

function tokensToVars(pathToJson: string): PluginOption {
  let json;

  return <Plugin>{
    name: 'tokensToVars',
    buildStart() {
      const filePath = path.resolve(pathToJson);
      const contents = fs.readFileSync(filePath, 'utf-8');
      json = JSON.parse(contents);
      const tokens = Object.entries(json).map(([key, value]) => {
        const varName = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        return `${varName}: ${value};`;
      });

      const tokensContent = `:root {
  ${tokens.join('\n  ')}
}`;
      try {
        fs.openSync(path.resolve('./src/tokens.css'), 'w+');

        fs.writeFileSync(path.resolve('./src/tokens.css'), tokensContent);
      } catch (error) {
        console.error('Error creating tokens.css file:', error);
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tokensToVars('./tokens.json')],
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
