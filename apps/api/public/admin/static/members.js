// Admin customer-service members management (rewritten)

const nameEl = document.querySelector('#admin-name');
const avatarEl = document.querySelector('#sidebar-avatar');
const logoutBtn = document.querySelector('#logout-btn');
const tableBody = document.querySelector('#member-table tbody');
const infoEl = document.querySelector('#member-info');
const pagerContainer = document.querySelector('#member-pager');
const pageSizeSelect = document.querySelector('#member-page-size');
const searchInput = document.querySelector('#member-search');
const checkAllEl = document.querySelector('#member-check-all');
const refreshBtn = document.querySelector('#member-refresh');
const refreshIconBtn = document.querySelector('#member-refresh-icon');
const addBtn = document.querySelector('#member-add');
const editBtn = document.querySelector('#member-edit');
const deleteBtn = document.querySelector('#member-delete');
const assignBtn = document.querySelector('#member-assign');

const modal = document.querySelector('#member-modal');
const modalTitle = document.querySelector('#member-modal-title');
const modalClose = document.querySelector('#member-modal-close');
const modalReset = document.querySelector('#member-modal-reset');
const modalSubmit = document.querySelector('#member-modal-submit');
const usernameInput = document.querySelector('#member-username');
const nicknameInput = document.querySelector('#member-nickname');
const passwordInput = document.querySelector('#member-password');
const emailInput = document.querySelector('#member-email');
const avatarInput = document.querySelector('#member-avatar');
const levelSelect = document.querySelector('#member-level');
const birthdayInput = document.querySelector('#member-birthday');
const balanceInput = document.querySelector('#member-balance');
const crystalExpireInput = document.querySelector('#member-crystal-expire');
const emperorExpireInput = document.querySelector('#member-emperor-expire');
const joinedAtInput = document.querySelector('#member-joined-at');
const genderRadios = document.querySelectorAll('input[name="member-gender"]');
const hiddenRadios = document.querySelectorAll('input[name="member-hidden"]');

const assignModal = document.querySelector('#assign-modal');
const assignClose = document.querySelector('#assign-close');
const assignCancel = document.querySelector('#assign-cancel');
const assignSubmit = document.querySelector('#assign-submit');
const assignSelect = document.querySelector('#assign-admin-select');

// Chatlog modal elements
const chatlogModal = document.querySelector('#chatlog-modal');
const chatlogTitle = document.querySelector('#chatlog-title');
const chatlogClose = document.querySelector('#chatlog-close');
const chatlogRefresh = document.querySelector('#chatlog-refresh');
const chatlogEdit = document.querySelector('#chatlog-edit');
const chatlogDelete = document.querySelector('#chatlog-delete');
const chatlogTableBody = document.querySelector('#chatlog-table tbody');
const chatlogCheckAll = document.querySelector('#chatlog-check-all');
const chatlogInfo = document.querySelector('#chatlog-info');
const chatlogPager = document.querySelector('#chatlog-pager');

const DEFAULT_OWNER = '系统';
const DEFAULT_IP = '0.0.0.0';
const EMPTY_TEXT = '--';

const state = {
  members: [],
  page: 1,
  pageSize: Number(pageSizeSelect?.value || 10) || 10,
  keyword: ''
};

function ensureToken() {
  const token = localStorage.getItem('admin_token');
  if (!token) {
    window.location.replace('/admin/login');
  }
}

function getAdminToken() {
  return localStorage.getItem('admin_token') || '';
}

