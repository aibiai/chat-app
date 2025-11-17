import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../store';
import { User } from '../types';
import { nanoid } from 'nanoid';
import { signToken, verifyToken } from '../auth';

export const registerRouter = Router();
// 默认头像路径：性别区分 + 其他/未知兜底
const DEFAULT_AVATAR_FEMALE = '/web-avatars/IMG_0819.PNG';
const DEFAULT_AVATAR_MALE = '/web-avatars/IMG_0820.PNG';
const DEFAULT_AVATAR_OTHER = '/static/defaults/avatar-default.svg';

registerRouter.post('/register', (req, res) => {
  const { email, password, nickname, gender } = req.body as {
    email: string; password: string; nickname: string; gender: 'male'|'female'|'other'
  };
  if (!email || !password || !nickname || !gender) return res.status(400).json({ error: 'Missing fields' });
  const users = db.getUsers();
  if (users.find(u => u.email === email)) return res.status(409).json({ error: 'Email exists' });
  const passwordHash = bcrypt.hashSync(password, 10);
  const user: User = { id: nanoid(), email, passwordHash, nickname, gender };
  // 性别默认头像赋值：保证所有新用户都有 avatarUrl
  const avatarUrl = gender === 'male' ? DEFAULT_AVATAR_MALE : gender === 'female' ? DEFAULT_AVATAR_FEMALE : DEFAULT_AVATAR_OTHER;
  (user as any).avatarUrl = avatarUrl;
  users.push(user);
  db.saveUsers(users);
  const token = signToken(user.id);
  res.json({ token, user: { id: user.id, nickname: user.nickname, gender: user.gender } });
});

registerRouter.post('/login', (req, res) => {
  const { nickname, email, password } = req.body as { nickname?: string; email?: string; password: string };
  const users = db.getUsers();
  let user = nickname ? users.find(u => u.nickname === nickname) : undefined;
  if (!user && email) user = users.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  if (!bcrypt.compareSync(password, user.passwordHash)) return res.status(401).json({ error: 'Invalid credentials' });
  const token = signToken(user.id);
  res.json({ token, user: { id: user.id, nickname: user.nickname, gender: user.gender, email: user.email } });
});

// get current user profile
registerRouter.get('/me', (req, res) => {
  const auth = req.headers.authorization?.replace('Bearer ', '');
  const payload = verifyToken(auth);
  if (!payload) return res.status(401).json({ error: 'Unauthorized' });
  const users = db.getUsers();
  const user = users.find((u: User) => u.id === payload.uid);
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json({ id: user.id, nickname: user.nickname, gender: user.gender, email: user.email });
});

// request password reset (demo: return token directly)
registerRouter.post('/forgot', (req, res) => {
  const { email } = req.body as { email: string };
  if (!email) return res.status(400).json({ error: 'Missing email' });
  const users = db.getUsers();
  const user = users.find(u => u.email === email);
  if (!user) return res.status(200).json({ ok: true }); // do not disclose existence
  const token = nanoid();
  (user as any).resetToken = token;
  (user as any).resetExpires = Date.now() + 1000 * 60 * 15; // 15 minutes
  db.saveUsers(users);
  res.json({ ok: true, token });
});

// reset password
registerRouter.post('/reset', (req, res) => {
  const { token, password } = req.body as { token: string; password: string };
  if (!token || !password) return res.status(400).json({ error: 'Missing token or password' });
  const users = db.getUsers();
  const user = users.find(u => (u as any).resetToken === token && ((u as any).resetExpires || 0) > Date.now());
  if (!user) return res.status(400).json({ error: 'Invalid or expired token' });
  user.passwordHash = bcrypt.hashSync(password, 10);
  delete (user as any).resetToken;
  delete (user as any).resetExpires;
  db.saveUsers(users);
  res.json({ ok: true });
});

// change password (requires auth)
registerRouter.post('/change-password', (req, res) => {
  const auth = req.headers.authorization?.replace('Bearer ', '');
  const payload = verifyToken(auth);
  if (!payload) return res.status(401).json({ error: 'Unauthorized' });
  const { oldPassword, newPassword } = req.body as { oldPassword: string; newPassword: string };
  if (!oldPassword || !newPassword) return res.status(400).json({ error: 'Missing fields' });
  // 强密码策略：至少 8 位 + 必须包含字母与数字
  const meetsLength = typeof newPassword === 'string' && newPassword.length >= 8;
  const hasLetter = /[A-Za-z]/.test(newPassword || '');
  const hasDigit = /\d/.test(newPassword || '');
  if (!(meetsLength && hasLetter && hasDigit)) {
    return res.status(400).json({ error: '密码需至少 8 位，且包含字母与数字' });
  }
  const users = db.getUsers();
  const user = users.find(u => u.id === payload.uid);
  if (!user) return res.status(404).json({ error: 'Not found' });
  if (!bcrypt.compareSync(oldPassword, user.passwordHash)) return res.status(400).json({ error: 'Old password incorrect' });
  user.passwordHash = bcrypt.hashSync(newPassword, 10);
  db.saveUsers(users);
  return res.json({ ok: true });
});
