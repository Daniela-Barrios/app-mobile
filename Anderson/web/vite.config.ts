import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        // En Docker, docker-compose.yml define VITE_API_TARGET=http://mock-api:4000
        // Fuera de Docker (npm run dev directo), usa localhost.
        target: process.env.VITE_API_TARGET ?? 'http://localhost:4000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
