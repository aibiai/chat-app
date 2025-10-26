import axios from 'axios';
// 开发环境一律走相对路径，让 Vite 代理至 http://localhost:3003；生产再使用 VITE_API_URL（如配置）
const isDev = (import.meta as any).env?.DEV;
const baseURL = isDev ? '/' : ((import.meta as any).env?.VITE_API_URL || '/');
// 统一设置超时，避免慢接口拖垮首屏；可以按需在单个请求里覆盖
const api = axios.create({ baseURL, timeout: 8000 });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
