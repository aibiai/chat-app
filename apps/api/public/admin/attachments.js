const nameEl = document.querySelector('#admin-name');
const avatarEl = document.querySelector('#sidebar-avatar');
const logoutBtn = document.querySelector('#logout-btn');
const tableBody = document.querySelector('#attachment-table tbody');
const infoEl = document.querySelector('#table-info');
const pagerContainer = document.querySelector('#pager-pages');
const checkAllEl = document.querySelector('#check-all');
const searchInput = document.querySelector('#attachment-search');
const pageSizeSelect = document.querySelector('#page-size');
const categoryFilter = document.querySelector('#category-filter');

const attachments = [
  {
    id: 9484,
    category: 'avatar',
    categoryLabel: '\u5934\u50cf\u7c7b',
    status: '\u672a\u5f52\u7c7b',
    thumb: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=120&q=60',
    fileName: '1759723872.jpg',
    size: '42 KB',
    width: 682,
    height: 562,
    format: 'jpg',
    storage: 'local',
    mime: 'image/jpeg',
    createdAt: '2025-10-06 12:11:12'
  },
  {
    id: 9483,
    category: 'poster',
    categoryLabel: '\u6d77\u62a5\u56fe',
    status: '\u672a\u5f52\u7c7b',
    thumb: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=120&q=60',
    fileName: '1759718103522.jpg',
    size: '72 KB',
    width: 720,
    height: 932,
    format: 'jpg',
    storage: 'local',
    mime: 'image/jpeg',
    createdAt: '2025-10-06 10:04:45'
  },
  {
    id: 9482,
    category: 'poster',
    categoryLabel: '\u6d77\u62a5\u56fe',
    status: '\u672a\u5f52\u7c7b',
    thumb: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=120&q=60',
    fileName: '1759716103743.jpg',
    size: '119 KB',
    width: 1165,
    height: 1405,
    format: 'jpg',
    storage: 'local',
    mime: 'image/jpeg',
    createdAt: '2025-10-06 08:04:08'
  },
  {
    id: 9481,
    category: 'poster',
    categoryLabel: '\u6d77\u62a5\u56fe',
    status: '\u672a\u5f52\u7c7b',
    thumb: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=120&q=60',
    fileName: 'Screenshot_2025-10-06.png',
    size: '315 KB',
    width: 1080,
    height: 2412,
    format: 'png',
    storage: 'local',
    mime: 'image/png',
    createdAt: '2025-10-05 08:04:32'
  },
  {
    id: 9480,
    category: 'avatar',
    categoryLabel: '\u5934\u50cf\u7c7b',
    status: '\u672a\u5f52\u7c7b',
    thumb: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=120&q=60',
    fileName: '1759502269.jpg',
    size: '29 KB',
    width: 354,
    height: 354,
    format: 'jpg',
    storage: 'local',
    mime: 'image/jpeg',
    createdAt: '2025-10-03 22:37:39'
  },
  {
    id: 9479,
    category: 'avatar',
    categoryLabel: '\u5934\u50cf\u7c7b',
    status: '\u672a\u5f52\u7c7b',
    thumb: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=120&q=60',
    fileName: '1759502155.jpg',
    size: '27 KB',
    width: 354,
    height: 354,
    format: 'jpg',
    storage: 'local',
    mime: 'image/jpeg',
    createdAt: '2025-10-03 22:35:55'
  },
  {
    id: 9478,
    category: 'avatar',
    categoryLabel: '\u5934\u50cf\u7c7b',
    status: '\u672a\u5f52\u7c7b',
    thumb: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=120&q=60',
    fileName: '1759502091.jpg',
    size: '26 KB',
    width: 354,
    height: 354,
    format: 'jpg',
    storage: 'local',
    mime: 'image/jpeg',
    createdAt: '2025-10-03 22:34:51'
  },
  {
    id: 9477,
    category: 'avatar',
    categoryLabel: '\u5934\u50cf\u7c7b',
    status: '\u672a\u5f52\u7c7b',
    thumb: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=120&q=60',
    fileName: '1759502023.jpg',
    size: '29 KB',
    width: 354,
    height: 354,
    format: 'jpg',
    storage: 'local',
    mime: 'image/jpeg',
    createdAt: '2025-10-03 22:33:43'
  },
  {
    id: 9476,
    category: 'other',
    categoryLabel: '\u672a\u5f52\u7c7b',
    status: '\u672a\u5f52\u7c7b',
    thumb: 'https://images.unsplash.com/photo-1443890484047-5eaa67d1d630?auto=format&fit=crop&w=120&q=60',
    fileName: '2F7875B9-E782-4370.jpeg',
    size: '5.47 MB',
    width: 4032,
    height: 3024,
    format: 'jpeg',
    storage: 'local',
    mime: 'image/jpeg',
    createdAt: '2025-09-30 19:45:50'
  },
  {
    id: 9475,
    category: 'avatar',
    categoryLabel: '\u5934\u50cf\u7c7b',
    status: '\u672a\u5f52\u7c7b',
    thumb: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=120&q=60',
    fileName: '1759222271.jpg',
    size: '85 KB',
    width: 576,
    height: 576,
    format: 'jpg',
    storage: 'local',
    mime: 'image/jpeg',
    createdAt: '2025-09-30 08:51:11'
  }
];

