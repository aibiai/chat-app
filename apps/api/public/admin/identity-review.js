const nameEl = document.querySelector('#admin-name');
const avatarEl = document.querySelector('#sidebar-avatar');
const logoutBtn = document.querySelector('#logout-btn');
const tableBody = document.querySelector('#identity-table tbody');
const infoEl = document.querySelector('#identity-info');
const pagerContainer = document.querySelector('#identity-pager');
const pageSizeSelect = document.querySelector('#identity-page-size');
const searchInput = document.querySelector('#identity-search');
const statusSelect = document.querySelector('#identity-status');
const checkAllEl = document.querySelector('#identity-check-all');

const API_BASE = '/admin/api/reviews';

const state = {
  page: 1,
  pageSize: 10,
  total: 0,
  keyword: '',
  status: 'all',
  items: [],
  loading: false
};

const PLACEHOLDER_IMG =
  '<span class="thumb-64 placeholder" title="\u65e0\u56fe">-</span>';

function firstNonEmpty(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

const identityKeywordMap = {
  front: ['idfront', 'front', 'frontside', '\u6b63\u9762', 'zheng', 'zhengmian'],
  back: ['idback', 'back', 'reverse', '\u53cd\u9762', 'fan', 'fanmian', '\u80cc\u9762'],
  selfie: ['selfie', 'self', 'handheld', 'hand', 'hold', '\u624b\u6301', '\u624b\u6301\u5408\u7167', '\u5408\u7167', '\u5408\u5f71', '\u81ea\u62cd']
};

const identityArrayFieldCandidates = [
  'identityPhotos',
  'identityImages',
  'identityAttachments',
  'identity',
  'attachments',
  'photos',
  'images',
  'files'
];

function normalizeIdentityEntry(entry, keyHint = '') {
  if (!entry) return null;
  if (typeof entry === 'string') {
    const value = entry.trim();
    if (!value) return null;
    const hint = String(keyHint || '').trim();
    return { value, searchKey: hint.toLowerCase(), rawKey: hint };
  }
  if (typeof entry === 'object') {
    const rawValue =
      entry.value ??
      entry.url ??
      entry.path ??
      entry.src ??
      entry.href ??
      entry.image ??
      entry.base64 ??
      entry.data ??
      '';
    const stringValue = typeof rawValue === 'string' ? rawValue.trim() : '';
    if (!stringValue) return null;
    const rawKey =
      entry.key ??
      entry.type ??
      entry.name ??
      entry.label ??
      entry.field ??
      entry.role ??
      entry.category ??
      entry.slot ??
      entry.kind ??
      entry.position ??
      entry.tag ??
      entry.desc ??
      entry.description ??
      entry.title ??
      entry.target ??
      entry.id ??
      keyHint ??
      '';
    const keyString = typeof rawKey === 'string' ? rawKey.trim() : String(rawKey || '');
    return { value: stringValue, searchKey: keyString.toLowerCase(), rawKey: keyString };
  }
  return null;
}

function collectIdentityEntries(source) {
  const results = [];
  if (!source) return results;
  const visited = new Set();

  const visit = (entry, hint = '') => {
    const normalized = normalizeIdentityEntry(entry, hint);
    if (normalized) {
      const key = `${normalized.rawKey}|${normalized.value}`;
      if (!visited.has(key)) {
        visited.add(key);
        results.push(normalized);
      }
    }
    if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
      Object.entries(entry).forEach(([key, value]) => {
        const nested = normalizeIdentityEntry(value, key);
        if (nested) {
          const nestedKey = `${nested.rawKey}|${nested.value}`;
          if (!visited.has(nestedKey)) {
            visited.add(nestedKey);
            results.push(nested);
          }
        }
      });
    }
  };

  if (Array.isArray(source)) {
    source.forEach((entry, index) => visit(entry, String(index)));
  } else if (typeof source === 'object') {
    Object.entries(source).forEach(([key, value]) => visit(value, key));
  }

  return results;
}

function matchEntryByKeywords(entries, keywords) {
  return entries.find(({ searchKey, rawKey }) => {
    if (!searchKey && !rawKey) return false;
    return keywords.some((keyword) => {
      const lowerKeyword = keyword.toLowerCase();
      return (searchKey && searchKey.includes(lowerKeyword)) || (rawKey && rawKey.includes(keyword));
    });
  });
}

