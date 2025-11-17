import { createRouter, createWebHashHistory } from 'vue-router';
// 路由按需加载，显著降低首屏 JS 体积
const Home = () => import('../views/Home.vue');
const Login = () => import('../views/Login.vue');
const Register = () => import('../views/Register.vue');
const Chat = () => import('../views/Chat.vue');
const Forgot = () => import('../views/Forgot.vue');
const Reset = () => import('../views/Reset.vue');
const Onboarding = () => import('../views/Onboarding.vue');
const Info = () => import('../views/Info.vue');
const Avatar = () => import('../views/Avatar.vue');
const Settings = () => import('../views/Settings.vue');
const AdminContent = () => import('../views/AdminContent.vue');
const AdminGifts = () => import('../views/AdminGifts.vue');
const Profile = () => import('../views/Profile.vue');
const Gifts = () => import('../views/Gifts.vue');
const GiftBox = () => import('../views/GiftBox.vue');
const Confession = () => import('../views/Confession.vue');
const Lucky = () => import('../views/Lucky.vue');

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/_refresh', component: Home },
    { path: '/login', component: Login },
    { path: '/register', component: Register },
    { path: '/forgot', component: Forgot },
    { path: '/reset', component: Reset },
  { path: '/chat/:id', name: 'chat', component: Chat },
  { path: '/profile/:id', component: Profile },
    { path: '/gifts', component: Gifts },
    { path: '/gift-box', component: GiftBox },
    { path: '/lucky', component: Lucky },
  { path: '/confession', component: Confession },
    { path: '/onboarding', component: Onboarding },
    { path: '/avatar', component: Avatar },
  { path: '/settings', component: Settings },
  { path: '/admin/content', component: AdminContent },
  { path: '/admin/gifts', component: AdminGifts, meta: { adminOnly: true } },
    { path: '/about', component: Info },
    { path: '/terms', component: Info },
    { path: '/privacy', component: Info },
    { path: '/security', component: Info },
    { path: '/help', component: Info },
    { path: '/contact', component: Info },
    // Fallback: redirect any unknown path to About to avoid blank pages
    { path: '/:pathMatch(.*)*', redirect: '/about' },
  ],
});

function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  try {
    // 仅解析 JWT payload 判断过期时间，不做签名校验
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const base64url = parts[1];
    // base64url -> base64（替换字符并补齐 padding）
    let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    if (pad === 2) base64 += '==';
    else if (pad === 3) base64 += '=';
    else if (pad !== 0) return false;
    const json = typeof atob === 'function' ? atob(base64) : Buffer.from(base64, 'base64').toString('utf-8');
    const payload = JSON.parse(json);
    const expSec = Number(payload?.exp);
    if (!Number.isFinite(expSec)) return false;
    const nowSec = Math.floor(Date.now() / 1000);
    return expSec > nowSec;
  } catch {
    return false;
  }
}

router.beforeEach((to, _from, next) => {
  const rawToken = localStorage.getItem('token');
  const tokenOk = isTokenValid(rawToken);
  if (rawToken && !tokenOk) {
    // 清理失效 token，避免错误拦截注册/登录页面
    localStorage.removeItem('token');
    // 同步清除 uid，保持一致
    localStorage.removeItem('uid');
  }
  const open = ['/login', '/register', '/forgot', '/reset'];
  // 现需求：未登录不支持任何客服或私聊，包括 /chat/support
  const hasToken = tokenOk;
  if ((to.path.startsWith('/chat') || to.path.startsWith('/onboarding') || to.path.startsWith('/avatar') || to.path.startsWith('/settings') || to.path.startsWith('/admin')) && !hasToken) {
    next('/login');
  } else if (open.includes(to.path) && hasToken) {
    next('/');
  } else {
    // 管理员页面：极简判断（与后端一致），仅 email 以 admin@ 开头才可访问
    if (to.meta && (to.meta as any).adminOnly) {
      try {
        const uid = localStorage.getItem('uid');
        // 我们没有直接存 email 到本地；调用 /api/users/me 简单校验一次（同步导航）
        // 为避免阻塞，这里只做兜底：若本地有标记 adminEmail=1 则放行；否则尝试放行并依赖页面的接口 401 反馈
        const adminFlag = localStorage.getItem('adminEmail') === '1';
        if (!adminFlag) {
          // 轻量策略：继续，让页面内的接口鉴权来最终判断。如果要硬拦截，可在登录时设置 adminEmail 标志。
        }
      } catch {}
    }
    next();
  }
});

export default router;
