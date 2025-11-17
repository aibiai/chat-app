const nameEl = document.querySelector('#admin-name');
const avatarEl = document.querySelector('#sidebar-avatar');
const logoutBtn = document.querySelector('#logout-btn');
const tableBody = document.querySelector('#customer-table tbody');
const infoEl = document.querySelector('#customer-info');
const pagerContainer = document.querySelector('#customer-pager');
const pageSizeSelect = document.querySelector('#customer-page-size');
const searchInput = document.querySelector('#customer-search');
const checkAllEl = document.querySelector('#customer-check-all');

let customers = [];
async function fetchCustomers(){
  const token = localStorage.getItem('admin_token') || '';
  try {
    const resp = await fetch('/admin/api/customer-service?page=1&pageSize=500', { headers:{ Authorization:`Bearer ${token}` }});
    if(!resp.ok) throw new Error('network');
    const data = await resp.json();
    if(data && data.ok && Array.isArray(data.list)){ customers = data.list; return customers; }
  } catch(e){ console.warn('[customer-service] 获取客服列表失败', e); }
  return customers;
}

const state = {
  page: 1,
  pageSize: 10,
  keyword: ''
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
  const name = profile.nickname || profile.username || '\u7ba1\u7406\u5458';
  if (nameEl) nameEl.textContent = name;
  if (avatarEl) avatarEl.textContent = name.slice(0, 1).toUpperCase();
}

function filterData() {
  const keyword = state.keyword.trim().toLowerCase();
  if (!keyword) return customers;
  return customers.filter(item => (
    item.owner.toLowerCase().includes(keyword) ||
    item.username.toLowerCase().includes(keyword) ||
    item.nickname.toLowerCase().includes(keyword) ||
    item.email.toLowerCase().includes(keyword) ||
    String(item.id).includes(keyword)
  ));
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
    tableBody.innerHTML = '<tr><td colspan="18" class="empty">\u6682\u65e0\u6570\u636e</td></tr>';
  } else {
    tableBody.innerHTML = pageData
      .map(
        (item) => `
        <tr>
          <td><input type="checkbox" data-id="${item.id}" /></td>
          <td>${item.id}</td>
          <td>${item.owner}</td>
          <td>${item.username}</td>
          <td>${item.nickname}</td>
          <td>${item.email}</td>
          <td><img src="${item.avatar}" alt="${item.nickname}" class="member-avatar" /></td>
          <td>${item.level}</td>
          <td>${item.gender}</td>
          <td>${item.balance}</td>
          <td>${item.crystalExpire}</td>
          <td>${item.emperorExpire}</td>
          <td>${item.lastLogin}</td>
          <td>${item.lastIp}</td>
          <td>${item.joinedAt}</td>
          <td>${item.joinIp}</td>
          <td>
            <span class="status-pill ${item.status === 'active' ? 'active' : 'disabled'}">
              ${item.status === 'active' ? '\u6b63\u5e38' : '\u51bb\u7ed3'}
            </span>
          </td>
          <td>
            <div class="table-actions">
              <button class="action-btn info" data-action="logs" data-id="${item.id}" title="\u67e5\u770b\u5185\u5bb9">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M12 20a8 8 0 1 1 8-8 8.009 8.009 0 0 1-8 8Zm0-14a6 6 0 1 0 6 6 6.006 6.006 0 0 0-6-6Zm0 2.9A2.1 2.1 0 1 1 9.9 11 2.1 2.1 0 0 1 12 8.9Zm0 3.4a4.4 4.4 0 0 0-3.81 2.1 4.994 4.994 0 0 0 7.62 0A4.4 4.4 0 0 0 12 12.3Z"/>
                </svg>
              </button>
              <button class="action-btn edit" data-action="edit" data-id="${item.id}" title="\u7f16\u8f91">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="m20.71 7.04-3.75-3.75a1 1 0 0 0-1.42 0L3 15.83V20h4.17L20.71 8.46a1 1 0 0 0 0-1.42ZM6.59 18H5v-1.59l8.06-8.06 1.59 1.59Zm9.47-9.47-1.59-1.59 1.42-1.42 1.59 1.59Z"/>
                </svg>
              </button>
            </div>
          </td>
        </tr>`
      )
      .join('');
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / state.pageSize));
  state.page = Math.min(state.page, totalPages);
  infoEl.innerHTML = `\u663e\u793a\u7b2c&nbsp;${state.page}&nbsp;\u9875&nbsp;/&nbsp;\u5171&nbsp;${totalPages}&nbsp;\u9875\uff0c\u603b\u8ba1&nbsp;${filtered.length}&nbsp;\u6761\u8bb0\u5f55`;

  const buttons = [];
  const startPage = Math.max(1, state.page - 2);
  const endPage = Math.min(totalPages, startPage + 4);
  for (let i = startPage; i <= endPage; i++) {
    buttons.push(`<button data-page="${i}" class="${i === state.page ? 'active' : ''}">${i}</button>`);
  }
  pagerContainer.innerHTML = buttons.join('');
}

