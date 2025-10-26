const nameEl = document.querySelector('#admin-name');
const avatarEl = document.querySelector('#sidebar-avatar');
const logoutBtn = document.querySelector('#logout-btn');
const formEl = document.querySelector('#push-form');
const serviceSelect = formEl?.elements.namedItem('service');
const segmentSelect = formEl?.elements.namedItem('segment');
const adminGroupSelect = formEl?.elements.namedItem('adminGroup');
const messageField = formEl?.elements.namedItem('message');
const messageBox = document.querySelector('#push-message');

const SERVICES = [
  { id: 'broadcast', name: '\u5e7f\u64ad\u670d\u52a1\u53f7' },
  { id: 'vip', name: 'VIP \u670d\u52a1\u53f7' },
  { id: 'ops', name: '\u8fd0\u7ef4\u901a\u77e5\u53f7' }
];

const SEGMENTS = [
  { id: 'all', name: '\u5168\u90e8\u7528\u6237' },
  { id: 'active', name: '\u8fd1 7 \u65e5\u6d3b\u8dc3\u7528\u6237' },
  { id: 'vip', name: 'VIP \u7528\u6237' },
  { id: 'new', name: '\u4eca\u65e5\u65b0\u589e\u7528\u6237' }
];

const ADMIN_GROUPS = [
  { id: 'all_admin', name: '\u5168\u90e8\u7ba1\u7406\u5458' },
  { id: 'ops_admin', name: '\u8fd0\u8425\u7ba1\u7406\u5458\u7ec4' },
  { id: 'service_admin', name: '\u5ba2\u670d\u7ba1\u7406\u5458\u7ec4' }
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
  if (nameEl) nameEl.textContent = profile.nickname || profile.username || '\u7ba1\u7406\u5458';
  if (avatarEl) avatarEl.textContent = (profile.nickname || profile.username || 'A').slice(0, 1).toUpperCase();
}

function populateSelect(selectEl, data) {
  if (!(selectEl instanceof HTMLSelectElement)) return;
  selectEl.innerHTML += data.map((item) => `<option value="${item.id}">${item.name}</option>`).join('');
}

function showMessage(type, text) {
  if (!messageBox) return;
  messageBox.textContent = text;
  messageBox.dataset.type = type;
  messageBox.hidden = false;
  setTimeout(() => {
    messageBox.hidden = true;
  }, 3000);
}

function bindForm() {
  if (!formEl) return;
  formEl.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(formEl);
    const payload = {
      service: formData.get('service'),
      segment: formData.get('segment'),
      adminGroup: formData.get('adminGroup'),
      message: formData.get('message')
    };

    if (!payload.service || !payload.segment || !payload.adminGroup || !payload.message) {
      showMessage('error', '\u8bf7\u5b8c\u6574\u586b\u5199\u63a8\u9001\u4fe1\u606f\u3002');
      return;
    }

    showMessage('success', '\u63a8\u9001\u4efb\u52a1\u5df2\u63d0\u4ea4\uff0c\u7cfb\u7edf\u5c06\u6309\u961f\u5217\u53d1\u9001\u3002');
    formEl.reset();
  });

  formEl.addEventListener('reset', () => {
    messageBox?.setAttribute('hidden', 'true');
  });
}

function init() {
  ensureToken();
  renderProfile();
  populateSelect(serviceSelect, SERVICES);
  populateSelect(segmentSelect, SEGMENTS);
  populateSelect(adminGroupSelect, ADMIN_GROUPS);
  bindForm();
}

logoutBtn?.addEventListener('click', () => {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_profile');
  window.location.replace('/admin/login');
});

init();
