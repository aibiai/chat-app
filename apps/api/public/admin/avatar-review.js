const nameEl = document.querySelector('#admin-name');
const avatarEl = document.querySelector('#sidebar-avatar');
const logoutBtn = document.querySelector('#logout-btn');
const tableBody = document.querySelector('#avatar-table tbody');
const infoEl = document.querySelector('#avatar-info');
const pagerContainer = document.querySelector('#avatar-pager');
const pageSizeSelect = document.querySelector('#avatar-page-size');
const searchInput = document.querySelector('#avatar-search');
const checkAllEl = document.querySelector('#avatar-check-all');

const avatarQueue = [
  {
    id: 7821,
    username: 'lucy88',
    email: 'lucy88@example.com',
    avatar: 'https://i.pravatar.cc/64?img=47',
    level: 'LV6 钻石',
    gender: '\u5973',
    status: 'pending',
    submittedAt: '2025-10-04 22:18',
    reason: '\u65b0\u63d0\u4ea4\u5934\u50cf'
  },
  {
    id: 7819,
    username: 'mike_dev',
    email: 'mike.dev@example.com',
    avatar: 'https://i.pravatar.cc/64?img=33',
    level: 'LV5 铂金',
    gender: '\u7537',
    status: 'approved',
    submittedAt: '2025-10-03 15:22',
    reason: '\u66f4\u6362\u4e3a\u6b63\u5f0f\u7167\u7247'
  },
  {
    id: 7813,
    username: 'violet',
    email: 'violet@example.com',
    avatar: 'https://i.pravatar.cc/64?img=5',
    level: 'LV3 银卡',
    gender: '\u5973',
    status: 'rejected',
    submittedAt: '2025-10-02 11:09',
    reason: '\u4f7f\u7528\u4e86\u7279\u6548\u8fc7\u5ea6\u7167'
  },
  {
    id: 7805,
    username: 'river',
    email: 'river@example.com',
    avatar: 'https://i.pravatar.cc/64?img=14',
    level: 'LV2 青铜',
    gender: '\u7537',
    status: 'pending',
    submittedAt: '2025-10-01 20:40',
    reason: '\u4e8e\u624b\u673a\u7aef\u66f4\u65b0'
  },
  {
    id: 7798,
    username: 'anna',
    email: 'anna@example.com',
    avatar: 'https://i.pravatar.cc/64?img=38',
    level: 'LV4 黄金',
    gender: '\u5973',
    status: 'pending',
    submittedAt: '2025-09-30 09:12',
    reason: '\u66f4\u65b0\u5934\u50cf\u5b63\u8282\u4e3b\u9898'
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
  if (nameEl) nameEl.innerHTML = '';
  const displayName = profile.nickname || profile.username || '\u7ba1\u7406\u5458';
  if (nameEl) nameEl.textContent = displayName;
  if (avatarEl) avatarEl.textContent = displayName.slice(0, 1).toUpperCase();
}

function translateStatus(status) {
  if (status === 'approved') return '\u901a\u8fc7';
  if (status === 'rejected') return '\u5df2\u62d2\u7edd';
  return '\u5f85\u5ba1';
}

function statusClass(status) {
  if (status === 'approved') return 'active';
  if (status === 'rejected') return 'disabled';
  return 'pending';
}

function filterData() {
  const keyword = state.keyword.trim().toLowerCase();
  if (!keyword) return avatarQueue;
  return avatarQueue.filter((item) => {
    return (
      item.username.toLowerCase().includes(keyword) ||
      item.email.toLowerCase().includes(keyword) ||
      item.level.toLowerCase().includes(keyword)
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
    tableBody.innerHTML = '<tr><td colspan="9" class="empty">\u6682\u65e0\u6570\u636e</td></tr>';
  } else {
    tableBody.innerHTML = pageData
      .map(
        (item) => `
        <tr>
          <td><input type="checkbox" data-id="${item.id}" /></td>
          <td>${item.id}</td>
          <td>
            <div class="cell-with-meta">
              <strong>${item.username}</strong>
              <small>\u63d0\u4ea4\u65f6\u95f4\uff1a${item.submittedAt}</small>
            </div>
          </td>
          <td>${item.email}</td>
          <td>
            <div class="avatar-preview">
              <img src="${item.avatar}" alt="${item.username}" class="member-avatar" />
              <button class="link-btn" data-action="preview" data-id="${item.id}">\u9884\u89c8</button>
            </div>
          </td>
          <td>${item.level}</td>
          <td>${item.gender}</td>
          <td>
            <span class="status-pill ${statusClass(item.status)}">${translateStatus(item.status)}</span>
          </td>
          <td>
            <div class="table-actions">
              <button class="action-btn approve" data-action="approve" data-id="${item.id}" title="\u901a\u8fc7">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="m9 16.17-3.58-3.59L4 14l5 5 11-11-1.41-1.42Z" />
                </svg>
              </button>
              <button class="action-btn reject" data-action="reject" data-id="${item.id}" title="\u9a73\u56de">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12Z" />
                </svg>
              </button>
              <button class="action-btn info" data-action="reason" data-id="${item.id}" title="\u67e5\u770b\u539f\u56e0">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M11 7h2v2h-2m0 4h2v6h-2m1-16A10 10 0 1 0 21 12 10 10 0 0 0 12 2Z"/>
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
  infoEl.innerHTML = `\u663e\u793a\u7b2c&nbsp;${state.page}&nbsp;\u9875&nbsp;/&nbsp;\u5171&nbsp;${totalPages}&nbsp;\u9875\uff0c\u603b\u8ba1&nbsp;${filtered.length}&nbsp;\u6761\u8bb0\u5f55`;

  const buttons = [];
  const startPage = Math.max(1, state.page - 2);
  const endPage = Math.min(totalPages, startPage + 4);
  for (let i = startPage; i <= endPage; i++) {
    buttons.push(`<button data-page="${i}" class="${i === state.page ? 'active' : ''}">${i}</button>`);
  }
  pagerContainer.innerHTML = buttons.join('');
}

function getSelectedIds() {
  return Array.from(tableBody.querySelectorAll('input[type="checkbox"]:checked')).map((node) => Number(node.dataset.id));
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

  document.querySelector('#avatar-refresh')?.addEventListener('click', () => {
    renderTable();
    alert('\u5df2\u66f4\u65b0\u5934\u50cf\u5ba1\u6838\u5217\u8868\uff08\u6f14\u793a\uff09\u3002');
  });

  document.querySelector('#avatar-export')?.addEventListener('click', () => {
    alert('\u5bfc\u51fa\u5ba1\u6838\u8bb0\u5f55\uff08\u6f14\u793a\uff09\u3002');
  });

  document.querySelector('#avatar-delete')?.addEventListener('click', () => {
    const selected = getSelectedIds();
    if (selected.length === 0) {
      alert('\u8bf7\u5148\u9009\u62e9\u9700\u8981\u5220\u9664\u7684\u8bb0\u5f55\u3002');
      return;
    }
    const confirmed = confirm(`\u786e\u5b9a\u5220\u9664 ${selected.length} \u4e2a\u5ba1\u6838\u8bb0\u5f55\u5417\uff1f`);
    if (confirmed) alert('\u6f14\u793a\u73af\u5883\uff1a\u4e0d\u4f1a\u771f\u6b63\u5220\u9664\u6570\u636e\u3002');
  });

  document.querySelector('#avatar-more')?.addEventListener('click', () => {
    alert('\u66f4\u591a\u64cd\u4f5c\u5c06\u5305\u62ec\u6279\u91cf\u91cd\u5ba1\u548c\u5f02\u5e38\u62a5\u544a\uff08\u6f14\u793a\uff09\u3002');
  });

  tableBody.addEventListener('click', (event) => {
    const target = event.target;
    const previewBtn = target.closest('[data-action="preview"]');
    if (previewBtn) {
      const id = Number(previewBtn.dataset.id);
      const item = avatarQueue.find((row) => row.id === id);
      if (!item) return;
      window.open(item.avatar, '_blank');
      return;
    }

    const reasonBtn = target.closest('[data-action="reason"]');
    if (reasonBtn) {
      const id = Number(reasonBtn.dataset.id);
      const item = avatarQueue.find((row) => row.id === id);
      if (!item) return;
      alert(`\u63d0\u4ea4\u8bf4\u660e\uff1a${item.reason}`);
      return;
    }

    const actionBtn = target.closest('.action-btn');
    if (!actionBtn) return;
    const action = actionBtn.dataset.action;
    const id = Number(actionBtn.dataset.id);
    const item = avatarQueue.find((row) => row.id === id);
    if (!item) return;

    if (action === 'approve') {
      item.status = 'approved';
      alert(`\u8bbe\u7f6e\u5ba1\u6838 #${id} \u4e3a\u901a\u8fc7\uff08\u6f14\u793a\uff09\u3002`);
    } else if (action === 'reject') {
      item.status = 'rejected';
      alert(`\u5df2\u62d2\u7edd\u5934\u50cf #${id} \uff08\u6f14\u793a\uff09\u3002`);
    }
    renderTable();
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
