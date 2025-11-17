const nameEl = document.querySelector('#admin-name');
const avatarEl = document.querySelector('#sidebar-avatar');
const logoutBtn = document.querySelector('#logout-btn');
const tableBody = document.querySelector('#card-table tbody');
const infoEl = document.querySelector('#card-info');
const pagerContainer = document.querySelector('#card-pager');
const pageSizeSelect = document.querySelector('#card-page-size');
const searchInput = document.querySelector('#card-search');
const checkAllEl = document.querySelector('#card-check-all');
const statusFilter = document.querySelector('#card-status-filter');

const API_BASE = '/admin/api/cards';

const state = {
  items: [],
  total: 0,
  page: 1,
  pageSize: Number(pageSizeSelect?.value) || 10,
  keyword: '',
  status: 'all',
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

function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

function formatDate(value) {
  if (!value) return '-';
  const num = Number(value);
  const date = Number.isFinite(num) ? new Date(num) : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

function formatBalance(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(2) : '0.00';
}

function statusLabel(status) {
  if (status === 'approved') return '已通过';
  if (status === 'rejected') return '已驳回';
  return '待审核';
}

function statusTag(status) {
  if (status === 'approved') return 'accent-teal';
  if (status === 'rejected') return 'accent-rose';
  return 'accent-amber';
}

function genderLabel(value) {
  if (value === 'male') return '男';
  if (value === 'female') return '女';
  if (value === 'other') return '其他';
  return value ? escapeHtml(value) : '-';
}

function renderTable() {
  if (checkAllEl) checkAllEl.checked = false;
  if (!tableBody) return;

  if (!state.items.length) {
    tableBody.innerHTML = '<tr><td colspan="13" class="empty">暂无数据</td></tr>';
    return;
  }

  tableBody.innerHTML = state.items
    .map((item) => {
      const id = escapeAttr(item.id || '');
      const userId = escapeAttr(item.userId || '');
      const nickname = escapeHtml(item.username || '-');
      const avatar = typeof item.avatar === 'string' && item.avatar.trim() ? item.avatar.trim() : '';
      // 当用户未上传自定义头像时，使用首字母占位头像，避免出现“—”占位
      const initial = (String(item.username || item.email || item.userId || 'U').trim()[0] || 'U')
        .toString()
        .toUpperCase();
      const avatarCell = avatar
        ? `<img src="${escapeAttr(avatar)}" alt="头像" class="avatar-thumb" width="40" height="40" style="width:40px;height:40px;border-radius:50%;object-fit:cover;box-shadow:0 2px 6px rgba(0,0,0,.15);" />`
        : `<span class="avatar-thumb empty" aria-label="默认头像" title="默认头像"
             style="display:inline-block;width:40px;height:40px;border-radius:50%;background:#e5e7eb;color:#374151;font-weight:600;font-size:14px;line-height:40px;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,.05);">${escapeHtml(initial)}</span>`;
      const email = escapeHtml(item.email || '-');
      const gender = genderLabel(item.gender);
      // 会员等级：使用 membershipLevel 并转成彩色标签（普通/水晶/帝皇）
      const membershipLevel = typeof item.membershipLevel === 'string' ? item.membershipLevel : 'none';
      const levelNum = membershipLevel === 'crown' ? 2 : membershipLevel === 'purple' ? 1 : 0;
      const levelLabel = levelNum === 2 ? '帝皇' : levelNum === 1 ? '水晶' : '普通';
      const levelHtml = `<span class="level-tag level-${levelNum}" data-level="${levelNum}">${levelLabel}</span>`;
      const status = item.status || 'pending';

      // 图片：优先使用 images 数组，最多 4 张；否则回落到 imageUrl 填充第 1 列
      const imgs = Array.isArray(item.images) && item.images.length
        ? item.images.slice(0, 4).map((u) => (typeof u === 'string' ? u : '')).filter(Boolean)
        : (typeof item.imageUrl === 'string' && item.imageUrl ? [item.imageUrl] : []);
      const cellImg = (idx) => {
        const url = imgs[idx] || '';
        return url ? `<img class="thumb-64" data-preview-src="${escapeAttr(url)}" src="${escapeAttr(url)}" alt="凭证${idx+1}" />` : '-';
      };
      const approveDisabled = status === 'approved' ? ' disabled' : '';
      const rejectDisabled = status === 'rejected' ? ' disabled' : '';
      return `
        <tr data-user-id="${userId}">
          <td><input type="checkbox" data-id="${id}" /></td>
          <td>${id}</td>
          <td>${avatarCell}</td>
          <td>${nickname}</td>
          <td>${email}</td>
          <td>${gender}</td>
          <td>${levelHtml}</td>
          <td>${cellImg(0)}</td>
          <td>${cellImg(1)}</td>
          <td>${cellImg(2)}</td>
          <td>${cellImg(3)}</td>
          <td><span class="tag ${statusTag(status)}">${statusLabel(status)}</span></td>
          <td class="ops">
            <button class="link-btn" data-action="approve" data-id="${id}"${approveDisabled}>通过</button>
            <button class="link-btn danger" data-action="reject" data-id="${id}"${rejectDisabled}>驳回</button>
          </td>
        </tr>`;
    })
    .join('');
}

function renderInfo() {
  if (!infoEl) return;
  const totalPages = Math.max(1, Math.ceil(state.total / state.pageSize));
  if (state.page > totalPages) state.page = totalPages;
  infoEl.textContent = `显示第 ${state.page} 页 / 共 ${totalPages} 页，总计 ${state.total} 条记录`;
  if (pageSizeSelect) pageSizeSelect.value = String(state.pageSize);
  if (statusFilter) statusFilter.value = state.status;
  renderPager(totalPages);
}

function renderPager(totalPages) {
  if (!pagerContainer) return;
  const buttons = [];
  const max = 5;
  let start = Math.max(1, state.page - Math.floor(max / 2));
  let end = start + max - 1;
  if (end > totalPages) {
    end = totalPages;
    start = Math.max(1, end - max + 1);
  }
  for (let page = start; page <= end; page += 1) {
    const activeClass = page === state.page ? 'active' : '';
    buttons.push(`<button data-page="${page}" class="${activeClass}">${page}</button>`);
  }
  pagerContainer.innerHTML = buttons.join('');
}

function getSelectedIds() {
  if (!tableBody) return [];
  return Array.from(tableBody.querySelectorAll('input[type="checkbox"]:checked')).map((item) =>
    String(item.dataset.id || '').trim()
  );
}

async function fetchRecords(force = false) {
  if (state.loading && !force) return;
  const token = ensureToken();
  if (!token) return;
  try {
    state.loading = true;
    const params = new URLSearchParams({
      page: String(state.page),
      pageSize: String(state.pageSize)
    });
    const keyword = state.keyword.trim();
    if (keyword) params.set('keyword', keyword);
    if (state.status && state.status !== 'all') params.set('status', state.status);

    const response = await fetch(`${API_BASE}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      throw new Error('加载失败，请稍后重试。');
    }
    const result = await response.json();
    const items = Array.isArray(result.items) ? result.items : [];
    state.items = items;
    state.total = Number(result.total) || items.length;
    renderTable();
    renderInfo();
  } catch (error) {
    console.error(error);
    alert(error instanceof Error ? error.message : '加载失败，请稍后重试。');
  } finally {
    state.loading = false;
  }
}

async function handleDelete(ids) {
  if (!ids.length) return;
  if (!confirm(`确认删除选中 ${ids.length} 条记录吗？`)) return;
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
    if (deleted && notFound) {
      alert(`已删除 ${deleted} 条记录，另有 ${notFound} 条未找到。`);
    } else if (deleted) {
      alert(`已删除 ${deleted} 条记录。`);
    } else {
      alert('未找到需要删除的记录，可能已被其他管理员处理。');
    }
    await fetchRecords(true);
  } catch (error) {
    console.error(error);
    alert(error instanceof Error ? error.message : '删除失败，请稍后重试。');
  } finally {
    state.loading = false;
    if (checkAllEl) checkAllEl.checked = false;
  }
}

async function handleAction(id, action) {
  if (state.loading || !id) return;
  const token = ensureToken();
  if (!token) return;
  try {
    state.loading = true;
    let endpoint = `${API_BASE}/${encodeURIComponent(id)}/approve`;
    let body = JSON.stringify({});
    if (action === 'reject') {
      const reasonInput = prompt('请输入驳回原因（可选）：', '') ?? '';
      const reason = reasonInput.trim();
      endpoint = `${API_BASE}/${encodeURIComponent(id)}/reject`;
      body = JSON.stringify(reason ? { reason } : {});
    }
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body
    });
    if (!response.ok) {
      if (response.status === 404) throw new Error('记录不存在或已被处理。');
      throw new Error('操作失败，请稍后重试。');
    }
    await fetchRecords(true);
  } catch (error) {
    console.error(error);
    alert(error instanceof Error ? error.message : '操作失败，请稍后重试。');
  } finally {
    state.loading = false;
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

  pagerContainer?.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const next = Number(button.dataset.page);
    if (Number.isFinite(next) && next !== state.page) {
      state.page = next;
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
    tableBody?.querySelectorAll('input[type="checkbox"]').forEach((box) => {
      box.checked = checked;
    });
  });

  document.querySelector('#card-refresh')?.addEventListener('click', () => fetchRecords());

  document.querySelector('#card-delete')?.addEventListener('click', () => {
    const ids = getSelectedIds();
    if (!ids.length) {
      alert('请选择需要删除的记录。');
      return;
    }
    handleDelete(ids);
  });

  document.querySelector('#card-more')?.addEventListener('click', () => {
    alert('演示环境：更多操作暂未实现。');
  });

  tableBody?.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const id = button.dataset.id;
    const action = button.dataset.action;
    if (!id || !action) return;
    handleAction(id, action);
  });

  // 图片预览
  const viewer = document.getElementById('img-viewer');
  const viewerImg = document.getElementById('img-viewer-img');
  const btnPrev = document.getElementById('img-viewer-prev');
  const btnNext = document.getElementById('img-viewer-next');
  let currentImages = [];
  let currentIndex = 0;

  function showAt(idx) {
    if (!currentImages.length) return;
    currentIndex = (idx + currentImages.length) % currentImages.length;
    viewerImg.src = currentImages[currentIndex];
  }
  tableBody?.addEventListener('click', (e) => {
    const img = e.target.closest('img.thumb-64');
    if (!img) return;
    const src = img.getAttribute('data-preview-src') || img.getAttribute('src');
    if (!src || !viewer || !viewerImg) return;
    // 收集当前行的最多 4 张图
    const row = img.closest('tr');
    const urls = [];
    if (row) {
      const imgs = row.querySelectorAll('img.thumb-64');
      imgs.forEach((im) => {
        const u = im.getAttribute('data-preview-src') || im.getAttribute('src');
        if (u) urls.push(u);
      });
    }
    currentImages = urls.length ? urls : [src];
    currentIndex = Math.max(0, currentImages.indexOf(src));
    viewerImg.src = currentImages[currentIndex];
    viewer.classList.add('open');
    viewer.setAttribute('aria-hidden', 'false');
  });
  viewer?.addEventListener('click', (e) => {
    const isClose = e.target.matches('[data-action="close"], .backdrop');
    if (!isClose) return;
    viewer.classList.remove('open');
    viewer.setAttribute('aria-hidden', 'true');
    if (viewerImg) viewerImg.removeAttribute('src');
    currentImages = [];
    currentIndex = 0;
  });

  btnPrev?.addEventListener('click', (e) => { e.stopPropagation(); if (!viewer.classList.contains('open')) return; showAt(currentIndex - 1); });
  btnNext?.addEventListener('click', (e) => { e.stopPropagation(); if (!viewer.classList.contains('open')) return; showAt(currentIndex + 1); });

  document.addEventListener('keydown', (e) => {
    if (!viewer || !viewer.classList.contains('open')) return;
    if (e.key === 'Escape') {
      viewer.classList.remove('open');
      viewer.setAttribute('aria-hidden', 'true');
      if (viewerImg) viewerImg.removeAttribute('src');
      currentImages = [];
      currentIndex = 0;
      return;
    }
    if (e.key === 'ArrowLeft') showAt(currentIndex - 1);
    if (e.key === 'ArrowRight') showAt(currentIndex + 1);
  });
}

ensureToken();
renderProfile();
bindEvents();
fetchRecords();

// ---- 实时会员等级监听（WebSocket）----
// 事件: admin:member-updated -> { id: <userId>, level: 0|1|2 }
try {
  import('https://cdn.socket.io/4.7.2/socket.io.esm.min.js').then(({ io }) => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;
    const socket = io('/', { auth: { token } });
    socket.on('connect_error', (err) => console.warn('[socket:card-review connect_error]', err.message));
    socket.on('admin:member-updated', (member) => {
      if (!member || !member.id) return;
      // 找到所有属于该用户的点卡记录行（可能多条）
      const rows = tableBody?.querySelectorAll(`tr[data-user-id="${member.id}"]`) || [];
      if (!rows.length) return; // 当前页无该用户记录
      const num = Number(member.level ?? 0);
      const label = num === 2 ? '帝皇' : num === 1 ? '水晶' : '普通';
      rows.forEach((row) => {
        const levelCell = row.querySelector('td:nth-child(7)'); // 新列序：1复选框 2 ID 3 头像 4 昵称 5 Email 6 性别 7 会员等级
        if (levelCell) {
          const prevNum = Number(levelCell.querySelector('.level-tag')?.getAttribute('data-level') || '-1');
          if (prevNum !== num) {
            levelCell.innerHTML = `<span class="level-tag level-${num}" data-level="${num}">${label}</span>`;
          }
        }
        // 如果事件里未来补充 avatar，可一并更新第3列
        if (member.avatar) {
          const avatarCell = row.querySelector('td:nth-child(3)');
          if (avatarCell) {
            const img = avatarCell.querySelector('img.avatar-thumb');
            if (!img || img.src !== member.avatar) {
              avatarCell.innerHTML = `<img src="${escapeAttr(member.avatar)}" alt="头像" class="avatar-thumb" width="40" height="40" style="width:40px;height:40px;border-radius:50%;object-fit:cover;box-shadow:0 2px 6px rgba(0,0,0,.15);" />`;
            }
          }
        }
      });
    });
  }).catch(err => console.warn('[socket:card-review load_failed]', err));
} catch (err) {
  console.warn('[socket:card-review setup_failed]', err);
}

logoutBtn?.addEventListener('click', () => {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_profile');
  window.location.replace('/admin/login');
});

