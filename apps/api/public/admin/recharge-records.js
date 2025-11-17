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
const startInput = document.querySelector('#start-date');
const endInput = document.querySelector('#end-date');

const API_BASE = '/admin/api/orders';

const state = {
  items: [],
  total: 0,
  page: 1,
  pageSize: Number(pageSizeSelect?.value) || 10,
  keyword: '',
  status: 'all',
  type: 'all',
  start: '',
  end: '',
  loading: false
};

function getToken() {
  const token = localStorage.getItem('admin_token');
  if (!token) {
    window.location.replace('/admin/login');
    return null;
  }
  return token;
}

function ensureToken() {
  return getToken();
}

function readProfile() {
  try {
    const raw = localStorage.getItem('admin_profile');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function renderProfile() {
  const profile = readProfile() || {};
  const displayName = profile.nickname || profile.username || '管理员';
  if (nameEl) nameEl.textContent = displayName;
  if (avatarEl) avatarEl.textContent = displayName.slice(0, 1).toUpperCase();
}

function formatDate(value) {
  if (!value) return '-';
  const num = Number(value);
  const date = Number.isFinite(num) ? new Date(num) : new Date(value);
  if (Number.isNaN(date.getTime())) return value.toString();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

function formatAmount(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(2) : '0.00';
}

function typeLabel(type) {
  if (type === 'upgrade') return '升级';
  return '充值';
}

function statusLabel(status) {
  if (status === 'success') return '成功';
  if (status === 'pending') return '提交订单';
  if (status === 'failed') return '支付失败';
  return status || '-';
}

function statusTag(status) {
  if (status === 'success') return 'accent-teal';
  if (status === 'pending') return 'accent-amber';
  if (status === 'failed') return 'accent-rose';
  return 'accent-slate';
}

function renderTable() {
  if (checkAllEl) checkAllEl.checked = false;

  if (!state.items.length) {
    tableBody.innerHTML = '<tr><td colspan="12" class="empty">暂无数据</td></tr>';
    return;
  }

  tableBody.innerHTML = state.items
    .map((item) => {
      const amount = formatAmount(item.amount);
      const paidAmount = formatAmount(item.paidAmount);
      const createdAt = formatDate(item.createdAt || item.rechargeAt);
      const method = item.method || '-';
      const type = item.type || 'recharge';
      const status = item.status || 'success';
      const note = item.note || item.remark || '-';
      return `
        <tr>
          <td><input type="checkbox" data-id="${item.id}" /></td>
          <td>${item.id}</td>
          <td>${item.orderNo || '-'}</td>
          <td>${item.account || '-'}</td>
          <td><span class="tag-badge owner">${item.owner || '-'}</span></td>
          <td>${amount}</td>
          <td>${paidAmount}</td>
          <td><span class="tag ${type === 'recharge' ? 'accent-rose' : 'accent-amber'}">${typeLabel(type)}</span></td>
          <td><span class="link">${method}</span></td>
          <td><span class="tag ${statusTag(status)}">${statusLabel(status)}</span></td>
          <td>${note || '-'}</td>
          <td>${createdAt}</td>
        </tr>`;
    })
    .join('');
}

function renderInfo() {
  const totalPages = Math.max(1, Math.ceil(state.total / state.pageSize));
  if (state.page > totalPages) state.page = totalPages;
  infoEl.innerHTML = `显示第&nbsp;${state.page}&nbsp;页&nbsp;/&nbsp;共&nbsp;${totalPages}&nbsp;页，总计&nbsp;${state.total}&nbsp;条记录`;

  if (pageSizeSelect) pageSizeSelect.value = String(state.pageSize);
  if (statusFilter) statusFilter.value = state.status;
  if (typeFilter) typeFilter.value = state.type;

  const buttons = [];
  const startPage = Math.max(1, state.page - 2);
  const endPage = Math.min(totalPages, startPage + 4);
  for (let i = startPage; i <= endPage; i += 1) {
    buttons.push(`<button data-page="${i}" class="${i === state.page ? 'active' : ''}">${i}</button>`);
  }
  pagerContainer.innerHTML = buttons.join('');
}

function renderAll() {
  renderTable();
  renderInfo();
}

async function fetchRecords() {
  if (state.loading) return;
  const token = ensureToken();
  if (!token) return;
  state.loading = true;
  try {
    const params = new URLSearchParams({
      page: String(state.page),
      pageSize: String(state.pageSize)
    });
    if (state.keyword.trim()) params.set('keyword', state.keyword.trim());
    if (state.status && state.status !== 'all') params.set('status', state.status);
    if (state.type && state.type !== 'all') params.set('type', state.type);
    if (state.start) params.set('start', state.start);
    if (state.end) params.set('end', state.end);

    const response = await fetch(`${API_BASE}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`Failed to load recharge records: ${response.status}`);
    const data = await response.json();
    state.items = Array.isArray(data.items) ? data.items : [];
    state.total = Number(data.total) || state.items.length;
    state.page = Number(data.page) || state.page;
    state.pageSize = Number(data.pageSize) || state.pageSize;
    renderAll();
  } catch (error) {
    console.error(error);
    alert('加载充值记录失败，请稍后重试。');
    state.items = [];
    state.total = 0;
    renderAll();
  } finally {
    state.loading = false;
  }
}

function getSelectedIds() {
  return Array.from(tableBody.querySelectorAll('input[type="checkbox"]:checked')).map((item) =>
    String(item.dataset.id || '').trim()
  );
}

async function handleDelete(ids) {
  if (!ids.length) return;
  if (!confirm(`确认删除选中的 ${ids.length} 条记录吗？`)) return;
  const token = ensureToken();
  if (!token) return;
  try {
    state.loading = true;
    const response = await fetch(`${API_BASE}/delete`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ids })
    });
    if (!response.ok) {
      if (response.status === 404) throw new Error('选中的记录不存在，可能已被删除。');
      throw new Error('删除失败，请稍后重试。');
    }
    const result = await response.json();
    const deleted = Array.isArray(result.deleted) ? result.deleted.length : ids.length;
    const notFound = Array.isArray(result.notFound) ? result.notFound.length : 0;
    if (notFound && !deleted) {
      alert('未找到需要删除的记录，可能已被其他管理员处理。');
    } else if (notFound) {
      alert(`已删除 ${deleted} 条记录，另有 ${notFound} 条未找到。`);
    } else {
      alert(`已删除 ${deleted} 条记录。`);
    }
    await fetchRecords();
  } catch (error) {
    console.error(error);
    alert(error instanceof Error ? error.message : '删除失败，请稍后重试。');
  } finally {
    state.loading = false;
    if (checkAllEl) checkAllEl.checked = false;
  }
}

function bindEvents() {
  let searchTimer = null;
  searchInput?.addEventListener('input', (event) => {
    state.keyword = event.target.value || '';
    state.page = 1;
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(() => fetchRecords(), 300);
  });

  pageSizeSelect?.addEventListener('change', (event) => {
    state.pageSize = Number(event.target.value) || 10;
    state.page = 1;
    fetchRecords();
  });

  statusFilter?.addEventListener('change', (event) => {
    state.status = event.target.value || 'all';
    state.page = 1;
    fetchRecords();
  });

  typeFilter?.addEventListener('change', (event) => {
    state.type = event.target.value || 'all';
    state.page = 1;
    fetchRecords();
  });

  startInput?.addEventListener('change', (e) => {
    state.start = e.target.value || '';
    state.page = 1;
    fetchRecords();
  });

  endInput?.addEventListener('change', (e) => {
    state.end = e.target.value || '';
    state.page = 1;
    fetchRecords();
  });

  pagerContainer?.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const nextPage = Number(button.dataset.page);
    if (Number.isFinite(nextPage) && nextPage !== state.page) {
      state.page = nextPage;
      fetchRecords();
    }
  });

  document.querySelectorAll('.table-pager .pager-btn').forEach((btn) =>
    btn.addEventListener('click', (event) => {
      const type = event.currentTarget.dataset.page;
      const totalPages = Math.max(1, Math.ceil(state.total / state.pageSize));
      if (type === 'prev') state.page = Math.max(1, state.page - 1);
      if (type === 'next') state.page = Math.min(totalPages, state.page + 1);
      fetchRecords();
    })
  );

  checkAllEl?.addEventListener('change', (event) => {
    const checked = event.target.checked;
    tableBody.querySelectorAll('input[type="checkbox"]').forEach((box) => {
      box.checked = checked;
    });
  });

  document.querySelector('#recharge-refresh')?.addEventListener('click', () => fetchRecords());

  // 导出在下方以带上 Authorization 头下载

  document.querySelector('#recharge-delete')?.addEventListener('click', () => {
    const ids = getSelectedIds();
    if (!ids.length) {
      alert('请选择需要操作的记录。');
      return;
    }
    handleDelete(ids);
  });

  document.querySelector('#recharge-export')?.addEventListener('click', async () => {
    const token = ensureToken();
    if (!token) return;
    try {
      const params = new URLSearchParams();
      if (state.keyword.trim()) params.set('keyword', state.keyword.trim());
      if (state.status && state.status !== 'all') params.set('status', state.status);
      if (state.type && state.type !== 'all') params.set('type', state.type);
      if (state.start) params.set('start', state.start);
      if (state.end) params.set('end', state.end);
      const url = `${API_BASE}/export?${params.toString()}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        try {
          const data = await res.json();
          alert(data?.error || `导出失败（${res.status}）`);
        } catch {
          alert(`导出失败（${res.status}）`);
        }
        return;
      }
      const blob = await res.blob();
      const cd = res.headers.get('Content-Disposition') || res.headers.get('content-disposition') || '';
      let filename = 'orders_export.csv';
      const m = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(cd);
      if (m) filename = decodeURIComponent(m[1] || m[2] || filename);
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    } catch (err) {
      console.error(err);
      alert('导出失败，请稍后重试。');
    }
  });
}

ensureToken();
renderProfile();
bindEvents();
fetchRecords();

logoutBtn?.addEventListener('click', () => {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_profile');
  window.location.replace('/admin/login');
});