function fieldToIdentityKey(field) {
  if (!field) return '';
  const lower = field.toLowerCase();
  if (lower.includes('front')) return 'front';
  if (lower.includes('back')) return 'back';
  if (lower.includes('self') || lower.includes('hand') || lower.includes('hold')) return 'selfie';
  if (field.includes('\u6b63') || field.includes('\u524d')) return 'front'; // 正 / 前
  if (field.includes('\u53cd') || field.includes('\u80cc')) return 'back'; // 反 / 背
  if (
    field.includes('\u624b') || // 手
    field.includes('\u5408') || // 合
    field.includes('\u5408\u7167') || // 合照
    field.includes('\u5408\u5f71') || // 合影
    field.includes('\u81ea\u62cd') // 自拍
  ) {
    return 'selfie';
  }
  return '';
}

function extractIdentityImages(item) {
  const payload = (item && item.payload) || {};
  const result = {
    front: firstNonEmpty(payload.idFrontPath, item?.idFrontPath, payload.front, item?.front),
    back: firstNonEmpty(payload.idBackPath, item?.idBackPath, payload.back, item?.back),
    selfie: firstNonEmpty(payload.selfiePath, item?.selfiePath, payload.selfie, item?.selfie)
  };

  const entries = [];
  identityArrayFieldCandidates.forEach((field) => {
    entries.push(...collectIdentityEntries(payload[field]));
    entries.push(...collectIdentityEntries(item?.[field]));
  });

  // Some payloads may directly contain keyed values.
  if (typeof payload === 'object' && payload) {
    Object.entries(payload).forEach(([key, value]) => {
      const normalized = normalizeIdentityEntry(value, key);
      if (normalized) entries.push(normalized);
    });
  }

  ['front', 'back', 'selfie'].forEach((key) => {
    if (result[key]) return;
    const match = matchEntryByKeywords(entries, identityKeywordMap[key]);
    if (match) result[key] = match.value;
  });

  const orderedValues = entries.map((entry) => entry.value).filter(Boolean);
  if (!result.front && orderedValues[0]) result.front = orderedValues[0];
  if (!result.back && orderedValues[1]) result.back = orderedValues[1];
  if (!result.selfie && orderedValues[2]) result.selfie = orderedValues[2];

  return result;
}

