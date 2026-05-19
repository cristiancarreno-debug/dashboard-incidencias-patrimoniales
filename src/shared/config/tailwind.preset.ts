import type { Config } from 'tailwindcss';

/**
 * Preset corporativo Seguros Bolívar para Tailwind CSS.
 *
 * Define la paleta de colores institucional, tipografía Inter,
 * border-radius y sombras estándar para la plataforma patrimoniales.
 *
 * @example
 * ```ts
 * // tailwind.config.ts
 * import { bolivarPreset } from './src/shared/config/tailwind.preset';
 * const config: Config = { presets: [bolivarPreset], content: [...] };
 * ```
 */
export const bolivarPreset: Config = {
  content: [],
  theme: {
    extend: {
      colors: {
        bolivar: {
          50: '#E6F7ED',
          100: '#CCF0DB',
          200: '#99E1B7',
          300: '#66D293',
          400: '#33C36F',
          500: '#00A651',
          600: '#008C44',
          700: '#007A3D',
          800: '#005C2E',
          900: '#003D1F',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#F8FAFB',
          tertiary: '#F1F5F9',
        },
        content: {
          primary: '#1F2937',
          secondary: '#6B7280',
          tertiary: '#9CA3AF',
        },
        border: {
          DEFAULT: '#E5E7EB',
          strong: '#D1D5DB',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
        navbar: '0 1px 3px 0 rgb(0 0 0 / 0.06)',
      },
    },
  },
  plugins: [],
};
