const nameEl = document.querySelector('#admin-name');
const avatarEl = document.querySelector('#sidebar-avatar');
const logoutBtn = document.querySelector('#logout-btn');

const localeSelect = document.querySelector('#redeem-locale');
const textArea = document.querySelector('#redeem-text');
const btnReset = document.querySelector('#redeem-reset');
const btnSave = document.querySelector('#redeem-save');
const statusEl = document.querySelector('#redeem-status');

const DEFAULT_REDEEM_TEXT = {
  'zh-CN': '提交说明：请上传点卡照片或订单截图，确保卡密清晰可见。最多支持 4 张 JPG/PNG 图片。提交后我们会尽快审核并完成兑换。',
  'zh-TW': '提交說明：請上傳點卡照片或訂單截圖，確保卡密清晰可見。最多支援 4 張 JPG/PNG 圖片。提交後我們會儘快審核並完成兌換。',
  'en': 'How it works: upload photos of the gift card or payment receipt. Make sure the code is readable. You can upload up to 4 JPG/PNG images. We will review and process your request shortly.',
  'ja': '提出方法：ギフトカードの写真または決済画面のスクリーンショットをアップロードしてください。コードが判読できるようにしてください。JPG/PNG 画像を最大4枚まで送信できます。送信後は順次審査して処理します。',
  'ko': '제출 안내: 상품권 사진 또는 결제 영수증 화면을 업로드해주세요. 핀 번호가 잘 보이도록 확인해주세요. JPG/PNG 이미지를 최대 4장까지 등록할 수 있습니다. 제출 후 차례로 검수하여 처리해 드립니다.'
};

function stripHtml(input) {
  if (!input || typeof input !== 'string') return '';
  const temp = document.createElement('div');
  temp.innerHTML = input;
  return (temp.textContent || temp.innerText || '').trim();
}

function ensureToken() {
  const token = localStorage.getItem('admin_token');
  if (!token) {
    window.location.replace('/admin/login');
    return null;
  }
  return token;
}

function readProfile() {
  try { const raw = localStorage.getItem('admin_profile'); return raw ? JSON.parse(raw) : null } catch { return null }
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

async function loadRedeem() {
  const locale = localeSelect.value || 'zh-CN';
  setStatus('加载中...');
  try {
    const data = await fetchJSON(`/api/content/${encodeURIComponent(locale)}`);
    const sec = data?.data?.sections?.cardRedeem || { title: '', content: [] };
    const text = Array.isArray(sec.content) && sec.content.length ? sec.content[0] : '';
    const clean = text ? stripHtml(text) : '';
    if (clean) {
      textArea.value = clean;
      setStatus('已加载');
      return;
    }
    const fallback = DEFAULT_REDEEM_TEXT[locale] || DEFAULT_REDEEM_TEXT['zh-CN'] || '';
    textArea.value = fallback;
    setStatus('该语言尚未配置，已显示默认文案');
  } catch (e) {
    console.error(e); setStatus('加载失败', 'error');
  }
}

async function saveRedeem() {
  const locale = localeSelect.value || 'zh-CN';
  const rawHtml = (textArea.value || '').trim();
  if (!rawHtml) {
    if (!confirm('内容为空，将清空该语言的点卡兑换说明，继续吗？')) return;
  }
  setStatus('保存中...');
  try {
    const body = JSON.stringify({ sections: { cardRedeem: { title: '', content: [rawHtml] } } });
    const data = await fetchJSON(`/api/content/${encodeURIComponent(locale)}`, { method: 'PATCH', body });
    if (data?.ok) setStatus('已保存', 'success'); else setStatus('保存失败', 'error');
  } catch (e) {
    console.error(e); setStatus('保存失败', 'error');
  }
}

function bindEvents() {
  localeSelect.addEventListener('change', () => loadRedeem());
  btnReset.addEventListener('click', () => loadRedeem());
  btnSave.addEventListener('click', () => saveRedeem());
  logoutBtn?.addEventListener('click', () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_profile');
    window.location.replace('/admin/login');
  });
}

ensureToken();
renderProfile();
bindEvents();
loadRedeem();
