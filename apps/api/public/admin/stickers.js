const nameEl = document.querySelector('#admin-name');
const avatarEl = document.querySelector('#sidebar-avatar');
const logoutBtn = document.querySelector('#logout-btn');
const tableBody = document.querySelector('#sticker-table tbody');
const infoEl = document.querySelector('#sticker-info');
const pagerContainer = document.querySelector('#sticker-pager');
const pageSizeSelect = document.querySelector('#sticker-page-size');
const searchInput = document.querySelector('#sticker-search');
const checkAllEl = document.querySelector('#sticker-check-all');

const stickers = [
  {
    id: 2,
    name: '\u5e78\u798f\u53ef\u4eba',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=64&q=60',
    price: 18,
    status: 'active'
  },
  {
    id: 1,
    name: '\u5361\u5361\u4f0a',
    image: 'https://images.unsplash.com/photo-1475688621402-4257c0c0b280?auto=format&fit=crop&w=64&q=60',
    price: 29,
    status: 'active'
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
  const displayName = profile.nickname || profile.username || '\u7ba1\u7406\u5458';
  if (nameEl) nameEl.textContent = displayName;
  if (avatarEl) avatarEl.textContent = displayName.slice(0, 1).toUpperCase();
}

function filterData() {
  const keyword = state.keyword.trim().toLowerCase();
  if (!keyword) return stickers;
  return stickers.filter((item) => item.name.toLowerCase().includes(keyword) || String(item.id).includes(keyword));
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
    tableBody.innerHTML = '<tr><td colspan="7" class="empty">\u6682\u65e0\u6570\u636e</td></tr>';
  } else {
    tableBody.innerHTML = pageData
      .map(
        (item) => `
        <tr>
          <td><input type="checkbox" data-id="${item.id}" /></td>
          <td>${item.id}</td>
          <td>${item.name}</td>
          <td><img src="${item.image}" alt="${item.name}" class="gift-thumb" /></td>
          <td>${item.price.toFixed(2)}</td>
          <td>
            <span class="status-pill ${item.status === 'active' ? 'active' : 'disabled'}">
              ${item.status === 'active' ? '\u542f\u7528' : '\u505c\u7528'}
            </span>
          </td>
          <td>
            <div class="table-actions">
              <button class="action-btn info" data-action="preview" data-id="${item.id}" title="\u8be6\u60c5">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M12 9a3 3 0 1 0 3 3 3 3 0 0 0-3-3Zm0-5A11.71 11.71 0 0 0 1 12a11.71 11.71 0 0 0 11 8 11.71 11.71 0 0 0 11-8 11.71 11.71 0 0 0-11-8Zm0 14a9 9 0 0 1-8.66-6 9 9 0 0 1 17.32 0A9 9 0 0 1 12 18Z"/>
                </svg>
              </button>
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
  return Array.from(tableBody.querySelectorAll('input[type="checkbox"]:checked')).map((item) => Number(item.dataset.id));
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

  document.querySelector('#sticker-refresh')?.addEventListener('click', () => {
    renderTable();
    alert('\u5df2\u66f4\u65b0\u8868\u60c5\u8d34\u5217\u8868\uff08\u6f14\u793a\uff09\u3002');
  });

  document.querySelector('#sticker-export')?.addEventListener('click', () => {
    alert('\u5bfc\u51fa\u8868\u60c5\u8d34\u6570\u636e\uff08\u6f14\u793a\uff09\u3002');
  });

  document.querySelector('#sticker-add')?.addEventListener('click', () => {
    alert('\u6f14\u793a\u73af\u5883\uff1a\u4e0d\u5b9e\u9645\u6dfb\u52a0\u8868\u60c5\u8d34\u3002');
  });

  document.querySelector('#sticker-edit')?.addEventListener('click', () => {
    const ids = getSelectedIds();
    if (ids.length !== 1) {
      alert('\u8bf7\u9009\u4e2d\u5355\u6761\u8bb0\u5f55\u8fdb\u884c\u7f16\u8f91\u3002');
      return;
    }
    alert(`\u7f16\u8f91\u8868\u60c5\u8d34 #${ids[0]} (\u6f14\u793a)\u3002`);
  });

  document.querySelector('#sticker-delete')?.addEventListener('click', () => {
    const ids = getSelectedIds();
    if (ids.length === 0) {
      alert('\u8bf7\u9009\u62e9\u9700\u8981\u5220\u9664\u7684\u8bb0\u5f55\u3002');
      return;
    }
    const confirmed = confirm(`\u786e\u5b9a\u5220\u9664 ${ids.length} \u6761\u8868\u60c5\u8d34\u5417\uff1f`);
    if (confirmed) alert('\u6f14\u793a\u73af\u5883\uff1a\u4e0d\u4f1a\u6267\u884c\u5b9e\u9645\u5220\u9664\u3002');
  });

  document.querySelector('#sticker-more')?.addEventListener('click', () => {
    alert('\u66f4\u591a\u529f\u80fd\u4f8b\u5982\u7fa4\u53d1\u63a8\u8350\u548c\u5206\u7c7b\u7ba1\u7406\u6b63\u5728\u8bbe\u8ba1\uff08\u6f14\u793a\uff09\u3002');
  });

  tableBody.addEventListener('click', (event) => {
    const actionBtn = event.target.closest('.action-btn');
    if (!actionBtn) return;
    const action = actionBtn.dataset.action;
    const id = Number(actionBtn.dataset.id);
    if (action === 'preview') {
      alert(`\u67e5\u770b\u8868\u60c5\u8d34 #${id} \u7684\u8be6\u7ec6\u6d88\u606f\uff08\u6f14\u793a\uff09\u3002`);
    } else if (action === 'edit') {
      alert(`\u7f16\u8f91\u8868\u60c5\u8d34 #${id} (\u6f14\u793a)\u3002`);
    } else if (action === 'delete') {
      const confirmed = confirm(`\u662f\u5426\u5220\u9664\u8868\u60c5\u8d34 #${id}\uff1f`);
      if (confirmed) alert('\u6f14\u793a\u73af\u5883\uff1a\u4e0d\u6267\u884c\u5b9e\u9645\u64cd\u4f5c\u3002');
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
