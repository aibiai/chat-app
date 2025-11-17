const nameEl = document.querySelector('#admin-name');
const avatarEl = document.querySelector('#sidebar-avatar');
const logoutBtn = document.querySelector('#logout-btn');
const tableBody = document.querySelector('#avatar-table tbody');
const infoEl = document.querySelector('#avatar-info');
const pagerContainer = document.querySelector('#avatar-pager');
const pageSizeSelect = document.querySelector('#avatar-page-size');
const searchInput = document.querySelector('#avatar-search');
const checkAllEl = document.querySelector('#avatar-check-all');

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

async function fetchReviews() {
  const token = ensureToken();
  if (!token) return;

  state.loading = true;
  try {
    const params = new URLSearchParams({
      type: 'avatar',
      page: String(state.page),
      pageSize: String(state.pageSize)
    });
    if (state.keyword.trim()) params.set('keyword', state.keyword.trim());

    const response = await fetch(`${API_BASE}?${params}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error(`Failed to load reviews: ${response.status}`);
    const data = await response.json();
    state.items = Array.isArray(data.items) ? data.items : [];
    state.total = typeof data.total === 'number' ? data.total : state.items.length;
    state.page = typeof data.page === 'number' ? data.page : state.page;
    state.pageSize = typeof data.pageSize === 'number' ? data.pageSize : state.pageSize;
    renderTable();
  } catch (error) {
    console.error(error);
    alert('加载审核数据失败，请稍后重试。');
  } finally {
    state.loading = false;
  }
}

function renderTable() {
  if (!state.items.length) {
    tableBody.innerHTML = '<tr><td colspan="9" class="empty">暂无数据</td></tr>';
  } else {
    tableBody.innerHTML = state.items
      .map((item) => {
        const user = item.user || {};
        const displayName = user.nickname || user.email || item.userId;
        const submittedAt = formatDate(item.createdAt);
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
          <td>${user.email || '-'}</td>
          <td>
            <div class="avatar-preview">
              <img src="${item.payload?.filePath || ''}" alt="${displayName}" class="member-avatar" width="48" height="48" style="width:48px;height:48px;object-fit:cover;border-radius:10px;border:1px solid rgba(226,232,240,0.75);background:#f1f5f9;" />
              <button class="link-btn" data-action="preview" data-id="${item.id}">预览</button>
            </div>
          </td>
          <td>${user.gender === 'male' ? '男' : user.gender === 'female' ? '女' : '其他'}</td>
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

  document.querySelector('#avatar-refresh')?.addEventListener('click', () => {
    fetchReviews();
  });

  document.querySelector('#avatar-export')?.addEventListener('click', () => {
    alert('导出功能暂未实现，可根据需要扩展。');
  });

  document.querySelector('#avatar-delete')?.addEventListener('click', () => {
    const selected = getSelectedIds();
    if (!selected.length) {
      alert('请选择需要删除的记录。');
      return;
    }
    handleDelete(selected);
  });

  document.querySelector('#avatar-more')?.addEventListener('click', () => {
    alert('演示环境：更多操作暂未实现。');
  });

  tableBody.addEventListener('click', (event) => {
    const target = event.target;
    const actionBtn = target.closest('[data-action]');
    if (!actionBtn) return;
    const action = actionBtn.dataset.action;
    const id = actionBtn.dataset.id;
    const item = state.items.find((row) => row.id === id);
    if (!item) return;

    if (action === 'preview') {
      const url = item.payload?.filePath;
      if (url) window.open(url, '_blank');
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
      return;
    }
    if (action === 'delete-single') {
      handleDelete([id]);
    }
  });
}

async function handleDelete(ids) {
  if (!Array.isArray(ids) || !ids.length) return;
  if (!confirm(`确认删除选中的 ${ids.length} 条审核记录吗？此操作不可恢复。`)) return;
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
      if (response.status === 404) throw new Error('所选记录不存在，可能已被删除。');
      throw new Error('删除失败，请稍后重试。');
    }
    const result = await response.json();
    const deleted = Array.isArray(result.deleted) ? result.deleted.length : ids.length;
    const notFound = Array.isArray(result.notFound) ? result.notFound.length : 0;
    if (deleted && notFound) {
      alert(`已删除 ${deleted} 条，另有 ${notFound} 条未找到。`);
    } else if (deleted) {
      alert(`已删除 ${deleted} 条审核记录。`);
    } else {
      alert('未找到需要删除的记录。');
    }
    await fetchReviews();
    if (checkAllEl) checkAllEl.checked = false;
  } catch (error) {
    console.error('[avatar-review] delete error', error);
    alert(error instanceof Error ? error.message : '删除失败，请稍后重试。');
  } finally {
    state.loading = false;
  }
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