function ensureToken() {
  const token = localStorage.getItem('admin_token');
  if (!token) {
    window.location.replace('/admin/login');
    return null;
  }
  return token;
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
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

function showMessageRow(text) {
  if (!tableBody) return;
  tableBody.innerHTML = `<tr><td colspan="10" class="empty">${text}</td></tr>`;
}

function updateInfo() {
  if (!infoEl) return;
  if (!state.total || !state.items.length) {
    infoEl.textContent = `暂无记录，当前总计 ${state.total} 条`;
    return;
  }
  const startIndex = (state.page - 1) * state.pageSize + 1;
  const endIndex = startIndex + state.items.length - 1;
  infoEl.textContent = `显示第 ${startIndex} - ${endIndex} 条 / 总计 ${state.total} 条记录`;
}

function renderTable() {
  if (!state.items.length) {
    showMessageRow('\u6682\u65e0\u6570\u636e');
    updateInfo();
    return;
  }

  const rows = state.items
    .map((item) => {
      const user = item.user || {};
      const displayName = user.nickname || user.email || item.userId;
      const submittedAt = formatDate(item.createdAt);
      const payload = item.payload || item || {};
      const realName = payload.realName || '-';
      const images = extractIdentityImages(item);
      const front = images.front || '';
      const back = images.back || '';
      const selfie = images.selfie || '';

      const renderImg = (src, field) =>
        src
          ? `<img class="thumb-64" src="${escapeAttr(src)}" data-preview-src="${escapeAttr(src)}" alt="${field}" data-action="preview" data-target="${field}" data-id="${item.id}" />`
          : PLACEHOLDER_IMG;

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
          <td>${realName}</td>
          <td class="thumb-cell">${renderImg(front, 'idFrontPath')}</td>
          <td class="thumb-cell">${renderImg(back, 'idBackPath')}</td>
          <td class="thumb-cell">${renderImg(selfie, 'selfiePath')}</td>
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
                  <path d="M19 13H5v-2h14Z" />
                </svg>
              </button>
              <button class="action-btn info" data-action="reason" data-id="${item.id}" title="审核备注">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8Z" />
                </svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');

  tableBody.innerHTML = rows;
  restoreImageColumns();
  updateInfo();
}

function renderPager() {
  if (!pagerContainer) return;
  const totalPages = Math.max(1, Math.ceil(state.total / state.pageSize));
  const startPage = Math.max(1, state.page - 2);
  const endPage = Math.min(totalPages, startPage + 4);
  const buttons = [];
  for (let i = startPage; i <= endPage; i += 1) {
    buttons.push(`<button data-page="${i}" class="${i === state.page ? 'active' : ''}">${i}</button>`);
  }
  pagerContainer.innerHTML = buttons.join('');
}

async function fetchReviews() {
  const token = ensureToken();
  if (!token) return;

  state.loading = true;
  showMessageRow('加载中...');
  try {
    const params = new URLSearchParams({
      type: 'identity',
      page: String(state.page),
      pageSize: String(state.pageSize)
    });
    if (state.keyword.trim()) params.set('keyword', state.keyword.trim());
    if (state.status && state.status !== 'all') params.set('status', state.status);

    const response = await fetch(`${API_BASE}?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.status === 401) {
      alert('登录状态已过期，请重新登录后台。');
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_profile');
      window.location.replace('/admin/login');
      return;
    }
    if (!response.ok) throw new Error(`Failed to load identity reviews: ${response.status}`);

    const data = await response.json();
    state.items = Array.isArray(data.items) ? data.items : [];
    state.total = Number.isFinite(data.total) ? Number(data.total) : state.items.length;
    state.page = Number.isFinite(data.page) ? Number(data.page) : state.page;
    state.pageSize = Number.isFinite(data.pageSize) ? Number(data.pageSize) : state.pageSize;

    renderTable();
    renderPager();
  } catch (error) {
    console.error('[identity-review] fetch error', error);
    showMessageRow('加载失败，请刷新重试。');
    alert('加载身份审核数据失败，请稍后重试。');
  } finally {
    state.loading = false;
  }
}

async function handleApprove(id) {
  if (state.loading) return;
  const token = ensureToken();
  if (!token) return;
  try {
    state.loading = true;
    const response = await fetch(`${API_BASE}/${id}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('审核失败');
    await fetchReviews();
  } catch (error) {
    console.error('[identity-review] approve error', error);
    alert('设置通过失败，请稍后重试。');
  } finally {
    state.loading = false;
  }
}

async function handleReject(id) {
  if (state.loading) return;
  const token = ensureToken();
  if (!token) return;
  const reason = prompt('请输入驳回原因（可留空）') || '';
  try {
    state.loading = true;
    const response = await fetch(`${API_BASE}/${id}/reject`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reason.trim() || undefined })
    });
    if (!response.ok) throw new Error('驳回失败');
    await fetchReviews();
  } catch (error) {
    console.error('[identity-review] reject error', error);
    alert('驳回失败，请稍后重试。');
  } finally {
    state.loading = false;
  }
}

function getSelectedIds() {
  return Array.from(tableBody.querySelectorAll('input[type="checkbox"]:checked')).map((item) => item.dataset.id);
}

function bindEvents() {
  searchInput?.addEventListener('input', (event) => {
    state.keyword = event.target.value;
    state.page = 1;
    fetchReviews();
  });

  pageSizeSelect?.addEventListener('change', (event) => {
    const value = Number(event.target.value) || 10;
    state.pageSize = value;
    state.page = 1;
    fetchReviews();
  });

  statusSelect?.addEventListener('change', (event) => {
    state.status = String(event.target.value || 'all');
    state.page = 1;
    fetchReviews();
  });

  pagerContainer?.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const nextPage = Number(button.dataset.page) || 1;
    if (nextPage === state.page) return;
    state.page = nextPage;
    fetchReviews();
  });

  document.querySelectorAll('.table-pager .pager-btn').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      const type = event.currentTarget.dataset.page;
      const totalPages = Math.max(1, Math.ceil(state.total / state.pageSize));
      if (type === 'prev') state.page = Math.max(1, state.page - 1);
      if (type === 'next') state.page = Math.min(totalPages, state.page + 1);
      fetchReviews();
    });
  });

  checkAllEl?.addEventListener('change', (event) => {
    const checked = event.target.checked;
    tableBody.querySelectorAll('input[type="checkbox"]').forEach((box) => {
      box.checked = checked;
    });
  });

  document.querySelector('#identity-refresh')?.addEventListener('click', () => fetchReviews());
  document.querySelector('#identity-export')?.addEventListener('click', () => alert('导出功能暂未实现，可根据需要扩展。'));

  document.querySelector('#identity-delete')?.addEventListener('click', () => {
    const selected = getSelectedIds();
    if (!selected.length) {
      alert('请选择需要删除的记录。');
      return;
    }
    handleDelete(selected);
  });

  document.querySelector('#identity-more')?.addEventListener('click', () => {
    alert('演示环境：更多操作暂未实现。');
  });

  tableBody.addEventListener('click', (event) => {
    const actionBtn = event.target.closest('[data-action]');
    if (!actionBtn) return;
    const id = actionBtn.dataset.id;
    if (!id) return;
    const item = state.items.find((row) => row.id === id);
    if (!item) return;
    const action = actionBtn.dataset.action;

  if (action === 'preview') {
      const field = actionBtn.dataset.target || '';
      const payload = item.payload || item || {};
      let url =
        actionBtn.getAttribute('data-preview-src') ||
        actionBtn.getAttribute('src') ||
        '';
      if (!url && field) {
        url = firstNonEmpty(payload[field], item[field]);
      }
      if (!url && field) {
        const key = fieldToIdentityKey(field);
        if (key) {
          const images = extractIdentityImages(item);
          if (images[key]) {
            url = images[key];
          }
        }
      }
      if (url) {
        // 直接用页面内置的灯箱预览，而不是跳转新窗口
        const viewer = document.getElementById('img-viewer');
        const viewerImg = document.getElementById('img-viewer-img');
        if (viewer && viewerImg) {
          viewerImg.src = url;
          viewer.classList.add('open');
          viewer.setAttribute('aria-hidden', 'false');
        } else {
          // 兜底：如果容器不存在仍打开新页
          window.open(url, '_blank', 'noopener');
        }
      } else {
        alert('暂无可预览的图片');
      }
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

ensureToken();
renderProfile();
bindEvents();
fetchReviews();

function ensureImageCell(tr, index) {
  while (tr.children.length <= index) {
    tr.appendChild(document.createElement('td'));
  }
  return tr.children[index];
}

function renderImageIntoCell(cell, src, field, id) {
  if (!cell) return;
  cell.classList.add('thumb-cell');
  if (src) {
    const escaped = escapeAttr(src);
    cell.innerHTML = `<img class="thumb-64" src="${escaped}" data-preview-src="${escaped}" alt="${field}" data-action="preview" data-target="${field}" data-id="${id}" />`;
  } else {
    cell.innerHTML = PLACEHOLDER_IMG;
  }
}

function restoreImageColumns() {
  if (!tableBody) return;
  const rows = Array.from(tableBody.rows);
  rows.forEach((tr, index) => {
    const item = state.items[index];
    if (!item) return;
    const images = extractIdentityImages(item);
    renderImageIntoCell(ensureImageCell(tr, 5), images.front || '', 'idFrontPath', item.id);
    renderImageIntoCell(ensureImageCell(tr, 6), images.back || '', 'idBackPath', item.id);
    renderImageIntoCell(ensureImageCell(tr, 7), images.selfie || '', 'selfiePath', item.id);
  });
}

async function handleDelete(ids) {
  if (!Array.isArray(ids) || !ids.length) return;
  if (!confirm(`确认删除选中的 ${ids.length} 条身份审核记录吗？此操作不可恢复。`)) return;
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
      if (response.status === 404) throw new Error('所选记录不存在或已被其他管理员删除。');
      throw new Error('删除失败，请稍后重试。');
    }
    const result = await response.json();
    const deleted = Array.isArray(result.deleted) ? result.deleted.length : ids.length;
    const notFound = Array.isArray(result.notFound) ? result.notFound.length : 0;
    if (deleted && notFound) {
      alert(`已删除 ${deleted} 条，另有 ${notFound} 条未找到。`);
    } else if (deleted) {
      alert(`已删除 ${deleted} 条身份审核记录。`);
    } else {
      alert('未找到需要删除的记录。');
    }
    await fetchReviews();
    if (checkAllEl) checkAllEl.checked = false;
  } catch (error) {
    console.error('[identity-review] delete error', error);
    alert(error instanceof Error ? error.message : '删除失败，请稍后重试。');
  } finally {
    state.loading = false;
  }
}

logoutBtn?.addEventListener('click', () => {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_profile');
  window.location.replace('/admin/login');
});
