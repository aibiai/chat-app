const nameEl = document.querySelector('#admin-name');
const avatarEl = document.querySelector('#sidebar-avatar');
const logoutBtn = document.querySelector('#logout-btn');

const tableBody = document.querySelector('#uc-table tbody');
const infoEl = document.querySelector('#uc-info');
const pagerContainer = document.querySelector('#uc-pager');
const pageSizeSelect = document.querySelector('#uc-page-size');
const searchInput = document.querySelector('#uc-search');
const checkAllEl = document.querySelector('#uc-check-all');

// Modal elements
const modalMask = document.querySelector('#uc-modal');
const addModalMask = document.querySelector('#uc-add-modal');
const modalTitle = document.querySelector('#uc-modal-title');
const modalCloseBtn = document.querySelector('#uc-modal-close');
const modalCancelBtn = document.querySelector('#uc-modal-cancel');
const modalSubmitBtn = document.querySelector('#uc-modal-submit');
const idInput = document.querySelector('#uc-id');
const nicknameInput = document.querySelector('#uc-nickname');
const emailInput = document.querySelector('#uc-email');
const avatarInput = document.querySelector('#uc-avatar');
const levelSelect = document.querySelector('#uc-level');
const genderSelect = document.querySelector('#uc-gender');
const popularityInput = document.querySelector('#uc-popularity');
const luckyInput = document.querySelector('#uc-lucky');
const quickToggleBtn = document.querySelector('#uc-quick-toggle');

// Add modal inputs
const addNicknameInput = document.querySelector('#uc-add-nickname');
const addEmailInput = document.querySelector('#uc-add-email');
const addAvatarInput = document.querySelector('#uc-add-avatar');
const addLevelSelect = document.querySelector('#uc-add-level');
const addGenderSelect = document.querySelector('#uc-add-gender');
const addPopularityInput = document.querySelector('#uc-add-popularity');
const addLuckyInput = document.querySelector('#uc-add-lucky');
const addQuickBtn = document.querySelector('#uc-add-quick');
const addCloseBtn = document.querySelector('#uc-add-close');
const addCancelBtn = document.querySelector('#uc-add-cancel');
const addSubmitBtn = document.querySelector('#uc-add-submit');

const API_BASE = '/admin/api/user-config';

const state = {
  items: [],
  total: 0,
  page: 1,
  pageSize: Number(pageSizeSelect?.value) || 10,
  keyword: '',
  loading: false,
  editingId: null,
};

function getToken() {
  const token = localStorage.getItem('admin_token');
  if (!token) {
    window.location.replace('/admin/login');
    return null;
  }
  return token;
}

function readProfile() {
  try { return JSON.parse(localStorage.getItem('admin_profile') || 'null'); } catch { return null; }
}

function renderProfile() {
  const profile = readProfile() || {};
  const display = profile.nickname || profile.username || '管理员';
  if (nameEl) nameEl.textContent = display;
  if (avatarEl) avatarEl.textContent = display.slice(0,1).toUpperCase();
}

function formatLevel(lvl){
  if (lvl === 'purple') return '紫晶';
  if (lvl === 'crown') return '皇冠';
  return '普通';
}
function formatGender(g){
  if (g === 'male' || g === '男') return '男';
  if (g === 'female' || g === '女') return '女';
  return '未知';
}

function renderTable(){
  if (checkAllEl) checkAllEl.checked = false;
  if (!state.items.length){
    tableBody.innerHTML = '<tr><td colspan="11" class="empty">暂无数据</td></tr>';
    return;
  }
  tableBody.innerHTML = state.items.map(item => `
    <tr>
      <td><input type="checkbox" data-id="${item.id}" /></td>
      <td>${item.id}</td>
      <td>${escapeHtml(item.nickname || '')}</td>
      <td>${escapeHtml(item.email || '')}</td>
      <td>${item.avatarUrl ? `<img src="${item.avatarUrl}" alt="avatar" class="uc-avatar" />` : '-'}</td>
      <td>${formatGender(item.gender)}</td>
      <td>${formatLevel(item.membershipLevel)}</td>
      <td>${Number(item.popularity || 0)}</td>
      <td>${Number(item.luckyStars || 0)}</td>
      <td>
        <button class="switch ${item.quickTextEnabled ? 'on' : ''}" data-action="toggle-quick" data-id="${item.id}">
          <span class="switch-handle"></span>
        </button>
      </td>
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
    </tr>`).join('');
}

