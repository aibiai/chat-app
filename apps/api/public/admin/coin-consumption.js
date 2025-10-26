const nameEl = document.querySelector('#admin-name');
const avatarEl = document.querySelector('#sidebar-avatar');
const logoutBtn = document.querySelector('#logout-btn');
const tableBody = document.querySelector('#coin-table tbody');
const infoEl = document.querySelector('#coin-info');
const pagerContainer = document.querySelector('#coin-pager');
const pageSizeSelect = document.querySelector('#coin-page-size');
const searchInput = document.querySelector('#coin-search');
const checkAllEl = document.querySelector('#coin-check-all');

const records = [
  {
    id: 2242,
    orderNo: '2025100110085358608486',
    account: 'a8680103',
    owner: 'Alex005',
    target: 'a8680103',
    item: '赠送礼物',
    amount: 388,
    status: 'success',
    statusLabel: '成功',
    consumeAt: '2025-10-01 20:55:20'
  },
  {
    id: 2241,
    orderNo: '-',
    account: 'cv0798413',
    owner: 'Alex003',
    target: 'kobe082408122@gmail.com',
    item: '赠送礼物',
    amount: 1199,
    status: 'success',
    statusLabel: '成功',
    consumeAt: '2025-09-29 20:53:12'
  },
  {
    id: 2240,
    orderNo: '2025092010455746411',
    account: '晓儿',
    owner: 'Alex005',
    target: 'kobe082408122@gmail.com',
    item: '赠送礼物',
    amount: 128,
    status: 'success',
    statusLabel: '成功',
    consumeAt: '2025-09-29 22:45:57'
  },
  {
    id: 2239,
    orderNo: '2025091908127031127745',
    account: '晓儿',
    owner: 'Alex005',
    target: 'asd170315',
    item: '赠送礼物',
    amount: 128,
    status: 'success',
    statusLabel: '成功',
    consumeAt: '2025-09-29 22:38:12'
  },
  {
    id: 2238,
    orderNo: '2025092009430219337237',
    account: 'cv0798413',
    owner: 'Alex005',
    target: '-',
    item: '赠送礼物',
    amount: 500,
    status: 'success',
    statusLabel: '成功',
    consumeAt: '2025-09-29 22:03:43'
  },
  {
    id: 2237,
    orderNo: '20250920095437884308',
    account: 'cv0798413',
    owner: 'Alex005',
    target: '-',
    item: '赠送礼物',
    amount: 500,
    status: 'success',
    statusLabel: '成功',
    consumeAt: '2025-09-29 21:58:45'
  },
  {
    id: 2236,
    orderNo: '-',
    account: '晓儿',
    owner: 'Alex003',
    target: 'Hanswen',
    item: '赠送礼物',
    amount: 1000,
    status: 'success',
    statusLabel: '成功',
    consumeAt: '2025-09-29 21:50:17'
  },
  {
    id: 2235,
    orderNo: '20250928110151432214',
    account: '晓妹',
    owner: 'Alex002',
    target: '晓薇',
    item: '赠送礼物',
    amount: 200,
    status: 'success',
    statusLabel: '成功',
    consumeAt: '2025-09-28 23:01:51'
  },
  {
    id: 2234,
    orderNo: '20250928140208385490',
    account: '影振帮',
    owner: 'Alex002',
    target: '-',
    item: '赠送礼物',
    amount: 16,
    status: 'success',
    statusLabel: '成功',
    consumeAt: '2025-09-28 22:48:53'
  },
  {
    id: 2233,
    orderNo: '202509280506304362436',
    account: 'Amiy',
    owner: 'Alex005',
    target: 'Pplu87',
    item: '赠送礼物',
    amount: 520,
    status: 'success',
    statusLabel: '成功',
    consumeAt: '2025-09-28 17:05:04'
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

function statusTag(status) {
  if (status === 'success') return 'accent-emerald';
  if (status === 'pending') return 'accent-amber';
  if (status === 'failed') return 'accent-rose';
  return 'neutral';
}

function normalizeKeyword(value) {
  return (value || '').toString().trim().toLowerCase();
}

function includesKeyword(source, keyword) {
  if (!keyword) return true;
  return normalizeKeyword(source).includes(keyword);
}

function filterData() {
  const keyword = normalizeKeyword(state.keyword);
  if (!keyword) return records;
  return records.filter((record) => {
    return (
      includesKeyword(record.orderNo, keyword) ||
      includesKeyword(record.account, keyword) ||
      includesKeyword(record.owner, keyword) ||
      includesKeyword(record.target, keyword)
    );
  });
}

function paginate(list) {
  const start = (state.page - 1) * state.pageSize;
  return list.slice(start, start + state.pageSize);
}

function renderTable() {
  const filtered = filterData();
  const pageData = paginate(filtered);

  if (checkAllEl) checkAllEl.checked = false;

  if (pageData.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="10" class="empty">\u6682\u65e0\u6570\u636e</td></tr>';
  } else {
    tableBody.innerHTML = pageData
      .map(
        (item) => `
        <tr>
          <td><input type="checkbox" data-id="${item.id}" /></td>
          <td>${item.id}</td>
          <td>${item.orderNo}</td>
          <td>${item.account}</td>
          <td><span class="tag-badge owner">${item.owner}</span></td>
          <td>${item.target || '-'}</td>
          <td>${item.item}</td>
          <td>${item.amount.toFixed(2)}</td>
          <td><span class="tag ${statusTag(item.status)}">${item.statusLabel}</span></td>
          <td>${item.consumeAt}</td>
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
  return Array.from(tableBody.querySelectorAll('input[type="checkbox"]:checked')).map((item) =>
    Number(item.dataset.id)
  );
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

  document.querySelector('#coin-refresh')?.addEventListener('click', () => {
    renderTable();
    alert('\u5df2\u5237\u65b0\u91d1\u5e01\u6d88\u8d39\u8bb0\u5f55\uff08\u6f14\u793a\uff09\u3002');
  });

  document.querySelector('#coin-export')?.addEventListener('click', () => {
    alert('\u5bfc\u51fa\u6d88\u8d39\u8be6\u60c5\uff08\u6f14\u793a\uff09\u3002');
  });

  document.querySelector('#coin-delete')?.addEventListener('click', () => {
    const ids = getSelectedIds();
    if (ids.length === 0) {
      alert('\u8bf7\u9009\u62e9\u9700\u8981\u64cd\u4f5c\u7684\u8bb0\u5f55\u3002');
      return;
    }
    const confirmed = confirm(`\u786e\u5b9a\u5220\u9664 ${ids.length} \u6761\u91d1\u5e01\u6d88\u8d39\u8bb0\u5f55\u5417\uff1f`);
    if (confirmed) alert('\u6f14\u793a\u73af\u5883\uff1a\u4e0d\u4f1a\u6267\u884c\u5b9e\u9645\u64cd\u4f5c\u3002');
  });

  document.querySelector('#coin-more')?.addEventListener('click', () => {
    alert('\u66f4\u591a\u529f\u80fd\u5982\u6d88\u8d39\u5206\u6790\u62a5\u8868\u3001\u901a\u9053\u5206\u6790\u6b63\u5728\u8bbe\u8ba1\uff08\u6f14\u793a\uff09\u3002');
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
