import express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { verifyToken } from './auth';
import { registerRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { messagesRouter } from './routes/messages';
import { contentRouter } from './routes/content';
import { setupSocket } from './socket';
import { verifyAdminToken } from './adminAuth';
import { giftsRouter } from './routes/gifts';
import { likesRouter } from './routes/likes';
import { reviewRouter } from './routes/review';
import { visitsRouter } from './routes/visits';
import { confessionRouter } from './routes/confession';
import { cardsRouter } from './routes/cards';
import { ordersRouter } from './routes/orders';
import { ensureDefaultAdmin, ensureDefaultRolesIntegrity, ensureSuperAdminBinding } from './adminStore';
import { adminRouter } from './routes/admin';
import { initAutoReplyScheduler } from './services/autoReplyScheduler';

dotenv.config();

const app = express();

// Polyfill fetch for Node < 18 to avoid runtime 500 in routes using fetch
(async () => {
  try {
    // @ts-ignore
    if (typeof fetch !== 'function') {
      // dynamic import to keep compatibility when running under CommonJS
      const undici = await import('undici');
      const anyUndici = undici as any;
      (globalThis as any).fetch = anyUndici.fetch;
      (globalThis as any).Headers = anyUndici.Headers;
      (globalThis as any).Request = anyUndici.Request;
      (globalThis as any).Response = anyUndici.Response;
    }
  } catch {
    // ignore polyfill failures in environments that already provide fetch
  }
})();
app.use(cors());
// Increase body size limits to support base64 uploads for review endpoints (avatar/identity)
app.use(express.json({ limit: '16mb' }));
app.use(express.urlencoded({ extended: true, limit: '16mb' }));

// 初始化基础管理员与角色数据，并确保数据一致性
ensureDefaultAdmin();
ensureDefaultRolesIntegrity();
ensureSuperAdminBinding();

// 提供后端静态资源服务：/static 指向 data/static
const STATIC_DIR = join(process.cwd(), 'data', 'static');
if (!existsSync(STATIC_DIR)) mkdirSync(STATIC_DIR, { recursive: true });
app.use('/static', express.static(STATIC_DIR));

const ADMIN_UI_DIR = join(process.cwd(), 'public', 'admin');
if (!existsSync(ADMIN_UI_DIR)) mkdirSync(ADMIN_UI_DIR, { recursive: true });
// 挂载前端项目的默认头像目录（按性别区分的 PNG），避免跨端口访问失败
// 目录结构：apps/web/public/avatars/*.PNG
const WEB_AVATARS_DIR = join(process.cwd(), '..', 'web', 'public', 'avatars');
try {
  if (existsSync(WEB_AVATARS_DIR)) {
    app.use('/web-avatars', express.static(WEB_AVATARS_DIR, { index: false }));
  } else {
    console.warn('[static] web avatars directory not found:', WEB_AVATARS_DIR);
  }
} catch (e) {
  console.warn('[static] mount web avatars failed:', e);
}
// 提供后台静态资源服务：
// - /admin/static/* 映射到 ADMIN_UI_DIR（历史路径，主要供 perm-guard/styles 等使用）
// - /admin/* 也映射到 ADMIN_UI_DIR，用于加载各页面对应的 *.js 业务脚本（例如 /admin/admins.js）
app.use('/admin/static', express.static(ADMIN_UI_DIR, { index: false }));
app.use('/admin', express.static(ADMIN_UI_DIR, { index: false }));
app.get(['/admin', '/admin/login'], (_req: Request, res: Response) =>
  res.sendFile(join(ADMIN_UI_DIR, 'index.html'))
);
app.get('/admin/dashboard', (_req: Request, res: Response) =>
  res.sendFile(join(ADMIN_UI_DIR, 'dashboard.html'))
);
app.get('/admin/attachments', (_req: Request, res: Response) =>
  res.sendFile(join(ADMIN_UI_DIR, 'attachments.html'))
);
app.get('/admin/profile', (_req: Request, res: Response) =>
  res.sendFile(join(ADMIN_UI_DIR, 'profile.html'))
);
app.get('/admin/admins', (_req: Request, res: Response) =>
  res.sendFile(join(ADMIN_UI_DIR, 'admins.html'))
);
app.get('/admin/admin-logs', (_req: Request, res: Response) =>
  res.sendFile(join(ADMIN_UI_DIR, 'admin-logs.html'))
);
app.get('/admin/roles', (_req: Request, res: Response) =>
  res.sendFile(join(ADMIN_UI_DIR, 'admin-roles.html'))
);
app.get('/admin/rules', (_req: Request, res: Response) =>
  res.sendFile(join(ADMIN_UI_DIR, 'admin-rules.html'))
);
app.get('/admin/push', (_req: Request, res: Response) =>
  res.sendFile(join(ADMIN_UI_DIR, 'push.html'))
);
app.get('/admin/service-accounts', (_req: Request, res: Response) =>
  res.sendFile(join(ADMIN_UI_DIR, 'service-accounts.html'))
);
app.get('/admin/members', (_req: Request, res: Response) =>
  res.sendFile(join(ADMIN_UI_DIR, 'members.html'))
);
app.get('/admin/avatar-review', (_req: Request, res: Response) =>
  res.sendFile(join(ADMIN_UI_DIR, 'avatar-review.html'))
);
app.get('/admin/identity-review', (_req: Request, res: Response) =>
  res.sendFile(join(ADMIN_UI_DIR, 'identity-review.html'))
);
// 兼容别名：防止手误输入 /admin/identity-r 或 /admin/identity 导致 404
app.get(['/admin/identity-r', '/admin/identity'], (_req: Request, res: Response) =>
  res.sendFile(join(ADMIN_UI_DIR, 'identity-review.html'))
);
app.get('/admin/confession-review', (_req: Request, res: Response) =>
  res.sendFile(join(ADMIN_UI_DIR, 'confession-review.html'))
);
app.get('/admin/customer-service', (_req: Request, res: Response) =>
  res.sendFile(join(ADMIN_UI_DIR, 'customer-service.html'))
);
app.get('/admin/member-upgrade', (_req: Request, res: Response) =>
  res.sendFile(join(ADMIN_UI_DIR, 'member-upgrade.html'))
);
app.get('/admin/gift-categories', (_req: Request, res: Response) =>
  res.sendFile(join(ADMIN_UI_DIR, 'gift-categories.html'))
);
app.get('/admin/gifts', (_req: Request, res: Response) =>
  res.sendFile(join(ADMIN_UI_DIR, 'gifts.html'))
);
app.get('/admin/stickers', (_req: Request, res: Response) =>
  res.sendFile(join(ADMIN_UI_DIR, 'stickers.html'))
);
app.get('/admin/order-overview', (_req: Request, res: Response) =>
  res.sendFile(join(ADMIN_UI_DIR, 'order-overview.html'))
);
app.get('/admin/recharge-records', (_req: Request, res: Response) =>
  res.sendFile(join(ADMIN_UI_DIR, 'recharge-records.html'))
);
app.get('/admin/coin-consumption', (_req: Request, res: Response) =>
  res.sendFile(join(ADMIN_UI_DIR, 'coin-consumption.html'))
);
app.get('/admin/card-review', (_req: Request, res: Response) =>
  res.sendFile(join(ADMIN_UI_DIR, 'card-review.html'))
);
app.get('/admin/frontend-terms', (_req: Request, res: Response) =>
  res.sendFile(join(ADMIN_UI_DIR, 'frontend-terms.html'))
);
app.get('/admin/frontend-privacy', (_req: Request, res: Response) =>
  res.sendFile(join(ADMIN_UI_DIR, 'frontend-privacy.html'))
);
app.get('/admin/frontend-security', (_req: Request, res: Response) =>
  res.sendFile(join(ADMIN_UI_DIR, 'frontend-security.html'))
);
app.get('/admin/frontend-help', (_req: Request, res: Response) =>
  res.sendFile(join(ADMIN_UI_DIR, 'frontend-help.html'))
);
app.get('/admin/frontend-contact', (_req: Request, res: Response) =>
  res.sendFile(join(ADMIN_UI_DIR, 'frontend-contact.html'))
);
app.get('/admin/frontend-user-config', (_req: Request, res: Response) =>
  res.sendFile(join(ADMIN_UI_DIR, 'frontend-user-config.html'))
);
app.get('/admin/frontend-card-redeem', (_req: Request, res: Response) =>
  res.sendFile(join(ADMIN_UI_DIR, 'frontend-card-redeem.html'))
);
app.get('/admin/frontend-confession-images', (_req: Request, res: Response) =>
  res.sendFile(join(ADMIN_UI_DIR, 'frontend-confession-images.html'))
);
app.get('/admin/frontend-chat-backgrounds', (_req: Request, res: Response) =>
  res.sendFile(join(ADMIN_UI_DIR, 'frontend-chat-backgrounds.html'))
);

// 访问根路径时跳转到健康检查，避免用户困惑
app.get('/', (_req: Request, res: Response) => res.redirect('/health'));

app.get('/health', (_req: Request, res: Response) => res.json({ ok: true }));

app.use('/admin/api', adminRouter);

app.use('/api/auth', registerRouter);
app.use('/api/users', usersRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/content', contentRouter);
app.use('/api/review', reviewRouter);
app.use('/api/gifts', giftsRouter);
app.use('/api/likes', likesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/visits', visitsRouter);
app.use('/api/confession', confessionRouter);
app.use('/api/cards', cardsRouter);

const server = http.createServer(app);
// 输出底层错误，便于诊断端口未监听等问�?
server.on('error', (err) => {
  console.error('[server:error]', err);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.use((socket, next: (err?: Error) => void) => {
  const auth: any = socket.handshake.auth || {};
  const token = auth.token || socket.handshake.query?.token;
  const payload = typeof token === 'string' ? verifyToken(token) : null;
  // 优先支持普通用户 token；其次支持管理员 token（将 uid 固定为 'admin' 以兼容现有消息逻辑）
  if (!payload && typeof token === 'string') {
    const admin = verifyAdminToken(token);
    if (admin) {
      (socket as any).uid = 'admin';
      return next();
    }
  }
  // 支持游客模式：当客户端传�?guest=true 时放行，并赋予临�?uid
  const isGuest = auth.guest === true || auth.guest === 'true';
  if (payload) {
    (socket as any).uid = payload.uid;
    return next();
  }
  if (isGuest) {
    const guestId = typeof auth.guestId === 'string' && auth.guestId ? auth.guestId : socket.id;
    (socket as any).uid = `guest:${guestId}`;
    return next();
  }
  return next(new Error('Unauthorized'));
});

setupSocket(io);

// 默认使用 3004（与前端 Vite 代理配置保持一致）；如需自定义，请设置 API_PORT 或 PORT
// 注意：优先读取 PORT 兼容云平台，其次 API_PORT，最终回退 3004，避免端口漂移
const PORT = Number(process.env.PORT || process.env.API_PORT || 3004);
const HOST = process.env.HOST || '0.0.0.0';
server.listen(PORT, HOST as any, () => {
  console.log(`API listening on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  try { initAutoReplyScheduler(); } catch (e) { console.warn('[auto-reply] scheduler init failed:', e); }
});
