import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { AdminRecord } from './adminStore';

dotenv.config();

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'dev_admin_secret';

export interface AdminJwtPayload {
  username: string;
  roles: string[];
  nickname: string;
  email: string;
}

export function signAdminToken(admin: AdminRecord) {
  const payload: AdminJwtPayload = {
    username: admin.username,
    roles: admin.roles,
    nickname: admin.nickname,
    email: admin.email
  };
  return jwt.sign(payload, ADMIN_JWT_SECRET, { expiresIn: '2d' });
}

export function verifyAdminToken(token?: string): AdminJwtPayload | null {
  if (!token) return null;
  try {
    return jwt.verify(token, ADMIN_JWT_SECRET) as AdminJwtPayload;
  } catch {
    return null;
  }
}
