module.exports = {
  parserOptions: {
    sourceType: 'script', // module
    ecmaVersion: 6,
    ecmaFeatures: {
      jsx: true,
      experimentalObjectRestSpread: true,
    },
  },

  rules: {
    // Errors
    'indent': [2, 2],
    'quotes': [2, 'single'],
    'linebreak-style': [2, 'unix'],
    'semi': [2, 'always'],
    'strict': [2, 'global'],
    'keyword-spacing': 2,

    'comma-dangle': [2, 'always-multiline'],
    'no-console': [2, { allow: ['warn', 'error', 'info'] }],
    'no-var': 2,
    'no-unused-vars': 2,
    'prefer-const': 2,
    'object-shorthand': 2,

    'react/jsx-uses-react': 2,
    'react/jsx-uses-vars': 2,
  },

  env: {
    es6: true,
    node: true,
  },

  extends: [
    'eslint:recommended',
  ],

  plugins: [
    'react',
  ],

  globals: {},
};
