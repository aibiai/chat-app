import axios from 'axios';

const env = import.meta.env ?? {};
const isDev = Boolean(env?.DEV);
const explicitBase = (env?.VITE_API_URL || env?.VITE_API_BASE || '').toString().trim();
const preferProxy = String(env?.VITE_API_PROXY || '').toLowerCase() === 'true';
const fallbackProd = env?.VITE_FALLBACK_API || 'https://chat-app-mwu5.onrender.com';

function resolveProtocol() {
  if (typeof window !== 'undefined' && window.location?.protocol?.startsWith('https')) {
    return 'https:';
  }
  return 'http:';
}

function resolveHost() {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return window.location.hostname;
  }
  return 'localhost';
}

function normalizeBase(input) {
  const trimmed = (input || '').trim();
  if (!trimmed) return '';
  if (trimmed === '/') return '/';
  const sanitized = trimmed.replace(/\/+$/, '');
  if (/^https?:\/\//i.test(sanitized)) return sanitized;
  if (sanitized.startsWith('//')) return `${resolveProtocol()}${sanitized}`;
  if (sanitized.startsWith('/')) return sanitized || '/';
  return `${resolveProtocol()}//${sanitized}`;
}

const computedBase = (() => {
  if (explicitBase) return normalizeBase(explicitBase);
  if (isDev && preferProxy) return '/';
  if (isDev) {
    const port = env?.VITE_API_PORT || '3004';
    return `${resolveProtocol()}//${resolveHost()}:${port}`;
  }
  return normalizeBase(fallbackProd);
})();

export const API_BASE_URL = computedBase === '/' ? '/' : normalizeBase(computedBase || fallbackProd);

export const API_ORIGIN = (() => {
  if (API_BASE_URL === '/') {
    if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
    return `${resolveProtocol()}//${resolveHost()}`;
  }
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return `${resolveProtocol()}//${resolveHost()}`;
  }
})();

const api = axios.create({ baseURL: API_BASE_URL, timeout: 8000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
