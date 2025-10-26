import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

export interface JwtPayload {
  uid: string;
}

export function signToken(uid: string) {
  return jwt.sign({ uid } as JwtPayload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token?: string): JwtPayload | null {
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}
