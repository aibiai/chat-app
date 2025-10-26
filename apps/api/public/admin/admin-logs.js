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

const logs = [
  {
    id: 34851,
    username: 'admin',
    title: '登录',
    url: '/admin/index/login?uri=%2Fadmin',
    ip: '61.183.188.26',
    browser: 'Mozilla/5.0',
    createdAt: '2025-10-07 02:08:44'
  },
  {
    id: 34850,
    username: 'Alex005',
    title: '登录',
    url: '/admin/index/login?uri=%2Fadmin',
    ip: '39.183.178.90',
    browser: 'Mozilla/5.0',
    createdAt: '2025-10-06 20:45:10'
  },
  {
    id: 34849,
    username: 'Alex005',
    title: '登录',
    url: '/admin/index/login?uri=%2Fadmin%2Fcontent',
    ip: '117.39.35.16',
    browser: 'Mozilla/5.0',
    createdAt: '2025-10-06 20:29:42'
  },
  {
    id: 34848,
    username: 'Alex005',
    title: '登录',
    url: '/admin/index/login?uri=%2Fadmin%2Frole',
    ip: '223.104.205.140',
    browser: 'Mozilla/5.0',
    createdAt: '2025-10-06 20:29:12'
  },
  {
    id: 34853,
    username: 'admin',
    title: '会员管理 / 会员管理 / 编辑',
    url: '/admin/user/user/edit?id=11387&dialog=1',
    ip: '36.142.63.55',
    browser: 'Mozilla/5.0',
    createdAt: '2025-10-01 16:09:50'
  },
  {
    id: 34852,
    username: 'admin',
    title: '会员管理 / 失物招领 / 替换',
    url: '/admin/user/avatar/muti',
    ip: '103.170.20.60',
    browser: 'Mozilla/5.0',
    createdAt: '2025-10-01 16:08:54'
  },
  {
    id: 34847,
    username: 'Alex005',
    title: '会员管理 / 会员管理 / 分配',
    url: '/admin/user/user/assignUser',
    ip: '103.170.20.88',
    browser: 'Mozilla/5.0',
    createdAt: '2025-09-30 21:53:30'
  },
  {
    id: 34846,
    username: 'Alex005',
    title: '登录',
    url: '/admin/index/login?uri=%2Fadmin',
    ip: '103.170.20.88',
    browser: 'Mozilla/5.0',
    createdAt: '2025-09-30 20:42:41'
  },
  {
    id: 34845,
    username: 'Alex005',
    title: '登录',
    url: '/admin/index/login?uri=%2Fadmin',
    ip: '103.170.20.60',
    browser: 'Mozilla/5.0',
    createdAt: '2025-09-30 19:42:10'
  },
  {
    id: 34844,
    username: 'Alex005',
    title: '登录',
    url: '/admin/index/login?uri=%2Fadmin',
    ip: '223.88.169.178',
    browser: 'Mozilla/5.0',
    createdAt: '2025-09-30 19:39:32'
  }
];

const state = {
  page: 1,
  pageSize: 10,
  keyword: ''
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

function filterData() {
  const keyword = state.keyword.trim().toLowerCase();
  if (!keyword) return logs;
  return logs.filter((item) => {
    return (
      item.username.toLowerCase().includes(keyword) ||
      item.title.toLowerCase().includes(keyword) ||
      item.url.toLowerCase().includes(keyword) ||
      item.ip.toLowerCase().includes(keyword) ||
      item.browser.toLowerCase().includes(keyword)
    );
  });
}

function paginate(data) {
  const start = (state.page - 1) * state.pageSize;
  return data.slice(start, start + state.pageSize);
}

function renderTable() {
  const filtered = filterData();
  const pageData = paginate(filtered);

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
              <button class="action-btn delete" data-action="delete" data-id="${item.id}" title="删除">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M6 7h12v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2Zm9-5 1 1h4v2H4V3h4l1-1Zm3 5H6v13h12Z"/></svg>
              </button>
            </div>
          </td>
        </tr>`
      )
      .join('');
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / state.pageSize));
  state.page = Math.min(state.page, totalPages);
  infoEl.textContent = `显示第 ${state.page} 页 / 共 ${totalPages} 页，总计 ${filtered.length} 条记录`;

  const buttons = [];
  const startPage = Math.max(1, state.page - 2);
  const endPage = Math.min(totalPages, startPage + 4);
  for (let i = startPage; i <= endPage; i++) {
    buttons.push(`<button data-page="${i}" class="${i === state.page ? 'active' : ''}">${i}</button>`);
  }
  pagerContainer.innerHTML = buttons.join('');
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
    renderTable();
  });

  pageSizeSelect?.addEventListener('change', (event) => {
    state.pageSize = Number(event.target.value);
    state.page = 1;
    renderTable();
  });

  pagerContainer?.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    state.page = Number(button.dataset.page);
    renderTable();
  });

  document.querySelectorAll('.table-pager .pager-btn').forEach((btn) =>
    btn.addEventListener('click', (event) => {
      const type = event.currentTarget.dataset.page;
      const totalPages = Math.max(1, Math.ceil(filterData().length / state.pageSize));
      if (type === 'prev') state.page = Math.max(1, state.page - 1);
      if (type === 'next') state.page = Math.min(totalPages, state.page + 1);
      renderTable();
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
    if (action === 'delete') {
      const confirmed = confirm(`确定要删除日志 #${id} 吗？`);
      if (confirmed) {
        alert('演示环境：不会真正删除日志记录。');
      }
    }
  });

  refreshBtn?.addEventListener('click', () => {
    alert('日志数据已刷新（示例）。');
  });

  filterBtn?.addEventListener('click', () => {
    alert('正式环境可在此弹出筛选条件面板。');
  });

  deleteBtn?.addEventListener('click', () => {
    const ids = getSelectedIds();
    if (ids.length === 0) {
      alert('请先选择要删除的日志。');
      return;
    }
    const confirmed = confirm(`确定批量删除选中的 ${ids.length} 条日志吗？`);
    if (confirmed) {
      alert('演示环境：不会真正删除所选日志。');
    }
  });

  exportBtn?.addEventListener('click', () => {
    alert('演示环境：导出功能尚未接入后台接口。');
  });
}

ensureToken();
renderProfile();
renderTable();
bindEvents();

logoutBtn?.addEventListener('click', () => {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_profile');
  window.location.replace('/admin/login');
});
