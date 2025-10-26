import axios from 'axios';
// ��������һ�������·������ Vite ���� http://localhost:3003��
// �����������ȶ�ȡ VITE_API_URL / VITE_API_BASE����󶵵�Ϊ���� API ����
const env = (import.meta as any).env || {};
const isDev = !!env.DEV;
const baseURL = isDev
  ? '/'
  : env.VITE_API_URL || env.VITE_API_BASE || 'https://chat-app-mwu5.onrender.com';
// ͳһ���ó�ʱ���������ӿ��Ͽ����������԰����ڵ��������︲��
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