const nameEl = document.querySelector('#admin-name');
const avatarEl = document.querySelector('#sidebar-avatar');
const logoutBtn = document.querySelector('#logout-btn');

const localeSelect = document.querySelector('#contact-locale');
const textArea = document.querySelector('#contact-text');
const btnReset = document.querySelector('#contact-reset');
const btnSave = document.querySelector('#contact-save');
const statusEl = document.querySelector('#contact-status');

function ensureToken() {
  const token = localStorage.getItem('admin_token');
  if (!token) {
    window.location.replace('/admin/login');
    return null;
  }
  return token;
}

function readProfile() {
  try {
    const raw = localStorage.getItem('admin_profile');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function renderProfile() {
  const profile = readProfile() || { nickname: '管理员', username: 'admin' };
  const displayName = profile.nickname || profile.username || '管理员';
  nameEl && (nameEl.textContent = displayName);
  avatarEl && (avatarEl.textContent = (displayName || 'A').slice(0, 1).toUpperCase());
}

function setStatus(text, type = 'info') {
  if (!statusEl) return;
  statusEl.textContent = text || '';
  statusEl.style.color = type === 'error' ? '#dc2626' : type === 'success' ? '#059669' : '#64748b';
}

async function fetchJSON(url, options = {}) {
  const token = ensureToken();
  if (!token) throw new Error('NO_TOKEN');
  const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
  const resp = await fetch(url, { ...options, headers });
  if (!resp.ok) throw new Error('HTTP_' + resp.status);
  return await resp.json();
}

async function loadContact() {
  const locale = localeSelect.value || 'zh-CN';
  setStatus('加载中...');
  try {
    const data = await fetchJSON(`/api/content/${encodeURIComponent(locale)}`);
    const sec = data?.data?.sections?.contact || { title: '', content: [] };
    const text = Array.isArray(sec.content) ? sec.content.join('\n\n') : '';
    textArea.value = text;
    setStatus('已加载');
  } catch (e) {
    console.error(e);
    setStatus('加载失败', 'error');
  }
}

function splitParagraphs(text) {
  const normalized = (text || '').replace(/\r\n/g, '\n');
  const blocks = normalized
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return blocks;
}

async function saveContact() {
  const locale = localeSelect.value || 'zh-CN';
  const rawText = textArea.value || '';
  const paragraphs = splitParagraphs(rawText);
  setStatus('保存中...');
  try {
    const body = JSON.stringify({ sections: { contact: { title: '', content: paragraphs } } });
    const data = await fetchJSON(`/api/content/${encodeURIComponent(locale)}`, { method: 'PATCH', body });
    if (data?.ok) setStatus('已保存', 'success'); else setStatus('保存失败', 'error');
  } catch (e) {
    console.error(e);
    setStatus('保存失败', 'error');
  }
}

function bindEvents() {
  localeSelect.addEventListener('change', () => loadContact());
  btnReset.addEventListener('click', () => loadContact());
  btnSave.addEventListener('click', () => saveContact());
  logoutBtn?.addEventListener('click', () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_profile');
    window.location.replace('/admin/login');
  });
}

ensureToken();
renderProfile();
bindEvents();
loadContact();
