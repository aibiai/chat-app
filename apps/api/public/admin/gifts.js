const nameEl = document.querySelector('#admin-name');
const avatarEl = document.querySelector('#sidebar-avatar');
const logoutBtn = document.querySelector('#logout-btn');
const tableBody = document.querySelector('#gift-table tbody');
const infoEl = document.querySelector('#gift-info');
const pagerContainer = document.querySelector('#gift-pager');
const pageSizeSelect = document.querySelector('#gift-page-size');
const searchInput = document.querySelector('#gift-search');
const checkAllEl = document.querySelector('#gift-check-all');

let gifts = [];

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

function headers() {
  const x = ensureToken();
  return x ? { 'x-admin-token': x } : {};
}

async function fetchCatalog() {
  try {
    const res = await fetch('/api/gifts/catalog', { headers: { 'content-type': 'application/json' } });
    const data = await res.json();
    gifts = Array.isArray(data?.list) ? data.list : [];
  } catch (e) {
    console.error('load catalog failed', e);
    gifts = [];
  }
}

function renderProfile() {
  const profile = readProfile() || {};
  const displayName = profile.nickname || profile.username || '\u7ba1\u7406\u5458';
  if (nameEl) nameEl.textContent = displayName;
  if (avatarEl) avatarEl.textContent = displayName.slice(0, 1).toUpperCase();
}

