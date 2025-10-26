const nameEl = document.querySelector('#admin-name');
const avatarEl = document.querySelector('#sidebar-avatar');
const logoutBtn = document.querySelector('#logout-btn');
const formEl = document.querySelector('#profile-form');
const messageEl = document.querySelector('#profile-message');
const logTableBody = document.querySelector('#log-table tbody');
const logInfo = document.querySelector('#log-info');
const logPager = document.querySelector('#log-pager');
const logPageSizeSelect = document.querySelector('#log-page-size');
const logRefreshBtn = document.querySelector('#log-refresh');

const profileDisplayName = document.querySelector('#profile-display-name');
const profileDisplayEmail = document.querySelector('#profile-display-email');

const profileData = {
  username: 'admin',
  email: 'admin@gmail.com',
  nickname: 'admin',
  roles: ['root'],
  lastLoginIp: '61.182.186.26'
};

const logs = Array.from({ length: 42 }).map((_, index) => ({
    id: 34856 - index,
  title: index % 2 === 0 ? '登录' : '会员管理 / 会员管理 / 编辑',
  link: index % 2 === 0 ? '/admin/index/login?url=%2Fadmin%2F' : `/admin/users/user/edit/${11000 + index}?dialog=1`,
  ip: ['61.182.186.26', '38.142.63.56', '210.145.79.56', '18.183.198.124', '54.189.21.243'][index % 5],
  time: new Date(Date.now() - index * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19)
}));

const state = {
  logPage: 1,
  logPageSize: 10
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
  const profile = readProfile() || profileData;
  nameEl.textContent = profile.nickname || profile.username || '管理员';
  profileDisplayName.textContent = profile.nickname || profile.username || '管理员';
  profileDisplayEmail.textContent = profile.email || 'admin@domain.com';
  if (avatarEl) {
    avatarEl.textContent = (profile.nickname || profile.username || 'A').slice(0, 1).toUpperCase();
  }
  const username = formEl.elements.namedItem('username');
  const email = formEl.elements.namedItem('email');
  const nickname = formEl.elements.namedItem('nickname');
  if (username) username.value = profile.username || '';
  if (email) email.value = profile.email || '';
  if (nickname) nickname.value = profile.nickname || '';
}

function showMessage(text, type = 'success') {
  if (!messageEl) return;
  messageEl.textContent = text;
  messageEl.className = `profile-message ${type}`;
  messageEl.hidden = false;
  window.setTimeout(() => (messageEl.hidden = true), 2500);
}

function renderLogs() {
  const start = (state.logPage - 1) * state.logPageSize;
  const paged = logs.slice(start, start + state.logPageSize);
  if (paged.length === 0) {
    logTableBody.innerHTML = '<tr><td colspan="5" class="empty">暂无日志记录</td></tr>';
  } else {
    logTableBody.innerHTML = paged
      .map(
        (log) => `
        <tr>
          <td>${log.id}</td>
          <td>${log.title}</td>
          <td>
            <div class="link-group">
              <span class="link">${log.link}</span>
              <button class="copy-btn" data-link="${log.link}" title="复制链接">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M16 1H4a2 2 0 0 0-2 2v12h2V3h12Zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm0 16H8V7h11Z"/></svg>
              </button>
            </div>
          </td>
          <td>${log.ip}</td>
          <td>${log.time}</td>
        </tr>`
      )
      .join('');
  }

  const totalPages = Math.max(1, Math.ceil(logs.length / state.logPageSize));
  state.logPage = Math.min(state.logPage, totalPages);
  logInfo.textContent = `显示第 ${state.logPage} 页 / 共 ${totalPages} 页，总计 ${logs.length} 条记录`;

  const buttons = [];
  const startPage = Math.max(1, state.logPage - 2);
  const endPage = Math.min(totalPages, startPage + 4);
  for (let i = startPage; i <= endPage; i++) {
    buttons.push(
      `<button data-page="${i}" class="${i === state.logPage ? 'active' : ''}">${i}</button>`
    );
  }
  logPager.innerHTML = buttons.join('');
}

function bindEvents() {
  formEl.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(formEl);
    const data = {
      username: formData.get('username'),
      email: formData.get('email'),
      nickname: formData.get('nickname')
    };
    const profile = readProfile() || {};
    localStorage.setItem('admin_profile', JSON.stringify({ ...profile, ...data }));
    renderProfile();
    showMessage('资料已更新', 'success');
  });

  logPager.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    state.logPage = Number(button.dataset.page);
    renderLogs();
  });

  document.querySelectorAll('.table-pager .pager-btn').forEach((btn) =>
    btn.addEventListener('click', (event) => {
      const type = event.currentTarget.dataset.page;
      const totalPages = Math.max(1, Math.ceil(logs.length / state.logPageSize));
      if (type === 'prev') state.logPage = Math.max(1, state.logPage - 1);
      if (type === 'next') state.logPage = Math.min(totalPages, state.logPage + 1);
      renderLogs();
    })
  );

  logPageSizeSelect.addEventListener('change', (event) => {
    state.logPageSize = Number(event.target.value);
    state.logPage = 1;
    renderLogs();
  });

  logRefreshBtn.addEventListener('click', () => {
    showMessage('日志已刷新', 'success');
    renderLogs();
  });

  logTableBody.addEventListener('click', async (event) => {
    const btn = event.target.closest('.copy-btn');
    if (!btn) return;
    const link = btn.dataset.link;
    try {
      await navigator.clipboard.writeText(link);
      showMessage('链接已复制', 'success');
    } catch {
      showMessage('复制失败，请手动选择复制', 'error');
    }
  });
}

ensureToken();
renderProfile();
renderLogs();
bindEvents();

logoutBtn?.addEventListener('click', () => {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_profile');
  window.location.replace('/admin/login');
});
