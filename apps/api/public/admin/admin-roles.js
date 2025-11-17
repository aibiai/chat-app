const nameEl = document.querySelector('#admin-name');
const avatarEl = document.querySelector('#sidebar-avatar');
const logoutBtn = document.querySelector('#logout-btn');
const tableBody = document.querySelector('#roles-table tbody');
const checkAllEl = document.querySelector('#roles-check-all');
const addBtn = document.querySelector('#roles-add');
const editBtn = document.querySelector('#roles-edit');
const deleteBtn = document.querySelector('#roles-delete');
const refreshBtn = document.querySelector('#roles-refresh');

// Modal elements
const roleModal = document.querySelector('#role-modal');
const roleModalTitle = document.querySelector('#role-modal-title');
const roleModalClose = document.querySelector('#role-modal-close');
const roleModalCancel = document.querySelector('#role-modal-cancel');
const roleModalSubmit = document.querySelector('#role-modal-submit');
const roleParentSelect = document.querySelector('#role-parent');
const roleNameInput = document.querySelector('#role-name');
const permTreeEl = document.querySelector('#perm-tree');
const permCheckAll = document.querySelector('#perm-check-all');
const permExpandAll = document.querySelector('#perm-expand-all');

// 后端菜单（一级菜单 + 下一级菜单）
const backendMenus = [
  { id: 'dashboard', name: '控制台', children: [] },
  {
    id: 'general',
    name: '常规管理',
    children: [
      { id: 'profile', name: '个人资料' },
      { id: 'channel-config', name: '栏目配置' },
      { id: 'cache-clear', name: '缓存清理' }
    ]
  },
  {
    id: 'review',
    name: '信息审核',
    children: [
      { id: 'attachments', name: '附件审核' },
      { id: 'avatar-review', name: '头像审核' },
      { id: 'identity-review', name: '身份审核' },
      { id: 'confession-review', name: '表白墙审核' }
    ]
  },
  {
    id: 'auth',
    name: '权限管理',
    children: [
      { id: 'admins', name: '管理员管理' },
      { id: 'admin-logs', name: '管理员日志' },
      { id: 'roles', name: '角色组' },
      { id: 'rules', name: '菜单规则' }
    ]
  },
  {
    id: 'im',
    name: '即时通信管理',
    children: [
      { id: 'push', name: '推送消息' },
      { id: 'service-accounts', name: '服务账号管理' }
    ]
  },
  {
    id: 'members',
    name: '会员管理',
    children: [
      { id: 'members', name: '会员管理' },
      { id: 'customer-service', name: '客服管理' },
      { id: 'member-upgrade', name: '升级会员' }
    ]
  },
  {
    id: 'gifts',
    name: '礼物管理',
    children: [
      { id: 'gift-categories', name: '礼物分类' },
      { id: 'gifts', name: '礼物管理' }
    ]
  },
  { id: 'stickers', name: '表情贴管理', children: [] },
  {
    id: 'orders',
    name: '订单管理',
    children: [
      { id: 'order-overview', name: '总营业额' },
      { id: 'recharge-records', name: '充值记录' },
      { id: 'coin-consumption', name: '金币消费记录' },
      { id: 'card-review', name: '点卡审核' }
    ]
  },
  {
    id: 'frontend',
    name: '前端管理',
    children: [
      { id: 'frontend-terms', name: '使用条款修改' },
      { id: 'frontend-privacy', name: '隐私条款修改' },
      { id: 'frontend-security', name: '交友安全修改' },
      { id: 'frontend-help', name: '帮助中心修改' },
      { id: 'frontend-contact', name: '联系我们修改' },
      { id: 'frontend-user-config', name: '用户参数修改' },
      { id: 'frontend-card-redeem', name: '点卡兑换内容修改' },
      { id: 'frontend-confession-images', name: '表白墙图片修改' }
    ]
  }
];

