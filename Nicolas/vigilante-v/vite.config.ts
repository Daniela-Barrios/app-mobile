import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5174,
    proxy: {
      // Mismo mock-api que usa el dashboard (Anderson/web/vite.config.ts):
      // el kiosco y el dashboard son dos clientes del mismo backend.
      '/api': {
        // En Docker, docker-compose.yml (raíz) define VITE_API_TARGET=http://mock-api:4000.
        // Fuera de Docker (npm run dev directo), usa localhost.
        target: process.env.VITE_API_TARGET ?? 'http://localhost:4000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
