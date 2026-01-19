import type { Config } from "tailwindcss";

const config: Config = {
  // AGREGA ESTA LÍNEA AQUÍ AL PRINCIPO
  darkMode: 'selector', 
  
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;