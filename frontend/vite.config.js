import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// During development the React dev server runs on :3000 and proxies any
// request starting with /api to the FastAPI backend on :8000. This means
// the frontend code can just call "/api/..." with no CORS headaches.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
