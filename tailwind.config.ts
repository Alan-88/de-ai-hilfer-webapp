/** @type {import('tailwindcss').Config} */
import typography from '@tailwindcss/typography';
import forms from '@tailwindcss/forms';

export default {
  content: ['./src/**/*.{html,js,svelte,ts}'], // <-- 确保这行内容正确
  theme: {
    extend: {},
  },
  plugins: [
    typography, // <-- 确保插件在这里
    forms,      // <-- 确保插件在这里
  ],
};
