import type { Config } from 'tailwindcss';

// Tailwind v4: theme tokens live in globals.css @theme block.
// This file only controls content scanning paths.
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
};

export default config;
