const nameEl = document.querySelector('#admin-name');
const avatarEl = document.querySelector('#sidebar-avatar');
const logoutBtn = document.querySelector('#logout-btn');
const tableBody = document.querySelector('#service-table tbody');
const infoEl = document.querySelector('#service-info');
const pagerContainer = document.querySelector('#service-pager');
const pageSizeSelect = document.querySelector('#service-page-size');
const searchInput = document.querySelector('#service-search');
const filterTabs = document.querySelector('#service-filter');
const checkAllEl = document.querySelector('#service-check-all');

const serviceData = [
  {
    id: 1,
    admin: 'admin',
    avatar: 'https://i.pravatar.cc/60?img=12',
    nickname: 'customer service',
    autoScript: '\u4e00\u952e\u6dfb\u52a0',
    welcome: '\u60a8\u597d\uff0c\u6211\u662f\u672c\u5e73\u53f0\u5ba2\u670d\u56e2\u961f\u4eba\u5458\uff0c\u8bf7\u95ee\u6709\u4ec0\u4e48\u53ef\u4ee5\u5e2e\u52a9\u60a8\u7684\u5462\uff1f',
    status: 'inactive',
    createdAt: '2019-07-23 13:44:37'
  },
  {
    id: 2,
    admin: 'ops_team',
    avatar: 'https://i.pravatar.cc/60?img=32',
    nickname: 'official bot',
    autoScript: '\u81ea\u52a8\u53d1\u9001',
    welcome: '\u6b22\u8fce\u4f7f\u7528\u5b98\u65b9\u5ba2\u670d\u901a\u9053\uff0c\u5982\u9700\u4eba\u5de5\u670d\u52a1\u8bf7\u76f4\u63a5\u56de\u590d\u3010\u5ba2\u670d\u3011\u3002',
    status: 'active',
    createdAt: '2025-08-12 10:12:10'
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
  if (nameEl) nameEl.textContent = profile.nickname || profile.username || '\u7ba1\u7406\u5458';
  if (avatarEl) avatarEl.textContent = (profile.nickname || profile.username || 'A').slice(0, 1).toUpperCase();
}

function filterData() {
  const keyword = state.keyword.trim().toLowerCase();
  return serviceData.filter((item) => {
    const matchStatus = state.status === 'all' || item.status === state.status;
    const matchKeyword =
      !keyword ||
      item.admin.toLowerCase().includes(keyword) ||
      item.nickname.toLowerCase().includes(keyword) ||
      item.welcome.toLowerCase().includes(keyword);
    return matchStatus && matchKeyword;
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
    tableBody.innerHTML = '<tr><td colspan="10" class="empty">\u52a0\u8f7d\u4e2d...</td></tr>';
  } else {
    tableBody.innerHTML = pageData
      .map(
        (item) => `
        <tr>
          <td><input type="checkbox" data-id="${item.id}" /></td>
          <td>${item.id}</td>
          <td>${item.admin}</td>
          <td><img src="${item.avatar}" alt="${item.nickname}" class="service-avatar" /></td>
          <td>${item.nickname}</td>
          <td><button class="link-btn" data-action="autoscript" data-id="${item.id}">${item.autoScript}</button></td>
          <td class="welcome-text">${item.welcome}</td>
          <td>
            <span class="status-pill ${item.status === 'active' ? 'active' : 'disabled'}">
              ${item.status === 'active' ? '\u542f\u7528' : '\u5173\u95ed'}
            </span>
          </td>
          <td>${item.createdAt}</td>
          <td>
            <div class="table-actions">
              <button class="action-btn edit" data-action="edit" data-id="${item.id}" title="\u7f16\u8f91">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="m20.71 7.04-3.75-3.75a1 1 0 0 0-1.42 0L3 15.83V20h4.17L20.71 8.46a1 1 0 0 0 0-1.42ZM6.59 18H5v-1.59l8.06-8.06 1.59 1.59Zm9.47-9.47-1.59-1.59 1.42-1.42 1.59 1.59Z"/>
                </svg>
              </button>
              <button class="action-btn delete" data-action="delete" data-id="${item.id}" title="\u5220\u9664">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M6 7h12v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2Zm9-5 1 1h4v2H4V3h4l1-1Zm3 5H6v13h12Z"/>
                </svg>
              </button>
            </div>
          </td>
        </tr>`
      )
      .join('');
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / state.pageSize));
  state.page = Math.min(state.page, totalPages);
  infoEl.textContent = `\u663e\u793a\u7b2c ${state.page} \u9875 / \u5171 ${totalPages} \u9875\uff0c\u603b\u8ba1 ${filtered.length} \u6761\u8bb0\u5f55`;

  const buttons = [];
  const startPage = Math.max(1, state.page - 2);
  const endPage = Math.min(totalPages, startPage + 4);
  for (let i = startPage; i <= endPage; i++) {
    buttons.push(`<button data-page="${i}" class="${i === state.page ? 'active' : ''}">${i}</button>`);
  }
  pagerContainer.innerHTML = buttons.join('');
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

  filterTabs?.addEventListener('click', (event) => {
    const btn = event.target.closest('.tab-btn');
    if (!btn) return;
    filterTabs.querySelectorAll('.tab-btn').forEach((tab) => tab.classList.remove('active'));
    btn.classList.add('active');
    state.status = btn.dataset.status;
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

  pageSizeSelect?.addEventListener('change', (event) => {
    state.pageSize = Number(event.target.value);
    state.page = 1;
    renderTable();
  });

  checkAllEl?.addEventListener('change', (event) => {
    const checked = event.target.checked;
    tableBody.querySelectorAll('input[type="checkbox"]').forEach((box) => {
      box.checked = checked;
    });
  });

  tableBody.addEventListener('click', (event) => {
    const linkBtn = event.target.closest('.link-btn');
    if (linkBtn) {
      const id = linkBtn.dataset.id;
      alert(`\u914d\u7f6e\u670d\u52a1\u8d26\u53f7 #${id} \u7684\u81ea\u52a8\u8bdd\u672c\uff08\u6f14\u793a\uff09\u3002`);
      return;
    }

    const actionBtn = event.target.closest('.action-btn');
    if (!actionBtn) return;
    const action = actionBtn.dataset.action;
    const id = actionBtn.dataset.id;
    if (action === 'edit') {
      alert(`\u7f16\u8f91\u670d\u52a1\u8d26\u53f7 #${id} \uff08\u6f14\u793a\uff09\u3002`);
    } else if (action === 'delete') {
      const confirmed = confirm(`\u786e\u5b9a\u5220\u9664\u670d\u52a1\u8d26\u53f7 #${id} \u5417\uff1f`);
      if (confirmed) alert('\u6f14\u793a\u73af\u5883\uff1a\u4e0d\u4f1a\u771f\u6b63\u5220\u9664\u8bb0\u5f55\u3002');
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
