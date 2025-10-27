import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3201, // Explicitly set the frontend port
    host: '0.0.0.0',
    proxy: {
      // Proxy API requests to avoid CORS issues in development
      '/api': {
        target: 'http://localhost:6201',
        changeOrigin: true,
        secure: false,
        // rewrite: (path) => path.replace(/^\/api/, ''), // Optional: remove /api prefix
      },
      // Proxy auth routes
      '/auth': {
        target: 'http://localhost:6201',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
