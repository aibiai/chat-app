// 通用请求封装：自动附带管理员 token，统一错误处理
export async function adminRequest(url, options = {}) {
  const token = localStorage.getItem('admin_token') || '';
  const headers = Object.assign({}, options.headers || {}, {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  });
  const final = Object.assign({}, options, { headers });
  try {
    const resp = await fetch(url, final);
    if (resp.status === 401) {
      alert('登录状态已失效，请重新登录');
      localStorage.removeItem('admin_token');
      location.replace('/admin/login');
      return Promise.reject(new Error('UNAUTHORIZED'));
    }
    if (resp.status === 403) {
      alert('没有权限执行该操作');
      return Promise.reject(new Error('FORBIDDEN'));
    }
    if (resp.status === 422) {
      const data = await resp.json().catch(()=>({}));
      alert(data.message || '提交数据验证失败');
      return Promise.reject(new Error('UNPROCESSABLE'));
    }
    let data; try { data = await resp.json(); } catch { data = null; }
    if (!resp.ok) {
      const errCode = (data && data.error) || `HTTP_${resp.status}`;
      return Promise.reject(Object.assign(new Error(errCode), { code: errCode, response: resp, data }));
    }
    return data;
  } catch (e) {
    console.error('[adminRequest] error', e);
    if (!navigator.onLine) alert('网络连接异常，请检查网络');
    throw e;
  }
}

export const adminGet = (url) => adminRequest(url, { method: 'GET' });
export const adminPost = (url, body) => adminRequest(url, { method: 'POST', body: JSON.stringify(body) });
export const adminPut = (url, body) => adminRequest(url, { method: 'PUT', body: JSON.stringify(body) });