function loadRoles() {
  try {
    const raw = localStorage.getItem('admin_roles');
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveRoles(list) {
  try {
    localStorage.setItem('admin_roles', JSON.stringify(list));
  } catch {}
  // 通知其它页面（例如管理员管理页）刷新角色展示
  try { window.dispatchEvent(new CustomEvent('roles-updated', { detail: { list } })); } catch {}
}

let roles = loadRoles();
// 当前是否为编辑模式（保存正在编辑的角色ID）；null 表示新增模式
let editingRoleId = null;

async function fetchRolesFromServer() {
  const token = localStorage.getItem('admin_token');
  if (!token) return;
  try {
    const resp = await fetch('/admin/api/roles', { headers: { Authorization: `Bearer ${token}` } });
    if (!resp.ok) return;
    const data = await resp.json();
    if (data && Array.isArray(data.list)) {
      roles = data.list;
      saveRoles(roles);
      renderTable();
    }
  } catch (e) { console.warn('[roles] fetch failed', e); }
}

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

function renderTable() {
  if (!roles.length) {
    tableBody.innerHTML = '<tr><td colspan="6" class="empty">暂无角色组</td></tr>';
    return;
  }

  tableBody.innerHTML = roles
    .map(
      (item) => `
        <tr>
          <td><input type="checkbox" data-id="${item.id}" /></td>
          <td>${item.id}</td>
          <td>${item.parentId}</td>
          <td class="role-name" data-id="${item.id}">${item.name}</td>
          <td><span class="status-pill ${item.status === 'active' ? 'active' : 'disabled'}">${item.status === 'active' ? '正常' : '隐藏'}</span></td>
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

function getSelectedIds() {
  return Array.from(tableBody.querySelectorAll('input[type="checkbox"]:checked')).map((item) => item.dataset.id);
}

// 计算需要删除的ID（包含所选ID及其所有子级，保护ID=0）
function getCascadeDeleteIds(initialIds) {
  const seed = new Set(
    (initialIds || [])
      .map((id) => Number(id))
      .filter((id) => !Number.isNaN(id) && id !== 0) // 保护超级管理员组
  );
  let changed = true;
  while (changed) {
    changed = false;
    for (const r of roles) {
      if (seed.has(Number(r.parentId)) && !seed.has(Number(r.id)) && Number(r.id) !== 0) {
        seed.add(Number(r.id));
        changed = true;
      }
    }
  }
  return Array.from(seed);
}

async function performDeleteByIds(ids) {
  const toDelete = getCascadeDeleteIds(ids);
  if (!toDelete.length) return { deleted: 0 };
  const token = localStorage.getItem('admin_token') || '';
  try {
    const resp = await fetch('/admin/api/roles/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ids: toDelete })
    });
    if (!resp.ok) {
      const data = await resp.json().catch(()=>({}));
      alert('后端删除失败' + (data.error ? `: ${data.error}` : ''));
      return { deleted: 0 };
    }
    await fetchRolesFromServer();
    await refreshCurrentAdminPermissions();
    if (checkAllEl) checkAllEl.checked = false;
    return { deleted: toDelete.length };
  } catch (e) {
    console.error(e);
    alert('网络错误，删除失败');
    return { deleted: 0 };
  }
}

// 刷新当前管理员权限并写入 localStorage
async function refreshCurrentAdminPermissions(){
  const token = localStorage.getItem('admin_token');
  if(!token) return;
  try {
    const resp = await fetch('/admin/api/profile', { headers: { Authorization: `Bearer ${token}` } });
    if(!resp.ok) return;
    const data = await resp.json();
    if(data && data.admin){
      try { localStorage.setItem('admin_permissions', JSON.stringify(data.admin.permissions || [])); } catch{}
      try { localStorage.setItem('admin_profile', JSON.stringify(data.admin)); } catch{}
      try { window.dispatchEvent(new CustomEvent('permissions-updated', { detail: { permissions: data.admin.permissions || [] }})); } catch{}
    }
  } catch (e) { console.warn('[roles] refresh permissions failed', e); }
}

function bindEvents() {
  checkAllEl?.addEventListener('change', (event) => {
    const checked = event.target.checked;
    tableBody.querySelectorAll('input[type="checkbox"]').forEach((box) => {
      box.checked = checked;
    });
  });

  // 允许点击名称单元格单选方便编辑
  tableBody.addEventListener('click', (e) => {
    const nameCell = e.target.closest('.role-name');
    if (nameCell) {
      const id = nameCell.dataset.id;
      // 清除其他勾选
      tableBody.querySelectorAll('input[type="checkbox"]').forEach((box) => (box.checked = false));
      const box = tableBody.querySelector(`input[type="checkbox"][data-id="${id}"]`);
      if (box) box.checked = true;
    }
  });

  tableBody.addEventListener('click', (event) => {
    const button = event.target.closest('.action-btn');
    if (!button) return;
    const action = button.dataset.action;
    const id = button.dataset.id;
    if (action === 'edit') {
      const target = roles.find((r) => Number(r.id) === Number(id));
      if (target) {
        showRoleEditModal(target);
      }
      return;
    }
    if (action === 'delete') {
      const cascade = getCascadeDeleteIds([id]);
      const confirmed = confirm(
        cascade.length > 1
          ? `将删除角色组 #${id} 及其 ${cascade.length - 1} 个子级，共计 ${cascade.length} 条（后端会忽略受保护组）。继续？`
          : `确定删除角色组 #${id} 吗？`
      );
      if (!confirmed) return;
      performDeleteByIds([id]).then(({ deleted }) => alert(`已请求删除，预计删除 ${deleted} 个角色组。`));
    }
  });

  addBtn?.addEventListener('click', () => {
    editingRoleId = null;
    showRoleModal();
  });

  // 顶部“编辑”按钮：要求只选择一个
  editBtn?.addEventListener('click', () => {
    const ids = getSelectedIds();
    if (ids.length !== 1) {
      alert('请选择一个要编辑的角色组。');
      return;
    }
    const idNum = Number(ids[0]);
    const target = roles.find((r) => Number(r.id) === idNum);
    if (!target) {
      alert('未找到要编辑的角色组。');
      return;
    }
    showRoleEditModal(target);
  });

  deleteBtn?.addEventListener('click', () => {
    const ids = getSelectedIds();
    if (ids.length === 0) {
      alert('请先选择要删除的角色组。');
      return;
    }
    const cascade = getCascadeDeleteIds(ids);
    if (cascade.length === 0) {
      alert('已选择的角色组中包含受保护或无效项，未执行删除。');
      return;
    }
    const confirmed = confirm(
      cascade.length > ids.length
        ? `选中了 ${ids.length} 个，将级联删除包含子级在内共 ${cascade.length} 个角色组（已自动忽略受保护的超级管理员组）。是否继续？`
        : `将删除选中的 ${ids.length} 个角色组（已自动忽略受保护的超级管理员组）。是否继续？`
    );
    if (!confirmed) return;
    performDeleteByIds(ids).then(({ deleted }) => alert(`已请求删除，预计删除 ${deleted} 个角色组。`));
  });

  refreshBtn?.addEventListener('click', () => { fetchRolesFromServer().then(()=> alert('已刷新角色组列表')); });
}