const state = {
  currentPage: 1,
  pageSize: 10,
  category: 'all',
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
  const profile = readProfile();
  if (!profile) return;
  nameEl.textContent = profile.nickname || profile.username || '管理员';
  if (avatarEl) {
    avatarEl.textContent = (profile.nickname || profile.username || 'A').slice(0, 1).toUpperCase();
  }
}

function getFilteredData() {
  return attachments.filter((item) => {
    const matchCategory = state.category === 'all' || item.category === state.category;
    const keyword = state.keyword.trim().toLowerCase();
    const matchKeyword =
      !keyword ||
      item.fileName.toLowerCase().includes(keyword) ||
      item.format.toLowerCase().includes(keyword) ||
      item.storage.toLowerCase().includes(keyword) ||
      item.mime.toLowerCase().includes(keyword);
    return matchCategory && matchKeyword;
  });
}

function paginate(data) {
  const start = (state.currentPage - 1) * state.pageSize;
  return data.slice(start, start + state.pageSize);
}

function renderTable() {
  const filtered = getFilteredData();
  const pageData = paginate(filtered);

  if (checkAllEl) checkAllEl.checked = false;

  if (pageData.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="13" class="empty">暂无数据</td></tr>`;
  } else {
    tableBody.innerHTML = pageData
      .map(
        (item) => `
      <tr>
        <td><input type="checkbox" data-id="${item.id}" /></td>
        <td>${item.id}</td>
        <td><span class="tag">${item.categoryLabel}</span></td>
        <td><img class="preview-thumb" src="${item.thumb}" alt="${item.fileName}"/></td>
        <td><a href="#" class="link">${item.fileName}</a></td>
        <td>${item.size}</td>
        <td>${item.width}</td>
        <td>${item.height}</td>
        <td><span class="tag neutral">${item.format}</span></td>
        <td>${item.storage}</td>
        <td>${item.mime}</td>
        <td>${item.createdAt}</td>
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

  const pageCount = Math.max(1, Math.ceil(filtered.length / state.pageSize));
  infoEl.textContent = `显示第 ${state.currentPage} 页 / 共 ${pageCount} 页，总计 ${filtered.length} 条记录`;
  renderPager(filtered.length);
}

function renderPager(total) {
  const pageCount = Math.max(1, Math.ceil(total / state.pageSize));
  state.currentPage = Math.min(state.currentPage, pageCount);
  const buttons = [];
  for (let i = 1; i <= pageCount && i <= 5; i++) {
    buttons.push(
      `<button data-page="${i}" class="${i === state.currentPage ? 'active' : ''}">${i}</button>`
    );
  }
  pagerContainer.innerHTML = buttons.join('');
}

function bindEvents() {
  checkAllEl?.addEventListener('change', (event) => {
    const checked = event.target.checked;
    tableBody.querySelectorAll('input[type="checkbox"]').forEach((box) => {
      box.checked = checked;
    });
  });

  pagerContainer?.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const page = Number(button.dataset.page);
    state.currentPage = page;
    renderTable();
  });

  document.querySelectorAll('.pager-btn').forEach((btn) =>
    btn.addEventListener('click', (event) => {
      const type = event.currentTarget.dataset.page;
      const filtered = getFilteredData();
      const pageCount = Math.max(1, Math.ceil(filtered.length / state.pageSize));
      if (type === 'prev') {
        state.currentPage = Math.max(1, state.currentPage - 1);
      } else if (type === 'next') {
        state.currentPage = Math.min(pageCount, state.currentPage + 1);
      }
      renderTable();
    })
  );

  pageSizeSelect?.addEventListener('change', (event) => {
    state.pageSize = Number(event.target.value);
    state.currentPage = 1;
    renderTable();
  });

  searchInput?.addEventListener('input', (event) => {
    state.keyword = event.target.value;
    state.currentPage = 1;
    renderTable();
  });

  categoryFilter?.addEventListener('click', (event) => {
    const btn = event.target.closest('.tab-btn');
    if (!btn) return;
    categoryFilter.querySelectorAll('.tab-btn').forEach((el) => el.classList.remove('active'));
    btn.classList.add('active');
    state.category = btn.dataset.category;
    state.currentPage = 1;
    renderTable();
  });
}

ensureToken();
renderProfile();
bindEvents();
renderTable();

logoutBtn?.addEventListener('click', () => {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_profile');
  window.location.replace('/admin/login');
});
