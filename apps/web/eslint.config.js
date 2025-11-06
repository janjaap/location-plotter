// import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// const compat = new FlatCompat();

export default defineConfig([
  // compat({
  //   extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  // }),
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      'no-console': ['error', { allow: ['error'] }],
      '@stylistic/multiline-ternary': ['error', 'always-multiline'],
      '@stylistic/jsx-first-prop-new-line': ['error', 'multiline'],
      '@stylistic/type-annotation-spacing': ['error'],
    },
  },
]);
