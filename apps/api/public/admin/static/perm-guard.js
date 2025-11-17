(function(){
  // 简单的后台页面权限守卫与侧边栏过滤
  const token = localStorage.getItem('admin_token');
  const profile = (()=>{try{const raw=localStorage.getItem('admin_profile');return raw?JSON.parse(raw):null}catch{return null}})();
  let perms = (()=>{try{const raw=localStorage.getItem('admin_permissions');return raw?JSON.parse(raw):[]}catch{return []}})();

  // 未登录，跳转登录页
  if(!token){ if(!location.pathname.endsWith('/admin') && !location.pathname.endsWith('/admin/')) location.replace('/admin/login'); return; }

  // 若本地没有权限缓存，尝试从后端刷新
  if(token && (!perms || !perms.length)){
    fetch('/admin/api/profile', { headers: { Authorization: `Bearer ${token}` }}).then(r=>r.ok?r.json():null).then(data=>{
      if(data && data.admin && Array.isArray(data.admin.permissions)){
        perms = data.admin.permissions;
        try{ localStorage.setItem('admin_permissions', JSON.stringify(perms)); }catch{}
      }
      applyGuard();
    }).catch(()=>applyGuard());
    return;
  }

  applyGuard();

  function applyGuard(){
    // href -> 权限 key 映射
  const map = new Map([
    ['/admin/dashboard','dashboard'],
    ['/admin/profile','general/profile'],
    ['/admin/attachments','review/attachments'],
    ['/admin/avatar-review','review/avatar-review'],
    ['/admin/identity-review','review/identity-review'],
    ['/admin/confession-review','review/confession-review'],
    ['/admin/admins','auth/admins'],
    ['/admin/admin-logs','auth/admin-logs'],
    ['/admin/roles','auth/roles'],
    ['/admin/rules','auth/rules'],
    ['/admin/push','im/push'],
    ['/admin/service-accounts','im/service-accounts'],
    ['/admin/members','members/members'],
    ['/admin/customer-service','members/customer-service'],
    ['/admin/member-upgrade','members/member-upgrade'],
    ['/admin/gift-categories','gifts/gift-categories'],
    ['/admin/gifts','gifts/gifts'],
    ['/admin/stickers','stickers'],
    ['/admin/order-overview','orders/order-overview'],
    ['/admin/recharge-records','orders/recharge-records'],
    ['/admin/coin-consumption','orders/coin-consumption'],
    ['/admin/card-review','orders/card-review'],
    ['/admin/frontend-terms','frontend/frontend-terms'],
    ['/admin/frontend-privacy','frontend/frontend-privacy'],
    ['/admin/frontend-security','frontend/frontend-security'],
    ['/admin/frontend-help','frontend/frontend-help'],
    ['/admin/frontend-contact','frontend/frontend-contact'],
    ['/admin/frontend-user-config','frontend/frontend-user-config'],
    ['/admin/frontend-card-redeem','frontend/frontend-card-redeem'],
    ['/admin/frontend-confession-images','frontend/frontend-confession-images'],
    ['/admin/frontend-chat-backgrounds','frontend/frontend-chat-backgrounds'],
  ]);

  function hasPermission(key){
    if(!key) return true; // 未映射的自由链接直接放行
    if(perms.includes(key)) return true; // 精确命中
    // 不再允许父级自动放行所有子项，防止越权；只有当链接本身就是父级（无子路径）时判断父级权限。
    if(!key.includes('/')) return perms.includes(key);
    return false;
  }

  // 侧边栏过滤
  const nav = document.querySelector('.admin-nav');
  if(nav){
    // 在“前端管理”分组中注入“聊天页背景”菜单项（若不存在）
    try{
      const groups = Array.from(nav.querySelectorAll('details.nav-group'));
      const frontendGroup = groups.find(g=>{
        const title = g.querySelector('summary.nav-item span');
        return title && title.textContent && title.textContent.trim() === '前端管理';
      });
      if(frontendGroup){
        const sub = frontendGroup.querySelector('.nav-sub');
        const path = '/admin/frontend-chat-backgrounds';
        const exists = sub && sub.querySelector(`a.nav-sub-item[href="${path}"]`);
        if(sub && !exists){
          const a = document.createElement('a');
          a.className = 'nav-sub-item';
          a.href = path;
          a.textContent = '聊天页背景';
          // 当前页高亮
          if(location.pathname === path) a.classList.add('active');
          sub.appendChild(a);
        }
      }
    }catch{}

    const links = nav.querySelectorAll('a[href^="/admin/"]');
    links.forEach(a=>{
      const key = map.get(new URL(a.href, location.origin).pathname);
      const allow = hasPermission(key);
      if(!allow){
        a.style.display='none';
      }
    });
    // 折叠无任何子项可见的 details 组
    nav.querySelectorAll('details.nav-group').forEach(grp => {
      const anyVisible = Array.from(grp.querySelectorAll('a.nav-sub-item')).some(x=>x.style.display!=='none');
      if(!anyVisible) grp.style.display='none';
    });
  }

  // 页面访问守卫：若当前路径不在权限内，自动跳转到 dashboard
  const current = map.get(location.pathname);
  if(current && !hasPermission(current)){
    alert('您无权访问当前页面，已跳转到控制台。');
    location.replace('/admin/dashboard');
  }

  // 页面顶部头像/昵称兜底（如果页面自身未渲染）
  const nameEl = document.querySelector('#admin-name');
  const avatarEl = document.querySelector('#sidebar-avatar');
  if(profile){
    if(nameEl && !nameEl.textContent) nameEl.textContent = profile.nickname || profile.username || '管理员';
    if(avatarEl && !avatarEl.textContent) avatarEl.textContent = (profile.nickname || profile.username || 'A').slice(0,1).toUpperCase();
  }

  // 注入可拖拽的悬浮“聊天”按钮（仅当具备客服权限时）
  try{
    const hasCS = Array.isArray(perms) && perms.includes('members/customer-service');
    const injected = document.querySelector('script[data-chat-floating]');
    if(token && hasCS && !injected){
      const s = document.createElement('script');
      s.type = 'text/javascript';
      // 注意：/admin/static 被挂载到 ADMIN_UI_DIR 根目录
      // 需要使用 /admin/static/static 才能访问 /public/admin/static 下的脚本
  s.src = '/admin/static/static/chat-floating.js?v=20251116-17';
      s.setAttribute('data-chat-floating','1');
      document.head.appendChild(s);
    } else if (!hasCS) {
      // 无权限时，若页面存在按钮则移除（双保险）
      const btn = document.getElementById('ac-floating-btn');
      if(btn) btn.remove();
    }
  }catch{}
  }
})();
