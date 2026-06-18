import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier/flat'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['build', 'coverage', 'node_modules']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      react.configs.flat['jsx-runtime'],
      jsxA11y.flatConfigs.recommended,
      reactHooks.configs.flat.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'max-lines': ['error', { max: 500, skipBlankLines: true, skipComments: true }],
      'no-console': 'error',
      'no-debugger': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
  {
    files: ['src/components/ui/label.tsx'],
    rules: {
      // Reusable label + `htmlFor`; control often lives in another component (e.g. FieldInput), so static analysis cannot prove the association.
      'jsx-a11y/label-has-associated-control': 'off',
    },
  },
  {
    files: ['src/components/ui/tooltip.tsx'],
    rules: {
      // Portal tooltip: positioning effect intentionally mirrors trade-harmonizer (deps are stable via refs + layout pass).
      'react-hooks/exhaustive-deps': 'off',
      // Trigger wraps arbitrary children (icons, text); keyboard access is via hover/focus patterns matching the TH tooltip.
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
    },
  },
  {
    files: ['**/*.test.tsx', '**/*.spec.tsx'],
    rules: {
      'max-lines': 'off',
      'no-console': 'off',
    },
  },
  eslintConfigPrettier,
])
