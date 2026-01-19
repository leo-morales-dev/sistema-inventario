/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    // Fíjate que aquí cambió el nombre:
    '@tailwindcss/postcss': {}, 
    autoprefixer: {},
  },
};

export default config;