function getSelectedIds() {
  return Array.from(tableBody.querySelectorAll('input[type="checkbox"]:checked')).map((item) => Number(item.dataset.id));
}

function bindEvents() {
  searchInput?.addEventListener('input', (event) => {
    state.keyword = event.target.value;
    state.page = 1;
    renderTable();
  });

  pageSizeSelect?.addEventListener('change', (event) => {
    state.pageSize = Number(event.target.value);
    state.page = 1;
    renderTable();
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

  checkAllEl?.addEventListener('change', (event) => {
    const checked = event.target.checked;
    tableBody.querySelectorAll('input[type="checkbox"]').forEach((box) => {
      box.checked = checked;
    });
  });

  document.querySelector('#customer-refresh')?.addEventListener('click', () => {
    renderTable();
    alert('\u5df2\u66f4\u65b0\u5ba2\u670d\u5217\u8868\uff08\u6f14\u793a\uff09\u3002');
  });

  document.querySelector('#customer-export')?.addEventListener('click', () => {
    alert('\u5bfc\u51fa\u5ba2\u670d\u5217\u8868\uff08\u6f14\u793a\uff09\u3002');
  });

  document.querySelector('#customer-delete')?.addEventListener('click', async () => {
    const selected = getSelectedIds();
    if (!selected.length) { alert('\u8bf7\u5148\u9009\u62e9\u9700\u8981\u5220\u9664\u7684\u8bb0\u5f55\u3002'); return; }
    if(!confirm(`\u786e\u5b9a\u5220\u9664 ${selected.length} \u4e2a\u5ba2\u670d\u8bb0\u5f55\u5417\uff1f`)) return;
    try {
      const resp = await fetch('/admin/api/customer-service/delete', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('admin_token')||''}` },
        body: JSON.stringify({ ids: selected.map(Number) })
      });
      if(!resp.ok){
        if(resp.status === 404) alert('\u5220\u9664\u5931\u8d25\uff1a\u8bb0\u5f55\u4e0d\u5b58\u5728');
        else if(resp.status === 400) alert('\u8bf7\u786e\u8ba4ID');
        else alert('\u5220\u9664\u5931\u8d25');
      } else {
        await fetchCustomers(); state.page=1; renderTable(); alert('\u5df2\u5220\u9664\u6240\u9009');
      }
    } catch(err){ console.error(err); alert('\u7f51\u7edc\u9519\u8bef\uff0c\u5220\u9664\u5931\u8d25'); }
  });

  document.querySelector('#customer-more')?.addEventListener('click', () => {
    alert('\u66f4\u591a\u529f\u80fd\u6b63\u5728\u5f00\u53d1\u4e2d\uff0c\u53ef\u5305\u62ec\u6279\u91cf\u8bbe\u4e3a\u9ed8\u8ba4\u5ba2\u670d\u548c\u89c4\u5219\u914d\u7f6e\uff08\u6f14\u793a\uff09\u3002');
  });

  tableBody.addEventListener('click', (event) => {
    const actionBtn = event.target.closest('.action-btn');
    if (!actionBtn) return;
    const action = actionBtn.dataset.action;
    const id = Number(actionBtn.dataset.id);
    if (action === 'logs') {
      alert(`\u67e5\u770b\u5ba2\u670d #${id} \u7684\u804a\u5929\u8bb0\u5f55\uff08\u6682\u672a\u5b9e\u73b0\uff09\u3002`);
    } else if (action === 'edit') {
      alert(`\u7f16\u8f91\u5ba2\u670d #${id} \uff08\u6682\u672a\u5b9e\u73b0\uff09\u3002`);
    }
  });
}

ensureToken();
renderProfile();
fetchCustomers().then(()=>{ renderTable(); });
bindEvents();

logoutBtn?.addEventListener('click', () => {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_profile');
  window.location.replace('/admin/login');
});
