const nameEl = document.querySelector('#admin-name');
const avatarEl = document.querySelector('#sidebar-avatar');
const logoutBtn = document.querySelector('#logout-btn');
const searchInput = document.querySelector('#rules-search');
const tableBody = document.querySelector('#rules-table tbody');
const checkAllEl = document.querySelector('#rules-check-all');
const refreshBtn = document.querySelector('#rules-refresh');
const expandBtn = document.querySelector('#rules-expand');
const addBtn = document.querySelector('#rules-add');
const editBtn = document.querySelector('#rules-edit');
const deleteBtn = document.querySelector('#rules-delete');
const toggleAllBtn = document.querySelector('#rules-toggle-all');
const exportBtn = document.querySelector('#rules-export');

const rules = [
  { id: 1, title: '控制台', icon: 'dashboard', rule: 'dashboard', permCount: 143, status: 'active', menu: true },
  { id: 2, title: '常规管理', icon: 'general', rule: 'general', permCount: 137, status: 'active', menu: true },
  { id: 3, title: '常规配置', icon: 'general/config', rule: 'general/config', permCount: 60, status: 'active', menu: false },
  { id: 7, title: '附件管理', icon: 'general/attachment', rule: 'general/attachment', permCount: 53, status: 'active', menu: true },
  { id: 8, title: '个人资料', icon: 'general/profile', rule: 'general/profile', permCount: 34, status: 'active', menu: true },
  { id: 9, title: '分类管理', icon: 'category', rule: 'category', permCount: 119, status: 'hidden', menu: true },
  { id: 5, title: '权限管理', icon: 'auth', rule: 'auth', permCount: 98, status: 'active', menu: true },
  { id: 6, title: '管理员管理', icon: 'auth/admin', rule: 'auth/admin', permCount: 118, status: 'active', menu: true },
  { id: 10, title: '管理员日志', icon: 'auth/adminlog', rule: 'auth/adminlog', permCount: 113, status: 'active', menu: true },
  { id: 11, title: '角色组', icon: 'auth/group', rule: 'auth/group', permCount: 109, status: 'active', menu: true },
  { id: 12, title: '菜单规则', icon: 'auth/rule', rule: 'auth/rule', permCount: 104, status: 'active', menu: true },
  { id: 13, title: '插件管理', icon: 'addon', rule: 'addon', permCount: 0, status: 'active', menu: true },
  { id: 14, title: '会员管理', icon: 'user', rule: 'user', permCount: 0, status: 'active', menu: true },
  { id: 67, title: '上架管理', icon: 'user/user', rule: 'user/user', permCount: 0, status: 'active', menu: true },
  { id: 340, title: '头像审核', icon: 'user/avatar', rule: 'user/avatar', permCount: 0, status: 'active', menu: true },
  { id: 341, title: '客服管理', icon: 'user/user/kefu', rule: 'user/user/kefu', permCount: 0, status: 'hidden', menu: true },
  { id: 80, title: '微信管理', icon: 'wechat', rule: 'wechat', permCount: 0, status: 'hidden', menu: true },
  { id: 81, title: '自动回复', icon: 'wechat/autoreply', rule: 'wechat/autoreply', permCount: 0, status: 'hidden', menu: true },
  { id: 82, title: '公众号配置', icon: 'wechat/config', rule: 'wechat/config', permCount: 0, status: 'hidden', menu: true },
  { id: 106, title: '客服消息', icon: 'wechat/response', rule: 'wechat/response', permCount: 0, status: 'hidden', menu: true }
];

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
  const keyword = (searchInput?.value || '').trim().toLowerCase();
  if (!keyword) return rules;
  return rules.filter((item) => {
    return (
      item.title.toLowerCase().includes(keyword) ||
      item.icon.toLowerCase().includes(keyword) ||
      item.rule.toLowerCase().includes(keyword)
    );
  });
}

function renderTable() {
  const data = filterData();

  if (checkAllEl) checkAllEl.checked = false;

  if (data.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="9" class="empty">暂无规则记录</td></tr>';
    return;
  }

  tableBody.innerHTML = data
    .map(
      (item) => `
        <tr>
          <td><input type="checkbox" data-id="${item.id}" /></td>
          <td>${item.id}</td>
          <td>${item.title}</td>
          <td><span class="rule-icon">${item.icon}</span></td>
          <td>${item.rule}</td>
          <td>${item.permCount}</td>
          <td><span class="status-pill ${item.status === 'active' ? 'active' : 'disabled'}">${
        item.status === 'active' ? '正常' : '隐藏'
      }</span></td>
          <td>
            <button class="switch ${item.menu ? 'on' : ''}" data-action="menu-toggle" data-id="${
        item.id
      }" aria-label="切换菜单显示">
              <span class="switch-handle"></span>
            </button>
          </td>
          <td>
            <div class="table-actions">
              <button class="action-btn" data-action="add-child" data-id="${item.id}" title="新增子节点">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 5v5H7v2h5v5h2v-5h5v-2h-5V5Z"/></svg>
              </button>
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

function bindEvents() {
  searchInput?.addEventListener('input', () => {
    renderTable();
  });

  checkAllEl?.addEventListener('change', (event) => {
    const checked = event.target.checked;
    tableBody.querySelectorAll('input[type="checkbox"]').forEach((box) => {
      box.checked = checked;
    });
  });

  refreshBtn?.addEventListener('click', () => {
    alert('已刷新规则数据（演示）。');
  });

  expandBtn?.addEventListener('click', () => {
    alert('演示环境：展开全部规则节点。');
  });

  addBtn?.addEventListener('click', () => {
    alert('演示环境：请在此弹出新增规则表单。');
  });

  editBtn?.addEventListener('click', () => {
    const ids = getSelectedIds();
    if (ids.length !== 1) {
      alert('请选择单条规则进行编辑。');
      return;
    }
    alert(`演示环境：编辑规则 #${ids[0]}`);
  });

  deleteBtn?.addEventListener('click', () => {
    const ids = getSelectedIds();
    if (ids.length === 0) {
      alert('请先选择要删除的规则。');
      return;
    }
    const confirmed = confirm(`确定删除选中的 ${ids.length} 条规则吗？`);
    if (confirmed) alert('演示环境：不会真正删除记录。');
  });

  toggleAllBtn?.addEventListener('click', () => {
    alert('演示环境：执行批量显示/隐藏操作。');
  });

  exportBtn?.addEventListener('click', () => {
    alert('演示环境：导出将生成规则报表。');
  });

  tableBody.addEventListener('click', (event) => {
    const switchBtn = event.target.closest('.switch');
    if (switchBtn) {
      switchBtn.classList.toggle('on');
      return;
    }

    const actionBtn = event.target.closest('.action-btn');
    if (!actionBtn) return;
    const action = actionBtn.dataset.action;
    const id = actionBtn.dataset.id;
    if (action === 'add-child') {
      alert(`演示环境：为规则 #${id} 新增子节点。`);
    } else if (action === 'edit') {
      alert(`演示环境：编辑规则 #${id}。`);
    } else if (action === 'delete') {
      const confirmed = confirm(`确定删除规则 #${id} 吗？`);
      if (confirmed) alert('演示环境：不会真正删除记录。');
    }
  });
}

ensureToken();
renderProfile();
renderTable();
bindEvents();

logoutBtn?.addEventListener('click', () => {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_profile');
  window.location.replace('/admin/login');
});
