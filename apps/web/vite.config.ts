import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: Number(process.env.VITE_PORT || 5173),
    host: true,
    open: true,
    proxy: {
      // Proxy API requests and static assets to the backend (default port 3004) to avoid CORS during local development
      '/api': {
        target: 'http://localhost:3004',
        changeOrigin: true
      },
      '/static': {
        target: 'http://localhost:3004',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:3004',
        ws: true,
        changeOrigin: true
      }
    }
  }
});
