import type { Config } from 'tailwindcss';
import { bolivarPreset } from './src/shared/config/tailwind.preset';

const config: Config = {
  presets: [bolivarPreset],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
