import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  worker: {
    format: 'es',
  },
  build: {
    target: 'es2020',
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://pdf-compress-backend.onrender.com',
        changeOrigin: true,
      },
    },
  },
})
