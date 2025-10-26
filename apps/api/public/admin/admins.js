const nameEl = document.querySelector('#admin-name');
const avatarEl = document.querySelector('#sidebar-avatar');
const logoutBtn = document.querySelector('#logout-btn');
const searchInput = document.querySelector('#admin-search');
const statusFilter = document.querySelector('#status-filter');
const tableBody = document.querySelector('#admins-table tbody');
const checkAllEl = document.querySelector('#admins-check-all');
const infoEl = document.querySelector('#admins-info');
const pagerContainer = document.querySelector('#admins-pager');
const pageSizeSelect = document.querySelector('#admins-page-size');

const admins = [
  {
    id: 67,
    username: 'Alex007',
    nickname: 'Alex007',
    groups: ['全球管理员'],
    email: 'he04174417@gmail.com',
    status: 'active',
    lastLogin: '2025-07-24 17:25:55'
  },
  {
    id: 66,
    username: 'Alex009',
    nickname: 'Alex009',
    groups: ['全球管理员'],
    email: '908654hhq2@qq.com',
    status: 'active',
    lastLogin: '2025-09-30 14:14:54'
  },
  {
    id: 65,
    username: 'Alex021',
    nickname: 'Alex021',
    groups: ['全球管理员'],
    email: '88744115@qq.com',
    status: 'active',
    lastLogin: '无'
  },
  {
    id: 63,
    username: 'Alex020',
    nickname: 'Alex020',
    groups: ['全球管理员'],
    email: '88888@qq.com',
    status: 'active',
    lastLogin: '无'
  },
  {
    id: 62,
    username: 'Alex019',
    nickname: 'Alex019',
    groups: ['全球管理员'],
    email: '868554@qq.com',
    status: 'active',
    lastLogin: '无'
  },
  {
    id: 61,
    username: 'Alex018',
    nickname: 'Alex018',
    groups: ['全球管理员'],
    email: '555555@qq.com',
    status: 'active',
    lastLogin: '无'
  },
  {
    id: 60,
    username: 'Alex017',
    nickname: 'Alex017',
    groups: ['全球管理员'],
    email: '004455@qq.com',
    status: 'active',
    lastLogin: '无'
  },
  {
    id: 59,
    username: 'Alex016',
    nickname: 'Alex016',
    groups: ['总部管理员'],
    email: '48711631@qq.com',
    status: 'active',
    lastLogin: '2025-09-30 11:48:57'
  },
  {
    id: 58,
    username: 'Alex010',
    nickname: 'Alex010',
    groups: ['总部管理员', '全球管理员'],
    email: '4468544856@qq.com',
    status: 'active',
    lastLogin: '无'
  },
  {
    id: 57,
    username: 'Alex004',
    nickname: 'Alex004',
    groups: ['全球管理员'],
    email: '8664154@qq.com',
    status: 'disabled',
    lastLogin: '2025-09-30 11:38:13'
  }
];

const state = {
  page: 1,
  pageSize: 10,
  keyword: '',
  status: 'all'
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
  return admins.filter((item) => {
    const matchesStatus = state.status === 'all' || item.status === state.status;
    const keyword = state.keyword.trim().toLowerCase();
    const matchesKeyword =
      !keyword ||
      item.username.toLowerCase().includes(keyword) ||
      item.nickname.toLowerCase().includes(keyword) ||
      item.email.toLowerCase().includes(keyword) ||
      item.groups.some((g) => g.toLowerCase().includes(keyword));
    return matchesStatus && matchesKeyword;
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
    tableBody.innerHTML = `<tr><td colspan="9" class="empty">暂无管理员记录</td></tr>`;
  } else {
    tableBody.innerHTML = pageData
      .map(
        (item) => `
        <tr>
          <td><input type="checkbox" data-id="${item.id}" /></td>
          <td>${item.id}</td>
          <td>${item.username}</td>
          <td>${item.nickname}</td>
          <td>
            <div class="role-group">
              ${item.groups
                .map((group) => `<span class="role-badge">${group}</span>`)
                .join('')}
            </div>
          </td>
          <td>${item.email}</td>
          <td><span class="status-pill ${item.status === 'active' ? 'active' : 'disabled'}">${item.status === 'active' ? '正常' : '禁用'}</span></td>
          <td>${item.lastLogin}</td>
          <td>
            <div class="table-actions">
              <button class="action-btn edit" data-action="edit" data-id="${item.id}" title="编辑">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="m20.71 7.04-3.75-3.75a1 1 0 0 0-1.42 0L3 15.83V20h4.17L20.71 8.46a1 1 0 0 0 0-1.42ZM6.59 18H5v-1.59l8.06-8.06 1.59 1.59Zm9.47-9.47-1.59-1.59 1.42-1.42 1.59 1.59Z"/></svg>
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

function bindEvents() {
  searchInput?.addEventListener('input', (event) => {
    state.keyword = event.target.value;
    state.page = 1;
    renderTable();
  });

  statusFilter?.addEventListener('click', (event) => {
    const btn = event.target.closest('.tab-btn');
    if (!btn) return;
    statusFilter.querySelectorAll('.tab-btn').forEach((el) => el.classList.remove('active'));
    btn.classList.add('active');
    state.status = btn.dataset.status;
    state.page = 1;
    renderTable();
  });

  checkAllEl?.addEventListener('change', (event) => {
    const checked = event.target.checked;
    tableBody.querySelectorAll('input[type="checkbox"]').forEach((box) => {
      box.checked = checked;
    });
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

  pageSizeSelect?.addEventListener('change', (event) => {
    state.pageSize = Number(event.target.value);
    state.page = 1;
    renderTable();
  });

  tableBody.addEventListener('click', (event) => {
    const button = event.target.closest('.action-btn');
    if (!button) return;
    const action = button.dataset.action;
    const id = button.dataset.id;
    if (action === 'edit') {
      alert(`编辑管理员 #${id}（示例弹窗）`);
    } else if (action === 'delete') {
      const confirmDelete = confirm(`确定删除管理员 #${id} 吗？`);
      if (confirmDelete) {
        alert('示例：已删除。实际环境中请调用接口。');
      }
    }
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
