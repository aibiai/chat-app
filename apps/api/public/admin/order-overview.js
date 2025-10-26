const nameEl = document.querySelector('#admin-name');
const avatarEl = document.querySelector('#sidebar-avatar');
const logoutBtn = document.querySelector('#logout-btn');
const tableBody = document.querySelector('#order-table tbody');
const infoEl = document.querySelector('#order-info');
const pagerContainer = document.querySelector('#order-pager');
const pageSizeSelect = document.querySelector('#order-page-size');
const searchInput = document.querySelector('#order-search');
const checkAllEl = document.querySelector('#order-check-all');

const orders = [
  {
    id: 15183,
    orderNo: '202509100385680486',
    email: 'a8680193alanhappy@gmail.com',
    account: 'a8680193',
    owner: 'Alex002',
    amount: 388,
    paid: 388,
    type: '充值',
    method: '支付宝',
    createdAt: '2025-10-01 20:35:58',
    paidAt: '2025-10-01 20:55:20'
  },
  {
    id: 15181,
    orderNo: '202509030042710313',
    email: 'a05822515980@gmail.com',
    account: 'jerry0422',
    owner: 'Alex002',
    amount: 120,
    paid: 120,
    type: '升级',
    method: '支付宝',
    createdAt: '2025-09-30 18:57:42',
    paidAt: '2025-09-30 20:17:13'
  },
  {
    id: 15179,
    orderNo: '202509030028570427',
    email: 'ao858685807@gmail.com',
    account: 'Aa19780710',
    owner: 'Alex003',
    amount: 168,
    paid: 168,
    type: '升级',
    method: '支付宝',
    createdAt: '2025-09-30 18:03:07',
    paidAt: '2025-09-30 20:02:54'
  },
  {
    id: 15178,
    orderNo: '202509020011941053',
    email: 'sk10981413@yahoo.com.tw',
    account: 'cv0798413',
    owner: 'Alex003',
    amount: 88,
    paid: 88,
    type: '充值',
    method: '支付宝',
    createdAt: '2025-09-29 23:50:36',
    paidAt: '2025-09-29 23:52:53'
  },
  {
    id: 15163,
    orderNo: '20250902011407340128',
    email: 'love8812052@gmail.com',
    account: 'Ss0098418591',
    owner: 'Alex004',
    amount: 18,
    paid: 18,
    type: '升级',
    method: '支付宝',
    createdAt: '2025-09-29 22:14:07',
    paidAt: '2025-09-29 22:17:35'
  },
  {
    id: 15161,
    orderNo: '20250920095437884306',
    email: 'kl0769413@gmail.com',
    account: 'cv0796413',
    owner: 'Alex005',
    amount: 500,
    paid: 500,
    type: '充值',
    method: '支付宝',
    createdAt: '2025-09-29 21:54:37',
    paidAt: '2025-09-29 21:58:45'
  },
  {
    id: 15132,
    orderNo: '20250928015081731340',
    email: 'a05822515980@gmail.com',
    account: 'jerry0422',
    owner: 'Alex002',
    amount: 16,
    paid: 16,
    type: '升级',
    method: '支付宝',
    createdAt: '2025-09-29 10:15:01',
    paidAt: '2025-09-29 10:19:00'
  },
  {
    id: 15120,
    orderNo: '202509281044003845490',
    email: 'wannmelin026@gmail.com',
    account: '黎耀辉',
    owner: 'Alex002',
    amount: 16,
    paid: 16,
    type: '充值',
    method: '支付宝',
    createdAt: '2025-09-28 22:42:06',
    paidAt: '2025-09-28 22:46:33'
  },
  {
    id: 15107,
    orderNo: '202509280410305348551',
    email: 'm60717@gmail.com',
    account: 'Pplu87',
    owner: 'Alex002',
    amount: 16,
    paid: 16,
    type: '升级',
    method: '支付宝',
    createdAt: '2025-09-28 18:13:05',
    paidAt: '2025-09-28 18:14:21'
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

function typeTag(type) {
  return type === '充值' ? 'accent-rose' : 'accent-amber';
}

function filterData() {
  const keyword = state.keyword.trim().toLowerCase();
  if (!keyword) return orders;
  return orders.filter((order) => {
    return (
      order.orderNo.includes(keyword) ||
      order.email.toLowerCase().includes(keyword) ||
      order.account.toLowerCase().includes(keyword)
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
    tableBody.innerHTML = '<tr><td colspan="12" class="empty">\u6682\u65e0\u6570\u636e</td></tr>';
  } else {
    tableBody.innerHTML = pageData
      .map(
        (item) => `
        <tr>
          <td><input type="checkbox" data-id="${item.id}" /></td>
          <td>${item.id}</td>
          <td>${item.orderNo}</td>
          <td>${item.email}</td>
          <td>${item.account}</td>
          <td><span class="tag-badge owner">${item.owner}</span></td>
          <td>${item.amount.toFixed(2)}</td>
          <td>${item.paid.toFixed(2)}</td>
          <td><span class="tag ${typeTag(item.type)}">${item.type}</span></td>
          <td><a class="link" href="#">${item.method}</a></td>
          <td>${item.createdAt}</td>
          <td>${item.paidAt}</td>
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
    state.keyword = event.target.value.toLowerCase();
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

  document.querySelector('#order-refresh')?.addEventListener('click', () => {
    renderTable();
    alert('\u5df2\u5237\u65b0\u8ba2\u5355\u8bb0\u5f55\uff08\u6f14\u793a\uff09\u3002');
  });

  document.querySelector('#order-export')?.addEventListener('click', () => {
    alert('\u5bfc\u51fa\u8ba2\u5355\u660e\u7ec6\uff08\u6f14\u793a\uff09\u3002');
  });

  document.querySelector('#order-delete')?.addEventListener('click', () => {
    const ids = getSelectedIds();
    if (ids.length === 0) {
      alert('\u8bf7\u9009\u62e9\u9700\u8981\u64cd\u4f5c\u7684\u8ba2\u5355\u3002');
      return;
    }
    const confirmed = confirm(`\u786e\u5b9a\u5220\u9664 ${ids.length} \u6761\u8ba2\u5355\u8bb0\u5f55\u5417\uff1f`);
    if (confirmed) alert('\u6f14\u793a\u73af\u5883\uff1a\u4e0d\u4f1a\u6267\u884c\u5b9e\u9645\u64cd\u4f5c\u3002');
  });

  document.querySelector('#order-more')?.addEventListener('click', () => {
    alert('\u66f4\u591a\u529f\u80fd\u5982\u8ba2\u5355\u91cd\u53d1\u548c\u652f\u4ed8\u65b9\u5f0f\u5206\u7c7b\u6b63\u5728\u8bbe\u8ba1\uff08\u6f14\u793a\uff09\u3002');
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
