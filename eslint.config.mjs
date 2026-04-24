import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  // Ignore build outputs
  { ignores: ['**/dist/**', '**/node_modules/**', '**/.expo/**', '**/migrations/**'] },

  // Base JS rules
  js.configs.recommended,

  // TypeScript rules
  ...tseslint.configs.recommended,

  // React Hooks rules (mobile only)
  {
    files: ['apps/mobile/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // Project-wide overrides
  {
    rules: {
      // Allow unused vars prefixed with _
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Allow any in specific cases (API error handling)
      '@typescript-eslint/no-explicit-any': 'warn',
      // No console in production code
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // Prefer const
      'prefer-const': 'error',
      // No var
      'no-var': 'error',
      // Allow empty catch blocks (intentional in our codebase)
      'no-empty': ['error', { allowEmptyCatch: true }],
      // Allow constant && expressions (used for conditional rendering)
      'no-constant-binary-expression': 'off',
      // Allow require() in NestJS (decorator metadata)
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // Relaxed rules for config/seed files
  {
    files: ['**/*.config.*', '**/seed.ts', '**/drizzle.config.ts'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
