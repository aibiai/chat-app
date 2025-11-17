// 动态接口版本（与 /admin/api/members 打通）
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
// 头像上传相关控件
const avatarFileInput = document.querySelector('#member-avatar-file');
const avatarUploadBtn = document.querySelector('#member-avatar-upload');
const avatarChooseBtn = document.querySelector('#member-avatar-choose');
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

let editingId = null;
const state = {
  members: [],
  page: 1,
  pageSize: Number(pageSizeSelect?.value || 10) || 10,
  keyword: '',
  chat: { userId: '', list: [], page: 1, pageSize: 10 }
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
    } catch {}
    throw new Error(message);
  }
  if (response.status === 204) return null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return response.json();
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

// 根据用户ID获取昵称（用于聊天记录中的“接受者昵称”展示）
function getNicknameById(userId) {
  if (!userId) return EMPTY_TEXT;
  if (String(userId) === 'admin') return '管理员';
  const user = state.members.find((u) => String(u.id) === String(userId));
  return user ? (user.nickname || user.username || EMPTY_TEXT) : EMPTY_TEXT;
}

function updateTable() {
  const filtered = state.members;
  const totalPages = Math.max(1, Math.ceil(filtered.length / state.pageSize));
  state.page = Math.min(Math.max(1, state.page), totalPages);
  const start = (state.page - 1) * state.pageSize;
  const pageData = filtered.slice(start, start + state.pageSize);

  if (checkAllEl) checkAllEl.checked = false;

  if (!pageData.length) {
    tableBody.innerHTML = '<tr><td colspan="21" class="empty">暂无会员记录</td></tr>';
  } else {
    tableBody.innerHTML = pageData
      .map((item) => {
        const avatar = item.avatar ? `<img src="${item.avatar}" alt="${item.nickname || ''}" class="member-avatar" width="25" height="25" />` : '-';
        const levelNum = Number(item.level ?? 0);
        const levelLabel = levelNum === 2 ? '帝皇' : levelNum === 1 ? '水晶' : '普通';
        const levelTag = `<span class="level-tag level-${levelNum}" data-level="${levelNum}">${levelLabel}</span>`;
        const balance = Number(item.balance ?? item.points ?? 0).toFixed(2);
        const onlineSwitch = `<button class=\"switch ${item.online ? 'on' : ''}\" data-toggle=\"online\" data-id=\"${item.id}\" aria-label=\"是否在线\"><span class=\"switch-handle\"></span></button>`;
        const hiddenSwitch = `<button class=\"switch ${item.hidden ? 'on' : ''}\" data-toggle=\"hidden\" data-id=\"${item.id}\" aria-label=\"是否隐身\"><span class=\"switch-handle\"></span></button>`;
        const mutedSwitch = `<button class=\"switch ${item.muted ? 'on' : ''}\" data-toggle=\"muted\" data-id=\"${item.id}\" aria-label=\"禁言\"><span class=\"switch-handle\"></span></button>`;
        return `<tr>
          <td><input type=\"checkbox\" data-id=\"${item.id}\" /></td>
          <td>${item.id}</td>
          <td><span class=\"tag-badge owner\">${item.owner || DEFAULT_OWNER}</span></td>
          <td>${item.username || ''}</td>
          <td>${item.nickname || ''}</td>
          <td>${item.email || ''}</td>
          <td>${avatar}</td>
          <td>${levelTag}</td>
          <td>${toDisplayGender(item.gender)}</td>
          <td>${balance}</td>
          <td>${item.crystalExpire || EMPTY_TEXT}</td>
          <td>${item.emperorExpire || EMPTY_TEXT}</td>
          <td>${item.lastLogin || item.lastLoginText || formatTS(item.lastLogin) || EMPTY_TEXT}</td>
          <td><a class=\"link\" href=\"https://whatismyipaddress.com/ip/${item.lastIp || DEFAULT_IP}\" target=\"_blank\" rel=\"noopener\">${item.lastIp || DEFAULT_IP}</a></td>
          <td>${onlineSwitch}</td>
          <td>${hiddenSwitch}</td>
          <td>${item.joinedAt || EMPTY_TEXT}</td>
          <td>${item.joinIp || DEFAULT_IP}</td>
          <td><span class=\"status-pill ${item.status === 'active' ? 'active' : 'disabled'}\">${item.status === 'active' ? '正常' : '冻结'}</span></td>
          <td>${mutedSwitch}</td>
          <td>
            <div class=\"table-actions\">
              <button class=\"action-btn chatlog\" data-action=\"chatlog\" data-id=\"${item.id}\" title=\"查看聊天记录\">查看聊天记录</button>
              <button class=\"action-btn edit\" data-action=\"edit\" data-id=\"${item.id}\" title=\"编辑\">编辑</button>
              <button class=\"action-btn delete\" data-action=\"delete\" data-id=\"${item.id}\" title=\"删除\">删除</button>
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
    buttons.push(`<button data-page=\"${i}\" class=\"${i === state.page ? 'active' : ''}\">${i}</button>`);
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
    tableBody.innerHTML = `<tr><td colspan=\"21\" class=\"empty\">加载失败：${error.message}</td></tr>`;
  }
}

function getSelectedChatIds() {
  return Array.from(chatlogTableBody.querySelectorAll('input[type="checkbox"]:checked')).map((el) => el.dataset.id || '');
}

function renderChatlog() {
  const totalPages = Math.max(1, Math.ceil(state.chat.list.length / state.chat.pageSize));
  state.chat.page = Math.min(Math.max(1, state.chat.page), totalPages);
  const start = (state.chat.page - 1) * state.chat.pageSize;
  const pageData = state.chat.list.slice(start, start + state.chat.pageSize);
  if (chatlogCheckAll) chatlogCheckAll.checked = false;
  if (!pageData.length) {
    chatlogTableBody.innerHTML = '<tr><td colspan="8" class="empty">暂无记录</td></tr>';
  } else {
    chatlogTableBody.innerHTML = pageData
      .map((msg) => {
        const created = formatTS(msg.createdAt);
        const receiver = msg.toUserId;
        const receiverName = getNicknameById(receiver);
        const senderName = getNicknameById(msg.fromUserId);
        return `<tr>
          <td><input type="checkbox" data-id="${msg.id}" /></td>
          <td>${msg.id}</td>
          <td>${receiver}</td>
          <td>${receiverName}</td>
          <td>${senderName}</td>
          <td>${(msg.content || '').replace(/</g,'&lt;')}</td>
          <td>${created}</td>
          <td>
            <button class="action-btn edit" data-action="edit-chat" data-id="${msg.id}">编辑</button>
            <button class="action-btn delete" data-action="delete-chat" data-id="${msg.id}">删除</button>
          </td>
        </tr>`;
      })
      .join('');
  }
  chatlogInfo.textContent = `显示第 ${state.chat.page} 页 / 共 ${totalPages} 页，总计 ${state.chat.list.length} 条记录`;
  const btns = [];
  const sp = Math.max(1, state.chat.page - 2);
  const ep = Math.min(totalPages, sp + 4);
  for (let i = sp; i <= ep; i++) btns.push(`<button data-page="${i}" class="${i===state.chat.page?'active':''}">${i}</button>`);
  chatlogPager.innerHTML = btns.join('');
}

async function openChatlogForUser(userId) {
  state.chat.userId = userId;
  state.chat.page = 1;
  chatlogTitle.textContent = `查看聊天记录 - 会员 #${userId}`;
  chatlogModal.style.display = 'flex';
  try {
    const data = await apiRequest(`/admin/api/messages?userId=${encodeURIComponent(userId)}`);
    state.chat.list = Array.isArray(data?.list) ? data.list : [];
    renderChatlog();
    // 标记已读（对 admin 侧统计生效）
    try { await apiRequest('/admin/api/messages/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ peerId: userId }) }); } catch {}
  } catch (err) {
    console.error('[openChatlogForUser]', err);
    chatlogTableBody.innerHTML = `<tr><td colspan=\"8\" class=\"empty\">加载失败：${err.message}</td></tr>`;
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
    balanceInput.value = Number(target.balance ?? target.points ?? 0) || '';
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
        { owner: DEFAULT_OWNER, joinIp: DEFAULT_IP, lastIp: DEFAULT_IP, status: 'active', online: false },
        payload
      );
      await apiRequest('/admin/api/members', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      alert('已添加会员');
    } else {
      await apiRequest(`/admin/api/members/${encodeURIComponent(editingId)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
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
  if (!ids.length) return alert('请选择要删除的记录');
  if (!window.confirm(`确定删除选中的 ${ids.length} 条记录吗？`)) return;
  try {
    await apiRequest('/admin/api/members/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) });
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
    assignSelect.innerHTML = (list.length ? ['<option value="" disabled selected>请选择</option>'].concat(list.map((item) => `<option value="${item.nickname || item.username}">${item.nickname || item.username}</option>`)) : ['<option value="" disabled selected>暂无管理员</option>']).join('');
  } catch (error) {
    console.error('[openAssignModal]', error);
    assignSelect.innerHTML = `<option value="" disabled selected>加载失败：${error.message}</option>`;
  }
}

async function submitAssign() {
  const owner = assignSelect?.value || '';
  const ids = getSelectedIds();
  if (!ids.length) return alert('请选择要分配的会员');
  if (!owner) return alert('请选择管理员');
  try {
    await Promise.all(ids.map((id) => apiRequest(`/admin/api/members/${encodeURIComponent(id)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ owner }) })));
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

  searchInput?.addEventListener('input', (event) => { state.keyword = event.target.value || ''; });
  searchInput?.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); refreshMembers({ resetPage: true }); } });

  pagerContainer?.addEventListener('click', (event) => {
    const btn = event.target.closest('button');
    if (!btn) return;
    state.page = Number(btn.dataset.page);
    updateTable();
  });

  document.querySelectorAll('.table-pager .pager-btn').forEach((btn) => btn.addEventListener('click', (event) => {
    const type = event.currentTarget.dataset.page;
    const totalPages = Math.max(1, Math.ceil(state.members.length / state.pageSize));
    if (type === 'prev') state.page = Math.max(1, state.page - 1);
    if (type === 'next') state.page = Math.min(totalPages, state.page + 1);
    updateTable();
  }));

  pageSizeSelect?.addEventListener('change', (event) => { state.pageSize = Number(event.target.value) || 10; state.page = 1; updateTable(); });

  checkAllEl?.addEventListener('change', (event) => {
    const checked = event.target.checked;
    tableBody.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => { checkbox.checked = checked; });
  });

  tableBody.addEventListener('click', (event) => {
    const switchBtn = event.target.closest('.switch');
    if (switchBtn) {
      switchBtn.classList.toggle('on');
      const id = switchBtn.dataset.id;
      const field = switchBtn.dataset.toggle; // online|hidden|muted
      if (id && field) {
        const enabled = switchBtn.classList.contains('on');
        const target = state.members.find((m) => String(m.id) === String(id));
        if (target) target[field] = enabled;
        apiRequest(`/admin/api/members/${encodeURIComponent(id)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [field]: enabled }) }).catch((err) => {
          console.error('[toggle failed]', err);
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
      openChatlogForUser(id);
    } else if (action === 'edit') {
      openMemberModal(id);
    } else if (action === 'delete') {
      deleteMembers([id]);
    }
  });

  addBtn?.addEventListener('click', () => openMemberModal());
  editBtn?.addEventListener('click', () => { const ids = getSelectedIds(); if (ids.length !== 1) return alert('请选择一个会员'); openMemberModal(ids[0]); });
  deleteBtn?.addEventListener('click', () => deleteMembers(getSelectedIds()));
  assignBtn?.addEventListener('click', async () => { const ids = getSelectedIds(); if (!ids.length) return alert('请选择要分配的会员'); await openAssignModal(); });

  modalClose?.addEventListener('click', closeMemberModal);
  modalReset?.addEventListener('click', () => { if (!editingId) openMemberModal(); else openMemberModal(editingId); });
  modalSubmit?.addEventListener('click', submitMember);

  // ------- 头像：选择/上传 -------
  // 小缓存：最近一次选择的文件（优先用于上传）
  let chosenAvatarFile = null;

  // 点击“选择”= 打开文件选择
  avatarChooseBtn?.addEventListener('click', () => {
    avatarFileInput?.click();
  });

  // 文件选择后：读为 dataURL 直接写入输入框，便于快速保存（后端支持 data: 前缀）
  avatarFileInput?.addEventListener('change', () => {
    const file = avatarFileInput?.files && avatarFileInput.files[0];
    if (!file) return;
    chosenAvatarFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        avatarInput.value = reader.result; // 直接回填 base64，点击“确定”也能保存
      }
    };
    reader.readAsDataURL(file);
  });

  // 将 dataURL 转 Blob（用于“上传”时把 base64 也能转成文件传给后端）
  function dataURLtoBlob(dataUrl) {
    try {
      const arr = dataUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) u8arr[n] = bstr.charCodeAt(n);
      return new Blob([u8arr], { type: mime });
    } catch {
      return null;
    }
  }

  // 点击“上传”= 将已选择文件或输入框中的 dataURL 上传到服务器，返回 URL 写回
  avatarUploadBtn?.addEventListener('click', async () => {
    // 优先使用最近选择的 File；否则尝试把输入框的 dataURL 转 Blob
    let file = chosenAvatarFile;
    if (!file && avatarInput?.value && avatarInput.value.startsWith('data:')) {
      const blob = dataURLtoBlob(avatarInput.value);
      if (blob) file = new File([blob], 'avatar.png', { type: blob.type || 'image/png' });
    }
    if (!file) {
      alert('请先通过“选择”挑选一张图片，或在输入框粘贴图片 URL / dataURL');
      return;
    }
    try {
      const fm = new FormData();
      fm.append('file', file);
      // 使用已有的“礼物图片上传”端点，支持管理员 Token（x-admin-token）
      const token = getAdminToken();
      const resp = await fetch('/api/gifts/upload', {
        method: 'POST',
        headers: token ? { 'x-admin-token': token } : {},
        body: fm
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      if (!data?.ok || !data?.url) throw new Error('上传失败');
      avatarInput.value = data.url; // 回填正式地址
      alert('上传成功，已填入头像地址');
    } catch (err) {
      console.error('[avatar:upload]', err);
      alert('上传失败：' + (err?.message || err));
    }
  });

  assignClose?.addEventListener('click', () => (assignModal.style.display = 'none'));
  assignCancel?.addEventListener('click', () => (assignModal.style.display = 'none'));
  assignSubmit?.addEventListener('click', submitAssign);

  // Chatlog events
  chatlogClose?.addEventListener('click', () => (chatlogModal.style.display = 'none'));
  chatlogCheckAll?.addEventListener('change', (e) => {
    const checked = e.target.checked; chatlogTableBody.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = checked);
  });
  chatlogPager?.addEventListener('click', (e) => {
    const btn = e.target.closest('button'); if (!btn) return; state.chat.page = Number(btn.dataset.page); renderChatlog();
  });
  chatlogRefresh?.addEventListener('click', () => { if (state.chat.userId) openChatlogForUser(state.chat.userId); });
  chatlogTableBody.addEventListener('click', (e) => {
    const actionBtn = e.target.closest('.action-btn'); if (!actionBtn) return; const action = actionBtn.dataset.action; const id = actionBtn.dataset.id; if (!action) return;
    if (action === 'edit-chat') {
      const msg = state.chat.list.find(m => m.id === id); if (!msg) return alert('消息不存在');
      const content = prompt('编辑消息内容：', msg.content); if (content == null) return; const trimmed = content.trim(); if (!trimmed) return alert('内容不能为空');
      apiRequest('/admin/api/messages/update', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, content: trimmed }) })
        .then(() => { const idx = state.chat.list.findIndex(m => m.id === id); if (idx>=0) state.chat.list[idx].content = trimmed; renderChatlog(); })
        .catch(err => alert('编辑失败：'+err.message));
    } else if (action === 'delete-chat') {
      if (!confirm('确定删除该消息吗？')) return;
      apiRequest('/admin/api/messages/delete', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ids:[id] }) })
        .then(() => { state.chat.list = state.chat.list.filter(m => m.id !== id); renderChatlog(); })
        .catch(err => alert('删除失败：'+err.message));
    }
  });
}

ensureToken();
renderProfile();
bindEvents();
refreshMembers({ resetPage: true });

// ---- 实时等级监听（WebSocket）----
// 使用与普通用户一致的 socket.io 连接方式，鉴权 token 采用 admin_token
// 事件: admin:member-updated -> { id, level, ... }
try {
  import('https://cdn.socket.io/4.7.2/socket.io.esm.min.js').then(({ io }) => {
    const token = localStorage.getItem('admin_token');
    if (!token) return; // 未登录管理员
    const socket = io('/', { auth: { token } });
    socket.on('connect_error', (err) => console.warn('[socket:connect_error]', err.message));
    socket.on('admin:member-updated', (member) => {
      if (!member || !member.id) return;
      // 更新本地 state 与表格行
      const idx = state.members.findIndex(m => String(m.id) === String(member.id));
      if (idx >= 0) {
        // 仅替换变化字段（避免重排）
        const prev = state.members[idx];
        state.members[idx] = Object.assign({}, prev, member);
        // 找到对应行的等级列（第8列）并更新文本
        const row = tableBody.querySelector(`tr td input[type="checkbox"][data-id="${member.id}"]`)?.closest('tr');
        if (row) {
          const levelCell = row.querySelector('td:nth-child(8)');
          if (levelCell) {
            const num = Number(member.level ?? 0);
            const label = num === 2 ? '帝皇' : num === 1 ? '水晶' : '普通';
            levelCell.innerHTML = `<span class="level-tag level-${num}" data-level="${num}">${label}</span>`;
          }
          // 第11列：水晶到期时间；第12列：帝皇到期时间
          const crystalCell = row.querySelector('td:nth-child(11)');
          const emperorCell = row.querySelector('td:nth-child(12)');
          const newCrystal = member.crystalExpire || '—';
          const newEmperor = member.emperorExpire || '—';
          if (crystalCell && crystalCell.textContent !== String(newCrystal)) {
            crystalCell.textContent = String(newCrystal);
            crystalCell.classList.remove('flash-updated'); // 触发重渲染
            // 强制一次 reflow 以重启动画
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            crystalCell.offsetWidth;
            crystalCell.classList.add('flash-updated');
            setTimeout(() => crystalCell.classList.remove('flash-updated'), 1800);
          }
          if (emperorCell && emperorCell.textContent !== String(newEmperor)) {
            emperorCell.textContent = String(newEmperor);
            emperorCell.classList.remove('flash-updated');
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            emperorCell.offsetWidth;
            emperorCell.classList.add('flash-updated');
            setTimeout(() => emperorCell.classList.remove('flash-updated'), 1800);
          }
        } else {
          // 如果当前分页没有该用户（可能在其它页），不强制刷新整表；可选：刷新当前页
        }
      } else {
        // 新用户：推入 state 并重新渲染（保持页码不变）
        state.members.push(member);
        updateTable();
      }
    });
  }).catch(err => console.warn('[socket:load_failed]', err));
} catch (err) {
  console.warn('[socket:setup_failed]', err);
}

logoutBtn?.addEventListener('click', () => {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_profile');
  window.location.replace('/admin/login');
});
