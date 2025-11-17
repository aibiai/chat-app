const nameEl = document.querySelector('#admin-name');
const avatarEl = document.querySelector('#sidebar-avatar');
const logoutBtn = document.querySelector('#logout-btn');
const searchInput = document.querySelector('#admin-search');
const statusFilter = document.querySelector('#status-filter');
const tableBody = document.querySelector('#admins-table tbody');
const checkAllEl = document.querySelector('#admins-check-all');
const infoEl = document.querySelector('#admins-info');
const pagerContainer = document.querySelector('#admins-pager');
const pageSizeSelect = document.querySelector('#admins-page-size');

// 从后端 API 读取管理员列表，若失败则回退 localStorage（便于离线开发）
async function fetchAdminsFromServer() {
  const token = localStorage.getItem('admin_token');
  if (!token) return loadAdminsFromLocal();
  try {
    const resp = await fetch('/admin/api/admins', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!resp.ok) throw new Error('network');
    const data = await resp.json();
    if (!data || !Array.isArray(data.list)) throw new Error('format');
    // 标准化为前端使用的结构（id 采用 username，便于与后端接口对齐）
    const list = data.list.map((item, idx) => ({
      id: item.username, // 作为业务主键用于编辑/删除
      order: item.order || idx + 1, // 展示序号
      username: item.username,
      nickname: item.nickname || item.username,
      groups: Array.isArray(item.roles) ? item.roles : [], // 后端已返回角色名称数组
      email: item.email || '',
      status: item.status || 'active',
      lastLogin: typeof item.lastLogin === 'string' ? item.lastLogin : '无',
      roleId: Array.isArray(item.roleIds) && item.roleIds.length ? Number(item.roleIds[0]) : undefined
    }));
    try { localStorage.setItem('admins_list', JSON.stringify(list)); } catch {}
    return list;
  } catch (err) {
    console.warn('[admins] 后端获取失败，使用本地缓存', err);
    return loadAdminsFromLocal();
  }
}

