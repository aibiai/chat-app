(function(){
  try { console.log('[chat-floating] loaded'); } catch {}
  function ready(fn){
    if(document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    }else{ fn(); }
  }

  function create(){
    if (document.getElementById('ac-floating-btn')) return;
  if (!document.body){ try { console.warn('[chat-floating] no document.body yet'); } catch {}; return; } // 兜底
    try { window.__ac_chatfloating = 'creating'; } catch {}
    injectStyles();
    const btn = document.createElement('button');
    btn.id = 'ac-floating-btn';
    btn.className = 'ac-floating-btn';
    btn.setAttribute('aria-label', '客服入口');
  btn.innerHTML = '<span>💬</span><span class="ac-float-badge" hidden>0</span>';
    btn.title = '客服管理';
  try { console.log('[chat-floating] init'); } catch {}
    // 兜底：即便外部样式被覆盖，也用内联样式保证可见
    btn.style.position = 'fixed';
    btn.style.right = '24px';
    btn.style.bottom = '24px';
    btn.style.width = '56px';
    btn.style.height = '56px';
    btn.style.borderRadius = '50%';
    btn.style.border = '0';
    btn.style.background = 'linear-gradient(135deg,#fb7185,#f472b6)';
    btn.style.boxShadow = '0 18px 38px rgba(244,114,182,.45)';
    btn.style.color = '#fff';
    btn.style.fontSize = '24px';
    btn.style.cursor = 'pointer';
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.zIndex = '2147483647';
    try {
      document.body.appendChild(btn);
      try { window.__ac_chatfloating = 'ready'; } catch {}
      try { console.log('[chat-floating] appended', document.getElementById('ac-floating-btn')); } catch {}
    } catch (e) {
      try { console.error('[chat-floating] append error', e); } catch {}
      return; // 追加失败则先退出，稍后重试
    }
    // 点击打开/关闭“客服聊天”弹窗（若刚发生拖动则抑制一次点击）
    btn.addEventListener('click', (ev) => {
      if (btn.__suppressClick) { ev.preventDefault(); ev.stopPropagation(); btn.__suppressClick = false; return; }
      try { toggleChatPanel(); } catch (e) { try { console.error('[chat-floating] panel error', e); } catch {} }
    });
    enableDrag(btn);

    // 若被外部脚本移除，尝试自动重建一次
    try{
      const mo = new MutationObserver(() => {
        if(!document.getElementById('ac-floating-btn')){
          try { console.log('[chat-floating] recreate'); } catch {}
          mo.disconnect();
          setTimeout(create, 100);
        }
      });
      mo.observe(document.body, { childList: true, subtree: true });
    }catch{}
  }

  ready(() => {
    try {
      create();
      // 若首帧时序导致未能渲染，稍后再尝试两次
      setTimeout(create, 300);
      setTimeout(create, 1000);
    } catch(e) { try { console.error('[chat-floating] create error', e); } catch {} }
  });

  // 额外兜底：如果脚本在 DOM 完全就绪后被注入，也尝试立即创建
  try { create(); } catch {}

  // ------------- API helpers & state -------------
  const API = {
    token() { try { return localStorage.getItem('admin_token') || ''; } catch { return ''; } },
    headers(extra){
      const h = Object.assign({ 'Accept': 'application/json' }, extra||{});
      const t = API.token(); if (t) h['Authorization'] = 'Bearer ' + t; return h;
    },
    async get(path){ const r = await fetch(path, { headers: API.headers() }); if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); },
    async post(path, body){ const r = await fetch(path, { method:'POST', headers: API.headers({ 'Content-Type':'application/json' }), body: JSON.stringify(body||{}) }); if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); },
    async upload(path, file){ const fd = new FormData(); fd.append('file', file); const r = await fetch(path, { method:'POST', headers: API.headers(), body: fd }); if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); },
    async translate(text, target){ return API.post('/admin/api/messages/translate', { text, target }); },
    async translateBatch(items, target){ return API.post('/admin/api/messages/translate/batch', { items, target }); }
  };
  const ALLOWED_TGT = ['zh-CN','zh-TW','en','ko','ja'];
  const normalizeTarget = (code)=>{
    const raw = String(code||'').trim();
    if (!raw) return 'zh-CN';
    const map = { 'zh-cn':'zh-CN','zh_cn':'zh-CN','zh':'zh-CN', 'zh-tw':'zh-TW','zh_tw':'zh-TW', 'en-us':'en','en-gb':'en','en_us':'en','en_gb':'en', 'kr':'ko','ko-kr':'ko','ko_kr':'ko', 'jp':'ja','ja-jp':'ja','ja_jp':'ja' };
    const norm = map[raw.toLowerCase()] || raw;
    return ALLOWED_TGT.includes(norm) ? norm : 'zh-CN';
  };
  const state = { open: false, recents: [], active: '', messages: new Map(), polling: 0, transTarget: (function(){ try { return normalizeTarget(localStorage.getItem('admin_chat_trans_target')); } catch { return 'zh-CN'; } })(), dualMode: (function(){ try { return localStorage.getItem('admin_chat_dual_mode') === '1'; } catch { return false; } })(), searching:false, searchResults:[], searchIndex:-1 };
  // 如果本地存储是历史的或非法值，及时回写为规范值
  try { localStorage.setItem('admin_chat_trans_target', state.transTarget); localStorage.setItem('admin_chat_dual_mode', state.dualMode? '1':'0'); } catch {}
  function setBadge(total){ try{ const el = document.querySelector('#ac-floating-btn .ac-float-badge'); if(!el) return; if(total>0){ el.textContent = String(total>99? '99+': total); el.hidden = false; } else { el.hidden = true; el.textContent='0'; } }catch{} }

  // -------- Chat Panel UI ----------
  function ensurePanel(){
    let wrap = document.getElementById('ac-chat-overlay');
    if(wrap) return wrap;
    wrap = document.createElement('div');
    wrap.id = 'ac-chat-overlay';
    wrap.className = 'ac-chat-overlay hidden';
    wrap.innerHTML = `
      <div class="ac-chat-mask" data-ac-close></div>
      <div class="ac-chat-panel" role="dialog" aria-modal="true" aria-label="客服聊天">
        <div class="ac-chat-header" data-ac-drag-handle>
          <div class="ac-chat-title">客服聊天</div>
          <div class="ac-chat-actions">
            <label>翻译至</label>
            <select class="ac-trans-target">
              <option value="zh-CN">简体中文</option>
              <option value="zh-TW">繁體中文</option>
              <option value="en">English</option>
              <option value="ko">한국어</option>
              <option value="ja">日本語</option>
            </select>
            <button class="ac-trans-all" title="翻译当前会话所有消息">全部翻译</button>
          </div>
          <button class="ac-chat-close" aria-label="关闭" data-ac-close>×</button>
        </div>
        <div class="ac-chat-body">
          <aside class="ac-chat-sidebar">
            <div class="ac-chat-search">
              <input class="ac-chat-search-input" type="search" placeholder="请输入用户名" />
            </div>
            <div class="ac-chat-sections">
              <div class="ac-section section-results" hidden>
                <div class="sec-title">搜索结果</div>
                <ul class="ac-chat-results"><!-- 搜索结果 --></ul>
              </div>
              <div class="ac-section section-recents">
                <div class="sec-title">最近会话</div>
                <ul class="ac-chat-conv"><!-- 最近会话 --></ul>
              </div>
            </div>
          </aside>
          <section class="ac-chat-main">
            <div class="ac-chat-messages">
              <div class="ac-chat-empty">选择左侧会话开始聊天</div>
            </div>
            <div class="ac-chat-inputbar">
              <input class="ac-chat-input" placeholder="输入消息..." />
              <div class="ac-chat-tools">
                <div class="emoji-wrap">
                  <button class="tool btn-emoji" title="表情">😊</button>
                  <div class="emoji-panel" hidden></div>
                </div>
                <div class="upload-wrap">
                  <input type="file" accept="image/*" hidden class="ac-file" />
                  <button class="tool btn-image" title="图片">🖼️</button>
                </div>
                <div class="trans-wrap">
                  <button type="button" class="tool btn-trans" title="翻译" aria-haspopup="true" aria-expanded="false">⋯</button>
                  <div class="lang-menu" hidden>
                    <div class="tip" aria-hidden="true"></div>
                    <div class="group-title">翻译为</div>
                    <button type="button" class="menu-item" data-lang="__original">显示原文</button>
                    <button type="button" class="menu-item" data-lang="zh-CN">简体中文</button>
                    <button type="button" class="menu-item" data-lang="zh-TW">繁體中文</button>
                    <button type="button" class="menu-item" data-lang="en">English</button>
                    <button type="button" class="menu-item" data-lang="ko">한국어</button>
                    <button type="button" class="menu-item" data-lang="ja">日本語</button>
                    <div class="divider" aria-hidden="true"></div>
                    <label class="menu-item toggle" data-toggle="dual">
                      <span>原文/译文双语</span>
                      <input type="checkbox" class="dual-mode-toggle" />
                    </label>
                    <div class="divider" aria-hidden="true"></div>
                    <button type="button" class="menu-item do-all" data-action="all">全部翻译</button>
                  </div>
                </div>
                <button class="send">发送</button>
              </div>
            </div>
          </section>
          <aside class="ac-chat-quick" aria-label="客服快捷设置">
            <div class="qr-tabs" role="tablist" aria-label="快捷设置">
              <button type="button" class="qr-tab active" data-tab="quick" role="tab" aria-selected="true">客服话术</button>
              <button type="button" class="qr-tab" data-tab="auto" role="tab" aria-selected="false">自动回复</button>
            </div>

            <div class="qr-pane qr-pane-quick" data-pane="quick" role="tabpanel" aria-labelledby="tab-quick">
              <div class="qr-header">
                <div class="qr-title">客服话术</div>
                <button type="button" class="qr-add-btn" title="新增话术">＋</button>
              </div>
              <div class="qr-editor" hidden>
                <textarea class="qr-text" placeholder="输入要保存的话术，支持多行"></textarea>
                <div class="qr-editor-actions">
                  <button type="button" class="qr-save">保存</button>
                  <button type="button" class="qr-cancel">取消</button>
                </div>
              </div>
              <ul class="qr-list" aria-live="polite"></ul>
              <div class="qr-empty" hidden>暂无话术，点击 + 添加</div>
            </div>

            <div class="qr-pane qr-pane-auto" data-pane="auto" role="tabpanel" aria-labelledby="tab-auto" hidden>
              <div class="ar-wrap" aria-label="自动回复">
                <div class="ar-header">
                  <div class="ar-title">自动回复</div>
                  <label class="ar-switch" title="开启后，按规则在无人回复时自动发送">
                    <input type="checkbox" class="ar-enabled" /> 启用
                  </label>
                </div>
                <ul class="ar-rules"></ul>
                <div class="ar-actions">
                  <button type="button" class="ar-add">添加规则</button>
                  <button type="button" class="ar-save">保存</button>
                </div>
                <div class="ar-tip">按顺序触发，以客服“最后一条消息”为基准计时；当用户回复后自动停止。</div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);

    // 绑定交互
    wrap.addEventListener('click', (e)=>{
      const t = e.target;
      if(t && (t.hasAttribute('data-ac-close'))){ hideChatPanel(); }
    });
  const sendBtn = wrap.querySelector('.ac-chat-inputbar .send');
    const inputEl = wrap.querySelector('.ac-chat-input');
    const msgList = wrap.querySelector('.ac-chat-messages');
  const convList = wrap.querySelector('.ac-chat-conv');
  const resultsList = wrap.querySelector('.ac-chat-results');
  const resultsSection = wrap.querySelector('.section-results');
  const searchInput = wrap.querySelector('.ac-chat-search-input');
    const fileInput = wrap.querySelector('.upload-wrap .ac-file');
  const imgBtn = wrap.querySelector('.btn-image');
  const emojiBtn = wrap.querySelector('.btn-emoji');
  const emojiPanel = wrap.querySelector('.emoji-panel');
  const emojiWrap = wrap.querySelector('.emoji-wrap');
  const transSelect = wrap.querySelector('.ac-trans-target');
  const transAllBtn = wrap.querySelector('.ac-trans-all');
  const transWrap = wrap.querySelector('.trans-wrap');
  const transBtn = wrap.querySelector('.btn-trans');
  const langMenu = wrap.querySelector('.lang-menu');
  const dualToggle = wrap.querySelector('.dual-mode-toggle');
  // 快捷话术相关元素
  const quickWrap = wrap.querySelector('.ac-chat-quick');
  const quickPane = wrap.querySelector('.qr-pane-quick');
  const autoPane = wrap.querySelector('.qr-pane-auto');
  const tabBtns = Array.from(wrap.querySelectorAll('.qr-tab'));
  const quickAddBtn = wrap.querySelector('.qr-add-btn');
  const quickEditor = wrap.querySelector('.qr-editor');
  const quickTextarea = wrap.querySelector('.qr-text');
  const quickSaveBtn = wrap.querySelector('.qr-save');
  const quickCancelBtn = wrap.querySelector('.qr-cancel');
  const quickList = wrap.querySelector('.qr-list');
  const quickEmpty = wrap.querySelector('.qr-empty');
  // 自动回复配置元素
  const arWrap = wrap.querySelector('.ar-wrap');
  const arEnabledCk = wrap.querySelector('.ar-enabled');
  const arRulesList = wrap.querySelector('.ar-rules');
  const arAddBtn = wrap.querySelector('.ar-add');
  const arSaveBtn = wrap.querySelector('.ar-save');

  // 统一增强滚动体验：避免上层全局监听阻断，确保滚动始终作用于列表本身
  (function enhanceScroll(){
    function attachSmartWheel(el){
      if(!el) return;
      const normalizeDelta = (ev)=>{
        // 统一像素单位
        if ('deltaY' in ev && ev.deltaY !== undefined){
          let d = ev.deltaY;
          if (ev.deltaMode === 1) d *= 16; // line -> px
          else if (ev.deltaMode === 2) d *= el.clientHeight; // page -> px
          return d;
        }
        if ('wheelDelta' in ev && ev.wheelDelta !== undefined){
          return -ev.wheelDelta; // Chrome legacy 正负相反
        }
        if ('detail' in ev && ev.detail !== undefined){
          return ev.detail * 16; // Firefox 旧版 DOMMouseScroll
        }
        return 0;
      };
      const handler = (e)=>{
        if (el.scrollHeight <= el.clientHeight) return;
        const delta = normalizeDelta(e);
        if (!delta) return;
        const max = el.scrollHeight - el.clientHeight;
        const before = el.scrollTop;
        const next = Math.max(0, Math.min(max, before + delta));
        if (next !== before){
          el.scrollTop = next;
          if (e.cancelable) e.preventDefault();
          e.stopPropagation();
        }
      };
      // 捕获与冒泡阶段都挂一份，另兼容旧事件名
      el.addEventListener('wheel', handler, { passive:false, capture:true });
      el.addEventListener('wheel', handler, { passive:false });
      el.addEventListener('mousewheel', handler, { passive:false, capture:true });
      el.addEventListener('mousewheel', handler, { passive:false });
      el.addEventListener('DOMMouseScroll', handler, { passive:false, capture:true });
      el.addEventListener('DOMMouseScroll', handler, { passive:false });
      try{ el.style.overscrollBehavior = 'contain'; }catch{}
    }
    attachSmartWheel(msgList);
    attachSmartWheel(convList);
    attachSmartWheel(resultsList);
    const quickList = wrap.querySelector('.qr-list');
    attachSmartWheel(quickList);
    attachSmartWheel(arRulesList);

    // 顶层捕获兜底：若存在全局捕获监听提前阻断，这里在 window 捕获阶段最先处理
    (function attachGlobalGuard(){
      const selector = '.ac-chat-messages, .ac-chat-conv, .ac-chat-results, .qr-list, .ar-rules';
      const normalizeDelta = (ev, el)=>{
        if ('deltaY' in ev && ev.deltaY !== undefined){
          let d = ev.deltaY; if (ev.deltaMode === 1) d *= 16; else if (ev.deltaMode === 2) d *= (el?.clientHeight||240); return d;
        }
        if ('wheelDelta' in ev && ev.wheelDelta !== undefined) return -ev.wheelDelta;
        if ('detail' in ev && ev.detail !== undefined) return ev.detail * 16;
        return 0;
      };
      const handler = (e)=>{
        const t = e.target; if(!wrap || !t || !wrap.contains(t)) return;
        let el = t.closest && t.closest(selector);
        // 兜底：当事件发生在聊天主区域但未命中具体滚动容器时，默认把滚动委派给消息列表
        if(!el){
          try{
            const panel = t.closest('.ac-chat-panel') || wrap.querySelector('.ac-chat-panel');
            const main = panel && panel.querySelector('.ac-chat-main');
            const msgs = panel && panel.querySelector('.ac-chat-messages');
            if(main && msgs){
              const r = main.getBoundingClientRect();
              const x = e.clientX, y = e.clientY;
              if (typeof x === 'number' && typeof y === 'number' && x>=r.left && x<=r.right && y>=r.top && y<=r.bottom){
                el = msgs; // 将滚轮路由给消息列表
              }
            }
          }catch{}
        }
        if(!el) return;
        if (el.scrollHeight <= el.clientHeight) return;
        const delta = normalizeDelta(e, el); if(!delta) return;
        const max = el.scrollHeight - el.clientHeight;
        const before = el.scrollTop;
        const next = Math.max(0, Math.min(max, before + delta));
        if (next !== before){
          el.scrollTop = next;
          if (e.cancelable) e.preventDefault();
          if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
          else e.stopPropagation();
        }
      };
      window.addEventListener('wheel', handler, { passive:false, capture:true });
      window.addEventListener('mousewheel', handler, { passive:false, capture:true });
      window.addEventListener('DOMMouseScroll', handler, { passive:false, capture:true });
    })();
  })();

  // ---- 快捷话术存储（仅管理员本地） ----
  const QUICK_KEY = 'admin_quick_texts';
  function loadQuickTexts(){
    try { const raw = localStorage.getItem(QUICK_KEY); if(!raw) return []; const arr = JSON.parse(raw); if(Array.isArray(arr)) return arr.filter(it=> typeof it?.text === 'string').map(it=> ({ id: it.id||genId(), text: it.text.trim() })).filter(it=> it.text); } catch { } return []; }
  function saveQuickTexts(list){ try { localStorage.setItem(QUICK_KEY, JSON.stringify(list)); } catch {} }
  function genId(){ return 'q_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8); }
  let quickItems = loadQuickTexts();
  let editingId = '';
  function renderQuick(){
    if(!quickList) return;
    if(!quickItems.length){ quickList.innerHTML=''; if(quickEmpty) quickEmpty.hidden=false; return; }
    if(quickEmpty) quickEmpty.hidden=true;
    quickList.innerHTML = quickItems.map(it=> `<li class="qr-item" data-id="${escapeAttr(it.id)}"><div class="qr-item-text" title="点击插入到输入框">${escapeHTML(it.text)}</div><div class="qr-item-actions"><button type="button" class="qr-edit" title="编辑">✎</button><button type="button" class="qr-del" title="删除">🗑️</button></div></li>`).join('');
  }
  function openEditor(id){ editingId = id||''; if(quickEditor) quickEditor.hidden=false; if(quickTextarea){ quickTextarea.value = id ? (quickItems.find(i=> i.id===id)?.text || '') : ''; quickTextarea.focus(); }
  }
  function closeEditor(){ editingId=''; if(quickEditor) quickEditor.hidden=true; if(quickTextarea) quickTextarea.value=''; }
  quickAddBtn?.addEventListener('click', ()=> openEditor(''));
  quickCancelBtn?.addEventListener('click', ()=> closeEditor());
  quickSaveBtn?.addEventListener('click', ()=>{
    const val = String(quickTextarea?.value||'').trim(); if(!val){ closeEditor(); return; }
    if(editingId){ const idx = quickItems.findIndex(i=> i.id===editingId); if(idx>=0){ quickItems[idx].text = val; } }
    else { quickItems.unshift({ id: genId(), text: val }); }
    saveQuickTexts(quickItems); renderQuick(); closeEditor();
  });
  quickList?.addEventListener('click', (e)=>{
    const li = e.target.closest('li.qr-item'); if(!li) return;
    const id = li.getAttribute('data-id');
    if(e.target.closest('.qr-edit')){ openEditor(id); return; }
    if(e.target.closest('.qr-del')){ quickItems = quickItems.filter(i=> i.id!==id); saveQuickTexts(quickItems); renderQuick(); return; }
    if(e.target.closest('.qr-item-text')){ // 插入到输入框
      const item = quickItems.find(i=> i.id===id); if(item && inputEl){ inputEl.value = item.text; inputEl.focus(); try{ inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length); }catch{} }
    }
  });
  // 初次渲染
  renderQuick();
  // 选项卡切换
  function activateTab(name){
    const isQuick = name === 'quick';
    tabBtns.forEach(btn=>{
      const on = btn.getAttribute('data-tab') === name;
      if(on){ btn.classList.add('active'); btn.setAttribute('aria-selected','true'); }
      else { btn.classList.remove('active'); btn.setAttribute('aria-selected','false'); }
    });
    if(quickPane) quickPane.hidden = !isQuick;
    if(autoPane) autoPane.hidden = isQuick;
  }
  tabBtns.forEach(btn=> btn.addEventListener('click', ()=> activateTab(btn.getAttribute('data-tab'))));
  activateTab('quick');

  // ---- 无人回复自动回复：配置与调度 ----
  const AUTO_KEY = 'admin_auto_reply_rules';
  const AUTO_ENABLED_KEY = 'admin_auto_reply_enabled';
  function loadAutoConfig(){
    // 默认两条规则（按你的要求），默认启用
    const defaults = [
      { id: genId(), minutes: 5, text: '先生您好，当前会员咨询人数较多，请耐心等待', enabled: true },
      { id: genId(), minutes: 20, text: '先生您好，当前人工客服正忙，请您留言您咨询问题，人工客服会第一时间回复您，请知悉', enabled: true }
    ];
    let list = [];
    try{ const raw = localStorage.getItem(AUTO_KEY); if(raw){ const arr = JSON.parse(raw); if(Array.isArray(arr)) list = arr; } }catch{}
    list = list.filter(it => it && Number(it.minutes) > 0 && typeof it.text === 'string')
               .map(it => ({ id: it.id || genId(), minutes: Math.max(1, Math.floor(Number(it.minutes))), text: String(it.text||'').trim(), enabled: it.enabled !== false }))
               .filter(it => it.text);
    if(!list.length) list = defaults;
    let enabled = false; try{ enabled = localStorage.getItem(AUTO_ENABLED_KEY) === '1'; }catch{}
    return { list: list.sort((a,b)=> a.minutes - b.minutes), enabled };
  }
  function saveAutoConfig(list, enabled){
    try{ localStorage.setItem(AUTO_KEY, JSON.stringify(list)); }catch{}
    try{ localStorage.setItem(AUTO_ENABLED_KEY, enabled? '1':'0'); }catch{}
  }
  const autoState = { rules: [], enabled: false, timers: new Map(), sent: new Map(), serverManaged: false };
  function renderAutoRules(){
    if(!arRulesList) return;
    if(!autoState.rules.length){ arRulesList.innerHTML = '<li class="ar-empty">暂无规则，点击“添加规则”</li>'; return; }
    arRulesList.innerHTML = autoState.rules.map(it => `
      <li class="ar-item" data-id="${escapeAttr(it.id)}">
        <div class="ar-row">
          <label>延时(分钟)</label>
          <input type="number" min="1" step="1" class="ar-minute" value="${Number(it.minutes)||1}"/>
        </div>
        <div class="ar-row">
          <label>发送内容</label>
          <textarea class="ar-text" placeholder="请输入自动回复内容">${escapeHTML(it.text||'')}</textarea>
        </div>
        <div class="ar-row">
          <label>启用</label>
          <input type="checkbox" class="ar-enabled-item" ${it.enabled!==false? 'checked':''} />
        </div>
        <div class="ar-row ar-ops">
          <button type="button" class="ar-del">删除</button>
        </div>
      </li>`).join('');
  }
  async function hydrateAutoUI(){
    let usedServer = false;
    try{
      const r = await fetch('/admin/api/auto-reply/config', { headers: API.headers() });
      if(r.ok){
        const j = await r.json();
        const data = j && (j.data||j);
        if(data && Array.isArray(data.rules)){
          autoState.rules = data.rules.map(it=> ({ minutes: Math.max(1, Number(it.minutes)||1), text: String(it.text||''), enabled: it.enabled !== false, id: it.id || genId() }))
                                   .filter(it=> it.text).sort((a,b)=> a.minutes-b.minutes);
          autoState.enabled = !!data.enabled;
          autoState.serverManaged = true;
          usedServer = true;
        }
      }
    }catch{}
    if(!usedServer){
      const cfg = loadAutoConfig();
      autoState.rules = cfg.list; autoState.enabled = cfg.enabled; autoState.serverManaged = false;
    }
    if(arEnabledCk) arEnabledCk.checked = !!autoState.enabled;
    renderAutoRules();
    try{
      const tip = arWrap?.querySelector('.ar-tip');
      if(tip){ tip.textContent = autoState.serverManaged ? '当前由服务端调度自动回复（始终生效）；此处保存将同步到服务端。' : '当前由本地浏览器计时调度；关闭页面后将不再自动发送。'; }
    }catch{}
  }
  function collectRulesFromUI(){
    if(!arRulesList) return autoState.rules;
    const items = Array.from(arRulesList.querySelectorAll('.ar-item')).map(li => {
      const id = li.getAttribute('data-id') || genId();
      const min = Number(li.querySelector('.ar-minute')?.value || 1) || 1;
      const text = String(li.querySelector('.ar-text')?.value || '').trim();
      const en = !!li.querySelector('.ar-enabled-item')?.checked;
      return { id, minutes: Math.max(1, Math.floor(min)), text, enabled: en };
    }).filter(it => it.text);
    return items.sort((a,b)=> a.minutes - b.minutes);
  }
  arAddBtn?.addEventListener('click', ()=>{
    autoState.rules.push({ id: genId(), minutes: 5, text: '', enabled: true });
    renderAutoRules();
  });
  arRulesList?.addEventListener('click', (e)=>{
    const li = e.target.closest('.ar-item'); if(!li) return;
    if(e.target.closest('.ar-del')){
      const id = li.getAttribute('data-id');
      autoState.rules = autoState.rules.filter(it => it.id !== id);
      renderAutoRules();
    }
  });
  arSaveBtn?.addEventListener('click', async ()=>{
    autoState.rules = collectRulesFromUI();
    autoState.enabled = !!arEnabledCk?.checked;
    if(autoState.serverManaged){
      try{
        const payload = { enabled: autoState.enabled, rules: autoState.rules.map(r=> ({ minutes: r.minutes, text: r.text, enabled: r.enabled !== false })) };
        const res = await fetch('/admin/api/auto-reply/config', { method:'PUT', headers: API.headers({ 'Content-Type':'application/json' }), body: JSON.stringify(payload) });
        if(res.ok){
          showArToast('已保存到服务端');
        } else {
          showArToast('保存到服务端失败，已保存到本地');
          saveAutoConfig(autoState.rules, autoState.enabled);
        }
      }catch(e){ showArToast('保存异常，已保存到本地'); saveAutoConfig(autoState.rules, autoState.enabled); }
    } else {
      saveAutoConfig(autoState.rules, autoState.enabled);
      showArToast('已保存到本地');
    }
  });
  function showArToast(msg){ try{ const t = document.createElement('div'); t.className='ar-toast'; t.textContent=msg; arWrap.appendChild(t); setTimeout(()=>{ t.remove(); }, 1800); }catch{} }
  arEnabledCk?.addEventListener('change', ()=>{
    autoState.enabled = !!arEnabledCk.checked;
    saveAutoConfig(collectRulesFromUI(), autoState.enabled);
  });
  hydrateAutoUI();

  // 调度逻辑
  function clearPeerTimers(peerId){
    const arr = autoState.timers.get(peerId) || [];
    for(const t of arr){ try{ clearTimeout(t.h); }catch{} }
    autoState.timers.delete(peerId);
  }
  function markSent(peerId, key){
    const set = autoState.sent.get(peerId) || new Set();
    set.add(key); autoState.sent.set(peerId, set);
  }
  function hasSent(peerId, key){ const set = autoState.sent.get(peerId); return set ? set.has(key) : false; }
  function latestAdminMessage(peerId){
    const list = state.messages.get(peerId) || [];
    for(let i=list.length-1;i>=0;i--){ const m=list[i]; if(isSelfMessage(m)) return m; }
    return null;
  }
  function hasUserAfter(peerId, timestamp){
    const list = state.messages.get(peerId) || [];
    return list.some(m => !isSelfMessage(m) && Number(m.createdAt||0) > Number(timestamp||0));
  }
  async function sendAuto(peerId, text, baseMsgId, minutes){
    try{
      const key = `${baseMsgId}|${minutes}`;
      if(hasSent(peerId, key)) return;
      const data = await API.post('/admin/api/messages/send', { toUserId: peerId, content: text });
      if(data && data.ok && data.item){
        const wrap = document.getElementById('ac-chat-overlay');
        const msgList = wrap?.querySelector('.ac-chat-messages');
        appendMessageBubble(msgList, data.item, true);
        state.messages.set(peerId, (state.messages.get(peerId)||[]).concat([data.item]));
        markSent(peerId, key);
        // 客服已回复，清除当前 peer 的其他定时
        clearPeerTimers(peerId);
        msgList && (msgList.scrollTop = msgList.scrollHeight);
        await refreshRecents();
      }
    }catch(err){ console.warn('[chat-floating] auto-reply send failed', err); }
  }
  function scheduleForPeer(peerId){
    if(autoState.serverManaged) return; // 服务端托管时，前端不做本地调度
    clearPeerTimers(peerId);
    if(!autoState.enabled) return;
    const rules = (autoState.rules||[]).filter(r => r && r.enabled !== false && Number(r.minutes)>0 && r.text);
    if(!rules.length) return;
    const m = latestAdminMessage(peerId);
    if(!m) return;
    if(hasUserAfter(peerId, m.createdAt)) return; // 用户已回复，不触发
    const now = Date.now();
    const baseAt = Number(m.createdAt||0);
    const arr = [];
    for(const r of rules){
      const key = `${m.id}|${r.minutes}`;
      if(hasSent(peerId, key)) continue; // 避免重复
      const due = baseAt + r.minutes*60000;
      const delay = Math.max(0, due - now);
      const h = setTimeout(()=>{
        // 触发前再校验一次：是否仍未被用户回复、且最新客服消息仍为基准
        const latest = latestAdminMessage(peerId);
        if(!latest || latest.id !== m.id) return; // 客服有了更新的消息，以最新为准
        if(hasUserAfter(peerId, latest.createdAt)) return; // 用户已回复
        sendAuto(peerId, r.text, m.id, r.minutes);
      }, delay);
      arr.push({ h, minutes: r.minutes });
    }
    if(arr.length) autoState.timers.set(peerId, arr);
  }
  function onAdminSent(){ if(state.active){ clearPeerTimers(state.active); scheduleForPeer(state.active); } }

  // 初始化语言选择
  try{ if (transSelect) { transSelect.value = state.transTarget; } }catch{}

    sendBtn?.addEventListener('click', async ()=>{
      const text = String(inputEl.value||'').trim();
      if(!text || !state.active) return;
      try{
        const data = await API.post('/admin/api/messages/send', { toUserId: state.active, content: text });
        if(data && data.ok && data.item){
          appendMessageBubble(msgList, data.item, true);
          try{ const cur = state.messages.get(state.active)||[]; cur.push(data.item); state.messages.set(state.active, cur);}catch{}
          inputEl.value='';
          msgList.scrollTop = msgList.scrollHeight;
          await refreshRecents();
          try{ onAdminSent(); }catch{}
        }
      }catch(err){ console.warn('[chat-floating] send failed', err); }
    });
    inputEl?.addEventListener('keydown',(e)=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); sendBtn.click(); }});
    convList?.addEventListener('click', async (e)=>{
      const li = e.target.closest('li[data-peer]'); if(!li) return;
      const peer = li.getAttribute('data-peer');
      await openConversation(peer);
    });
    resultsList?.addEventListener('click', async (e)=>{
      const li = e.target.closest('li[data-peer]'); if(!li) return;
      const peer = li.getAttribute('data-peer');
      await openConversation(peer);
    });
    imgBtn?.addEventListener('click', ()=> fileInput && fileInput.click());
    fileInput?.addEventListener('change', async (e)=>{
      const f = e.target.files && e.target.files[0];
      if(!f || !state.active) return;
      try{
        const up = await API.upload('/admin/api/upload', f);
        if (up && up.ok && up.url){
          const payload = 'img:'+ up.url;
          const data = await API.post('/admin/api/messages/send', { toUserId: state.active, content: payload });
          if(data && data.ok && data.item){
            appendMessageBubble(msgList, data.item, true);
            try{ const cur = state.messages.get(state.active)||[]; cur.push(data.item); state.messages.set(state.active, cur);}catch{}
            msgList.scrollTop = msgList.scrollHeight;
            await refreshRecents();
            try{ onAdminSent(); }catch{}
          }
        }
      }catch(err){ console.warn('[chat-floating] upload failed', err); }
      e.target.value = '';
    });
    // 表情面板开关与“点击外部关闭”
    if (emojiBtn && emojiPanel && emojiWrap){
      const closeEmoji = ()=>{ try{ emojiPanel.hidden = true; emojiPanel.style.display='none'; emojiWrap.classList.remove('open'); emojiBtn.setAttribute('aria-expanded','false'); }catch{} };
      const openEmoji = ()=>{ try{ emojiPanel.hidden = false; emojiPanel.style.display='grid'; emojiWrap.classList.add('open'); emojiBtn.setAttribute('aria-expanded','true'); }catch{} };
      emojiBtn.addEventListener('click', (ev)=>{
        ev.stopPropagation();
        if (emojiPanel.childElementCount === 0) buildEmojiPanel(emojiPanel, (emo)=>{ insertAtCursor(inputEl, emo); });
        const isOpen = emojiWrap.classList.contains('open');
        if (isOpen) closeEmoji(); else openEmoji();
      });
      emojiPanel.addEventListener('click', (ev)=> ev.stopPropagation());
      // 点击页面其它位置时收起（用捕获阶段，避免被内部 stopPropagation 影响）
      const onDocDown = (ev)=>{ if (!emojiWrap.contains(ev.target)) closeEmoji(); };
      document.addEventListener('mousedown', onDocDown, true);
    }

    // 翻译：批量
    transAllBtn?.addEventListener('click', async ()=>{
      try { await translateAllInView(msgList); } catch(e){ console.warn('[chat-floating] translate all failed', e); }
    });
    // 输入区：翻译菜单 (新版与前端一致)
    if (transBtn && langMenu && transWrap){
      const closeMenu = ()=>{ try{ console.debug('[chat-floating] closeMenu'); }catch{}; try{ langMenu.hidden = true; langMenu.style.display='none'; langMenu.setAttribute('aria-hidden','true'); transWrap.classList.remove('open'); transBtn.setAttribute('aria-expanded','false'); }catch(e){ try{ console.warn('[chat-floating] closeMenu error', e); }catch{} } };
      const openMenu = ()=>{ try{ console.debug('[chat-floating] openMenu start'); }catch{}; try{ positionLangMenu(); highlightActiveLang(); langMenu.hidden = false; langMenu.removeAttribute('aria-hidden'); langMenu.style.display='flex'; transWrap.classList.add('open'); transBtn.setAttribute('aria-expanded','true'); console.debug('[chat-floating] openMenu done hidden=', langMenu.hidden, 'display=', langMenu.style.display); }catch(e){ try{ console.warn('[chat-floating] openMenu error', e); }catch{} } };
      const toggleMenu = ()=>{ const willOpen = !transWrap.classList.contains('open'); try{ console.debug('[chat-floating] toggleMenu willOpen=', willOpen); }catch{}; willOpen ? openMenu() : closeMenu(); setTimeout(()=>{ try{ console.debug('[chat-floating] postToggle status open=', transWrap.classList.contains('open'), 'hidden=', langMenu.hidden); }catch{}; if(transWrap.classList.contains('open') && langMenu.hidden){ try{ console.debug('[chat-floating] retry openMenu because still hidden'); }catch{} openMenu(); } }, 60); };
      // 使用 click 事件更符合用户预期；提升按钮 z-index 保证可点
      transBtn.addEventListener('click',(ev)=>{ ev.stopPropagation(); try{ console.debug('[chat-floating] transBtn click'); }catch{} toggleMenu(); });
      try{ transWrap.dataset.transInit='1'; }catch{}
      // ESC 关闭
      document.addEventListener('keydown',(e)=>{ if(e.key==='Escape' && transWrap.classList.contains('open')) closeMenu(); });
      // 点击菜单内部的语言项与开关
      langMenu.addEventListener('click', async (ev)=>{
        const btn = ev.target.closest('button.menu-item');
        if(btn){
          const lang = btn.getAttribute('data-lang');
          const action = btn.getAttribute('data-action');
          if (lang){
            if (lang === '__original'){
              state.transTarget=''; try{ localStorage.setItem('admin_chat_trans_target',''); }catch{}
              removeAllTranslations(msgList); highlightActiveLang(); closeMenu(); return;
            } else {
              state.transTarget = lang; try{ localStorage.setItem('admin_chat_trans_target', lang); }catch{}
              if (transSelect) { try{ transSelect.value = lang; }catch{} }
              try { await translateAllInView(msgList); } catch(e){ console.warn('[chat-floating] translate all failed', e); }
              highlightActiveLang(); closeMenu(); return;
            }
          }
          if (action === 'all'){
            try { await translateAllInView(msgList); } catch(e){ console.warn('[chat-floating] translate all failed', e); }
            closeMenu(); return;
          }
        }
        const toggle = ev.target.closest('label.menu-item.toggle');
        if (toggle){
          const ck = toggle.querySelector('.dual-mode-toggle');
            if (ck){ state.dualMode = ck.checked; try{ localStorage.setItem('admin_chat_dual_mode', state.dualMode? '1':'0'); }catch{} updateDisplayModes(msgList); highlightActiveLang(); }
        }
      });
      // 点击菜单外部区域关闭（捕获阶段避免内部 stopPropagation 影响）
      const onDocDown = (ev)=>{ if (transWrap.classList.contains('open') && !transWrap.contains(ev.target)) { try{ console.debug('[chat-floating] outside click -> close'); }catch{} closeMenu(); } };
      document.addEventListener('mousedown', onDocDown, true);
      // 当窗口滚动或尺寸变化时，若菜单打开则重定位
      window.addEventListener('scroll',()=>{ if(transWrap.classList.contains('open')) positionLangMenu(); }, true);
      window.addEventListener('resize',()=>{ if(transWrap.classList.contains('open')) positionLangMenu(); });
    }
    // 兜底：无条件委托（即使已初始化也允许执行，用于覆盖被外部脚本移除的监听）
    document.addEventListener('click', (e)=>{
      try{
        const btnx = e.target.closest('.trans-wrap .btn-trans'); if(!btnx) return;
        const wrapx = btnx.closest('.trans-wrap'); const menux = wrapx && wrapx.querySelector('.lang-menu'); if(!menux) return;
        // 若原生监听已经处理（open/close状态已改变且事件冒泡继续到这里）则忽略
        const before = wrapx.classList.contains('open');
        // 用一个短延时查看是否已被主监听处理
        setTimeout(()=>{
          const after = wrapx.classList.contains('open');
          if(before!==after){ try{ console.debug('[chat-floating] delegated sees state changed by primary, skip'); }catch{} return; }
          // 主监听未触发 -> 手动执行
          const willOpen = !after;
          if(willOpen){ menux.hidden=false; menux.style.display='flex'; menux.removeAttribute('aria-hidden'); wrapx.classList.add('open'); btnx.setAttribute('aria-expanded','true'); }
          else { menux.hidden=true; menux.style.display='none'; menux.setAttribute('aria-hidden','true'); wrapx.classList.remove('open'); btnx.setAttribute('aria-expanded','false'); }
          try{ console.debug('[chat-floating] delegated forced toggle willOpen=', willOpen); }catch{}
        }, 0);
      }catch(err){ try{ console.warn('[chat-floating] delegated toggle error', err); }catch{} }
    }, true);
    // 翻译目标切换
    transSelect?.addEventListener('change', (e)=>{
      const val = normalizeTarget(e.target.value || 'zh-CN');
      state.transTarget = val;
      try { localStorage.setItem('admin_chat_trans_target', val); } catch {}
    });
    // 单条翻译按钮事件已移除

    // 搜索：输入时查询所有用户（带键盘导航）
    if (searchInput) {
      let timer = 0;
      const runSearch = async (q)=>{
        const kw = String(q||'').trim();
        if (!kw) { state.searching=false; state.searchResults=[]; state.searchIndex=-1; renderSidebar(); return; }
        try{
          const data = await API.get('/admin/api/messages/search-users?keyword='+encodeURIComponent(kw));
          state.searching=true; state.searchResults = Array.isArray(data?.list) ? data.list : []; state.searchIndex=-1;
          renderSidebar();
        }catch(err){ console.warn('[chat-floating] search users failed', err); state.searching=true; state.searchResults=[]; state.searchIndex=-1; renderSidebar(); }
      };
      searchInput.addEventListener('input', (e)=>{
        const q = e.target.value;
        if (timer) clearTimeout(timer);
        timer = setTimeout(()=> runSearch(q), 300);
      });
      searchInput.addEventListener('keydown', (e)=>{
        const hasResults = Array.isArray(state.searchResults) && state.searchResults.length>0;
        if (e.key === 'ArrowDown' && hasResults){ e.preventDefault(); state.searchIndex = Math.min((state.searchIndex??-1)+1, state.searchResults.length-1); updateSuggestActive(); }
        else if (e.key === 'ArrowUp' && hasResults){ e.preventDefault(); state.searchIndex = Math.max((state.searchIndex??-1)-1, 0); updateSuggestActive(); }
        else if (e.key === 'Enter'){
          if (state.searching && hasResults){ e.preventDefault(); const idx = state.searchIndex>=0 ? state.searchIndex : 0; const item = state.searchResults[idx]; if(item) openConversation(item.id); }
        } else if (e.key === 'Escape'){
          state.searching=false; state.searchResults=[]; state.searchIndex=-1; searchInput.value=''; renderSidebar();
        }
      });
      function updateSuggestActive(){
        if (!resultsList) return; const lis = Array.from(resultsList.querySelectorAll('li'));
        lis.forEach((el,i)=>{ if (i===state.searchIndex) el.classList.add('suggest-active'); else el.classList.remove('suggest-active'); });
        const cur = lis[state.searchIndex]; if (cur) cur.scrollIntoView({ block:'nearest' });
      }
    }

    // 允许拖动面板（通过 header）
    makeDraggable(wrap.querySelector('.ac-chat-panel'), wrap.querySelector('[data-ac-drag-handle]'));

    // 窗口变化时，若用户拖过弹窗，保持其在屏幕内
    try{
      const panelEl = wrap.querySelector('.ac-chat-panel');
      window.addEventListener('resize', ()=> keepPanelVisible(panelEl));
    }catch{}

    return wrap;
  }

  function escapeHTML(s){ return s.replace(/[&<>"']/g, c=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c])); }
  async function toggleChatPanel(){
    const el = ensurePanel();
    el.classList.toggle('hidden');
    state.open = !el.classList.contains('hidden');
    if (state.open) {
      try { keepPanelVisible(el.querySelector('.ac-chat-panel')); } catch {}
      await refreshRecents();
      if (state.recents && state.recents.length && !state.active){ await openConversation(state.recents[0].peerId); }
    }
  }
  function hideChatPanel(){ const el = document.getElementById('ac-chat-overlay'); if(el){ el.classList.add('hidden'); state.open=false; } }

  function summarizeUnread(){ try{ const total = (state.recents||[]).reduce((s,it)=> s + (Number(it.unread)||0), 0); setBadge(total); }catch{} }

  async function refreshRecents(){
    try{
      const data = await API.get('/admin/api/messages/recent');
      if (data && data.ok && Array.isArray(data.list)){
        state.recents = data.list;
        renderSidebar();
        summarizeUnread();
        // 若当前正在查看某个会话且该会话存在未读，主动同步消息并滚动到底部
        try{
          if(state.open && state.active){
            const cur = state.recents.find(r=> r.peerId === state.active);
            if(cur && Number(cur.unread||0) > 0){ await syncActiveMessages(); }
          }
        }catch{}
      }
    }catch(err){ console.warn('[chat-floating] recent error', err); }
  }

  function renderSidebar(){
    const wrap = document.getElementById('ac-chat-overlay'); if(!wrap) return;
    const ulRecents = wrap.querySelector('.ac-chat-conv');
    if(!ulRecents) return;
    // 最近会话
    const recHtml = (state.recents||[]).map(item => {
      const name = item?.peer?.nickname || item?.peerId || '用户';
      const avatar = (item?.peer?.avatar || '').trim();
      const last = formatLast(item?.lastContent || '');
      const time = formatTime(item?.lastAt);
      const unread = Number(item?.unread||0);
      const initials = name.slice(0,1).toUpperCase();
      const pid = item.peerId;
      const active = pid === state.active ? 'active' : '';
      return `<li class="${active}" data-peer="${escapeAttr(pid)}">
        <div class="avatar">${avatar ? `<img src="${escapeAttr(avatar)}" alt=""/>` : escapeHTML(initials)}</div>
        <div class="meta"><div class="name">${escapeHTML(name)}</div><div class="desc">${escapeHTML(last)}</div></div>
        <div class="time">${time}</div>
        ${unread>0? `<span class=\"unread\">${unread>99?'99+':unread}</span>`:''}
      </li>`;
    }).join('');
    ulRecents.innerHTML = recHtml || '<div class="ac-chat-empty" style="margin:12px;">暂无会话</div>';

    // 搜索结果
    const secResults = wrap.querySelector('.section-results');
    const ulResults = wrap.querySelector('.ac-chat-results');
    if (secResults && ulResults){
      if (state.searching){
        const resHtml = (state.searchResults||[]).map((it, idx) => {
          const name = it?.nickname || it?.id || '用户';
          const avatar = (it?.avatar || '').trim();
          const initials = name.slice(0,1).toUpperCase();
          const active = it.id === state.active ? 'active' : '';
          const selected = idx === state.searchIndex ? 'suggest-active' : '';
          return `<li class="${active} ${selected}" data-peer="${escapeAttr(it.id)}">
            <div class="avatar">${avatar ? `<img src="${escapeAttr(avatar)}" alt=""/>` : escapeHTML(initials)}</div>
            <div class="meta">
              <div class="name">${escapeHTML(name)}</div>
            </div>
          </li>`;
        }).join('');
        ulResults.innerHTML = resHtml || '<div class="ac-chat-empty" style="margin:12px;">未找到匹配的用户</div>';
        secResults.hidden = false;
      } else {
        ulResults.innerHTML = '';
        secResults.hidden = true;
      }
    }
  }

  // 判断一条消息是否为“客服自己”发送
  function isSelfMessage(m){ const from = String(m?.fromUserId || m?.from || '').toLowerCase(); return from === 'support' || from === 'admin'; }

  async function openConversation(peerId){
    state.active = peerId;
    state.searching = false; // 选中后退出搜索态
    renderSidebar();
    const wrap = document.getElementById('ac-chat-overlay'); if(!wrap) return;
    const msgList = wrap.querySelector('.ac-chat-messages'); if(!msgList) return;
    const searchInput = wrap.querySelector('.ac-chat-search-input'); if (searchInput) searchInput.value = '';
    msgList.innerHTML = '';
    try{
      const data = await API.get('/admin/api/messages?userId=' + encodeURIComponent(peerId));
      if (data && data.ok && Array.isArray(data.list)){
        state.messages.set(peerId, data.list);
        for (const m of data.list){ appendMessageBubble(msgList, m, isSelfMessage(m)); }
        // 初次打开自动滚动到底部，并处理图片延迟加载重新滚动
        scrollToLatest(msgList);
        // 选择了翻译语言后，自动对当前会话全部消息进行翻译；仅在显示原文(__original/空)时跳过。
        try{
          if(state.transTarget){ await translateAllInView(msgList); }
        }catch(e){ console.warn('[chat-floating] auto translate on open failed', e); }
        await API.post('/admin/api/messages/read', { peerId });
        await refreshRecents();
        try{ scheduleForPeer(peerId); }catch{}
      }
    }catch(err){ console.warn('[chat-floating] load messages error', err); }
  }

  // 当轮询检测到当前会话有未读时，拉取并增量追加新消息，随后自动滚动到底部
  async function syncActiveMessages(){
    if(!state.active) return;
    const wrap = document.getElementById('ac-chat-overlay'); if(!wrap) return;
    const msgList = wrap.querySelector('.ac-chat-messages'); if(!msgList) return;
    try{
      const data = await API.get('/admin/api/messages?userId=' + encodeURIComponent(state.active));
      if(!(data && data.ok && Array.isArray(data.list))) return;
      const old = state.messages.get(state.active) || [];
      const oldIds = new Set(old.map(m=> m && m.id));
      const toAppend = data.list.filter(m => m && !oldIds.has(m.id));
      if(toAppend.length){
        // 判断追加前是否已接近底部，避免打断查看历史
        const stick = isNearBottom(msgList, 120);
        for(const m of toAppend){ appendMessageBubble(msgList, m, isSelfMessage(m)); }
        // 更新本地缓存
        state.messages.set(state.active, data.list);
        // 仅在靠近底部时才自动滚动
        if(stick){
          msgList.scrollTop = msgList.scrollHeight;
          // 图片可能异步加载，加载完成后再补一次滚动
          try{
            const imgs = Array.from(msgList.querySelectorAll('img.msg-img'));
            imgs.forEach(img=>{ if(img && !img.__ac_bind_scroll){ img.__ac_bind_scroll = true; img.addEventListener('load', ()=>{ msgList.scrollTop = msgList.scrollHeight; }, { once:true }); }});
          }catch{}
        }
        // 新增消息时也自动翻译（若已选择目标语言）。避免管理员重复点击“全部翻译”。
        try{
          if(state.transTarget){ await translateAllInView(msgList); }
        }catch(e){ console.warn('[chat-floating] auto translate on sync failed', e); }
        // 标记已读并刷新侧边栏
        try{ await API.post('/admin/api/messages/read', { peerId: state.active }); }catch{}
        try{ await refreshRecents(); }catch{}
        // 调整自动回复调度：如果是客户消息，安排；如果是客服消息，清理
        try{
          const last = data.list[data.list.length-1];
          if(last){ if(isSelfMessage(last)) scheduleForPeer(state.active); else clearPeerTimers(state.active); }
        }catch{}
      }
    }catch(err){ console.warn('[chat-floating] sync messages error', err); }
  }

  // 是否接近底部（阈值默认 120px）
  function isNearBottom(el, threshold){
    if(!el) return true;
    const t = Number(threshold||0);
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    return dist <= t;
  }

  function appendMessageBubble(container, msg, isSelf){
    const node = document.createElement('div');
    node.className = 'msg ' + (isSelf ? 'msg-self' : 'msg-other');
    node.setAttribute('data-id', msg.id || '');
    const parsed = parseContent(msg.content || '');
    const time = formatMsgTime(msg.createdAt);
    // 头像来源：当前会话用户 or 客服
    const peerMeta = getActivePeerMeta();
    const userAvatar = (peerMeta && peerMeta.avatar) || '';
    const adminAvatar = getAdminAvatar();
    const avatarUrl = isSelf ? adminAvatar : userAvatar;
    const avatarHTML = `<div class=\"msg-avatar\">${avatarUrl ? `<img src=\"${escapeAttr(avatarUrl)}\" alt=\"avatar\"/>` : '<span class=\"placeholder\">客</span>'}</div>`;
      let bubbleInner = '';
      if (parsed.type === 'image') {
        bubbleInner = `<img class=\"msg-img\" src=\"${escapeAttr(parsed.url)}\" alt=\"image\"/>`;
      } else {
        node.setAttribute('data-text', parsed.text || '');
        bubbleInner = `<span class=\"orig-text\">${escapeHTML(parsed.text||'')}</span>`; // 移除单条消息“译”按钮
      }
    const bubbleHTML = `<div class=\"bubble\">${bubbleInner}<div class=\"time\">${escapeHTML(time)}</div></div>`;
    // 布局：用户消息 = avatar + bubble；客服消息 = bubble + avatar
    node.innerHTML = isSelf ? bubbleHTML + avatarHTML : avatarHTML + bubbleHTML;
    container.appendChild(node);
  }
  // 滚动辅助：确保最新消息可见，处理图片加载后的高度变化
  function scrollToLatest(list){
    if(!list) return;
    requestAnimationFrame(()=>{ try{ list.scrollTop = list.scrollHeight; }catch{} });
    setTimeout(()=>{ try{ list.scrollTop = list.scrollHeight; }catch{} }, 120);
    try{
      const imgs = Array.from(list.querySelectorAll('img.msg-img'));
      imgs.forEach(img=>{ if(img && !img.__ac_bind_scroll){ img.__ac_bind_scroll = true; img.addEventListener('load', ()=>{ try{ list.scrollTop = list.scrollHeight; }catch{} }, { once:true }); }});
    }catch{}
  }

  function parseContent(s){
    if (typeof s === 'string' && s.startsWith('img:')){
      return { type:'image', url: s.slice(4) };
    }
    return { type:'text', text: String(s||'') };
  }
  // 获取当前会话用户元数据（头像）
  function getActivePeerMeta(){
    const pid = state.active;
    if(!pid) return null;
    const rec = (state.recents||[]).find(r=> r.peerId === pid);
    if(rec && rec.peer){
      return { id: rec.peerId, avatar: (rec.peer.avatar || '').trim(), nickname: rec.peer.nickname || '' };
    }
    return null;
  }
  function getAdminAvatar(){
    try{
      const profRaw = localStorage.getItem('admin_profile');
      if(profRaw){
        const p = JSON.parse(profRaw);
        if(p && p.avatarUrl) return String(p.avatarUrl).trim();
        if(p && p.avatar) return String(p.avatar).trim();
      }
    }catch{}
    return '';
  }

  function formatTime(ts){
    const t = Number(ts||0); if (!Number.isFinite(t)||t<=0) return '';
    const d = new Date(t); const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    const pad = (n)=> String(n).padStart(2,'0');
    return sameDay ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : `${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  }
  function formatLast(s){ return (typeof s==='string' && s.startsWith('img:')) ? '[图片]' : (String(s||'')); }
  function formatMsgTime(ts){
    const t = Number(ts||0); if (!Number.isFinite(t)||t<=0) return '';
    const d = new Date(t); const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime())/1000);
    if (diff < 60) return '刚刚';
    if (diff < 3600) return Math.floor(diff/60) + '分钟前';
    if (d.toDateString() === now.toDateString()){
      return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    }
    const yesterday = new Date(now); yesterday.setDate(now.getDate()-1);
    if (d.toDateString() === yesterday.toDateString()) return '昨天';
    return `${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }
  async function translateOneMessage(msgEl){
    const id = msgEl.getAttribute('data-id') || '';
    const text = msgEl.getAttribute('data-text') || '';
    if (!text) return;
    const target = normalizeTarget(state.transTarget || 'zh-CN');
    let transNode = msgEl.querySelector('.translated');
    if (!transNode){
      transNode = document.createElement('div'); transNode.className = 'translated loading'; msgEl.querySelector('.bubble').appendChild(transNode);
    }
  transNode.textContent = getTranslatingLabel(target);
  // 非双语模式立即隐藏原文
  try{ const listWrap = document.querySelector('.ac-chat-messages'); updateDisplayModes(listWrap); }catch{}
    try {
      const r = await API.translate(text, target);
      const translated = r?.translated || r?.data?.translated || r?.data?.translatedText || r?.translatedText || '';
      if (translated){
        // 若仍是占位格式 [LANG] 原文，则视为失败
        if (isPlaceholderTranslation(translated, target, text)){
          transNode.classList.add('failed'); transNode.textContent = getTranslateFailedLabel(target);
        } else {
          transNode.classList.remove('loading'); transNode.textContent = translated;
        }
      } else { transNode.classList.add('failed'); transNode.textContent = getTranslateFailedLabel(target); }
    } catch(err){ transNode.classList.add('failed'); transNode.textContent = getTranslateFailedLabel(target); }
    // 更新显示模式（可能需要隐藏原文或显示双语）
    try{ const listWrap = document.querySelector('.ac-chat-messages'); updateDisplayModes(listWrap); }catch{}
  }
  async function translateAllInView(msgList){
    const nodes = Array.from(msgList.querySelectorAll('.msg[data-text]'));
    if (!nodes.length) return;
    const items = nodes.map(el => ({ id: el.getAttribute('data-id') || '', text: el.getAttribute('data-text') || '' }))
      .filter(it => it.text);
    if (!items.length) return;
    const target = normalizeTarget(state.transTarget || 'zh-CN');
    // 预置“翻译中”占位
    for (const el of nodes){
      let transNode = el.querySelector('.translated');
      if (!transNode){ transNode = document.createElement('div'); transNode.className = 'translated loading'; el.querySelector('.bubble').appendChild(transNode); }
      else { transNode.classList.add('loading'); }
      transNode.textContent = getTranslatingLabel(target);
      try{ updateDisplayModes(msgList); }catch{}
    }
    try {
      const r = await API.translateBatch(items, target);
      const list = r?.list || r?.data?.list || [];
      // 构建结果映射（含 provider 用于判断 noop）
      const map = new Map(list.map(it => [it.id, { translated: it.translated, provider: it.provider, original: it.original }]));
      for (const el of nodes){
        const id = el.getAttribute('data-id'); const entry = id ? map.get(id) : undefined;
        let transNode = el.querySelector('.translated');
        if (!entry){ if(transNode){ transNode.classList.add('failed'); transNode.textContent = getTranslateFailedLabel(target); transNode.classList.remove('loading'); } continue; }
        const t = entry.translated;
        const provider = entry.provider;
        const originalText = entry.original || el.getAttribute('data-text') || '';
        // provider 为 noop 且文本与原文相同：不创建译文节点，保持原文显示（视为无需翻译）
        if (provider === 'noop' && t === originalText){
          if (transNode){ try { transNode.remove(); } catch {} }
          // 保留原文显示，无需后续处理
          continue;
        }
        if (!transNode){ transNode = document.createElement('div'); transNode.className = 'translated'; el.querySelector('.bubble').appendChild(transNode); }
        if (isPlaceholderTranslation(t, target, originalText)){
          transNode.classList.add('failed'); transNode.textContent = getTranslateFailedLabel(target); transNode.classList.remove('loading');
        } else {
          transNode.classList.remove('loading'); transNode.classList.remove('failed');
          transNode.textContent = t;
        }
      }
    } catch(err){
      for (const el of nodes){ const tn = el.querySelector('.translated'); if(tn){ tn.classList.add('failed'); tn.textContent = getTranslateFailedLabel(target); tn.classList.remove('loading'); } }
    }
    // 刷新显示模式
    try{ updateDisplayModes(msgList); }catch{}
  }
  function getTranslatingLabel(target){ return ({ 'zh-CN':'翻译中', 'zh-TW':'翻譯中', 'en':'Translating...', 'ja':'翻訳中', 'ko':'번역 중' }[target] || 'Translating...'); }
  function getTranslateFailedLabel(target){ return ({ 'zh-CN':'翻译失败', 'zh-TW':'翻譯失敗', 'en':'Translate failed', 'ja':'翻訳失敗', 'ko':'번역 실패' }[target] || 'Translate failed'); }
  function isPlaceholderTranslation(text, target, original){
    const tgt = String(target||'').toUpperCase();
    const origTrim = String(original||'').trim();
    const txtTrim = String(text||'').trim();
    return !!origTrim && txtTrim === `[${tgt}] ${origTrim}`;
  }
  // 根据当前模式（显示原文 / 双语 / 仅译文）更新消息显示
  function updateDisplayModes(msgList){
    if(!msgList) return; const nodes = Array.from(msgList.querySelectorAll('.msg[data-text]'));
    for(const el of nodes){
      const orig = el.querySelector('.orig-text');
      const trans = el.querySelector('.translated');
      if(!orig) continue;
      // 未选择目标语言或选择“显示原文” -> 仅展示原文
      if (!state.transTarget){ orig.style.display=''; if(trans) trans.style.display='none'; continue; }
      // 已选择目标语言
      if (!trans){ // 还没开始翻译（异常）保留原文
        orig.style.display=''; continue;
      }
      if(state.dualMode){ // 双语模式：两者都显示
        orig.style.display=''; trans.style.display='';
      } else {
        // 非双语：始终隐藏原文（即便 loading 或 failed），仅显示译文区域
        orig.style.display='none'; trans.style.display='';
      }
    }
  }
  function removeAllTranslations(msgList){ if(!msgList) return; const nodes = Array.from(msgList.querySelectorAll('.msg .translated')); nodes.forEach(n=>{ if(n && n.parentElement){ n.parentElement.removeChild(n); } }); updateDisplayModes(msgList); }
  function highlightActiveLang(){ if(!langMenu) return; const code = state.transTarget || '__original'; const items = Array.from(langMenu.querySelectorAll('button.menu-item')); items.forEach(btn=>{ const l = btn.getAttribute('data-lang'); if(l===code) btn.classList.add('active'); else btn.classList.remove('active'); }); if(dualToggle) dualToggle.checked = !!state.dualMode; }
  function positionLangMenu(){ if(!langMenu || !transBtn) return; try{ langMenu.style.bottom='calc(100% + 8px)'; langMenu.style.marginBottom=''; }catch{} }
  function insertAtCursor(input, text){ if(!input) return; const el=input; const start=el.selectionStart||el.value.length; const end=el.selectionEnd||el.value.length; el.value = el.value.slice(0,start)+text+el.value.slice(end); el.focus(); const pos=start+text.length; el.setSelectionRange(pos,pos); }
  function buildEmojiPanel(container, onPick){
    // 使用 codepoint 构造，避免文件编码导致字符变成 �
    const emojiCodes = [
      // 笑脸/情绪
      [0x1F600],[0x1F603],[0x1F604],[0x1F605],[0x1F606],[0x1F60A],[0x1F60D],[0x1F618],[0x1F617],[0x1F61A],
      [0x1F61C],[0x1F61D],[0x1F602],[0x1F923],[0x1F970],[0x1F929],[0x1F60F],[0x1F924],[0x1F914],[0x1F644],
      [0x1F910],[0x1F928],[0x1F975],[0x1F976],[0x1F974],[0x1F62D],[0x1F634],[0x1F621],[0x1F620],
      // 手势
      [0x1F44D],[0x1F44E],[0x1F44F],[0x1F64C],[0x1F64F],[0x1F64B],[0x1F44C],[0x270C,0xFE0F],[0x1F44A],[0x1F91D],[0x1F91E],
      // 爱心/星星/庆祝
      [0x2764,0xFE0F],[0x1F9E1],[0x1F49B],[0x1F49A],[0x1F499],[0x1F49C],[0x1F495],[0x1F496],[0x1F493],[0x1F49F],[0x1F49E],[0x1F90D],[0x1F90E],[0x1F5A4],
      [0x2B50],[0x1F31F],[0x2728],[0x1F389],[0x1F38A],[0x1F381],[0x1F4AF],
      // 趣味/物件
      [0x1F4A1],[0x1F4A3],[0x1F4A9],[0x1F525],[0x1F60E],[0x1F973],[0x1F913],[0x1F920],
      // 动物/其他
      [0x1F436],[0x1F431],[0x1F981],[0x1F42D],[0x1F430],[0x1F43C],[0x1F47B],[0x1F480]
    ];
    container.className = 'emoji-panel';
    container.innerHTML = '';
    const fontStack = "'Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol','Noto Color Emoji','EmojiOne Color','Twemoji Mozilla',sans-serif";
    try{ container.style.setProperty('font-family', fontStack, 'important'); }catch{}
    for(const codes of emojiCodes){
      const ch = String.fromCodePoint.apply(String, codes);
      const b = document.createElement('button');
      b.className = 'emo';
      b.type = 'button';
      b.textContent = ch;
      try{ b.style.setProperty('font-family', fontStack, 'important'); }catch{}
      b.style.fontSize = '22px';
      b.style.lineHeight = '28px';
      b.style.display = 'flex'; b.style.alignItems = 'center'; b.style.justifyContent = 'center';
      b.setAttribute('aria-label', 'emoji');
      container.appendChild(b);
    }
    container.addEventListener('click', (e)=>{ const b=e.target.closest('button.emo'); if(!b) return; onPick(b.textContent||''); e.preventDefault(); });
  }

  function makeDraggable(panel, handle){
    if(!panel||!handle) return;
    let sx=0, sy=0, ox=0, oy=0, dragging=false;
    const clamp=(v,min,max)=> Math.min(max, Math.max(min, v));
    const onMove=(e)=>{
      if(!dragging) return; const p = e.touches?e.touches[0]:e; const dx=p.clientX-sx; const dy=p.clientY-sy;
      const w = panel.offsetWidth; const h = panel.offsetHeight;
      const left = clamp(ox+dx, 8, window.innerWidth - w - 8);
      const top  = clamp(oy+dy, 8, window.innerHeight - h - 8);
      panel.style.left = left + 'px'; panel.style.top = top + 'px';
      if(e.cancelable) e.preventDefault();
    };
    const onUp=()=>{ if(!dragging) return; dragging=false; document.removeEventListener('mousemove',onMove); document.removeEventListener('mouseup',onUp); document.removeEventListener('touchmove',onMove); document.removeEventListener('touchend',onUp); };
    const start=(e)=>{
      const r = panel.getBoundingClientRect(); dragging=true; const p = e.touches?e.touches[0]:e; sx=p.clientX; sy=p.clientY; ox=r.left; oy=r.top;
      // 切换为自由定位并去除初始 transform，避免计算偏移造成“乱飘”
      panel.style.position='fixed'; panel.style.transform='none'; panel.style.left=r.left+'px'; panel.style.top=r.top+'px'; panel.style.right=''; panel.style.bottom='';
      try { panel.dataset.dragged = '1'; } catch {}
      document.addEventListener('mousemove',onMove,{passive:false}); document.addEventListener('mouseup',onUp); document.addEventListener('touchmove',onMove,{passive:false}); document.addEventListener('touchend',onUp);
      if(e.cancelable) e.preventDefault();
    };
    handle.addEventListener('mousedown', start);
    handle.addEventListener('touchstart', start, {passive:false});
  }

  // 在窗口尺寸变化时，若面板已被拖拽过，则保持其仍在可视区域内
  function keepPanelVisible(panel){
    if(!panel) return;
    try{ if(panel.dataset.dragged !== '1') return; }catch{ return; }
    const clamp=(v,min,max)=> Math.min(max, Math.max(min, v));
    const r = panel.getBoundingClientRect();
    const left = clamp(r.left, 8, window.innerWidth - r.width - 8);
    const top  = clamp(r.top, 8, window.innerHeight - r.height - 8);
    panel.style.position='fixed'; panel.style.transform='none';
    panel.style.left = left + 'px'; panel.style.top = top + 'px';
  }

  function enableDrag(target){
    let startX=0,startY=0,origLeft=0,origTop=0,isDragging=false, moved=false;
    const clamp=(v,min,max)=> Math.min(max, Math.max(min, v));
    const onMove=(e)=>{
      if(!isDragging) return;
      const point = e.touches? e.touches[0]: e;
      const dx = point.clientX - startX;
      const dy = point.clientY - startY;
      const left = clamp(origLeft + dx, 10, window.innerWidth - target.offsetWidth - 10);
      const top  = clamp(origTop + dy, 10, window.innerHeight - target.offsetHeight - 10);
      target.style.left = left + 'px';
      target.style.top  = top + 'px';
      moved = true;
      if(e.cancelable) e.preventDefault();
    };
    const onUp=()=>{
      if(!isDragging) return;
      isDragging=false;
      window.removeEventListener('mousemove',onMove);
      window.removeEventListener('touchmove',onMove);
      window.removeEventListener('mouseup',onUp);
      window.removeEventListener('touchend',onUp);
      if(moved){ target.__suppressClick = true; setTimeout(()=>{ target.__suppressClick=false; }, 80); }
    };
    target.addEventListener('mousedown',(e)=>{
      isDragging=true; moved=false;
      startX=e.clientX; startY=e.clientY;
      const rect = target.getBoundingClientRect();
      origLeft = rect.left; origTop = rect.top;
      // 切换为 left/top 布局，避免 right/bottom 计算反直觉
      target.style.right=''; target.style.bottom='';
      target.style.left = origLeft + 'px';
      target.style.top  = origTop + 'px';
      document.addEventListener('mousemove',onMove,{passive:false});
      document.addEventListener('mouseup',onUp,{passive:true});
      if(e.cancelable) e.preventDefault();
    });
    target.addEventListener('touchstart',(e)=>{
      isDragging=true; moved=false;
      const t = e.touches[0]; startX=t.clientX; startY=t.clientY;
      const rect = target.getBoundingClientRect();
      origLeft = rect.left; origTop = rect.top;
      target.style.right=''; target.style.bottom='';
      target.style.left = origLeft + 'px';
      target.style.top  = origTop + 'px';
      document.addEventListener('touchmove',onMove,{passive:false});
      document.addEventListener('touchend',onUp,{passive:true});
      if(e.cancelable) e.preventDefault();
    }, {passive:false});
    // 提升拖拽体验
    try{ target.style.touchAction='none'; target.style.userSelect='none'; target.style.webkitUserSelect='none'; }catch{}
  }

  function injectStyles(){
    if(document.getElementById('ac-floating-style'))return;
    const style=document.createElement('style');
    style.id='ac-floating-style';
    style.textContent = `
      .ac-floating-btn{position:fixed;right:24px;bottom:24px;width:56px;height:56px;border-radius:50%;border:0;background:linear-gradient(135deg,#fb7185,#f472b6);box-shadow:0 18px 38px rgba(244,114,182,.45);color:#fff;font-size:24px;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:2147483647}
      .ac-floating-btn .ac-float-badge{position:absolute; right:-2px; top:-2px; min-width:18px; height:18px; padding:0 4px; border-radius:9px; background:#ef4444; color:#fff; font-size:12px; line-height:18px; text-align:center; box-shadow:0 0 0 2px #fff}
      .ac-floating-btn:active{transform:scale(.95)}

      .ac-chat-overlay{position:fixed;inset:0;z-index:2147483646;display:block}
      .ac-chat-overlay.hidden{display:none}
      .ac-chat-mask{position:absolute;inset:0;background:rgba(0,0,0,.25)}
      .ac-chat-panel{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:min(1100px,96vw);height:min(640px,88vh);background:#fff;border-radius:16px;box-shadow:0 24px 64px rgba(0,0,0,.2);display:flex;flex-direction:column;overflow:hidden}
      .ac-chat-header{height:48px;display:flex;align-items:center;justify-content:space-between;padding:0 12px 0 16px;background:linear-gradient(90deg,#fde7ef,#f8f5fb);border-bottom:1px solid #f1e1ea;cursor:move}
      .ac-chat-title{font-weight:600}
  .ac-chat-actions{display:flex;align-items:center;gap:8px}
  .ac-chat-actions select{height:28px;border:1px solid #e5e7eb;border-radius:8px;padding:0 8px;background:#fff;outline:0}
  .ac-chat-actions button{height:28px;padding:0 10px;border:0;border-radius:8px;background:#f3f4f6;cursor:pointer}
      .ac-chat-close{width:32px;height:32px;border:0;border-radius:8px;background:#fff;cursor:pointer}
      .ac-chat-body{flex:1;display:flex;min-height:0}
      .ac-chat-sidebar{width:260px;background:linear-gradient(180deg,#f6f7f9,#f2f6fb);border-right:1px solid #eef0f3;display:flex;flex-direction:column}
  .ac-chat-quick{width:240px;background:linear-gradient(180deg,#fff,#fdf2f8);border-left:1px solid #fce7f3;display:flex;flex-direction:column;padding:8px 10px;gap:8px}
  .ac-chat-quick .qr-tabs{display:flex;gap:8px;background:transparent}
  .ac-chat-quick .qr-tab{flex:1;height:32px;border:0;border-radius:10px;background:#f3f4f6;color:#374151;cursor:pointer;font-weight:600}
  .ac-chat-quick .qr-tab.active{background:linear-gradient(135deg,#fb7185,#f472b6);color:#fff}
  .ac-chat-quick .qr-pane{display:block}
  .ac-chat-quick .qr-pane[hidden]{display:none}
  .ac-chat-quick .qr-header{display:flex;align-items:center;justify-content:space-between}
  .ac-chat-quick .qr-title{font-size:14px;font-weight:600;color:#be185d}
  .ac-chat-quick .qr-add-btn{width:32px;height:32px;border:0;border-radius:10px;background:#f472b6;color:#fff;font-size:18px;cursor:pointer;line-height:32px;display:flex;align-items:center;justify-content:center}
  .ac-chat-quick .qr-editor{display:flex;flex-direction:column;gap:6px}
  .ac-chat-quick .qr-text{width:100%;min-height:80px;border:1px solid #f9a8d4;border-radius:10px;padding:8px 10px;font-size:13px;resize:vertical;background:#fff7fb;outline:0}
  .ac-chat-quick .qr-editor-actions{display:flex;gap:8px}
  .ac-chat-quick .qr-editor-actions button{flex:1;height:34px;border:0;border-radius:10px;cursor:pointer;font-weight:600}
  .ac-chat-quick .qr-save{background:linear-gradient(135deg,#fb7185,#f472b6);color:#fff}
  .ac-chat-quick .qr-cancel{background:#f3f4f6;color:#374151}
  .ac-chat-quick .qr-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px;overflow:auto}
  .ac-chat-quick .qr-item{background:#fff;border:1px solid #fce7f3;border-radius:10px;padding:8px 10px;display:flex;flex-direction:column;gap:6px;position:relative}
  .ac-chat-quick .qr-item-text{font-size:13px;line-height:1.5;white-space:pre-wrap;cursor:pointer}
  .ac-chat-quick .qr-item-text:hover{background:#fff0f6}
  .ac-chat-quick .qr-item-actions{display:flex;gap:8px}
  .ac-chat-quick .qr-item-actions button{flex:1;height:28px;border:0;border-radius:8px;background:#f3f4f6;color:#374151;font-size:12px;cursor:pointer}
  .ac-chat-quick .qr-item-actions .qr-edit{background:#fde68a;color:#92400e}
  .ac-chat-quick .qr-item-actions .qr-del{background:#fee2e2;color:#b91c1c}
  .ac-chat-quick .qr-empty{margin-top:12px;font-size:12px;color:#9ca3af;text-align:center}
  /* Auto reply */
  .ac-chat-quick .ar-wrap{margin-top:6px;padding-top:6px;border-top:1px dashed #f9a8d4;display:flex;flex-direction:column;gap:8px}
  .ac-chat-quick .ar-header{display:flex;align-items:center;justify-content:space-between}
  .ac-chat-quick .ar-title{font-size:13px;font-weight:600;color:#be185d}
  .ac-chat-quick .ar-switch{font-size:12px;color:#6b7280;display:flex;align-items:center;gap:6px}
  .ac-chat-quick .ar-rules{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px;max-height:220px;overflow:auto}
  .ac-chat-quick .ar-item{background:#fff;border:1px solid #fce7f3;border-radius:10px;padding:8px 10px;display:flex;flex-direction:column;gap:6px}
  .ac-chat-quick .ar-row{display:flex;align-items:center;gap:8px}
  .ac-chat-quick .ar-row label{width:80px;font-size:12px;color:#6b7280}
  .ac-chat-quick .ar-minute{width:72px;height:28px;border:1px solid #f9a8d4;border-radius:8px;padding:0 8px;background:#fff7fb;outline:0}
  .ac-chat-quick .ar-text{width:100%;min-height:60px;border:1px solid #f9a8d4;border-radius:10px;padding:8px 10px;font-size:13px;resize:vertical;background:#fff7fb;outline:0}
  .ac-chat-quick .ar-ops{justify-content:flex-end}
  .ac-chat-quick .ar-ops .ar-del{height:28px;border:0;border-radius:8px;background:#fee2e2;color:#b91c1c;font-size:12px;cursor:pointer;padding:0 10px}
  .ac-chat-quick .ar-actions{display:flex;gap:8px}
  .ac-chat-quick .ar-actions .ar-add{flex:1;height:32px;border:0;border-radius:10px;background:#f3f4f6;color:#374151;cursor:pointer}
  .ac-chat-quick .ar-actions .ar-save{flex:1;height:32px;border:0;border-radius:10px;background:linear-gradient(135deg,#fb7185,#f472b6);color:#fff;cursor:pointer}
  .ac-chat-quick .ar-tip{font-size:11px;color:#9ca3af}
  .ac-chat-quick .ar-toast{position:absolute;right:12px;bottom:12px;background:rgba(0,0,0,.8);color:#fff;padding:6px 10px;border-radius:8px;font-size:12px;box-shadow:0 4px 12px rgba(0,0,0,.2)}
    .ac-chat-search{padding:12px}
    .ac-chat-search input{width:100%;height:36px;border:1px solid #e5e7eb;border-radius:10px;padding:0 12px;outline:0}
    .ac-chat-sections{display:flex;flex-direction:column;gap:8px;overflow:auto}
    .ac-section .sec-title{font-size:12px;color:#9ca3af;padding:6px 12px}
  .ac-chat-conv{list-style:none;margin:0;padding:0 12px 12px;overflow:auto}
  .ac-chat-conv li{display:flex;align-items:center;gap:10px;padding:10px;border-radius:12px;position:relative;cursor:pointer}
      .ac-chat-conv li.active{background:#fff;box-shadow:0 1px 0 rgba(0,0,0,.02)}
  .ac-chat-conv .avatar{width:36px;height:36px;border-radius:50%;background:#eef2ff;display:flex;align-items:center;justify-content:center;font-size:14px;overflow:hidden}
  .ac-chat-conv .avatar img{width:100%;height:100%;object-fit:cover;display:block}
      .ac-chat-conv .meta{flex:1;min-width:0}
      .ac-chat-conv .meta .name{font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .ac-chat-conv .meta .desc{font-size:12px;color:#6b7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .ac-chat-conv .time{font-size:12px;color:#9ca3af}
  .ac-chat-conv .unread{position:absolute;right:10px;bottom:8px;min-width:16px;height:16px;padding:0 4px;border-radius:8px;background:#ef4444;color:#fff;font-size:11px;line-height:16px;text-align:center}
    .ac-chat-results{list-style:none;margin:0;padding:0 12px 12px;overflow:auto}
    .ac-chat-results li{display:flex;align-items:center;gap:10px;padding:10px;border-radius:12px;position:relative;cursor:pointer}
    .ac-chat-results li.suggest-active{background:#fff; box-shadow:0 0 0 2px #f472b6 inset}
    .ac-chat-results .avatar{width:36px;height:36px;border-radius:50%;background:#eef2ff;display:flex;align-items:center;justify-content:center;font-size:14px;overflow:hidden}
    .ac-chat-results .avatar img{width:100%;height:100%;object-fit:cover;display:block}
    .tag{display:inline-block;margin-right:6px;padding:0 8px;height:18px;line-height:18px;border-radius:9px;background:#f3f4f6;color:#6b7280;font-size:11px}
    .tag-level.level-none{background:#f3f4f6;color:#6b7280}
    .tag-level.level-purple{background:#ede9fe;color:#6d28d9}
    .tag-level.level-crown{background:#fef3c7;color:#b45309}
    .tag-gender.gender-male{background:#e0f2fe;color:#0369a1}
    .tag-gender.gender-female{background:#fde2e2;color:#be123c}
    .tag-gender.gender-other{background:#e5e7eb;color:#6b7280}
      .ac-chat-main{flex:1;display:flex;flex-direction:column;background:radial-gradient(1200px 480px at 70% 10%, rgba(244,114,182,.06), transparent 60%) #fff}
      .ac-chat-messages{flex:1;overflow:auto;padding:12px 16px}
      .ac-chat-empty{margin-top:24px;color:#9ca3af;text-align:center}
      .ac-chat-inputbar{display:flex;align-items:center;gap:12px;padding:12px;border-top:1px solid #f1f5f9;background:#fff}
      .ac-chat-input{flex:1;height:44px;border:1px solid #e5e7eb;border-radius:12px;padding:0 12px;outline:0;background:#f9fafb}
  .ac-chat-tools{display:flex;align-items:center;gap:10px;position:relative}
      .ac-chat-tools .tool{width:40px;height:40px;border:0;border-radius:12px;background:#f3f4f6;cursor:pointer}
      .ac-chat-tools .send{height:40px;padding:0 16px;border:0;border-radius:12px;background:linear-gradient(135deg,#fb7185,#f472b6);color:#fff;font-weight:600;cursor:pointer}
  .trans-wrap{position:relative}
  .trans-menu{position:absolute;right:0;bottom:48px;width:220px;padding:8px;border-radius:12px;background:#fff;box-shadow:0 8px 24px rgba(0,0,0,.15);z-index:20}
  .trans-menu .head{font-size:12px;color:#6b7280;padding:6px 8px}
  .trans-menu .list{display:flex;flex-wrap:wrap;gap:6px;padding:0 6px 6px}
  .trans-menu .item{display:inline-block;padding:6px 10px;border:0;border-radius:999px;background:#f3f4f6;color:#374151;cursor:pointer;font-size:13px}
  .trans-menu .divider{height:1px;background:#f3f4f6;margin:6px 4px}
  .emoji-wrap{position:relative}
  .emoji-wrap{position:relative}
  .emoji-panel{position:absolute;bottom:48px;left:0;width:260px;max-height:220px;overflow:auto;padding:8px;border-radius:12px;background:#fff;box-shadow:0 8px 24px rgba(0,0,0,.15);display:none;grid-template-columns:repeat(8,1fr);gap:6px;z-index:10;font-family:'Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol','Noto Color Emoji','EmojiOne Color','Twemoji Mozilla',sans-serif !important}
  .emoji-wrap.open .emoji-panel{display:grid !important}
  .emoji-panel .emo{width:28px;height:28px;border:0;background:#fff;cursor:pointer;font-size:22px;line-height:28px;display:flex;align-items:center;justify-content:center;font-family:'Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol','Noto Color Emoji','EmojiOne Color','Twemoji Mozilla',sans-serif !important}
  .msg .bubble .msg-img{max-width:280px;max-height:220px;border-radius:8px;display:block}
      .msg{display:flex;margin:8px 0}
  .msg-self{justify-content:flex-end}
  .msg-self .msg-avatar{order:2;margin-left:8px}
  .msg-self .bubble{order:1}
  .msg-other .msg-avatar{order:1;margin-right:8px}
  .msg-other .bubble{order:2}
  .msg-avatar{width:42px;height:42px;border-radius:50%;overflow:hidden;background:#eef2ff;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;box-shadow:0 0 0 1px #e5e7eb}
  .msg-avatar img{width:100%;height:100%;object-fit:cover;display:block}
  .msg .bubble{max-width:60%;padding:10px 14px;border-radius:20px;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.08);position:relative;line-height:1.5}
  .msg-self .bubble{background:linear-gradient(135deg,#fb7185,#f472b6);color:#fff}
  .msg .bubble .time{font-size:11px;color:#9ca3af;margin-top:6px}
  .msg-self .bubble .time{color:#ffe4f1}
  /* translate-btn 样式已移除 */
  .msg .bubble .translated{margin-top:8px;font-size:13px;color:#374151;background:#f9fafb;display:block;padding:8px 10px;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.08)}
  .msg-self .bubble .translated{background:rgba(255,255,255,.25);color:#fff}
  .msg .bubble .translated.loading{opacity:.7;font-style:italic}
  .msg .bubble .translated.failed{color:#dc2626}
  .lang-menu{position:absolute;right:0;bottom:calc(100% + 8px);width:220px;padding:8px 10px;border-radius:16px;background:#fff;box-shadow:0 12px 32px rgba(0,0,0,.18);z-index:30;display:flex;flex-direction:column;gap:4px;font-size:14px;pointer-events:auto;transition:opacity .15s ease,transform .15s ease;opacity:0;transform:translateY(4px)}
  .trans-wrap.open .lang-menu{opacity:1;transform:translateY(0)}
  .ac-chat-tools .tool.btn-trans{position:relative;z-index:40}
  .lang-menu .group-title{font-size:12px;color:#6b7280;padding:2px 4px;font-weight:500}
  .lang-menu .menu-item{position:relative;text-align:left;padding:8px 10px;border:0;border-radius:10px;background:#f9fafb;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:space-between}
  .lang-menu .menu-item.active{background:#fff0f6;box-shadow:0 0 0 1px #f472b6 inset;color:#be185d;font-weight:600}
  .lang-menu .menu-item.toggle input{margin-left:8px}
  .lang-menu .divider{height:1px;background:#f1f5f9;margin:4px 0}
  .lang-menu .tip{position:absolute;bottom:-6px;left:24px;width:12px;height:12px;background:#fff;transform:rotate(45deg);box-shadow:1px 1px 2px rgba(0,0,0,.05)}
    `;
    document.head.appendChild(style);
  }
  // -------- Polling for unread --------
  function startPolling(){ if(state.polling) return; state.polling = setInterval(()=>{ refreshRecents(); }, 15000); }
  function stopPolling(){ if(state.polling){ clearInterval(state.polling); state.polling = 0; } }

  // start polling on load
  try { startPolling(); refreshRecents(); } catch {}

  // helpers
  function escapeAttr(s){ return String(s||'').replace(/"/g,'&quot;'); }
})();
