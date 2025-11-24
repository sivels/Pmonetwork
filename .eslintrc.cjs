module.exports = {
  extends: ['next', 'next/core-web-vitals'],
  plugins: ['jsx-a11y', 'react'],
  rules: {
    // Enable jsx-a11y recommended rules
    'jsx-a11y/anchor-is-valid': ['error', { aspects: ['invalidHref'] }],
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/no-autofocus': 'warn',
    'jsx-a11y/heading-has-content': 'error',
    // allow Next.js pages and components to use dev-only console.logs
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }]
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
};