function loadAdminsFromLocal() {
  try {
    const raw = localStorage.getItem('admins_list');
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveAdmins(list) {
  try { localStorage.setItem('admins_list', JSON.stringify(list)); } catch {}
}

let admins = [];

const state = {
  page: 1,
  pageSize: 10,
  keyword: '',
  status: 'all'
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
  const profile = readProfile() || {};
  if (nameEl) nameEl.textContent = profile.nickname || profile.username || '管理员';
  if (avatarEl) avatarEl.textContent = (profile.nickname || profile.username || 'A').slice(0, 1).toUpperCase();
}

function filterData() {
  return admins.filter((item) => {
    const matchesStatus = state.status === 'all' || item.status === state.status;
    const keyword = state.keyword.trim().toLowerCase();
    const matchesKeyword =
      !keyword ||
      item.username.toLowerCase().includes(keyword) ||
      item.nickname.toLowerCase().includes(keyword) ||
      item.email.toLowerCase().includes(keyword) ||
      item.groups.some((g) => g.toLowerCase().includes(keyword));
    return matchesStatus && matchesKeyword;
  });
}

function paginate(data) {
  const start = (state.page - 1) * state.pageSize;
  return data.slice(start, start + state.pageSize);
}

function renderTable() {
  const filtered = filterData();
  const pageData = paginate(filtered);

  if (checkAllEl) checkAllEl.checked = false;

  if (pageData.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="9" class="empty">暂无管理员记录</td></tr>`;
  } else {
    const rolesCache = loadRoles();
    const getRoleName = (rec) => {
      if (rec.roleId != null) {
        const r = rolesCache.find(x => Number(x.id) === Number(rec.roleId));
        if (r) return r.name;
      }
      return (rec.groups && rec.groups[0]) || '';
    };

    tableBody.innerHTML = pageData
      .map(
        (item) => `
        <tr>
          <td><input type="checkbox" data-id="${item.id}" /></td>
          <td>${item.order || ''}</td>
          <td>${item.username}</td>
          <td>${item.nickname}</td>
          <td>
            <div class="role-group">
              ${[getRoleName(item)].filter(Boolean).map((group) => `<span class="role-badge">${group}</span>`).join('')}
            </div>
          </td>
          <td>${item.email}</td>
          <td><span class="status-pill ${item.status === 'active' ? 'active' : 'disabled'}">${item.status === 'active' ? '正常' : '禁用'}</span></td>
          <td>${item.lastLogin}</td>
          <td>
            <div class="table-actions">
              <button class="action-btn edit" data-action="edit" data-id="${item.id}" title="编辑">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="m20.71 7.04-3.75-3.75a1 1 0 0 0-1.42 0L3 15.83V20h4.17L20.71 8.46a1 1 0 0 0 0-1.42ZM6.59 18H5v-1.59l8.06-8.06 1.59 1.59Zm9.47-9.47-1.59-1.59 1.42-1.42 1.59 1.59Z"/></svg>
              </button>
              <button class="action-btn delete" data-action="delete" data-id="${item.id}" title="删除">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M6 7h12v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2Zm9-5 1 1h4v2H4V3h4l1-1Zm3 5H6v13h12Z"/></svg>
              </button>
            </div>
          </td>
        </tr>`
      )
      .join('');
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / state.pageSize));
  state.page = Math.min(state.page, totalPages);
  infoEl.textContent = `显示第 ${state.page} 页 / 共 ${totalPages} 页，总计 ${filtered.length} 条记录`;

  const buttons = [];
  const startPage = Math.max(1, state.page - 2);
  const endPage = Math.min(totalPages, startPage + 4);
  for (let i = startPage; i <= endPage; i++) {
    buttons.push(`<button data-page="${i}" class="${i === state.page ? 'active' : ''}">${i}</button>`);
  }
  pagerContainer.innerHTML = buttons.join('');
}

function bindEvents() {
  searchInput?.addEventListener('input', (event) => {
    state.keyword = event.target.value;
    state.page = 1;
    renderTable();
  });

  statusFilter?.addEventListener('click', (event) => {
    const btn = event.target.closest('.tab-btn');
    if (!btn) return;
    statusFilter.querySelectorAll('.tab-btn').forEach((el) => el.classList.remove('active'));
    btn.classList.add('active');
    state.status = btn.dataset.status;
    state.page = 1;
    renderTable();
  });

  checkAllEl?.addEventListener('change', (event) => {
    const checked = event.target.checked;
    tableBody.querySelectorAll('input[type="checkbox"]').forEach((box) => {
      box.checked = checked;
    });
  });

  pagerContainer?.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    state.page = Number(button.dataset.page);
    renderTable();
  });

  document.querySelectorAll('.table-pager .pager-btn').forEach((btn) =>
    btn.addEventListener('click', (event) => {
      const type = event.currentTarget.dataset.page;
      const totalPages = Math.max(1, Math.ceil(filterData().length / state.pageSize));
      if (type === 'prev') state.page = Math.max(1, state.page - 1);
      if (type === 'next') state.page = Math.min(totalPages, state.page + 1);
      renderTable();
    })
  );

  pageSizeSelect?.addEventListener('change', (event) => {
    state.pageSize = Number(event.target.value);
    state.page = 1;
    renderTable();
  });

  tableBody.addEventListener('click', (event) => {
    const button = event.target.closest('.action-btn');
    if (!button) return;
    const action = button.dataset.action;
    const id = button.dataset.id;
    if (action === 'edit') {
      openAdminModal(String(id));
    } else if (action === 'delete') {
      const confirmDelete = confirm(`确定删除管理员 ${id} 吗？`);
      if (confirmDelete) {
        (async () => {
          try {
            const resp = await fetch('/admin/api/admins/delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('admin_token') || ''}` },
              body: JSON.stringify({ usernames: [String(id)] })
            });
            if (!resp.ok) {
              const data = await resp.json().catch(()=>({}));
              if (resp.status === 403 && data.error === 'PROTECTED_ADMIN') {
                alert('默认管理员 admin 不可删除');
              } else if (resp.status === 404) {
                alert('删除失败：未找到该管理员');
              } else {
                alert('删除失败');
              }
            } else {
              admins = await fetchAdminsFromServer();
              renderTable();
              alert('已删除。');
            }
          } catch (e) {
            console.error(e);
            alert('网络错误，删除失败');
          }
        })();
      }
    }
  });
}

ensureToken();
renderProfile();
bindEvents();
// 首次加载从后端刷新
// 先尝试拉取角色，便于“添加/编辑”时可选
async function fetchRolesFromServer() {
  const token = localStorage.getItem('admin_token');
  if (!token) return;
  try {
    const resp = await fetch('/admin/api/roles', { headers: { Authorization: `Bearer ${token}` } });
    if (!resp.ok) return;
    const data = await resp.json();
    if (data && Array.isArray(data.list)) {
      localStorage.setItem('admin_roles', JSON.stringify(data.list));
    }
  } catch {}
}

(async () => {
  await fetchRolesFromServer();
  admins = await fetchAdminsFromServer();
  renderTable();
})();

// 监听角色更新事件（同页触发）与 storage（跨标签页）以刷新表格中角色名称
window.addEventListener('roles-updated', () => {
  renderTable();
});
window.addEventListener('storage', (e) => {
  if (e.key === 'admin_roles') {
    renderTable();
  }
});