function renderInfo(){
  const totalPages = Math.max(1, Math.ceil(state.total / state.pageSize));
  if (state.page > totalPages) state.page = totalPages;
  infoEl.textContent = `显示第 ${state.page} 页 / 共 ${totalPages} 页，总计 ${state.total} 条记录`;
  const buttons = [];
  const startPage = Math.max(1, state.page - 2);
  const endPage = Math.min(totalPages, startPage + 4);
  for (let i=startPage;i<=endPage;i++){ buttons.push(`<button data-page="${i}" class="${i===state.page?'active':''}">${i}</button>`); }
  pagerContainer.innerHTML = buttons.join('');
}

function renderAll(){ renderTable(); renderInfo(); }

async function fetchList(){
  if (state.loading) return; const token = getToken(); if (!token) return;
  state.loading = true;
  try {
    const params = new URLSearchParams({ page:String(state.page), pageSize:String(state.pageSize) });
    if (state.keyword.trim()) params.set('keyword', state.keyword.trim());
    const resp = await fetch(`${API_BASE}?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!resp.ok) throw new Error(`加载失败: ${resp.status}`);
    const data = await resp.json();
    state.items = Array.isArray(data.list) ? data.list : [];
    state.total = Number(data.total) || state.items.length;
    state.page = Number(data.page) || state.page;
    state.pageSize = Number(data.pageSize) || state.pageSize;
    renderAll();
  } catch (err){ console.error(err); alert('加载用户参数失败，请稍后重试'); state.items=[]; state.total=0; renderAll(); }
  finally { state.loading = false; }
}

function showModal(editing){
  if (editing){
    modalTitle.textContent = '编辑用户参数';
    idInput.value = editing.id;
    nicknameInput.value = editing.nickname || '';
    emailInput.value = editing.email || '';
    avatarInput.value = editing.avatarUrl || '';
    levelSelect.value = editing.membershipLevel || 'none';
    if (genderSelect) genderSelect.value = (editing.gender === 'male' || editing.gender === 'female') ? editing.gender : 'other';
    popularityInput.value = Number(editing.popularity || 0);
    luckyInput.value = Number(editing.luckyStars || 0);
    quickToggleBtn.classList.toggle('on', !!editing.quickTextEnabled);
  } else {
    modalTitle.textContent = '新增用户 (演示仅编辑)';
    idInput.value = ''; nicknameInput.value=''; emailInput.value=''; avatarInput.value=''; levelSelect.value='none'; if(genderSelect) genderSelect.value='other'; popularityInput.value='0'; luckyInput.value='0'; quickToggleBtn.classList.remove('on');
  }
  state.editingId = editing ? editing.id : null;
  modalMask.style.display = 'flex';
}
function hideModal(){ modalMask.style.display='none'; }
function showAddModal(){
  addNicknameInput.value='';
  addEmailInput.value='';
  addAvatarInput.value='';
  addLevelSelect.value='none';
  if (addGenderSelect) addGenderSelect.value='other';
  addPopularityInput.value='0';
  addLuckyInput.value='0';
  addQuickBtn.classList.remove('on');
  addModalMask.style.display='flex';
}
function hideAddModal(){ addModalMask.style.display='none'; }

// create user (shown in Add modal)
async function createUser(){
  const token = getToken(); if(!token) return;
  const payload = {
    nickname: addNicknameInput.value.trim(),
    email: addEmailInput.value.trim(),
    avatarUrl: addAvatarInput.value.trim(),
    gender: addGenderSelect?.value || 'other',
    membershipLevel: addLevelSelect.value,
    popularity: Number(addPopularityInput.value || 0),
    luckyStars: Number(addLuckyInput.value || 0),
    quickTextEnabled: addQuickBtn.classList.contains('on'),
  };
  try {
    const resp = await fetch(API_BASE, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify(payload) });
    if(!resp.ok){ const data = await resp.json().catch(()=>({})); throw new Error(data.error || '创建失败'); }
    hideAddModal(); await fetchList();
  } catch(err){ console.error(err); alert(err.message || '创建失败'); }
}

// save changes for Edit modal
async function saveChanges(){
  const token = getToken(); if (!token) return;
  const id = idInput.value.trim(); if (!id){ alert('缺少 ID'); return; }
  const payload = {
    nickname: nicknameInput.value.trim(),
    email: emailInput.value.trim(),
    avatarUrl: avatarInput.value.trim(),
    gender: genderSelect?.value || undefined,
    membershipLevel: levelSelect.value,
    popularity: Number(popularityInput.value || 0),
    luckyStars: Number(luckyInput.value || 0),
    quickTextEnabled: quickToggleBtn.classList.contains('on'),
  };
  try {
    const resp = await fetch(`${API_BASE}/${id}`, { method:'PUT', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify(payload) });
    if (!resp.ok){ const errData = await resp.json().catch(()=>({})); throw new Error(errData.error || `保存失败(${resp.status})`); }
    await fetchList(); hideModal();
  } catch (err){ console.error(err); alert(err.message || '保存失败'); }
}

async function toggleQuick(id, current){
  const token = getToken(); if (!token) return;
  try {
    const resp = await fetch(`${API_BASE}/${id}/quick-text`, { method:'PATCH', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ enabled: !current }) });
    if (!resp.ok) throw new Error('切换失败');
    await fetchList();
  } catch (err){ console.error(err); alert('切换快捷内容开关失败'); }
}

async function deleteSelected(ids){
  if (!ids.length) return; if (!confirm(`确认删除选中的 ${ids.length} 条记录吗？`)) return;
  const token = getToken(); if (!token) return;
  try {
    const resp = await fetch(`${API_BASE}/delete`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ ids }) });
    if (!resp.ok) throw new Error('删除失败');
    await fetchList();
  } catch (err){ console.error(err); alert('删除失败，请稍后再试'); }
}

function getSelectedIds(){ return Array.from(tableBody.querySelectorAll('input[type="checkbox"]:checked')).map(el => el.dataset.id).filter(Boolean); }

function escapeHtml(str){ return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[s])); }

function bindEvents(){
  searchInput?.addEventListener('input', e => { state.keyword = e.target.value || ''; state.page = 1; fetchList(); });
  pageSizeSelect?.addEventListener('change', e => { state.pageSize = Number(e.target.value)||10; state.page=1; fetchList(); });
  pagerContainer?.addEventListener('click', e => { const btn = e.target.closest('button'); if(!btn) return; const next = Number(btn.dataset.page); if(Number.isFinite(next) && next!==state.page){ state.page=next; fetchList(); }});
  document.querySelectorAll('.table-pager .pager-btn').forEach(btn => btn.addEventListener('click', e => { const type = e.currentTarget.dataset.page; const totalPages = Math.max(1, Math.ceil(state.total / state.pageSize)); if(type==='prev') state.page = Math.max(1, state.page-1); if(type==='next') state.page = Math.min(totalPages, state.page+1); fetchList(); }));
  checkAllEl?.addEventListener('change', e => { const checked = e.target.checked; tableBody.querySelectorAll('input[type="checkbox"]').forEach(box => { box.checked = checked; }); });

  tableBody.addEventListener('click', e => {
    const actionBtn = e.target.closest('.action-btn');
    if (actionBtn){
      const action = actionBtn.dataset.action; const id = actionBtn.dataset.id;
      const row = state.items.find(it => it.id === id);
      if (action === 'edit' && row){ showModal(row); }
      if (action === 'delete' && id){ deleteSelected([id]); }
      return;
    }
    const switchBtn = e.target.closest('.switch[data-action="toggle-quick"]');
    if (switchBtn){
      const id = switchBtn.dataset.id; const current = switchBtn.classList.contains('on');
      toggleQuick(id, current);
    }
  });

  document.querySelector('#uc-refresh')?.addEventListener('click', () => fetchList());
  document.querySelector('#uc-delete')?.addEventListener('click', () => { const ids = getSelectedIds(); if(!ids.length){ alert('请选择记录'); return;} deleteSelected(ids); });
  document.querySelector('#uc-edit')?.addEventListener('click', () => { const ids = getSelectedIds(); if(ids.length!==1){ alert('请选择 1 条记录进行编辑'); return;} const row = state.items.find(it => it.id === ids[0]); if(row) showModal(row); });
  document.querySelector('#uc-add')?.addEventListener('click', () => { showAddModal(); });

  modalCloseBtn?.addEventListener('click', hideModal);
  modalCancelBtn?.addEventListener('click', hideModal);
  modalSubmitBtn?.addEventListener('click', saveChanges);
  quickToggleBtn?.addEventListener('click', () => { quickToggleBtn.classList.toggle('on'); });

  addCloseBtn?.addEventListener('click', hideAddModal);
  addCancelBtn?.addEventListener('click', hideAddModal);
  addSubmitBtn?.addEventListener('click', createUser);
  addQuickBtn?.addEventListener('click', () => { addQuickBtn.classList.toggle('on'); });

  logoutBtn?.addEventListener('click', () => { localStorage.removeItem('admin_token'); localStorage.removeItem('admin_profile'); window.location.replace('/admin/login'); });
}

getToken();
renderProfile();
bindEvents();
fetchList();
