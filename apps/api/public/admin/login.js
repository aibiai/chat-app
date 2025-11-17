const form = document.querySelector('#admin-login-form');
const messageEl = document.querySelector('#login-message');

function showMessage(text, type = 'error') {
  if (!messageEl) return;
  messageEl.textContent = text;
  messageEl.dataset.type = type;
  messageEl.hidden = false;
}

function clearMessage() {
  if (!messageEl) return;
  messageEl.textContent = '';
  messageEl.hidden = true;
  delete messageEl.dataset.type;
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearMessage();

  const formData = new FormData(form);
  const payload = {
    username: formData.get('username')?.toString().trim(),
    password: formData.get('password')?.toString() ?? ''
  };

  if (!payload.username || !payload.password) {
    showMessage('请填写用户名和密码。');
    return;
  }

  try {
    const res = await fetch('/admin/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const code = data?.error || '登录失败';
      if (code === 'UNAUTHORIZED') {
        showMessage('用户名或密码不正确。');
      } else if (code === 'INVALID_PAYLOAD') {
        showMessage('提交数据缺失或格式错误。');
      } else {
        showMessage('登录失败，请稍后重试。');
      }
      return;
    }

    const data = await res.json();
    if (data?.token) {
      localStorage.setItem('admin_token', data.token);
  localStorage.setItem('admin_profile', JSON.stringify(data.admin || {}));
  localStorage.setItem('admin_permissions', JSON.stringify(data.admin?.permissions || []));
      showMessage('登录成功，正在进入后台...', 'success');
      setTimeout(() => {
        window.location.href = '/admin/dashboard';
      }, 600);
    } else {
      showMessage('登录成功，但未获取凭据，请联系管理员。');
    }
  } catch (err) {
    console.error(err);
    showMessage('网络异常，请稍后重试。');
  }
});
