const nameEl = document.querySelector('#admin-name');
const avatarEl = document.querySelector('#sidebar-avatar');
const logoutBtn = document.querySelector('#logout-btn');
const tableBody = document.querySelector('#roles-table tbody');
const checkAllEl = document.querySelector('#roles-check-all');
const addBtn = document.querySelector('#roles-add');
const deleteBtn = document.querySelector('#roles-delete');
const refreshBtn = document.querySelector('#roles-refresh');

const roles = [
  { id: 0, parentId: 0, name: '超级管理员组', status: 'active' },
  { id: 8, parentId: 1, name: '总部管理员组', status: 'active' },
  { id: 9, parentId: 8, name: '上主管理组', status: 'active' }
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
          <td>${item.name}</td>
          <td><span class="status-pill ${item.status === 'active' ? 'active' : 'disabled'}">${item.status === 'active' ? '正常' : '禁用'}</span></td>
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

function bindEvents() {
  checkAllEl?.addEventListener('change', (event) => {
    const checked = event.target.checked;
    tableBody.querySelectorAll('input[type="checkbox"]').forEach((box) => {
      box.checked = checked;
    });
  });

  tableBody.addEventListener('click', (event) => {
    const button = event.target.closest('.action-btn');
    if (!button) return;
    const action = button.dataset.action;
    const id = button.dataset.id;
    if (action === 'edit') {
      alert(`编辑角色组 #${id}（演示功能）`);
    }
    if (action === 'delete') {
      const confirmed = confirm(`确定删除角色组 #${id} 吗？`);
      if (confirmed) alert('演示环境：不执行实际删除。');
    }
  });

  addBtn?.addEventListener('click', () => {
    alert('演示环境：添加角色组弹窗尚未接入。');
  });

  deleteBtn?.addEventListener('click', () => {
    const ids = getSelectedIds();
    if (ids.length === 0) {
      alert('请先选择要删除的角色组。');
      return;
    }
    const confirmed = confirm(`确定批量删除选中的 ${ids.length} 个角色组吗？`);
    if (confirmed) alert('演示环境：不执行实际删除。');
  });

  refreshBtn?.addEventListener('click', () => {
    alert('演示环境：已重新加载角色组列表。');
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
