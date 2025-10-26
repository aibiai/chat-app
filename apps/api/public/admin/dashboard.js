const nameEl = document.querySelector('#admin-name');
const avatarEl = document.querySelector('#sidebar-avatar');
const logoutBtn = document.querySelector('#logout-btn');

const metricEls = {
  members: document.querySelector('#metric-members'),
  messages: document.querySelector('#metric-messages'),
  gifts: document.querySelector('#metric-gifts'),
  vip: document.querySelector('#metric-vip')
};

const quickStatEls = {
  today: document.querySelector('#stat-today'),
  three: document.querySelector('#stat-three'),
  seven: document.querySelector('#stat-seven'),
  login: document.querySelector('#stat-login'),
  newMembers: document.querySelector('#stat-new-members'),
  activeConv: document.querySelector('#stat-active-conv')
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

const dashboardData = {
  metrics: {
    members: 1338,
    messages: 9204,
    gifts: 780,
    vip: 117
  },
  quickStats: {
    today: 9,
    three: 21,
    seven: 58,
    login: 4,
    newMembers: 9,
    activeConv: 689
  },
  summary: {
    categories: 13,
    datasets: 53,
    datasetSize: '28MB',
    attachments: 9484,
    attachmentsSize: '6GB',
    images: 9437,
    imagesSize: '6GB'
  },
  trend: [
    { label: '10-01', value: 120 },
    { label: '10-02', value: 180 },
    { label: '10-03', value: 230 },
    { label: '10-04', value: 160 },
    { label: '10-05', value: 190 },
    { label: '10-06', value: 220 },
    { label: '10-07', value: 320 }
  ]
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
  const profile = readProfile();
  if (!profile) {
    nameEl.textContent = '未获取到管理员信息';
    return;
  }
  nameEl.textContent = profile.nickname || profile.username || '管理员';
  if (avatarEl) {
    avatarEl.textContent = (profile.nickname || profile.username || 'A').slice(0, 1).toUpperCase();
  }
}

function formatNumber(num) {
  if (num >= 10000) return `${(num / 10000).toFixed(1)}万`;
  return num.toLocaleString();
}

function renderMetrics() {
  Object.entries(metricEls).forEach(([key, el]) => {
    if (!el) return;
    const value = dashboardData.metrics[key];
    el.textContent = value != null ? formatNumber(value) : '--';
  });
}

function renderQuickStats() {
  Object.entries(quickStatEls).forEach(([key, el]) => {
    if (!el) return;
    const value = dashboardData.quickStats[key];
    el.textContent = value != null ? value : '--';
  });
}

function renderSummary() {
  if (summaryEls.categories) summaryEls.categories.textContent = dashboardData.summary.categories;
  if (summaryEls.datasets) summaryEls.datasets.textContent = dashboardData.summary.datasets;
  if (summaryEls.datasetSize) summaryEls.datasetSize.textContent = dashboardData.summary.datasetSize;
  if (summaryEls.attachments) summaryEls.attachments.textContent = formatNumber(dashboardData.summary.attachments);
  if (summaryEls.attachmentsSize) summaryEls.attachmentsSize.textContent = dashboardData.summary.attachmentsSize;
  if (summaryEls.images) summaryEls.images.textContent = formatNumber(dashboardData.summary.images);
  if (summaryEls.imagesSize) summaryEls.imagesSize.textContent = dashboardData.summary.imagesSize;
}

function renderTrend() {
  if (!chartArea || !chartLine || !chartAxis) return;
  const points = dashboardData.trend;
  const width = 520;
  const height = 220;
  const padding = 20;
  const usableHeight = height - padding * 2;
  const maxVal = Math.max(...points.map((p) => p.value)) || 1;
  const xStep = (width - padding * 2) / (points.length - 1);

  const coords = points.map((point, index) => {
    const x = padding + index * xStep;
    const y = height - padding - (point.value / maxVal) * usableHeight;
    return { x, y };
  });

  const areaPath = [
    `M ${padding} ${height - padding}`,
    ...coords.map((c) => `L ${c.x.toFixed(2)} ${c.y.toFixed(2)}`),
    `L ${padding + (points.length - 1) * xStep} ${height - padding}`,
    'Z'
  ].join(' ');
  chartArea.setAttribute('d', areaPath);

  const linePath = coords.map((c, index) => `${index === 0 ? 'M' : 'L'} ${c.x.toFixed(2)} ${c.y.toFixed(2)}`).join(' ');
  chartLine.setAttribute('d', linePath);

  chartAxis.innerHTML = points.map((point) => `<span>${point.label}</span>`).join('');
}

ensureToken();
renderProfile();
renderMetrics();
renderQuickStats();
renderSummary();
renderTrend();

logoutBtn?.addEventListener('click', () => {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_profile');
  window.location.replace('/admin/login');
});
