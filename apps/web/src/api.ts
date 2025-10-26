import axios from 'axios';
// 开发环境一律走相对路径，让 Vite 代理到 http://localhost:3003；
// 生产环境优先读取 VITE_API_URL / VITE_API_BASE，最后兜底为线上 API 域名
const env = (import.meta as any).env || {};
const isDev = !!env.DEV;
const baseURL = isDev
  ? '/'
  : env.VITE_API_URL || env.VITE_API_BASE || 'https://chat-app-mwu5.onrender.com';
// 统一设置超时，避免慢接口拖垮首屏；可以按需在单个请求里覆盖
const api = axios.create({ baseURL, timeout: 8000 });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = Bearer ;
  }
  return config;
});

export default api;