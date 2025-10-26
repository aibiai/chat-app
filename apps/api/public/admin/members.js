const nameEl = document.querySelector('#admin-name');
const avatarEl = document.querySelector('#sidebar-avatar');
const logoutBtn = document.querySelector('#logout-btn');
const tableBody = document.querySelector('#member-table tbody');
const infoEl = document.querySelector('#member-info');
const pagerContainer = document.querySelector('#member-pager');
const pageSizeSelect = document.querySelector('#member-page-size');
const searchInput = document.querySelector('#member-search');
const filterTabs = document.querySelector('#member-filter');
const checkAllEl = document.querySelector('#member-check-all');

const members = [
  {
    id: 11571,
    owner: 'Alex002',
    username: 'lollol',
    nickname: 'lolol',
    email: '123qwe@gmail.com',
    avatar: 'https://i.pravatar.cc/48?img=1',
    points: 0,
    gender: '\u7537',
    crystalExpire: '\u65e0',
    emperorExpire: '\u65e0',
    lastLogin: '2025-10-08 00:54:41',
    lastIp: '49.215.25.65',
    online: false,
    hidden: false,
    joinedAt: '2025-09-30 00:54:41',
    joinIp: '49.215.25.65',
    status: 'active',
    remark: '\u67e5\u770b\u67e5\u91cd\u8bb0\u5f55'
  },
  {
    id: 11567,
    owner: 'Alex005',
    username: 'nhk740330',
    nickname: 'nhk740330',
    email: 'nhk80312@email.com',
    avatar: 'https://i.pravatar.cc/48?img=9',
    points: 0,
    gender: '\u7537',
    crystalExpire: '\u65e0',
    emperorExpire: '\u65e0',
    lastLogin: '2025-10-09 17:22:48',
    lastIp: '27.52.5.163',
    online: false,
    hidden: false,
    joinedAt: '2025-09-30 17:22:48',
    joinIp: '27.52.5.163',
    status: 'active',
    remark: '\u67e5\u770b\u67e5\u91cd\u8bb0\u5f55'
  },
  {
    id: 11562,
    owner: 'Alex005',
    username: 'kk888',
    nickname: 'kk888',
    email: 'chenkunyuan.kevin@gmail.com',
    avatar: 'https://i.pravatar.cc/48?img=11',
    points: 0,
    gender: '\u7537',
    crystalExpire: '\u65e0',
    emperorExpire: '\u65e0',
    lastLogin: '2025-09-30 23:10:15',
    lastIp: '1.171.55.114',
    online: false,
    hidden: false,
    joinedAt: '2025-09-30 23:10:15',
    joinIp: '1.171.55.114',
    status: 'active',
    remark: '\u67e5\u770b\u67e5\u91cd\u8bb0\u5f55'
  },
  {
    id: 11560,
    owner: 'Alex002',
    username: 'qqw123',
    nickname: 'qqw123',
    email: 'harry3200000@yahoo.com.tw',
    avatar: 'https://i.pravatar.cc/48?img=21',
    points: 0,
    gender: '\u7537',
    crystalExpire: '\u65e0',
    emperorExpire: '\u65e0',
    lastLogin: '2025-09-30 22:48:59',
    lastIp: '27.242.99.255',
    online: true,
    hidden: false,
    joinedAt: '2025-09-30 22:48:59',
    joinIp: '27.242.99.255',
    status: 'active',
    remark: '\u67e5\u770b\u67e5\u91cd\u8bb0\u5f55'
  },
  {
    id: 11559,
    owner: 'Alex002',
    username: 'age010728',
    nickname: 'Age010728',
    email: 'a0097382213@email.com.tw',
    avatar: 'https://i.pravatar.cc/48?img=37',
    points: 0,
    gender: '\u7537',
    crystalExpire: '\u65e0',
    emperorExpire: '\u65e0',
    lastLogin: '2025-09-30 19:12:58',
    lastIp: '42.77.177.61',
    online: false,
    hidden: true,
    joinedAt: '2025-09-30 19:12:58',
    joinIp: '42.77.177.61',
    status: 'active',
    remark: '\u67e5\u770b\u67e5\u91cd\u8bb0\u5f55'
  },
  {
    id: 11556,
    owner: 'Alex005',
    username: '2253575',
    nickname: '2253575',
    email: 'qq078602480@gmail.com',
    avatar: 'https://i.pravatar.cc/48?img=55',
    points: 0,
    gender: '\u7537',
    crystalExpire: '\u65e0',
    emperorExpire: '\u65e0',
    lastLogin: '2025-09-30 01:35:08',
    lastIp: '42.71.111.13',
    online: true,
    hidden: false,
    joinedAt: '2025-09-30 01:35:08',
    joinIp: '42.71.111.13',
    status: 'active',
    remark: '\u67e5\u770b\u67e5\u91cd\u8bb0\u5f55'
  }
];

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
  if (nameEl) nameEl.textContent = profile.nickname || profile.username || '\u7ba1\u7406\u5458';
  if (avatarEl) avatarEl.textContent = (profile.nickname || profile.username || 'A').slice(0, 1).toUpperCase();
}

