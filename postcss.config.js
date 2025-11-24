// Ensure we prefer the native lightningcss binary when running under Turbopack/PostCSS
// This avoids a missing `../pkg` wasm package error in some environments.
// Use Tailwind v3 postcss plugin to avoid lightningcss/pkg issues in this environment.
process.env.CSS_TRANSFORMER_WASM = process.env.CSS_TRANSFORMER_WASM || '';

module.exports = {
  plugins: [
    require('tailwindcss'),
    require('autoprefixer'),
  ],
}
