import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import globals from 'globals';

export default defineConfig([
  { 
    files: ['**/*.js'], 
    plugins: { js }, 
    extends: ['js/recommended'], 
    languageOptions: { globals: {
      ...globals.browser,
      ...globals.node,
      ...globals.jest,
      } 
    }, 
    rules: { // custom eslint rules
      'no-unused-vars': 'warn',
      'no-undef': 'warn',
      'eol-last': ['error', 'always'],
      'no-console': 'off',
      'indent': ['error', 2],
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
    } 
  },
  { files: ['**/*.js'], languageOptions: { sourceType: 'commonjs' } },
]);
