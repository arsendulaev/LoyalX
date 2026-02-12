import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vite.dev/config/
export default defineConfig({
  base: '/LoyalX/', // Базовый путь для GitHub Pages
  plugins: [
    react(), 
    tailwindcss(),
    nodePolyfills({
      // Включаем полифилы для Buffer и других Node.js модулей
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  server: {
    host: '0.0.0.0', // Разрешаем доступ из сети
    port: 5173, // Фиксируем порт
    strictPort: true, // Не пытаться использовать другой порт
  },
});
