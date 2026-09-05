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
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('pdf-lib')) return 'pdf-lib'
          if (id.includes('pdfjs-dist')) return 'pdfjs'
          if (id.includes('qrcode')) return 'qrcode'
        },
      },
    },
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
