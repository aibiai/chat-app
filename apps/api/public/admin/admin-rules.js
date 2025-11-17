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

let rules = [];

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
  const keyword = (searchInput?.value || '').trim().toLowerCase();
  const data = !keyword ? rules : rules.filter(item => (
    item.title.toLowerCase().includes(keyword) ||
    item.icon.toLowerCase().includes(keyword) ||
    item.rule.toLowerCase().includes(keyword)
  ));

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
    fetchRulesFromServer();
  });

  expandBtn?.addEventListener('click', () => {
    alert('演示环境：展开全部规则节点。');
  });

  addBtn?.addEventListener('click', () => {
    const title = prompt('规则标题：');
    if(!title) return;
    const icon = prompt('图标（可选）：') || '';
    const rule = prompt('规则标识（如 dashboard 或 members/members）：');
    if(!rule) return alert('必须填写规则标识');
    (async () => {
      try {
        const resp = await fetch('/admin/api/rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('admin_token') || ''}` },
          body: JSON.stringify({ title, icon, rule, permCount: 0, status: 'active', menu: true })
        });
        if(!resp.ok){
          if(resp.status===403) alert('权限不足：需要 auth/rules 权限'); else alert('创建失败');
          return;
        }
        await fetchRulesFromServer();
        alert('已创建');
      } catch(e){ console.error(e); alert('网络错误'); }
    })();
  });

  editBtn?.addEventListener('click', () => {
    const ids = getSelectedIds();
    if (ids.length !== 1) return alert('请选择单条规则进行编辑');
    const id = ids[0];
    const target = rules.find(r=>String(r.id)===String(id));
    if(!target) return alert('记录不存在');
    const title = prompt('规则标题：', target.title) || target.title;
    const icon = prompt('图标：', target.icon) || target.icon;
    const rule = prompt('规则标识：', target.rule) || target.rule;
    const status = confirm('是否保持为正常状态? 取消则隐藏') ? 'active' : 'hidden';
    const menu = confirm('是否在菜单中显示?');
    (async () => {
      try {
        const resp = await fetch(`/admin/api/rules/${encodeURIComponent(id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('admin_token') || ''}` },
          body: JSON.stringify({ title, icon, rule, status, menu })
        });
        if(!resp.ok){ if(resp.status===403) alert('权限不足：需要 auth/rules 权限'); else alert('更新失败'); return; }
        await fetchRulesFromServer();
        alert('已更新');
      } catch(e){ console.error(e); alert('网络错误'); }
    })();
  });

  deleteBtn?.addEventListener('click', () => {
    const ids = getSelectedIds();
    if (!ids.length) return alert('请选择要删除的规则');
    if(!confirm(`确定删除选中的 ${ids.length} 条规则吗？`)) return;
    (async () => {
      try {
        const resp = await fetch('/admin/api/rules/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('admin_token') || ''}` },
          body: JSON.stringify({ ids: ids.map(i=>Number(i)) })
        });
        if(!resp.ok){ if(resp.status===403) alert('权限不足：需要 auth/rules 权限'); else alert('删除失败'); return; }
        await fetchRulesFromServer();
        alert('已删除');
      } catch(e){ console.error(e); alert('网络错误'); }
    })();
  });

  toggleAllBtn?.addEventListener('click', () => {
    if(!rules.length) return;
    const anyHidden = rules.some(r=>r.status==='hidden');
    const targetStatus = anyHidden ? 'active' : 'hidden';
    (async () => {
      for(const r of rules){
        try {
          await fetch(`/admin/api/rules/${encodeURIComponent(r.id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('admin_token') || ''}` },
            body: JSON.stringify({ status: targetStatus })
          });
        } catch {}
      }
      await fetchRulesFromServer();
      alert(`已批量设为 ${targetStatus==='active'?'正常':'隐藏'}`);
    })();
  });

  exportBtn?.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(rules, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'admin_rules_export.json'; a.click();
    URL.revokeObjectURL(url);
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
      alert('当前简易实现：暂未支持层级结构，请直接使用新增添加顶级规则。');
    } else if (action === 'edit') {
      editBtn.click();
    } else if (action === 'delete') {
      deleteBtn.click();
    }
  });
}

async function fetchRulesFromServer(){
  const token = ensureToken();
  if(!token) return;
  try {
    const resp = await fetch('/admin/api/rules', { headers: { Authorization: `Bearer ${token}` }});
    if(!resp.ok){ if(resp.status===403) alert('权限不足：需要 auth/rules 权限'); return; }
    const data = await resp.json();
    if(data && Array.isArray(data.list)){
      rules = data.list;
      renderTable();
    }
  } catch(e){ console.error(e); }
}

ensureToken();
renderProfile();
bindEvents();
fetchRulesFromServer();

logoutBtn?.addEventListener('click', () => {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_profile');
  window.location.replace('/admin/login');
});
