const nameEl = document.querySelector('#admin-name');
const heroNameEl = document.querySelector('#hero-admin-name');
const heroPendingEl = document.querySelector('#hero-pending');
const heroUpdatedEl = document.querySelector('#hero-updated');
const avatarEl = document.querySelector('#sidebar-avatar');
const logoutBtn = document.querySelector('#logout-btn');
const heroSyncBtn = document.querySelector('#hero-sync');
const heroExportBtn = document.querySelector('#hero-export');
const activityListEl = document.querySelector('#activity-list');

const metricEls = {
  members: document.querySelector('#metric-members'),
  messages: document.querySelector('#metric-messages'),
  gifts: document.querySelector('#metric-gifts'),
  vip: document.querySelector('#metric-vip')
};

const quickStatEls = {
  todayRegister: document.querySelector('#stat-today-register'),
  todayLogin: document.querySelector('#stat-today-login'),
  threeIncrease: document.querySelector('#stat-three-increase'),
  sevenIncrease: document.querySelector('#stat-seven-increase'),
  sevenActive: document.querySelector('#stat-seven-active'),
  monthActive: document.querySelector('#stat-month-active')
};

const summaryEls = {
  categories: document.querySelector('#summary-categories'),
  datasets: document.querySelector('#summary-datasets'),
  datasetSize: document.querySelector('#summary-dataset-size'),
  attachments: document.querySelector('#summary-attachments'),
  attachmentsSize: document.querySelector('#summary-attachments-size'),
  images: document.querySelector('#summary-images'),
  imagesSize: document.querySelector('#summary-images-size')
};

const chartArea = document.querySelector('#trend-area');
const chartLine = document.querySelector('#trend-line');
const chartAxis = document.querySelector('#chart-axis');

let latestData = null;

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

function handleUnauthorized() {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_profile');
  window.location.replace('/admin/login');
}

function renderProfile() {
  const profile = readProfile();
  const displayName = profile?.nickname || profile?.username || '\u7ba1\u7406\u5458';
  if (nameEl) nameEl.textContent = displayName;
  if (heroNameEl) heroNameEl.textContent = displayName;
  if (avatarEl) avatarEl.textContent = displayName.slice(0, 1).toUpperCase();
}

function formatNumber(num) {
  if (!Number.isFinite(num)) return '--';
  if (num >= 10000) return `${(num / 10000).toFixed(num >= 100000 ? 0 : 1)}\u4e07`;
  return Number(num || 0).toLocaleString('zh-CN');
}

