import { Request, Response, NextFunction } from 'express';
import { collectAdminPermissions, findAdminByUsername } from '../adminStore';

function getUsername(req: Request): string | null {
  const payload = (req as any).admin as { username?: string } | undefined;
  const uname = payload && typeof payload.username === 'string' ? payload.username.trim() : '';
  return uname || null;
}

export function requirePermission(key: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const username = getUsername(req);
    if (!username) return res.status(401).json({ error: 'UNAUTHORIZED' });
    const admin = findAdminByUsername(username);
    if (!admin) return res.status(401).json({ error: 'UNAUTHORIZED' });
    const perms = collectAdminPermissions(admin);
    if (!key || perms.includes(key) || (!key.includes('/') && perms.includes(key))) {
      return next();
    }
    return res.status(403).json({ error: 'FORBIDDEN', need: key });
  };
}

export function requireAnyPermission(keys: string[]) {
  const set = Array.isArray(keys) ? keys.filter(Boolean) : [];
  return (req: Request, res: Response, next: NextFunction) => {
    const username = getUsername(req);
    if (!username) return res.status(401).json({ error: 'UNAUTHORIZED' });
    const admin = findAdminByUsername(username);
    if (!admin) return res.status(401).json({ error: 'UNAUTHORIZED' });
    const perms = collectAdminPermissions(admin);
    if (set.length === 0) return next();
    const ok = set.some((k) => perms.includes(k) || (!k.includes('/') && perms.includes(k)));
    if (ok) return next();
    return res.status(403).json({ error: 'FORBIDDEN', needAnyOf: set });
  };
}
