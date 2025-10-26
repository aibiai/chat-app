import axios from 'axios';
const isDev = import.meta.env?.DEV;
const baseURL = isDev ? '/' : ((import.meta.env?.VITE_API_URL) || '/');
const api = axios.create({ baseURL });
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
export default api;
