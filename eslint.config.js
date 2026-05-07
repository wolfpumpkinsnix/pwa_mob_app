import { defineConfig } from 'eslint/config';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default defineConfig([
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
      'no-undef': 'off',
    },
  },
  {
    // Disable type-aware linting for config files
    files: ['*.config.ts', 'eslint.config.js'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    ignores: ['dist/', 'node_modules/', 'dev-dist/', '.yarn/'],
  }
]);
