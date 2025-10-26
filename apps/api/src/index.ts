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
import { giftsRouter } from './routes/gifts';
import { likesRouter } from './routes/likes';
import { reviewRouter } from './routes/review';
import { visitsRouter } from './routes/visits';
import { confessionRouter } from './routes/confession';
import { ensureDefaultAdmin } from './adminStore';
import { adminRouter } from './routes/admin';

dotenv.config();

const app = express();

// Polyfill fetch for Node < 18 to avoid runtime 500 in routes using fetch
try {
  // @ts-ignore
  if (typeof fetch !== 'function') {
    // dynamic require via import to keep ESM compatibility
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const undici = await import('undici');
    // @ts-ignore
    (globalThis as any).fetch = (undici as any).fetch;
    // @ts-ignore
    (globalThis as any).Headers = (undici as any).Headers;
    // @ts-ignore
    (globalThis as any).Request = (undici as any).Request;
    // @ts-ignore
    (globalThis as any).Response = (undici as any).Response;
  }
} catch {/* ignore */}
app.use(cors());
app.use(express.json());

ensureDefaultAdmin();

// 提供后端静态资源服务：/static 指向 data/static
const STATIC_DIR = join(process.cwd(), 'data', 'static');
if (!existsSync(STATIC_DIR)) mkdirSync(STATIC_DIR, { recursive: true });
app.use('/static', express.static(STATIC_DIR));

const ADMIN_UI_DIR = join(process.cwd(), 'public', 'admin');
if (!existsSync(ADMIN_UI_DIR)) mkdirSync(ADMIN_UI_DIR, { recursive: true });
app.use('/admin/static', express.static(ADMIN_UI_DIR, { index: false }));
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
app.get('/admin/customer-service', (_req: Request, res: Response) =>
  res.sendFile(join(ADMIN_UI_DIR, 'customer-service.html'))
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
app.use('/api/visits', visitsRouter);
app.use('/api/confession', confessionRouter);

const server = http.createServer(app);
// 输出底层错误，便于诊断端口未监听等问题
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
  // 支持游客模式：当客户端传入 guest=true 时放行，并赋予临时 uid
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

// 默认使用 3003 以与前端 Vite 开发环境一致；如需自定义，请设置 API_PORT
// 注意：不再读取通用 PORT，避免与其他工具或环境变量冲突导致端口漂移
const PORT = Number(process.env.API_PORT || 3003);
const HOST = process.env.HOST || '0.0.0.0';
server.listen(PORT, HOST as any, () => {
  console.log(`API listening on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
});
