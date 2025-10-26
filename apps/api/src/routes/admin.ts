import { Router } from 'express';
import { ensureDefaultAdmin, verifyAdminCredentials } from '../adminStore';
import { signAdminToken } from '../adminAuth';

export const adminRouter = Router();

adminRouter.post('/login', (req, res) => {
  ensureDefaultAdmin();
  const { username, email, nickname, password } = req.body || {};

  if (
    typeof username !== 'string' ||
    typeof email !== 'string' ||
    typeof nickname !== 'string' ||
    typeof password !== 'string'
  ) {
    return res.status(400).json({ error: 'INVALID_PAYLOAD' });
  }

  const record = verifyAdminCredentials({ username, email, nickname, password });
  if (!record) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  const token = signAdminToken(record);
  return res.json({
    token,
    admin: {
      username: record.username,
      email: record.email,
      nickname: record.nickname,
      roles: record.roles
    }
  });
});
