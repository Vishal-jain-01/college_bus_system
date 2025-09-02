import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js',
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        sw: 'public/sw.js'
      }
    }
  },
  server: {
    // Ensure service worker is served with correct MIME type
    headers: {
      'Service-Worker-Allowed': '/'
    }
  }
})