function escapeHtml(value) {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function setLoading(isLoading) {
  if (heroSyncBtn) {
    heroSyncBtn.classList.toggle('is-loading', isLoading);
    heroSyncBtn.disabled = isLoading;
  }
}

function renderMetrics(data) {
  Object.entries(metricEls).forEach(([key, el]) => {
    if (!el) return;
    const value = data?.metrics?.[key];
    el.textContent = value != null ? formatNumber(value) : '--';
  });
}

function renderQuickStats(data) {
  Object.entries(quickStatEls).forEach(([key, el]) => {
    if (!el) return;
    const value = data?.quickStats?.[key];
    el.textContent = value != null ? formatNumber(value) : '--';
  });
}

function renderSummary(data) {
  const summary = data?.summary;
  if (!summary) {
    if (summaryEls.categories) summaryEls.categories.textContent = '--';
    if (summaryEls.datasets) summaryEls.datasets.textContent = '--';
    if (summaryEls.datasetSize) summaryEls.datasetSize.textContent = '--';
    if (summaryEls.attachments) summaryEls.attachments.textContent = '--';
    if (summaryEls.attachmentsSize) summaryEls.attachmentsSize.textContent = '--';
    if (summaryEls.images) summaryEls.images.textContent = '--';
    if (summaryEls.imagesSize) summaryEls.imagesSize.textContent = '--';
    return;
  }
  if (summaryEls.categories) summaryEls.categories.textContent = formatNumber(summary.categories);
  if (summaryEls.datasets) summaryEls.datasets.textContent = formatNumber(summary.datasets);
  if (summaryEls.datasetSize) summaryEls.datasetSize.textContent = summary.datasetSize ?? '--';
  if (summaryEls.attachments) summaryEls.attachments.textContent = formatNumber(summary.attachments);
  if (summaryEls.attachmentsSize) summaryEls.attachmentsSize.textContent = summary.attachmentsSize ?? '--';
  if (summaryEls.images) summaryEls.images.textContent = formatNumber(summary.images);
  if (summaryEls.imagesSize) summaryEls.imagesSize.textContent = summary.imagesSize ?? '--';
}

function renderMeta(data) {
  const meta = data?.meta;
  if (heroPendingEl) heroPendingEl.textContent = meta?.reviewPending != null ? formatNumber(meta.reviewPending) : '--';
  if (heroUpdatedEl) heroUpdatedEl.textContent = meta?.lastUpdated ?? '--';
}

function renderActivity(data) {
  if (!activityListEl) return;
  const activity = data?.activity ?? [];
  if (!activity.length) {
    activityListEl.innerHTML =
      '<li class="todo-item empty"><h4>\u6682\u65e0\u5f85\u529e</h4><p>\u4e00\u5207\u8fd0\u884c\u826f\u597d\uff0c\u4fdd\u6301\u5173\u6ce8\u5373\u53ef\u3002</p><span class="todo-meta">\u7cfb\u7edf\u63d0\u793a</span></li>';
    return;
  }
  activityListEl.innerHTML = activity
    .map(
      (item) => `
        <li class="todo-item">
          <h4>${escapeHtml(item.title)}</h4>
          <p>${escapeHtml(item.detail)}</p>
          <span class="todo-meta">${escapeHtml(item.meta)}</span>
        </li>`
    )
    .join('');
}

function renderTrend(data) {
  if (!chartArea || !chartLine || !chartAxis) return;
  const points = data?.trend ?? [];
  if (!points.length) {
    chartArea.setAttribute('d', '');
    chartLine.setAttribute('d', '');
    chartAxis.innerHTML = '';
    return;
  }

  const width = 640;
  const height = 280;
  const paddingX = 40;
  const paddingY = 40;
  const maxValue = Math.max(...points.map((p) => p.value), 1);
  const step = (width - paddingX * 2) / Math.max(1, points.length - 1);

  const coords = points.map((point, index) => {
    const x = paddingX + index * step;
    const ratio = point.value / maxValue;
    const y = height - paddingY - ratio * (height - paddingY * 2);
    return { x, y };
  });

  const areaPath = [
    `M ${paddingX} ${height - paddingY}`,
    ...coords.map((c) => `L ${c.x.toFixed(2)} ${c.y.toFixed(2)}`),
    `L ${paddingX + (points.length - 1) * step} ${height - paddingY}`,
    'Z'
  ].join(' ');

  const linePath = coords
    .map((c, index) => `${index === 0 ? 'M' : 'L'} ${c.x.toFixed(2)} ${c.y.toFixed(2)}`)
    .join(' ');

  chartArea.setAttribute('d', areaPath);
  chartLine.setAttribute('d', linePath);
  chartAxis.innerHTML = points
    .map((point) => `<span>${escapeHtml(point.label)}</span>`)
    .join('');
}

function showLoadError(message) {
  if (!activityListEl) return;
  activityListEl.innerHTML = `
    <li class="todo-item error">
      <h4>\u6570\u636e\u52a0\u8f7d\u5931\u8d25</h4>
      <p>${escapeHtml(message || '\u8bf7\u68c0\u67e5\u7f51\u7edc\u6216\u7a0d\u540e\u91cd\u8bd5\u3002')}</p>
      <span class="todo-meta">\u7cfb\u7edf\u63d0\u793a</span>
    </li>
  `;
}

async function fetchDashboardSummary() {
  const token = ensureToken();
  if (!token) return null;
  const response = await fetch('/admin/api/dashboard/summary', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (response.status === 401) {
    handleUnauthorized();
    return null;
  }

  const payload = await response.json().catch(() => null);
  if (!payload || !payload.ok) {
    throw new Error(payload?.error || 'FETCH_FAILED');
  }
  return payload.data;
}

async function refreshDashboard({ showToast } = {}) {
  try {
    setLoading(true);
    const data = await fetchDashboardSummary();
    if (!data) return;
    latestData = data;
    renderMetrics(data);
    renderQuickStats(data);
    renderSummary(data);
    renderMeta(data);
    renderTrend(data);
    renderActivity(data);
    if (showToast) window.alert('\u6570\u636e\u5df2\u5237\u65b0');
  } catch (error) {
    console.error('[dashboard] refresh failed', error);
    showLoadError(error?.message === 'Failed to fetch' ? '\u670d\u52a1\u5668\u8fde\u63a5\u5931\u8d25\u3002' : '\u6682\u65f6\u65e0\u6cd5\u83b7\u53d6\u6700\u65b0\u6570\u636e\u3002');
  } finally {
    setLoading(false);
  }
}

function bindHeroActions() {
  heroSyncBtn?.addEventListener('click', () => {
    refreshDashboard({ showToast: true });
  });

  heroExportBtn?.addEventListener('click', () => {
    if (!latestData) {
      window.alert('\u6682\u65e0\u6570\u636e\u53ef\u5bfc\u51fa\uff0c\u8bf7\u5148\u5237\u65b0\u3002');
      return;
    }
    const blob = new Blob([JSON.stringify(latestData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard-summary-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
}

function init() {
  if (!ensureToken()) return;
  renderProfile();
  renderMetrics(null);
  renderQuickStats(null);
  renderSummary(null);
  renderMeta(null);
  renderTrend(null);
  renderActivity(null);
  bindHeroActions();
  refreshDashboard();
}

logoutBtn?.addEventListener('click', () => {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_profile');
  window.location.replace('/admin/login');
});

init();
