const nameEl = document.querySelector('#admin-name');
const avatarEl = document.querySelector('#sidebar-avatar');
const logoutBtn = document.querySelector('#logout-btn');
const searchInput = document.querySelector('#logs-search');
const tableBody = document.querySelector('#logs-table tbody');
const checkAllEl = document.querySelector('#logs-check-all');
const infoEl = document.querySelector('#logs-info');
const pagerContainer = document.querySelector('#logs-pager');
const pageSizeSelect = document.querySelector('#logs-page-size');
const refreshBtn = document.querySelector('#logs-refresh');
const filterBtn = document.querySelector('#logs-filter');
const deleteBtn = document.querySelector('#logs-delete');
const exportBtn = document.querySelector('#logs-export');

let logs = [];

const state = {
  page: 1,
  pageSize: 10,
  keyword: '',
  username: '',
  start: '',
  end: '',
  total: 0
};

function readProfile() {
  try {
    const raw = localStorage.getItem('admin_profile');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function ensureToken() {
  const token = localStorage.getItem('admin_token');
  if (!token) {
    window.location.replace('/admin/login');
    return null;
  }
  return token;
}

function renderProfile() {
  const profile = readProfile() || {};
  if (nameEl) nameEl.textContent = profile.nickname || profile.username || '管理员';
  if (avatarEl) avatarEl.textContent = (profile.nickname || profile.username || 'A').slice(0, 1).toUpperCase();
}

function renderTable() {
  const pageData = logs;

  if (checkAllEl) checkAllEl.checked = false;

  if (pageData.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="9" class="empty">暂无日志记录</td></tr>';
  } else {
    tableBody.innerHTML = pageData
      .map(
        (item) => `
        <tr>
          <td><input type="checkbox" data-id="${item.id}" /></td>
          <td>${item.id}</td>
          <td>${item.username}</td>
          <td>${item.title}</td>
          <td>
            <div class="link-group">
              <a class="link" href="${item.url}" target="_blank" rel="noopener">${item.url}</a>
              <button class="copy-btn" data-url="${item.url}" title="复制链接">复制</button>
            </div>
          </td>
          <td>${item.ip}</td>
          <td>${item.browser}</td>
          <td>${item.createdAt}</td>
          <td>
            <div class="table-actions">
              <button class="action-btn edit" data-action="detail" data-id="${item.id}" title="详情">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 5c-7.63 0-10 7-10 7s2.37 7 10 7 10-7 10-7-2.37-7-10-7Zm0 12a5 5 0 1 1 5-5 5.006 5.006 0 0 1-5 5Zm0-8a3 3 0 1 0 3 3 3.009 3.009 0 0 0-3-3Z"/></svg>
              </button>
            </div>
          </td>
        </tr>`
      )
      .join('');
  }

  const totalPages = Math.max(1, Math.ceil(state.total / state.pageSize));
  state.page = Math.min(state.page, totalPages);
  infoEl.textContent = `显示第 ${state.page} 页 / 共 ${totalPages} 页，总计 ${state.total} 条记录`;

  const buttons = [];
  const startPage = Math.max(1, state.page - 2);
  const endPage = Math.min(totalPages, startPage + 4);
  for (let i = startPage; i <= endPage; i++) {
    buttons.push(`<button data-page="${i}" class="${i === state.page ? 'active' : ''}">${i}</button>`);
  }
  pagerContainer.innerHTML = buttons.join('');
}

async function fetchLogsFromServer() {
  const token = ensureToken();
  if (!token) return;
  const params = new URLSearchParams({
    page: String(state.page),
    pageSize: String(state.pageSize),
    keyword: String(state.keyword || ''),
    username: String(state.username || ''),
    start: String(state.start || ''),
    end: String(state.end || '')
  });
  try {
    const resp = await fetch(`/admin/api/admin-logs?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!resp.ok) {
      if (resp.status === 403) alert('权限不足：需要 auth/admin-logs 权限');
      return;
    }
    const data = await resp.json();
    if (data && Array.isArray(data.list)) {
      logs = data.list;
      state.total = Number(data.total || logs.length);
      renderTable();
    }
  } catch (e) {
    console.error(e);
  }
}

function copyToClipboard(text) {
  if (!navigator.clipboard) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return;
  }
  navigator.clipboard.writeText(text).catch(() => {});
}

function getSelectedIds() {
  return Array.from(tableBody.querySelectorAll('input[type="checkbox"]:checked')).map((item) => item.dataset.id);
}

function bindEvents() {
  searchInput?.addEventListener('input', (event) => {
    state.keyword = event.target.value;
    state.page = 1;
    fetchLogsFromServer();
  });

  pageSizeSelect?.addEventListener('change', (event) => {
    state.pageSize = Number(event.target.value);
    state.page = 1;
    fetchLogsFromServer();
  });

  pagerContainer?.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    state.page = Number(button.dataset.page);
    fetchLogsFromServer();
  });

  document.querySelectorAll('.table-pager .pager-btn').forEach((btn) =>
    btn.addEventListener('click', (event) => {
      const type = event.currentTarget.dataset.page;
      const totalPages = Math.max(1, Math.ceil(state.total / state.pageSize));
      if (type === 'prev') state.page = Math.max(1, state.page - 1);
      if (type === 'next') state.page = Math.min(totalPages, state.page + 1);
      fetchLogsFromServer();
    })
  );

  checkAllEl?.addEventListener('change', (event) => {
    const checked = event.target.checked;
    tableBody.querySelectorAll('input[type="checkbox"]').forEach((box) => {
      box.checked = checked;
    });
  });

  tableBody.addEventListener('click', (event) => {
    const copyButton = event.target.closest('.copy-btn');
    if (copyButton) {
      copyToClipboard(copyButton.dataset.url);
      copyButton.classList.add('copied');
      setTimeout(() => copyButton.classList.remove('copied'), 1500);
      return;
    }

    const actionBtn = event.target.closest('.action-btn');
    if (!actionBtn) return;
    const action = actionBtn.dataset.action;
    const id = actionBtn.dataset.id;
    if (action === 'detail') {
      alert(`查看管理员日志 #${id} 的详细信息（演示功能）`);
    }
  });

  refreshBtn?.addEventListener('click', () => {
    fetchLogsFromServer();
  });

  filterBtn?.addEventListener('click', () => {
    const start = prompt('开始日期(YYYY-MM-DD)，留空不过滤：', state.start || '') || '';
    const end = prompt('结束日期(YYYY-MM-DD)，留空不过滤：', state.end || '') || '';
    const username = prompt('操作者用户名，留空不过滤：', state.username || '') || '';
    state.start = start.trim();
    state.end = end.trim();
    state.username = username.trim();
    state.page = 1;
    fetchLogsFromServer();
  });

  if (deleteBtn) {
    deleteBtn.style.display = 'none';
  }

  exportBtn?.addEventListener('click', () => {
    const params = new URLSearchParams({
      keyword: String(state.keyword || ''),
      username: String(state.username || ''),
      start: String(state.start || ''),
      end: String(state.end || '')
    });
    const url = `/admin/api/admin-logs/export?${params.toString()}`;
    window.open(url, '_blank');
  });
}

ensureToken();
renderProfile();
bindEvents();
fetchLogsFromServer();

logoutBtn?.addEventListener('click', async () => {
  const token = localStorage.getItem('admin_token') || '';
  try { await fetch('/admin/api/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }); } catch {}
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_profile');
  window.location.replace('/admin/login');
});