async function apiRequest(url, options = {}) {
  const headers = Object.assign({}, options.headers || {}, {
    Authorization: `Bearer ${getAdminToken()}`
  });
  const response = await fetch(url, Object.assign({}, options, { headers }));
  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      message = body?.error || message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  if (response.status === 204) return null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

function renderProfile() {
  try {
    const raw = localStorage.getItem('admin_profile');
    const profile = raw ? JSON.parse(raw) : {};
    if (nameEl) nameEl.textContent = profile.nickname || profile.username || '管理员';
    if (avatarEl) avatarEl.textContent = (profile.nickname || profile.username || 'A').slice(0, 1).toUpperCase();
  } catch {
    if (nameEl) nameEl.textContent = '管理员';
    if (avatarEl) avatarEl.textContent = 'A';
  }
}

function formatTS(ts) {
  if (!ts) return EMPTY_TEXT;
  const date = new Date(Number(ts));
  if (Number.isNaN(date.getTime())) return EMPTY_TEXT;
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function toDisplayGender(value) {
  if (!value) return '未知';
  const normalized = value.toLowerCase();
  if (['male', 'm', '男'].includes(normalized)) return '男';
  if (['female', 'f', '女'].includes(normalized)) return '女';
  return value;
}

function updateTable() {
  const filtered = state.members;
  const totalPages = Math.max(1, Math.ceil(filtered.length / state.pageSize));
  state.page = Math.min(Math.max(1, state.page), totalPages);
  const start = (state.page - 1) * state.pageSize;
  const pageData = filtered.slice(start, start + state.pageSize);

  if (checkAllEl) checkAllEl.checked = false;

  if (!pageData.length) {
    // 21列（含复选框）
    tableBody.innerHTML = '<tr><td colspan="21" class="empty">暂无会员记录</td></tr>';
  } else {
    tableBody.innerHTML = pageData
      .map((item) => {
        const avatar = item.avatar ? `<img src="${item.avatar}" alt="${item.nickname || ''}" class="member-avatar" width="25" height="25" />` : '-';
        const level = Number(item.level ?? 0);
        const balance = Number(item.balance ?? item.points ?? 0).toFixed(2);
        const onlineSwitch = `<button class="switch ${item.online ? 'on' : ''}" data-toggle="online" data-id="${item.id}" aria-label="是否在线"><span class="switch-handle"></span></button>`;
        const hiddenSwitch = `<button class="switch ${item.hidden ? 'on' : ''}" data-toggle="hidden" data-id="${item.id}" aria-label="是否隐身"><span class="switch-handle"></span></button>`;
        const mutedSwitch = `<button class="switch ${item.muted ? 'on' : ''}" data-toggle="muted" data-id="${item.id}" aria-label="禁言"><span class="switch-handle"></span></button>`;
        return `<tr>
          <td><input type="checkbox" data-id="${item.id}" /></td>
          <td>${item.id}</td>
          <td><span class="tag-badge owner">${item.owner || DEFAULT_OWNER}</span></td>
          <td>${item.username || ''}</td>
          <td>${item.nickname || ''}</td>
          <td>${item.email || ''}</td>
          <td>${avatar}</td>
          <td>${level}</td>
          <td>${toDisplayGender(item.gender)}</td>
          <td>${balance}</td>
          <td>${item.crystalExpire || EMPTY_TEXT}</td>
          <td>${item.emperorExpire || EMPTY_TEXT}</td>
          <td>${item.lastLogin || item.lastLoginText || formatTS(item.lastLogin) || EMPTY_TEXT}</td>
          <td><a class="link" href="https://whatismyipaddress.com/ip/${item.lastIp || DEFAULT_IP}" target="_blank" rel="noopener">${item.lastIp || DEFAULT_IP}</a></td>
          <td>${onlineSwitch}</td>
          <td>${hiddenSwitch}</td>
          <td>${item.joinedAt || EMPTY_TEXT}</td>
          <td>${item.joinIp || DEFAULT_IP}</td>
          <td><span class="status-pill ${item.status === 'active' ? 'active' : 'disabled'}">${item.status === 'active' ? '正常' : '冻结'}</span></td>
          <td>${mutedSwitch}</td>
          <td>
            <div class="table-actions">
              <button class="action-btn chatlog" data-action="chatlog" data-id="${item.id}" title="查看聊天记录">查看聊天记录</button>
              <button class="action-btn edit" data-action="edit" data-id="${item.id}" title="编辑">编辑</button>
              <button class="action-btn delete" data-action="delete" data-id="${item.id}" title="删除">删除</button>
            </div>
          </td>
        </tr>`;
      })
      .join('');
  }

  infoEl.textContent = `显示第 ${state.page} 页 / 共 ${totalPages} 页，总计 ${filtered.length} 条记录`;
  const buttons = [];
  const startPage = Math.max(1, state.page - 2);
  const endPage = Math.min(totalPages, startPage + 4);
  for (let i = startPage; i <= endPage; i++) {
    buttons.push(`<button data-page="${i}" class="${i === state.page ? 'active' : ''}">${i}</button>`);
  }
  pagerContainer.innerHTML = buttons.join('');
}

async function refreshMembers({ resetPage = false } = {}) {
  try {
    if (resetPage) state.page = 1;
    const query = state.keyword.trim();
    const url = query ? `/admin/api/members?keyword=${encodeURIComponent(query)}` : '/admin/api/members';
    const data = await apiRequest(url);
    state.members = Array.isArray(data?.list) ? data.list : [];
    updateTable();
  } catch (error) {
    console.error('[refreshMembers]', error);
    tableBody.innerHTML = `<tr><td colspan="20" class="empty">加载失败：${error.message}</td></tr>`;
  }
}

function getSelectedIds() {
  return Array.from(tableBody.querySelectorAll('input[type="checkbox"]:checked')).map((item) => String(item.dataset.id || ''));
}

function openMemberModal(id) {
  editingId = id || null;
  if (!editingId) {
    modalTitle.textContent = '添加会员';
    usernameInput.value = '';
    nicknameInput.value = '';
    passwordInput.value = '';
    emailInput.value = '';
    avatarInput.value = '';
    levelSelect.value = '0';
    birthdayInput.value = '';
    balanceInput.value = '';
    crystalExpireInput.value = '';
    emperorExpireInput.value = '';
    joinedAtInput.value = '';
    genderRadios.forEach((radio) => (radio.checked = radio.value === '男'));
    hiddenRadios.forEach((radio) => (radio.checked = radio.value === '0'));
  } else {
    const target = state.members.find((item) => String(item.id) === String(editingId));
    if (!target) {
      alert('未找到该会员');
      return;
    }
    modalTitle.textContent = `编辑会员 #${editingId}`;
    usernameInput.value = target.username || '';
    nicknameInput.value = target.nickname || '';
    passwordInput.value = '';
    emailInput.value = target.email || '';
    avatarInput.value = target.avatar || '';
    levelSelect.value = String(Number(target.level ?? 0));
    birthdayInput.value = (target.birthday || '').slice(0, 10);
    balanceInput.value = Number(target.points ?? 0) || '';
    crystalExpireInput.value = (target.crystalExpire || '').replace(' ', 'T').slice(0, 16);
    emperorExpireInput.value = (target.emperorExpire || '').replace(' ', 'T').slice(0, 16);
    joinedAtInput.value = (target.joinedAt || '').replace(' ', 'T').slice(0, 16);
    const gender = toDisplayGender(target.gender);
    genderRadios.forEach((radio) => (radio.checked = radio.value === gender));
    hiddenRadios.forEach((radio) => (radio.checked = radio.value === (target.hidden ? '1' : '0')));
  }
  modal.style.display = 'flex';
}

function closeMemberModal() {
  modal.style.display = 'none';
  editingId = null;
}

function collectMemberPayload() {
  const payload = {
    username: (usernameInput.value || '').trim(),
    nickname: (nicknameInput.value || '').trim(),
    password: (passwordInput.value || '').trim(),
    email: (emailInput.value || '').trim(),
    avatar: (avatarInput.value || '').trim(),
    level: Number(levelSelect?.value || 0),
    birthday: (birthdayInput.value || '').trim(),
    points: Number(balanceInput.value || 0),
    crystalExpire: crystalExpireInput.value ? crystalExpireInput.value.replace('T', ' ') + ':00' : '',
    emperorExpire: emperorExpireInput.value ? emperorExpireInput.value.replace('T', ' ') + ':00' : '',
    joinedAt: joinedAtInput.value ? joinedAtInput.value.replace('T', ' ') + ':00' : '',
    hidden: document.querySelector('input[name="member-hidden"]:checked')?.value === '1',
    gender: document.querySelector('input[name="member-gender"]:checked')?.value || '男'
  };
  if (!payload.email) throw new Error('请输入邮箱');
  if (!payload.username) payload.username = payload.nickname || payload.email.split('@')[0];
  return payload;
}

async function submitMember() {
  try {
    const payload = collectMemberPayload();
    if (!editingId) {
      const body = Object.assign(
        {
          owner: DEFAULT_OWNER,
          joinIp: DEFAULT_IP,
          lastIp: DEFAULT_IP,
          status: 'active',
          online: false
        },
        payload
      );
      await apiRequest('/admin/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      alert('已添加会员');
    } else {
      await apiRequest(`/admin/api/members/${encodeURIComponent(editingId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      alert('已更新会员');
    }
    closeMemberModal();
    await refreshMembers({ resetPage: true });
  } catch (error) {
    console.error('[submitMember]', error);
    alert(`保存失败：${error.message}`);
  }
}

async function deleteMembers(ids) {
  if (!ids.length) {
    alert('请选择要删除的记录');
    return;
  }
  if (!window.confirm(`确定删除选中的 ${ids.length} 条记录吗？`)) return;
  try {
    await apiRequest('/admin/api/members/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
    });
    alert('已删除');
    await refreshMembers({ resetPage: true });
  } catch (error) {
    console.error('[deleteMembers]', error);
    alert(`删除失败：${error.message}`);
  }
}

async function openAssignModal() {
  assignModal.style.display = 'flex';
  assignSelect.innerHTML = '<option value="" disabled selected>加载中...</option>';
  try {
    const data = await apiRequest('/admin/api/admins');
    const list = Array.isArray(data?.list) ? data.list : [];
    if (!list.length) {
      assignSelect.innerHTML = '<option value="" disabled selected>暂无管理员</option>';
      return;
    }
    const options = ['<option value="" disabled selected>请选择</option>'].concat(
      list.map((item) => `<option value="${item.nickname || item.username}">${item.nickname || item.username}</option>`)
    );
    assignSelect.innerHTML = options.join('');
  } catch (error) {
    console.error('[openAssignModal]', error);
    assignSelect.innerHTML = `<option value="" disabled selected>加载失败：${error.message}</option>`;
  }
}

async function submitAssign() {
  const owner = assignSelect?.value || '';
  const ids = getSelectedIds();
  if (!ids.length) {
    alert('请选择要分配的会员');
    return;
  }
  if (!owner) {
    alert('请选择管理员');
    return;
  }
  try {
    await Promise.all(
      ids.map((id) =>
        apiRequest(`/admin/api/members/${encodeURIComponent(id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ owner })
        })
      )
    );
    alert('已分配');
    assignModal.style.display = 'none';
    await refreshMembers();
  } catch (error) {
    console.error('[submitAssign]', error);
    alert(`分配失败：${error.message}`);
  }
}

function bindEvents() {
  refreshBtn?.addEventListener('click', () => refreshMembers({ resetPage: true }));
  refreshIconBtn?.addEventListener('click', () => refreshMembers({ resetPage: true }));

  searchInput?.addEventListener('input', (event) => {
    state.keyword = event.target.value || '';
  });
  searchInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      refreshMembers({ resetPage: true });
    }
  });

  pagerContainer?.addEventListener('click', (event) => {
    const btn = event.target.closest('button');
    if (!btn) return;
    state.page = Number(btn.dataset.page);
    updateTable();
  });

  document.querySelectorAll('.table-pager .pager-btn').forEach((btn) =>
    btn.addEventListener('click', (event) => {
      const type = event.currentTarget.dataset.page;
      const totalPages = Math.max(1, Math.ceil(state.members.length / state.pageSize));
      if (type === 'prev') state.page = Math.max(1, state.page - 1);
      if (type === 'next') state.page = Math.min(totalPages, state.page + 1);
      updateTable();
    })
  );

  pageSizeSelect?.addEventListener('change', (event) => {
    state.pageSize = Number(event.target.value) || 10;
    state.page = 1;
    updateTable();
  });

  checkAllEl?.addEventListener('change', (event) => {
    const checked = event.target.checked;
    tableBody.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      checkbox.checked = checked;
    });
  });

  tableBody.addEventListener('click', (event) => {
    const switchBtn = event.target.closest('.switch');
    if (switchBtn) {
      switchBtn.classList.toggle('on');
      const id = switchBtn.dataset.id;
      const field = switchBtn.dataset.toggle; // online | hidden | muted
      if (id && field) {
        const enabled = switchBtn.classList.contains('on');
        // 乐观更新：立即更新本地 state
        const target = state.members.find(m => String(m.id) === String(id));
        if (target) target[field] = enabled;
        apiRequest(`/admin/api/members/${encodeURIComponent(id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [field]: enabled })
        }).catch(err => {
          console.error('[toggle failed]', err);
          // 失败回滚
            switchBtn.classList.toggle('on');
            if (target) target[field] = !enabled;
            alert(`更新${field}失败：${err.message}`);
        });
      }
      return;
    }
    const actionBtn = event.target.closest('.action-btn');
    if (!actionBtn) return;
    const action = actionBtn.dataset.action;
    const id = actionBtn.dataset.id;
    if (!id) return;
    if (action === 'chatlog') {
      const modal = document.querySelector('#chatlog-modal');
      const title = document.querySelector('#chatlog-title');
      if (title) title.textContent = `查看聊天记录 - 会员 #${id}`;
      if (modal) modal.style.display = 'flex';
    } else if (action === 'edit') {
      openMemberModal(id);
    } else if (action === 'delete') {
      deleteMembers([id]);
    }
  });

  addBtn?.addEventListener('click', () => openMemberModal());
  editBtn?.addEventListener('click', () => {
    const ids = getSelectedIds();
    if (ids.length !== 1) {
      alert('请选择一个会员');
      return;
    }
    openMemberModal(ids[0]);
  });
  deleteBtn?.addEventListener('click', () => deleteMembers(getSelectedIds()));
  assignBtn?.addEventListener('click', async () => {
    const ids = getSelectedIds();
    if (!ids.length) {
      alert('请选择要分配的会员');
      return;
    }
    await openAssignModal();
  });

  modalClose?.addEventListener('click', closeMemberModal);
  modalReset?.addEventListener('click', () => {
    if (!editingId) openMemberModal();
    else openMemberModal(editingId);
  });
  modalSubmit?.addEventListener('click', submitMember);

  assignClose?.addEventListener('click', () => (assignModal.style.display = 'none'));
  assignCancel?.addEventListener('click', () => (assignModal.style.display = 'none'));
  assignSubmit?.addEventListener('click', submitAssign);

  // Chatlog events
  chatlogClose?.addEventListener('click', () => (chatlogModal.style.display = 'none'));
  chatlogCheckAll?.addEventListener('change', (e) => {
    const checked = e.target.checked; chatlogTableBody.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = checked);
  });
  chatlogPager?.addEventListener('click', (e) => {
    const btn = e.target.closest('button'); if (!btn) return; state.page = Number(btn.dataset.page); updateTable();
  });
  chatlogRefresh?.addEventListener('click', () => { /* refresh handled in openChatlogForUser within root file */ });
}

ensureToken();
renderProfile();
bindEvents();
refreshMembers({ resetPage: true });

logoutBtn?.addEventListener('click', () => {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_profile');
  window.location.replace('/admin/login');
});
