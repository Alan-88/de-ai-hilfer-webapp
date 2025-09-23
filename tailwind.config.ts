/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'], // <-- 确保这行内容正确
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'), // <-- 确保插件在这里
    require('@tailwindcss/forms'),      // <-- 确保插件在这里
  ],
};