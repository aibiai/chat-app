import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: Number(process.env.VITE_PORT || 5173),
    host: true,
    open: true,
    proxy: {
      // 本地开发将 /api 与 /static 代理到后端（API 默认 3003 端口），避免 CORS
      '/api': {
        target: 'http://localhost:3003',
        changeOrigin: true
      },
      '/static': {
        target: 'http://localhost:3003',
        changeOrigin: true
      }
      ,
      '/socket.io': {
        target: 'http://localhost:3003',
        ws: true,
        changeOrigin: true
      }
    }
  }
});
