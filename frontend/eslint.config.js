import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

/**
 * Rules that encode a decision (ADR, manifesto law, security) are `error`.
 * Rules covering pre-existing debt are `warn` so the gate stays on rather than
 * being switched off.
 */
export default tseslint.config(
  { ignores: ['dist', 'coverage', '**/*.d.ts', 'public/**'] },

  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },

  // TypeScript — the actual application, previously unlinted.
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'none',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',

      // Retired Flask-era client; also reads auth material from localStorage.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react-ga*',
                'mixpanel*',
                '@segment/*',
                'posthog*',
                'amplitude*',
              ],
              message:
                'Third-party behavioural trackers are forbidden in member surfaces (L9, ADR-0004).',
            },
          ],
        },
      ],

      // Interruptive notifications are architecturally forbidden (L4, ADR-0004).
      'no-restricted-globals': [
        'error',
        {
          name: 'Notification',
          message:
            'Push/interruptive notifications are forbidden (L4, ADR-0004). Signals are pull-based and ambient.',
        },
      ],
    },
  },

  {
    files: ['**/*.{test,spec}.{ts,tsx}', 'src/test/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // Context/provider files co-locate hooks with their providers — standard React pattern.
  {
    files: [
      'src/shared/contexts/**',
      'src/organism/OrganismContext.tsx',
      'src/content/editable/SiteContentProvider.tsx',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
)