function filterData() {
  const keyword = state.keyword.trim().toLowerCase();
  if (!keyword) return gifts;
  return gifts.filter((item) => String(item.name || '').toLowerCase().includes(keyword) || String(item.id).includes(keyword));
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
    tableBody.innerHTML = '<tr><td colspan="8" class="empty">\u6682\u65e0\u6570\u636e</td></tr>';
  } else {
    tableBody.innerHTML = pageData
      .map(
        (item) => `
        <tr>
          <td><input type="checkbox" data-id="${item.id}" /></td>
          <td>${item.id}</td>
          <td>${item.name}</td>
          <td><img src="${item.img}" alt="${item.name}" class="gift-thumb" width="48" height="48" style="width:48px;height:48px;object-fit:cover;border-radius:10px;border:1px solid rgba(226,232,240,0.75);background:#f1f5f9;" /></td>
          <td>${Number(item.price || 0).toFixed(2)}</td>
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
  // 注意：礼物 id 可能为字符串（如 g1、g2），因此不要强制转换为数字
  return Array.from(tableBody.querySelectorAll('input[type="checkbox"]:checked')).map((item) => String(item.dataset.id));
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

  document.querySelector('#gift-refresh')?.addEventListener('click', async () => {
    await fetchCatalog();
    renderTable();
  });

  document.querySelector('#gift-export')?.addEventListener('click', () => {
    alert('\u5bfc\u51fa\u793c\u7269\u7edf\u8ba1\uff08\u6f14\u793a\uff09\u3002');
  });

  // —— 模态框：添加/编辑 ——
  const modal = document.querySelector('#gift-modal');
  const modalTitle = document.querySelector('#gift-modal-title');
  const modalClose = document.querySelector('#gift-modal-close');
  const modalCancel = document.querySelector('#gift-modal-cancel');
  const modalSubmit = document.querySelector('#gift-modal-submit');
  const inputName = document.querySelector('#gift-name');
  const inputPrice = document.querySelector('#gift-price');
  const inputImg = document.querySelector('#gift-img');
  const preview = document.querySelector('#gift-preview');
  const fileInput = document.querySelector('#gift-file');
  const uploadBtn = document.querySelector('#gift-upload');
  const chooseUrlBtn = document.querySelector('#gift-choose-url');

  function showModal(mode = 'create', item = null){
    modal.dataset.mode = mode;
    modal.dataset.id = item?.id ?? '';
    modalTitle.textContent = mode === 'edit' ? '编辑礼物' : '添加礼物';
    inputName.value = item?.name ?? '';
    inputPrice.value = Number(item?.price ?? '').toString();
    inputImg.value = item?.img ?? '';
    if (item?.img) preview.style.backgroundImage = `url(${item.img})`; else preview.style.backgroundImage = 'none';
    modal.style.display = 'flex';
  }

  function hideModal(){
    modal.style.display = 'none';
    inputName.value = '';
    inputPrice.value = '';
    inputImg.value = '';
    preview.style.backgroundImage = 'none';
    modal.dataset.mode = '';
    modal.dataset.id = '';
  }

  document.querySelector('#gift-add')?.addEventListener('click', () => showModal('create'));

  modalClose?.addEventListener('click', hideModal);
  modalCancel?.addEventListener('click', hideModal);

  // 选择 URL
  chooseUrlBtn?.addEventListener('click', () => {
    const url = prompt('请输入图片 URL', inputImg.value || '/static/gifts/star.png') || '';
    if (url){
      inputImg.value = url; preview.style.backgroundImage = `url(${url})`;
    }
  });

  // 上传图片 -> 立即上传并回填 URL
  uploadBtn?.addEventListener('click', () => fileInput?.click());
  fileInput?.addEventListener('change', async () => {
    const f = fileInput.files?.[0];
    if (!f) return;
    try{
      uploadBtn.disabled = true; uploadBtn.textContent = '上传中...';
      const fd = new FormData(); fd.append('file', f);
      const res = await fetch('/api/gifts/upload', { method: 'POST', body: fd, headers: headers() });
      const data = await res.json();
      if (!data?.ok || !data?.url) throw new Error(data?.error || '上传失败');
      inputImg.value = data.url; preview.style.backgroundImage = `url(${data.url})`;
    }catch(e){ alert(String(e?.message || e)) }
    finally{ uploadBtn.disabled = false; uploadBtn.textContent = '上传'; fileInput.value = '' }
  });

  // 提交
  modalSubmit?.addEventListener('click', async () => {
    const name = inputName.value.trim();
    const price = Number(inputPrice.value || '0');
    const img = inputImg.value.trim();
    if (!name) return alert('请填写名称');
    if (!Number.isFinite(price) || price < 0) return alert('价格不合法');
    if (!img) return alert('请提供图片 URL 或上传图片');

    const mode = modal.dataset.mode;
    const id = modal.dataset.id;
    try{
      if (mode === 'edit' && id){
        const res = await fetch(`/api/gifts/catalog/${id}`, {
          method: 'PUT',
          headers: { 'content-type': 'application/json', ...headers() },
          body: JSON.stringify({ name, price: Number(price), img })
        });
        const data = await res.json();
        if (!data?.ok) throw new Error(data?.error || '更新失败');
      } else {
        const res = await fetch('/api/gifts/catalog', {
          method: 'POST',
          headers: { 'content-type': 'application/json', ...headers() },
          body: JSON.stringify({ name, price: Number(price), img })
        });
        const data = await res.json();
        if (!data?.ok) throw new Error(data?.error || '创建失败');
      }
      await fetchCatalog();
      state.page = 1; renderTable();
      hideModal();
    }catch(e){ alert(String(e?.message || e)) }
  });

  async function createGift(name, price, img){
    try{
      const res = await fetch('/api/gifts/catalog', {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...headers() },
        body: JSON.stringify({ name, price: Number(price), img })
      });
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.error || '创建失败');
      await fetchCatalog();
      state.page = 1;
      renderTable();
      alert('已新增礼物');
    }catch(e){ alert(String(e?.message || e)) }
  }

  document.querySelector('#gift-edit')?.addEventListener('click', async () => {
    const ids = getSelectedIds();
    if (ids.length !== 1) {
      alert('\u8bf7\u9009\u4e2d\u5355\u4e2a\u793c\u7269\u8fdb\u884c\u7f16\u8f91\u3002');
      return;
    }
    const current = gifts.find(g => String(g.id) === String(ids[0]));
    if (!current) return alert('未找到该礼物');
    showModal('edit', current);
  });

  document.querySelector('#gift-delete')?.addEventListener('click', async () => {
    const ids = getSelectedIds();
    if (ids.length === 0) {
      alert('\u8bf7\u5148\u9009\u62e9\u793c\u7269\u8bb0\u5f55\u3002');
      return;
    }
    const confirmed = confirm(`\u786e\u5b9a\u5220\u9664 ${ids.length} \u4e2a\u793c\u7269\u5417\uff1f`);
    if (!confirmed) return;
    try{
      for (const id of ids){
        await fetch(`/api/gifts/catalog/${id}`, { method: 'DELETE', headers: headers() });
      }
      await fetchCatalog();
      state.page = 1; renderTable();
    }catch(e){ alert('删除失败') }
  });

  document.querySelector('#gift-more')?.addEventListener('click', () => {
    alert('\u66f4\u591a\u529f\u80fd\u6b63\u5728\u63d0\u5347\uff0c\u4f8b\u5982\u7fa4\u53d1\u793c\u7269\u548c\u901a\u77e5\u914d\u7f6e\uff08\u6f14\u793a\uff09\u3002');
  });

  tableBody.addEventListener('click', (event) => {
    const actionBtn = event.target.closest('.action-btn');
    if (!actionBtn) return;
    const action = actionBtn.dataset.action;
    const id = String(actionBtn.dataset.id);
    if (action === 'edit') {
      const current = gifts.find(g => String(g.id) === String(id));
      if (current) showModal('edit', current);
    } else if (action === 'delete') {
      const confirmed = confirm(`\u662f\u5426\u5220\u9664\u793c\u7269 #${id}\uff1f`);
      if (!confirmed) return;
      (async () => {
        try{
          const res = await fetch(`/api/gifts/catalog/${id}`, { method: 'DELETE', headers: headers() });
          const data = await res.json();
          if (!data?.ok) throw new Error(data?.error || '删除失败');
          await fetchCatalog();
          renderTable();
        }catch(e){
          alert(String(e?.message || e));
        }
      })();
    }
  });
}

ensureToken();
renderProfile();
(async () => { await fetchCatalog(); renderTable(); })();
bindEvents();

logoutBtn?.addEventListener('click', () => {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_profile');
  window.location.replace('/admin/login');
});