// ---- 权限刷新逻辑 ----
async function refreshCurrentAdminPermissions(){
  const token = localStorage.getItem('admin_token');
  if(!token) return false;
  try {
    const resp = await fetch('/admin/api/profile', { headers: { Authorization: `Bearer ${token}` } });
    if(!resp.ok) return false;
    const data = await resp.json();
    if(data && data.admin){
      try { localStorage.setItem('admin_permissions', JSON.stringify(data.admin.permissions || [])); } catch{}
      try { localStorage.setItem('admin_profile', JSON.stringify(data.admin)); } catch{}
      try { window.dispatchEvent(new CustomEvent('permissions-updated', { detail: { permissions: data.admin.permissions || [] }})); } catch{}
      return true;
    }
  } catch {}
  return false;
}

// 刷新权限按钮监听需要在元素引用声明之后，此处提前引用并绑定，避免脚本延迟加载时变量未定义
const refreshPermBtn = document.querySelector('#admins-refresh-perm');
refreshPermBtn?.addEventListener('click', async () => {
  const ok = await refreshCurrentAdminPermissions();
  if (ok) {
    if (confirm('权限已刷新，是否立即重新加载页面以应用菜单与守卫？')) {
      location.reload();
    }
  } else {
    alert('刷新失败或未登录');
  }
});

