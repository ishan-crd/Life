const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const tseslint = require('typescript-eslint');

module.exports = defineConfig([
  expoConfig,
  ...tseslint.configs.recommended,
  {
    ignores: ['dist/*', 'docs/*', '.expo/*', 'eslint.config.js', 'babel.config.js', 'metro.config.js'],
  },
  {
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Reanimated shared values are mutable by design — `sv.value = x` inside a
      // worklet is the documented API, not a render-phase mutation.
      'react-hooks/immutability': 'off',
    },
  },
]);
