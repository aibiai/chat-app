// === 鎮诞鑱婂ぉ鍏ュ彛锛堜粎淇濈暀鍙嫋鍔ㄦ寜閽級===
(function () {
  if (document.getElementById('afc-stub')) return;
	// 先构造 SVG 并进行 URL 编码，避免复杂引号嵌套导致的解析误报
	const svgIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M2 3h20v12a2 2 0 0 1-2 2H8l-6 4V3z"/></svg>';
	const dataUrl = 'data:image/svg+xml;utf8,' + encodeURIComponent(svgIcon);
	const css = [
		".afc-stub{position:fixed;right:18px;bottom:18px;z-index:10050}",
		".afc-stub-btn{width:54px;height:54px;border-radius:50%;border:0;background:linear-gradient(135deg,#f17384,#e67a88);box-shadow:0 10px 30px rgba(230,122,136,.38);cursor:pointer;position:relative}",
		'.afc-stub-btn::after{content:"";position:absolute;left:50%;top:50%;width:22px;height:22px;transform:translate(-50%,-50%);background:no-repeat center/contain url(' + JSON.stringify(dataUrl) + ') }'
	].join("\n");
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  const wrap = document.createElement('div');
  wrap.id = 'afc-stub';
  wrap.className = 'afc-stub';
	const btn = document.createElement('button');
	btn.className = 'afc-stub-btn';
	btn.setAttribute('title', '瀹㈡湇鑱婂ぉ');
	wrap.appendChild(btn);
	document.body.appendChild(wrap);
	// 修复：补全缺失的引号，避免语法错误；不改变原有提示文案与效果（统一使用 \u 转义避免编码问题）
	btn.addEventListener('click', function () { alert('\u804a\u5929\u6a21\u5757\u5373\u5c06\u542f\u7528'); });
  const getPos = () => { try { return JSON.parse(localStorage.getItem('afc_pos') || '{}'); } catch (err) { return {}; } };
  const setPos = (pos) => { try { localStorage.setItem('afc_pos', JSON.stringify(pos || {})); } catch (err) {} };
  const applyStoredPos = (el) => { const p = getPos(); if (p && typeof p.right === 'number' && typeof p.bottom === 'number') { el.style.setProperty('right', p.right + 'px', 'important'); el.style.setProperty('bottom', p.bottom + 'px', 'important'); } };
  const enableDrag = (handleEl, moveEl) => {
    let dragging = false, sx = 0, sy = 0, sr = 0, sb = 0, nr = 0, nb = 0;
    const getRB = () => { const rect = moveEl.getBoundingClientRect(); const W = window.innerWidth, H = window.innerHeight; return { right: Math.max(0, W - rect.right), bottom: Math.max(0, H - rect.bottom) }; };
    const clampRB = (r, b) => { const W = window.innerWidth, H = window.innerHeight; const w = moveEl.offsetWidth || 54, h = moveEl.offsetHeight || 54; let left = W - r - w, top = H - b - h; left = Math.min(Math.max(6, left), Math.max(6, W - w - 6)); top = Math.min(Math.max(6, top), Math.max(6, H - h - 6)); return { right: Math.max(0, W - left - w), bottom: Math.max(0, H - top - h) }; };
    const onMove = (e) => { if (!dragging) return; const point = e.touches ? e.touches[0] : e; const dx = point.clientX - sx; const dy = point.clientY - sy; const c = clampRB(sr - dx, sb - dy); nr = c.right; nb = c.bottom; moveEl.style.setProperty('right', nr + 'px', 'important'); moveEl.style.setProperty('bottom', nb + 'px', 'important'); handleEl.__afc_dragMoved = (Math.abs(dx) + Math.abs(dy) > 3); };
    const onUp = () => { if (!dragging) return; dragging = false; setPos({ right: nr, bottom: nb }); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onUp); };
    handleEl.addEventListener('mousedown', (e) => { dragging = true; handleEl.__afc_dragMoved = false; sx = e.clientX; sy = e.clientY; const rb = getRB(); sr = rb.right; sb = rb.bottom; window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp); });
    handleEl.addEventListener('touchstart', (e) => { dragging = true; handleEl.__afc_dragMoved = false; sx = e.touches[0].clientX; sy = e.touches[0].clientY; const rb = getRB(); sr = rb.right; sb = rb.bottom; window.addEventListener('touchmove', onMove, { passive: false }); window.addEventListener('touchend', onUp); }, { passive: true });
    handleEl.addEventListener('click', (e) => { if (handleEl.__afc_dragMoved) { e.preventDefault(); e.stopImmediatePropagation(); handleEl.__afc_dragMoved = false; } }, true);
  };
  applyStoredPos(wrap);
  enableDrag(btn, wrap);
})();