ensureToken();
renderProfile();
fetchRolesFromServer().then(()=> { if (!roles.length) renderTable(); });
bindEvents();

logoutBtn?.addEventListener('click', async () => {
  const token = localStorage.getItem('admin_token') || '';
  try { await fetch('/admin/api/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }); } catch {}
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_profile');
  window.location.replace('/admin/login');
});

// ---------- 角色组新增弹窗逻辑 ----------
function showRoleModal() {
  if (!roleModal) return;
  // 标题
  roleModalTitle && (roleModalTitle.textContent = editingRoleId == null ? '添加角色组' : '编辑角色组');
  // 父级选项（含 顶级）
  if (roleParentSelect) {
    const options = [{ id: 0, name: '作为顶级' }, ...roles.map((r) => ({ id: r.id, name: `${r.name} (#${r.id})` }))];
    roleParentSelect.innerHTML = options
      .map((op) => `<option value="${op.id}">${op.name}</option>`) 
      .join('');
    roleParentSelect.value = '0';
  }
  // 清空名称与状态
  if (roleNameInput) roleNameInput.value = '';
  const statusActive = document.querySelector('input[name="role-status"][value="active"]');
  const statusHidden = document.querySelector('input[name="role-status"][value="hidden"]');
  if (statusActive) statusActive.checked = true;
  if (statusHidden) statusHidden.checked = false;

  // 渲染权限树
  renderPermTree(true);

  roleModal.style.display = 'flex';
}

function hideRoleModal() {
  if (!roleModal) return;
  roleModal.style.display = 'none';
  editingRoleId = null;
}

function renderPermTree(expandAll = true, preSelected = []) {
  if (!permTreeEl) return;
  permTreeEl.innerHTML = backendMenus
    .map((g) => {
      const children = (g.children || [])
        .map((c) => {
          const key = `${g.id}/${c.id}`;
          const checked = preSelected.includes(key) ? 'checked' : '';
          return `<label><input type="checkbox" data-type="child" data-parent="${g.id}" data-key="${key}" ${checked} /> ${c.name}</label>`;
        })
        .join('');
      return `
        <div class="perm-group ${expandAll ? '' : 'perm-collapsed'}" data-group="${g.id}">
          <label class="perm-head"><input type="checkbox" data-type="parent" data-key="${g.id}" ${preSelected.includes(g.id) ? 'checked' : ''} /> ${g.name}</label>
          <div class="perm-children">${children || '<em style="color:#64748b;font-size:12px;">无下级</em>'}</div>
        </div>`;
    })
    .join('');

  // 绑定父子联动
  permTreeEl.addEventListener('change', onPermChange, { once: true, capture: false });

  // 工具条复位
  if (permCheckAll) permCheckAll.checked = false;
  if (permExpandAll) permExpandAll.checked = expandAll;

  // 父级勾选状态同步（如果所有子级被选中则父级选中）
  backendMenus.forEach((g) => {
    const boxes = Array.from(
      permTreeEl.querySelectorAll(`.perm-group[data-group="${g.id}"] .perm-children input[type="checkbox"]`)
    );
    const parentBox = permTreeEl.querySelector(`input[data-type="parent"][data-key="${g.id}"]`);
    if (parentBox && boxes.length) parentBox.checked = boxes.every((b) => b.checked);
  });
}

function onPermChange(e) {
  const target = e.target;
  if (!(target instanceof HTMLInputElement)) return;
  const type = target.dataset.type;
  if (type === 'parent') {
    const groupId = target.dataset.key;
    permTreeEl
      .querySelectorAll(`.perm-group[data-group="${groupId}"] .perm-children input[type="checkbox"]`)
      .forEach((box) => (box.checked = target.checked));
  } else if (type === 'child') {
    const parent = target.dataset.parent;
    const boxes = Array.from(
      permTreeEl.querySelectorAll(`.perm-group[data-group="${parent}"] .perm-children input[type="checkbox"]`)
    );
    const allChecked = boxes.every((b) => b.checked);
    const parentBox = permTreeEl.querySelector(`input[data-type="parent"][data-key="${parent}"]`);
    if (parentBox) parentBox.checked = allChecked;
  }
  // 继续监听后续更改
  permTreeEl.addEventListener('change', onPermChange, { once: true, capture: false });
}

permCheckAll?.addEventListener('change', () => {
  if (!permTreeEl) return;
  const checked = permCheckAll.checked;
  permTreeEl.querySelectorAll('input[type="checkbox"]').forEach((box) => (box.checked = checked));
});

permExpandAll?.addEventListener('change', () => {
  if (!permTreeEl) return;
  const expand = permExpandAll.checked;
  permTreeEl.querySelectorAll('.perm-group').forEach((el) => {
    if (expand) el.classList.remove('perm-collapsed');
    else el.classList.add('perm-collapsed');
  });
});

roleModalClose?.addEventListener('click', hideRoleModal);

roleModalCancel?.addEventListener('click', () => {
  // 重置表单
  if (roleNameInput) roleNameInput.value = '';
  if (roleParentSelect) roleParentSelect.value = '0';
  if (permTreeEl) permTreeEl.querySelectorAll('input[type="checkbox"]').forEach((b) => (b.checked = false));
  const statusActive = document.querySelector('input[name="role-status"][value="active"]');
  const statusHidden = document.querySelector('input[name="role-status"][value="hidden"]');
  if (statusActive) statusActive.checked = true;
  if (statusHidden) statusHidden.checked = false;
  editingRoleId = null;
});

roleModalSubmit?.addEventListener('click', () => {
  const name = (roleNameInput?.value || '').trim();
  const parentId = Number(roleParentSelect?.value || '0');
  const status = (document.querySelector('input[name="role-status"]:checked')?.value || 'active').toString();
  if (!name) {
    alert('请输入角色组名称');
    return;
  }

  // 收集权限
  const selected = Array.from(permTreeEl?.querySelectorAll('input[type="checkbox"]:checked') || [])
    .map((box) => box.dataset.key)
    .filter(Boolean);

  // 确保选中子级时包含父级
  const withParent = new Set(selected);
  selected.forEach((key) => {
    if (key.includes('/')) {
      const parent = key.split('/')[0];
      withParent.add(parent);
    }
  });

  if (editingRoleId == null) {
    // 新增 -> 后端 POST /roles
    (async () => {
      try {
        const resp = await fetch('/admin/api/roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('admin_token') || ''}` },
          body: JSON.stringify({ name, parentId, status, permissions: Array.from(withParent) })
        });
        if (!resp.ok) {
          const data = await resp.json().catch(()=>({}));
          alert('创建失败' + (data.error ? `: ${data.error}` : ''));
          return;
        }
  await fetchRolesFromServer();
  await refreshCurrentAdminPermissions();
  hideRoleModal();
  alert(`已创建角色组「${name}」，开通权限 ${withParent.size} 项。权限缓存已刷新。`);
      } catch (e) { console.error(e); alert('网络错误，创建失败'); }
    })();
  } else {
    // 编辑 -> 后端 PUT /roles/:id
    (async () => {
      try {
        const resp = await fetch(`/admin/api/roles/${encodeURIComponent(editingRoleId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('admin_token') || ''}` },
          body: JSON.stringify({ name, parentId, status, permissions: Array.from(withParent) })
        });
        if (!resp.ok) {
          const data = await resp.json().catch(()=>({}));
          alert('更新失败' + (data.error ? `: ${data.error}` : ''));
          return;
        }
  await fetchRolesFromServer();
  await refreshCurrentAdminPermissions();
  hideRoleModal();
  alert(`已更新角色组「${name}」，权限 ${withParent.size} 项。权限缓存已刷新。`);
      } catch (e) { console.error(e); alert('网络错误，更新失败'); }
    })();
  }
});

// 编辑模式入口：传入角色对象
function showRoleEditModal(role) {
  editingRoleId = role.id;
  // 先调用 showRoleModal 以清空，再覆盖数据
  showRoleModal();
  // 填充
  if (roleParentSelect) roleParentSelect.value = String(role.parentId ?? 0);
  if (roleNameInput) roleNameInput.value = role.name || '';
  const statusActive = document.querySelector('input[name="role-status"][value="active"]');
  const statusHidden = document.querySelector('input[name="role-status"][value="hidden"]');
  if (statusActive) statusActive.checked = role.status === 'active';
  if (statusHidden) statusHidden.checked = role.status === 'hidden';
  // 重新渲染权限并预选
  renderPermTree(true, role.permissions || []);
}

// （保留空位）
