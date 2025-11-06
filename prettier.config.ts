import { type Config } from 'prettier';

const config: Config = {
  bracketSameLine: true,
  endOfLine: 'auto',
  parser: 'typescript',
  printWidth: 100,
  semi: true,
  singleAttributePerLine: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all',
  useTabs: false,
};

export default config;