const nameEl = document.querySelector('#admin-name');
const avatarEl = document.querySelector('#sidebar-avatar');
const logoutBtn = document.querySelector('#logout-btn');
const tableBody = document.querySelector('#customer-table tbody');
const infoEl = document.querySelector('#customer-info');
const pagerContainer = document.querySelector('#customer-pager');
const pageSizeSelect = document.querySelector('#customer-page-size');
const searchInput = document.querySelector('#customer-search');
const checkAllEl = document.querySelector('#customer-check-all');

const customers = [
	{
		id: 143,
		owner: 'Customer Service Manager',
		username: 'Customer Service Manager',
		nickname: 'Customer Service Manager',
		email: '145612@qq.com',
		avatar: 'https://i.pravatar.cc/64?img=45',
		level: '\u5e1d\u7687\u4f1a\u5458',
		gender: '\u5973',
		balance: '0.00',
		crystalExpire: '\u65e0',
		emperorExpire: '\u65e0',
		lastLogin: '2025-08-25 18:14:05',
		lastIp: '83.147.15.3',
		joinedAt: '2022-04-09 15:24:02',
		joinIp: '83.147.15.3',
		status: 'active'
	},
	{
		id: 142,
		owner: 'customer service',
		username: 'customer service',
		nickname: 'customer service',
		email: '458109018@qq.com',
		avatar: 'https://i.pravatar.cc/64?img=36',
		level: '\u5e1d\u7687\u4f1a\u5458',
		gender: '\u5973',
		balance: '1387.00',
		crystalExpire: '\u65e0',
		emperorExpire: '2025-10-28 15:34:18',
		lastLogin: '2025-10-08 00:41:21',
		lastIp: '39.163.178.90',
		joinedAt: '2022-04-09 15:21:41',
		joinIp: '39.163.178.90',
		status: 'active'
	}
];

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
	return customers.filter((item) => {
		return (
			item.owner.toLowerCase().includes(keyword) ||
			item.username.toLowerCase().includes(keyword) ||
			item.nickname.toLowerCase().includes(keyword) ||
			item.email.toLowerCase().includes(keyword) ||
			String(item.id).includes(keyword)
		);
	});
}

function paginate(data) {
	const start = (state.page - 1) * state.pageSize;
	return data.slice(start, start + state.pageSize);
}

function renderTable() {
    // 若页面未包含相关表格元素，则安全退出，避免在其他页面报错（不改变有元素时的行为）
    if (!tableBody || !infoEl || !pagerContainer) return;
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
	if (!tableBody) return [];
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
		tableBody?.querySelectorAll('input[type="checkbox"]').forEach((box) => {
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

	document.querySelector('#customer-delete')?.addEventListener('click', () => {
		const selected = getSelectedIds();
		if (selected.length === 0) {
			alert('\u8bf7\u5148\u9009\u62e9\u9700\u8981\u5220\u9664\u7684\u8bb0\u5f55\u3002');
			return;
		}
		const confirmed = confirm(`\u786e\u5b9a\u5220\u9664 ${selected.length} \u4e2a\u5ba2\u670d\u8bb0\u5f55\u5417\uff1f`);
		if (confirmed) {
			alert('\u6f14\u793a\u73af\u5883\uff1a\u4e0d\u4f1a\u771f\u6b63\u5220\u9664\u6570\u636e\u3002');
		}
	});

	document.querySelector('#customer-more')?.addEventListener('click', () => {
		alert('\u66f4\u591a\u529f\u80fd\u6b63\u5728\u5f00\u53d1\u4e2d\uff0c\u53ef\u5305\u62ec\u6279\u91cf\u8bbe\u4e3a\u9ed8\u8ba4\u5ba2\u670d\u548c\u89c4\u5219\u914d\u7f6e\uff08\u6f14\u793a\uff09\u3002');
	});

	tableBody?.addEventListener('click', (event) => {
		const actionBtn = event.target.closest('.action-btn');
		if (!actionBtn) return;
		const action = actionBtn.dataset.action;
		const id = Number(actionBtn.dataset.id);
		if (action === 'logs') {
			alert(`\u67e5\u770b\u5ba2\u670d #${id} \u7684\u804a\u5929\u8bb0\u5f55\uff08\u6f14\u793a\uff09\u3002`);
		} else if (action === 'edit') {
			alert(`\u7f16\u8f91\u5ba2\u670d #${id} \uff08\u6f14\u793a\uff09\u3002`);
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


