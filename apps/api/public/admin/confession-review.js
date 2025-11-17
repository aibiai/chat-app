const nameEl = document.querySelector('#admin-name');
const avatarEl = document.querySelector('#sidebar-avatar');
const logoutBtn = document.querySelector('#logout-btn');
const tableBody = document.querySelector('#confession-table tbody');
const infoEl = document.querySelector('#confession-info');
const pagerContainer = document.querySelector('#confession-pager');
const pageSizeSelect = document.querySelector('#confession-page-size');
const searchInput = document.querySelector('#confession-search');
const checkAllEl = document.querySelector('#confession-check-all');

const API_BASE = '/admin/api/reviews';

const state = {
  page: 1,
  pageSize: 10,
  total: 0,
  keyword: '',
  items: [],
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

function translateStatus(status) {
  if (status === 'approved') return '通过';
  if (status === 'rejected') return '已拒绝';
  return '待审';
}

function statusClass(status) {
  if (status === 'approved') return 'active';
  if (status === 'rejected') return 'disabled';
  return 'pending';
}

function formatDate(ts) {
  if (!ts) return '-';
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return '-';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function escapeHTML(str = '') {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function fetchReviews() {
  const token = ensureToken();
  if (!token) return;

  state.loading = true;
  try {
    const params = new URLSearchParams({
      type: 'confession',
      page: String(state.page),
      pageSize: String(state.pageSize)
    });
    if (state.keyword.trim()) params.set('keyword', state.keyword.trim());

    const response = await fetch(`${API_BASE}?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`Failed to load confession reviews: ${response.status}`);
    const data = await response.json();
    state.items = Array.isArray(data.items) ? data.items : [];
    state.total = typeof data.total === 'number' ? data.total : state.items.length;
    state.page = typeof data.page === 'number' ? data.page : state.page;
    state.pageSize = typeof data.pageSize === 'number' ? data.pageSize : state.pageSize;
    renderTable();
  } catch (error) {
    console.error(error);
    alert('加载表白墙审核数据失败，请稍后重试。');
  } finally {
    state.loading = false;
  }
}

function renderTable() {
  if (!state.items.length) {
    tableBody.innerHTML = '<tr><td colspan="7" class="empty">暂无数据</td></tr>';
  } else {
    tableBody.innerHTML = state.items
      .map((item) => {
        const user = item.user || {};
        const displayName = user.nickname || user.email || item.userId;
        const submittedAt = formatDate(item.createdAt);
        const payload = item.payload || {};
        const text = escapeHTML(payload.text || '');
        const displayText = text.length > 80 ? `${text.slice(0, 80)}…` : text || '（无文案）';
        return `
        <tr data-id="${item.id}">
          <td><input type="checkbox" data-id="${item.id}" /></td>
          <td>${item.id}</td>
          <td>
            <div class="cell-with-meta">
              <strong>${displayName}</strong>
              <small>提交时间：${submittedAt}</small>
            </div>
          </td>
          <td>
            <div class="avatar-preview">
              <img src="${payload.img || ''}" alt="${displayName}" class="member-avatar" width="48" height="48" />
              <button class="link-btn" data-action="preview" data-id="${item.id}">预览</button>
            </div>
          </td>
          <td>
            <div class="cell-with-meta">
              <span>${displayText}</span>
            </div>
          </td>
          <td>
            <span class="status-pill ${statusClass(item.status)}">${translateStatus(item.status)}</span>
            ${item.reviewedAt ? `<small class="block text-xs text-slate-400 mt-1">审核：${formatDate(item.reviewedAt)}</small>` : ''}
          </td>
          <td>
            <div class="table-actions">
              <button class="action-btn approve" data-action="approve" data-id="${item.id}" title="通过">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="m9 16.17-3.58-3.59L4 14l5 5 11-11-1.41-1.42Z" />
                </svg>
              </button>
              <button class="action-btn reject" data-action="reject" data-id="${item.id}" title="驳回">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12Z" />
                </svg>
              </button>
              <button class="action-btn info" data-action="reason" data-id="${item.id}" title="查看原因">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M11 7h2v2h-2m0 4h2v6h-2m1-16A10 10 0 1 0 21 12 10 10 0 0 0 12 2Z"/>
                </svg>
              </button>
            </div>
          </td>
        </tr>`;
      })
      .join('');
  }

  const totalPages = Math.max(1, Math.ceil(state.total / state.pageSize));
  infoEl.innerHTML = `显示第&nbsp;${state.page}&nbsp;页&nbsp;/&nbsp;共&nbsp;${totalPages}&nbsp;页，总计&nbsp;${state.total}&nbsp;条记录`;

  const buttons = [];
  const startPage = Math.max(1, state.page - 2);
  const endPage = Math.min(totalPages, startPage + 4);
  for (let i = startPage; i <= endPage; i++) {
    buttons.push(`<button data-page="${i}" class="${i === state.page ? 'active' : ''}">${i}</button>`);
  }
  pagerContainer.innerHTML = buttons.join('');
}

function getSelectedIds() {
  return Array.from(tableBody.querySelectorAll('input[type="checkbox"]:checked')).map((node) => String(node.dataset.id || ''));
}

async function handleApprove(id) {
  if (state.loading) return;
  const token = ensureToken();
  if (!token) return;
  try {
    const response = await fetch(`${API_BASE}/${id}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error('审核失败');
    await fetchReviews();
  } catch (error) {
    console.error(error);
    alert('设置通过失败，请稍后重试。');
  }
}

async function handleReject(id) {
  if (state.loading) return;
  const token = ensureToken();
  if (!token) return;
  const reason = prompt('请输入驳回原因（可留空）：') || '';
  try {
    const response = await fetch(`${API_BASE}/${id}/reject`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reason.trim() || undefined })
    });
    if (!response.ok) throw new Error('驳回失败');
    await fetchReviews();
  } catch (error) {
    console.error(error);
    alert('驳回失败，请稍后重试。');
  }
}

async function handleDelete(ids) {
  if (state.loading) return;
  if (!Array.isArray(ids) || ids.length === 0) return;
  if (!confirm(`\u786e\u8ba4\u5220\u9664\u9009\u4e2d\u7684 ${ids.length} \u6761\u8bb0\u5f55\u5417\uff1f`)) return;
  const token = ensureToken();
  if (!token) return;
  try {
    state.loading = true;
    const response = await fetch(`${API_BASE}/delete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
    });
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('\u9009\u4e2d\u7684\u8bb0\u5f55\u4e0d\u5b58\u5728\uff0c\u53ef\u80fd\u5df2\u88ab\u5220\u9664\u3002');
      }
      throw new Error('\u5220\u9664\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002');
    }
    const result = await response.json();
    const deletedCount = Array.isArray(result.deleted) ? result.deleted.length : ids.length;
    const notFoundCount = Array.isArray(result.notFound) ? result.notFound.length : 0;
    if (notFoundCount && !deletedCount) {
      alert('\u672a\u627e\u5230\u9700\u8981\u5220\u9664\u7684\u8bb0\u5f55\uff0c\u53ef\u80fd\u88ab\u5176\u4ed6\u7ba1\u7406\u5458\u5904\u7406\u3002');
    } else if (notFoundCount) {
      alert(`\u5df2\u5220\u9664 ${deletedCount} \u6761\u8bb0\u5f55\uff0c\u53e6\u6709 ${notFoundCount} \u6761\u672a\u627e\u5230\u3002`);
    } else {
      alert(`\u5df2\u5220\u9664 ${deletedCount} \u6761\u8bb0\u5f55\u3002`);
    }
    await fetchReviews();
  } catch (error) {
    console.error(error);
    alert(error instanceof Error ? error.message : '\u5220\u9664\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002');
  } finally {
    state.loading = false;
    if (checkAllEl) checkAllEl.checked = false;
  }
}

function bindEvents() {
  searchInput?.addEventListener('input', (event) => {
    state.keyword = event.target.value;
    state.page = 1;
    fetchReviews();
  });

  pageSizeSelect?.addEventListener('change', (event) => {
    state.pageSize = Number(event.target.value) || 10;
    state.page = 1;
    fetchReviews();
  });

  pagerContainer?.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    state.page = Number(button.dataset.page) || 1;
    fetchReviews();
  });

  document.querySelectorAll('.table-pager .pager-btn').forEach((btn) =>
    btn.addEventListener('click', (event) => {
      const type = event.currentTarget.dataset.page;
      const totalPages = Math.max(1, Math.ceil(state.total / state.pageSize));
      if (type === 'prev') state.page = Math.max(1, state.page - 1);
      if (type === 'next') state.page = Math.min(totalPages, state.page + 1);
      fetchReviews();
    })
  );

  checkAllEl?.addEventListener('change', (event) => {
    const checked = event.target.checked;
    tableBody.querySelectorAll('input[type="checkbox"]').forEach((box) => {
      box.checked = checked;
    });
  });

  document.querySelector('#confession-refresh')?.addEventListener('click', () => fetchReviews());
  document.querySelector('#confession-export')?.addEventListener('click', () =>
    alert('\u5bfc\u51fa\u529f\u80fd\u6682\u672a\u5b9e\u73b0\uff0c\u53ef\u6839\u636e\u9700\u8981\u6269\u5c55\u3002')
  );

  document.querySelector('#confession-delete')?.addEventListener('click', () => {
    const selected = getSelectedIds();
    if (!selected.length) {
      alert('\u8bf7\u9009\u62e9\u9700\u8981\u64cd\u4f5c\u7684\u8bb0\u5f55\u3002');
      return;
    }
    handleDelete(selected);
  });
  document.querySelector('#confession-more')?.addEventListener('click', () => {
    alert('\u6f14\u793a\u73af\u5883\uff1a\u66f4\u591a\u64cd\u4f5c\u6682\u672a\u5b9e\u73b0\u3002');
  });
  tableBody.addEventListener('click', (event) => {
    const target = event.target;
    const actionBtn = target.closest('[data-action]');
    if (!actionBtn) return;
    const id = actionBtn.dataset.id;
    const item = state.items.find((row) => row.id === id);
    if (!item) return;
    const action = actionBtn.dataset.action;

    if (action === 'preview') {
      const url = item.payload?.img;
      if (url) window.open(url, '_blank');
      else alert('暂无可预览的图片。');
      return;
    }

    if (action === 'reason') {
      const message = item.reason ? `最近一次审核说明：${item.reason}` : '暂无审核说明。';
      alert(message);
      return;
    }

    if (action === 'approve') {
      handleApprove(id);
      return;
    }

    if (action === 'reject') {
      handleReject(id);
    }
  });
}

ensureToken();
renderProfile();
bindEvents();
fetchReviews();

logoutBtn?.addEventListener('click', () => {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_profile');
  window.location.replace('/admin/login');
});
