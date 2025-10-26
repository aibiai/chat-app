const nameEl = document.querySelector('#admin-name');
const avatarEl = document.querySelector('#sidebar-avatar');
const logoutBtn = document.querySelector('#logout-btn');
const tableBody = document.querySelector('#recharge-table tbody');
const infoEl = document.querySelector('#recharge-info');
const pagerContainer = document.querySelector('#recharge-pager');
const pageSizeSelect = document.querySelector('#recharge-page-size');
const searchInput = document.querySelector('#recharge-search');
const checkAllEl = document.querySelector('#recharge-check-all');
const statusFilter = document.querySelector('#status-filter');
const typeFilter = document.querySelector('#type-filter');

const records = [
  {
    id: 15183,
    orderNo: '202509100385680486',
    account: 'a8680193',
    owner: 'Alex005',
    amount: 388,
    paidAmount: 388,
    type: '充值',
    method: '支付2',
    status: 'success',
    statusLabel: '成功',
    remark: '',
    rechargeAt: '2025-10-01 20:53:56'
  },
  {
    id: 15182,
    orderNo: '202509050037865808177',
    account: 'qqw123',
    owner: 'Alex003',
    amount: 50,
    paidAmount: 0,
    type: '充值',
    method: '支付2',
    status: 'pending',
    statusLabel: '提交订单',
    remark: 'order faild',
    rechargeAt: '2025-09-30 18:55:57'
  },
  {
    id: 15181,
    orderNo: '202509030042710313',
    account: 'jerry0422',
    owner: 'Alex002',
    amount: 120,
    paidAmount: 120,
    type: '升级',
    method: '支付2',
    status: 'success',
    statusLabel: '成功',
    remark: '-',
    rechargeAt: '2025-09-30 18:57:42'
  },
  {
    id: 15180,
    orderNo: '202509020020474027413',
    account: 'Aa19780710',
    owner: 'Alex005',
    amount: 120,
    paidAmount: 120,
    type: '升级',
    method: '支付2',
    status: 'success',
    statusLabel: '成功',
    remark: '-',
    rechargeAt: '2025-09-30 18:51:42'
  },
  {
    id: 15178,
    orderNo: '2025090300155551221855',
    account: 'Aa19780710',
    owner: 'Alex005',
    amount: 16,
    paidAmount: 0,
    type: '升级',
    method: '支付2',
    status: 'pending',
    statusLabel: '提交订单',
    remark: '(YX007)Payment time out',
    rechargeAt: '2025-09-30 01:55:51'
  },
  {
    id: 15177,
    orderNo: '202509030012704538842',
    account: 'stK19911031',
    owner: 'Alex002',
    amount: 120,
    paidAmount: 0,
    type: '充值',
    method: '支付2',
    status: 'pending',
    statusLabel: '提交订单',
    remark: '(YX007)Payment time out',
    rechargeAt: '2025-09-30 01:27:04'
  },
  {
    id: 15176,
    orderNo: '202509030012702160067',
    account: 'stK19911031',
    owner: 'Alex002',
    amount: 120,
    paidAmount: 0,
    type: '充值',
    method: '支付2',
    status: 'pending',
    statusLabel: '提交订单',
    remark: '(YX007)Payment time out',
    rechargeAt: '2025-09-30 01:27:02'
  },
  {
    id: 15175,
    orderNo: '202509030012700324808',
    account: 'stK19911031',
    owner: 'Alex002',
    amount: 120,
    paidAmount: 0,
    type: '充值',
    method: '支付2',
    status: 'pending',
    statusLabel: '提交订单',
    remark: 'order faild',
    rechargeAt: '2025-09-30 01:27:00'
  },
  {
    id: 15174,
    orderNo: '2025090300124556922785',
    account: 'Amiy',
    owner: 'Alex005',
    amount: 100,
    paidAmount: 0,
    type: '充值',
    method: '支付2',
    status: 'pending',
    statusLabel: '提交订单',
    remark: '-',
    rechargeAt: '2025-09-30 01:24:55'
  },
  {
    id: 15173,
    orderNo: '202509022359207645210',
    account: 'guest129',
    owner: 'Alex001',
    amount: 60,
    paidAmount: 60,
    type: '充值',
    method: '支付1',
    status: 'success',
    statusLabel: '成功',
    remark: '-',
    rechargeAt: '2025-09-29 23:59:59'
  }
];

const state = {
  page: 1,
  pageSize: 10,
  keyword: '',
  status: 'all',
  type: 'all'
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

function statusTag(status) {
  if (status === 'success') return 'accent-emerald';
  if (status === 'pending') return 'accent-amber';
  if (status === 'failed') return 'accent-rose';
  return 'neutral';
}

function normalizeKeyword(source) {
  return (source || '').toString().trim().toLowerCase();
}

function filterData() {
  return records.filter((record) => {
    const keyword = normalizeKeyword(state.keyword);
    const matchedKeyword =
      !keyword ||
      record.orderNo.toLowerCase().includes(keyword) ||
      record.account.toLowerCase().includes(keyword) ||
      record.owner.toLowerCase().includes(keyword);
    const matchedStatus = state.status === 'all' || record.status === state.status;
    const matchedType = state.type === 'all' || record.type === state.type;
    return matchedKeyword && matchedStatus && matchedType;
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
    tableBody.innerHTML = '<tr><td colspan="12" class="empty">\u6682\u65e0\u6570\u636e</td></tr>';
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
          <td>${item.amount.toFixed(2)}</td>
          <td>${item.paidAmount.toFixed(2)}</td>
          <td><span class="tag ${typeTag(item.type)}">${item.type}</span></td>
          <td><a class="link" href="#">${item.method}</a></td>
          <td><span class="tag ${statusTag(item.status)}">${item.statusLabel}</span></td>
          <td>${item.remark && item.remark !== '-' ? item.remark : '-'}</td>
          <td>${item.rechargeAt}</td>
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

  statusFilter?.addEventListener('change', (event) => {
    state.status = event.target.value;
    state.page = 1;
    renderTable();
  });

  typeFilter?.addEventListener('change', (event) => {
    state.type = event.target.value;
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

  document.querySelector('#recharge-refresh')?.addEventListener('click', () => {
    renderTable();
    alert('\u5df2\u5237\u65b0\u5145\u503c\u8bb0\u5f55\uff08\u6f14\u793a\uff09\u3002');
  });

  document.querySelector('#recharge-export')?.addEventListener('click', () => {
    alert('\u5bfc\u51fa\u5145\u503c\u660e\u7ec6\uff08\u6f14\u793a\uff09\u3002');
  });

  document.querySelector('#recharge-delete')?.addEventListener('click', () => {
    const ids = getSelectedIds();
    if (ids.length === 0) {
      alert('\u8bf7\u9009\u62e9\u9700\u8981\u64cd\u4f5c\u7684\u8bb0\u5f55\u3002');
      return;
    }
    const confirmed = confirm(`\u786e\u5b9a\u5220\u9664 ${ids.length} \u6761\u5145\u503c\u8bb0\u5f55\u5417\uff1f`);
    if (confirmed) alert('\u6f14\u793a\u73af\u5883\uff1a\u4e0d\u4f1a\u6267\u884c\u5b9e\u9645\u64cd\u4f5c\u3002');
  });

  document.querySelector('#recharge-more')?.addEventListener('click', () => {
    alert('\u66f4\u591a\u529f\u80fd\u5982\u5bfc\u51fa\u62a5\u8868\u3001\u652f\u4ed8\u901a\u9053\u5206\u6790\u6b63\u5728\u8bbe\u8ba1\uff08\u6f14\u793a\uff09\u3002');
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
