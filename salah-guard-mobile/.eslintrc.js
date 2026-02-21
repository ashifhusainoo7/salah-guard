module.exports = {
  root: true,
  extends: [
    '@react-native',
    'airbnb',
    'airbnb-typescript',
    'plugin:react-hooks/recommended',
    'plugin:react-native/all',
    'prettier',
  ],
  plugins: ['react', 'react-native', 'react-hooks', 'prettier'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    'prettier/prettier': 'error',
    'react/react-in-jsx-scope': 'off',
    'react/require-default-props': 'off',
    'react/jsx-props-no-spreading': 'off',
    'import/prefer-default-export': 'off',
    'react-native/no-raw-text': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': 'error',
  },
  ignorePatterns: ['node_modules/', 'android/', 'ios/', '*.config.js'],
};