logoutBtn?.addEventListener('click', async () => {
  const token = localStorage.getItem('admin_token') || '';
  try { await fetch('/admin/api/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }); } catch {}
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_profile');
  window.location.replace('/admin/login');
});

// ---------------- 管理员新增/编辑弹窗逻辑 ----------------
const modal = document.querySelector('#admin-modal');
const modalTitle = document.querySelector('#admin-modal-title');
const modalClose = document.querySelector('#admin-modal-close');
const modalReset = document.querySelector('#admin-modal-reset');
const modalSubmit = document.querySelector('#admin-modal-submit');
const roleSelect = document.querySelector('#admin-role');
const usernameInput = document.querySelector('#admin-username');
const emailInput = document.querySelector('#admin-email');
const nicknameInput = document.querySelector('#admin-nickname');
const passwordInput = document.querySelector('#admin-password');
const addBtn = document.querySelector('#admins-add');
const editBtn = document.querySelector('#admins-edit');
const deleteBtn = document.querySelector('#admins-delete');
// refreshPermBtn 已在顶部提前绑定；避免重复声明
// 已有 checkAllEl 负责该元素的引用，此处不再重复定义

function getSelectedIds() {
  return Array.from(tableBody.querySelectorAll('input[type="checkbox"]:checked')).map(i => String(i.dataset.id || ''));
}

function loadRoles() {
  try {
    const raw = localStorage.getItem('admin_roles');
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function renderRoleSelect(selectedId = '') {
  if (!roleSelect) return;
  const roles = loadRoles();
  const options = ['<option value="">请选择角色组</option>'].concat(
    roles.map(r => `<option value="${r.id}" ${String(r.id)===String(selectedId)?'selected':''}>${r.name}</option>`)
  );
  roleSelect.innerHTML = options.join('');
}

let editingId = null; // null 代表新增；非 null 时为 username 字符串

function openAdminModal(id = null) {
  editingId = id;
  if (id == null) {
    modalTitle.textContent = '添加管理员';
    usernameInput.value = '';
    emailInput.value = '';
    nicknameInput.value = '';
    passwordInput.value = '';
    document.querySelector('input[name="admin-status"][value="active"]').checked = true;
    renderRoleSelect('');
  } else {
    const target = admins.find(a => a.id === id);
    if (!target) { alert('记录不存在'); return; }
    modalTitle.textContent = `编辑管理员 ${id}`;
    usernameInput.value = target.username;
    emailInput.value = target.email || '';
    nicknameInput.value = target.nickname || '';
    passwordInput.value = '';
    document.querySelector(`input[name="admin-status"][value="${target.status}"]`).checked = true;
    // 假设单角色绑定；若老数据只有名称，则按名称匹配角色ID
    const primaryRoleId = (function(){
      if (target.roleId != null) return target.roleId;
      const name = (target.groups && target.groups[0]) || '';
      if (!name) return '';
      const match = loadRoles().find(r => r.name === name);
      return match ? match.id : '';
    })();
    renderRoleSelect(primaryRoleId);
  }
  modal.style.display = 'flex';
}

function closeAdminModal() {
  modal.style.display = 'none';
  editingId = null;
}

modalClose?.addEventListener('click', closeAdminModal);
modalReset?.addEventListener('click', () => {
  if (editingId == null) {
    usernameInput.value = '';
    emailInput.value = '';
    nicknameInput.value = '';
    passwordInput.value = '';
    document.querySelector('input[name="admin-status"][value="active"]').checked = true;
    renderRoleSelect('');
  } else {
    openAdminModal(editingId); // 重新加载编辑数据
  }
});

modalSubmit?.addEventListener('click', () => {
  const username = (usernameInput.value || '').trim();
  const email = (emailInput.value || '').trim();
  const nickname = (nicknameInput.value || '').trim();
  const password = (passwordInput.value || '').trim();
  const status = document.querySelector('input[name="admin-status"]:checked')?.value || 'active';
  const roleId = roleSelect?.value || '';
  if (!roleId) { alert('请选择角色组'); return; }
  const rolesData = loadRoles();
  const selectedRole = rolesData.find(r => String(r.id) === String(roleId));
  const permissions = selectedRole ? (selectedRole.permissions || []) : [];
  if (!username) { alert('请输入用户名'); return; }
  if (editingId == null) {
    // 调用后端创建管理员并写入文件
    (async () => {
      try {
        const resp = await fetch('/admin/api/admins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('admin_token') || ''}` },
          body: JSON.stringify({ username, email, nickname: nickname || username, password: password || '123456', roleIds: [Number(roleId)] })
        });
        if (!resp.ok) {
          const data = await resp.json().catch(()=>({}));
          if (data.error === 'USERNAME_EXISTS') {
            alert('创建失败：用户名已存在');
          } else if (resp.status === 403) {
            alert('权限不足：需要 auth/admins 权限');
          } else {
            alert('创建失败，请稍后重试');
          }
        } else {
          const data = await resp.json();
          // 刷新列表
          admins = await fetchAdminsFromServer();
          renderTable();
          closeAdminModal();
          alert(`已添加管理员 ${username}，角色：${selectedRole?selectedRole.name:'未知'}，权限数：${permissions.length}`);
        }
      } catch (e) {
        console.error(e);
        alert('网络错误，创建失败');
      }
    })();
  } else {
    const target = admins.find(a => a.id === editingId);
    if (!target) { alert('记录不存在'); return; }
    target.username = username;
    target.nickname = nickname || username;
    target.email = email;
    target.status = status;
    target.roleId = Number(roleId);
    target.permissions = permissions;
    target.groups = selectedRole ? [selectedRole.name] : [];
    if (password) {
      // 仅示例：实际应调用后端修改密码
      target._passwordChanged = true;
    }
    (async () => {
      try {
        const resp = await fetch(`/admin/api/admins/${encodeURIComponent(target.username)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('admin_token') || ''}` },
          body: JSON.stringify({ email, nickname: nickname || username, password, roleIds: [Number(roleId)] })
        });
        if (!resp.ok) {
          if (resp.status === 403) {
            alert('权限不足：需要 auth/admins 权限');
          } else {
            alert('更新失败');
          }
        } else {
          admins = await fetchAdminsFromServer();
          renderTable();
          closeAdminModal();
          alert(`已更新管理员 ${target.username}，角色：${selectedRole?selectedRole.name:'未知'}，权限数：${permissions.length}`);
        }
      } catch (e) {
        console.error(e);
        alert('网络错误，更新失败');
      }
    })();
  }
});

addBtn?.addEventListener('click', () => openAdminModal());
editBtn?.addEventListener('click', () => {
  const selected = getSelectedIds();
  if (selected.length === 0) { alert('请选择要编辑的管理员'); return; }
  if (selected.length > 1) { alert('一次只能编辑一个管理员'); return; }
  openAdminModal(selected[0]);
});

deleteBtn?.addEventListener('click', () => {
  const selected = getSelectedIds();
  if (!selected.length) { alert('请选择要删除的记录'); return; }
  if (!confirm(`确定删除选中的 ${selected.length} 个管理员吗？`)) return;
  (async () => {
    try {
      const resp = await fetch('/admin/api/admins/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('admin_token') || ''}` },
        body: JSON.stringify({ usernames: selected.map(String) })
      });
      if (!resp.ok) {
        const data = await resp.json().catch(()=>({}));
        if (resp.status === 403 && data.error === 'PROTECTED_ADMIN') {
          alert('默认管理员 admin 不可删除');
        } else if (resp.status === 404) {
          alert('删除失败：未找到这些管理员');
        } else if (resp.status === 403) {
          alert('权限不足：需要 auth/admins 权限');
        } else {
          alert('删除失败');
        }
      } else {
        admins = await fetchAdminsFromServer();
        renderTable();
        alert('已批量删除。');
      }
    } catch (e) {
      console.error(e);
      alert('网络错误，删除失败');
    }
  })();
});