function filterData() {
  const keyword = state.keyword.trim().toLowerCase();
  return members.filter((member) => {
    const matchStatus =
      state.status === 'all' ||
      (state.status === 'active' && member.status === 'active') ||
      (state.status === 'frozen' && member.status === 'frozen') ||
      (state.status === 'vip' && (member.crystalExpire !== '\u65e0' || member.emperorExpire !== '\u65e0'));
    const matchKeyword =
      !keyword ||
      member.username.toLowerCase().includes(keyword) ||
      member.nickname.toLowerCase().includes(keyword) ||
      member.email.toLowerCase().includes(keyword) ||
      String(member.id).includes(keyword);
    return matchStatus && matchKeyword;
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
    tableBody.innerHTML = '<tr><td colspan="20" class="empty">\u6682\u65e0\u4f1a\u5458\u8bb0\u5f55</td></tr>';
  } else {
    tableBody.innerHTML = pageData
      .map(
        (item) => `
        <tr>
          <td><input type="checkbox" data-id="${item.id}" /></td>
          <td>${item.id}</td>
          <td><span class="tag-badge owner">${item.owner}</span></td>
          <td>${item.username}</td>
          <td>${item.nickname}</td>
          <td>${item.email}</td>
          <td><img src="${item.avatar}" alt="${item.nickname}" class="member-avatar" /></td>
          <td>${item.points.toFixed(2)}</td>
          <td>${item.gender}</td>
          <td>${item.crystalExpire}</td>
          <td>${item.emperorExpire}</td>
          <td>${item.lastLogin}</td>
          <td><a class="link" href="https://whatismyipaddress.com/ip/${item.lastIp}" target="_blank" rel="noopener">${item.lastIp}</a></td>
          <td>
            <button class="switch ${item.online ? 'on' : ''}" data-toggle="online" data-id="${item.id}" aria-label="\u662f\u5426\u5728\u7ebf">
              <span class="switch-handle"></span>
            </button>
          </td>
          <td>
            <button class="switch ${item.hidden ? 'on' : ''}" data-toggle="hidden" data-id="${item.id}" aria-label="\u662f\u5426\u9690\u85cf">
              <span class="switch-handle"></span>
            </button>
          </td>
          <td>${item.joinedAt}</td>
          <td>${item.joinIp}</td>
          <td>
            <span class="status-pill ${item.status === 'active' ? 'active' : 'disabled'}">
              ${item.status === 'active' ? '\u6b63\u5e38' : '\u51bb\u7ed3'}
            </span>
          </td>
          <td><button class="link-btn" data-action="remark" data-id="${item.id}">${item.remark}</button></td>
          <td>
            <div class="table-actions">
              <button class="action-btn edit" data-action="edit" data-id="${item.id}" title="\u7f16\u8f91">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="m20.71 7.04-3.75-3.75a1 1 0 0 0-1.42 0L3 15.83V20h4.17L20.71 8.46a1 1 0 0 0 0-1.42ZM6.59 18H5v-1.59l8.06-8.06 1.59 1.59Zm9.47-9.47-1.59-1.59 1.42-1.42 1.59 1.59Z"/>
                </svg>
              </button>
              <button class="action-btn delete" data-action="delete" data-id="${item.id}" title="\u5220\u9664">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M6 7h12v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2Zm9-5 1 1h4v2H4V3h4l1-1Zm3 5H6v13h12Z"/>
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
  infoEl.textContent = `\u663e\u793a\u7b2c ${state.page} \u9875 / \u5171 ${totalPages} \u9875\uff0c\u603b\u8ba1 ${filtered.length} \u6761\u8bb0\u5f55`;

  const buttons = [];
  const startPage = Math.max(1, state.page - 2);
  const endPage = Math.min(totalPages, startPage + 4);
  for (let i = startPage; i <= endPage; i++) {
    buttons.push(`<button data-page="${i}" class="${i === state.page ? 'active' : ''}">${i}</button>`);
  }
  pagerContainer.innerHTML = buttons.join('');
}

function getSelectedIds() {
  return Array.from(tableBody.querySelectorAll('input[type="checkbox"]:checked')).map((item) => item.dataset.id);
}

function bindEvents() {
  searchInput?.addEventListener('input', (event) => {
    state.keyword = event.target.value;
    state.page = 1;
    renderTable();
  });

  filterTabs?.addEventListener('click', (event) => {
    const btn = event.target.closest('.tab-btn');
    if (!btn) return;
    filterTabs.querySelectorAll('.tab-btn').forEach((tab) => tab.classList.remove('active'));
    btn.classList.add('active');
    state.status = btn.dataset.status;
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

  pageSizeSelect?.addEventListener('change', (event) => {
    state.pageSize = Number(event.target.value);
    state.page = 1;
    renderTable();
  });

  checkAllEl?.addEventListener('change', (event) => {
    const checked = event.target.checked;
    tableBody.querySelectorAll('input[type="checkbox"]').forEach((box) => {
      box.checked = checked;
    });
  });

  tableBody.addEventListener('click', (event) => {
    const switchBtn = event.target.closest('.switch');
    if (switchBtn) {
      switchBtn.classList.toggle('on');
      return;
    }

    const linkBtn = event.target.closest('.link-btn');
    if (linkBtn) {
      alert(`\u64cd\u4f5c\uff1a${linkBtn.textContent}\uff08\u6f14\u793a\uff09\u3002`);
      return;
    }

    const actionBtn = event.target.closest('.action-btn');
    if (!actionBtn) return;
    const action = actionBtn.dataset.action;
    const id = actionBtn.dataset.id;
    if (action === 'edit') {
      alert(`\u7f16\u8f91\u4f1a\u5458 #${id} \uff08\u6f14\u793a\uff09\u3002`);
    } else if (action === 'delete') {
      const confirmed = confirm(`\u786e\u5b9a\u5220\u9664\u4f1a\u5458 #${id} \u5417\uff1f`);
      if (confirmed) alert('\u6f14\u793a\u73af\u5883\uff1a\u4e0d\u4f1a\u771f\u6b63\u5220\u9664\u8bb0\u5f55\u3002');
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
