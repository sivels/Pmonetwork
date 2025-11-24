const nextConfig = require('eslint-config-next');
module.exports = [
  // include Next's recommended config first (spread if it's an array)
  ...(Array.isArray(nextConfig) ? nextConfig : [nextConfig]),
  {
    files: ['**/*.{js,jsx}'],
    rules: {
      'jsx-a11y/anchor-is-valid': ['error', { aspects: ['invalidHref'] }],
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/no-autofocus': 'warn',
      'jsx-a11y/heading-has-content': 'error'
    }
  }
];
