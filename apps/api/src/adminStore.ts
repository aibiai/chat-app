import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import bcrypt from 'bcryptjs';

export interface AdminRecord {
  username: string;
  email: string;
  nickname: string;
  passwordHash: string;
  // 角色 ID 列表（以字符串形式存储，兼容旧的 signAdminToken 类型）
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RoleRecord {
  id: number;
  parentId: number;
  name: string;
  status: 'active' | 'hidden';
  permissions: string[]; // 例如 ['dashboard', 'auth', 'auth/admins']
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = join(process.cwd(), 'data', 'admin');
const ADMINS_FILE = join(DATA_DIR, 'admins.json');
const ROLES_FILE = join(DATA_DIR, 'roles.json');

function defaultRolesSeed(): RoleRecord[] {
  const now = new Date().toISOString();
  return [
    {
      id: 1,
      parentId: 0,
      name: '超级管理员组',
      status: 'active',
      permissions: [
        'dashboard',
        'general',
        'general/profile',
        'review',
        'review/attachments',
        'review/avatar-review',
        'review/identity-review',
        'review/confession-review',
        'auth',
        'auth/admins',
        'auth/admin-logs',
        'auth/roles',
        'auth/rules',
        'im',
        'im/push',
        'im/service-accounts',
        'members',
        'members/members',
        'members/customer-service',
        'members/member-upgrade',
        'gifts',
        'gifts/gift-categories',
        'gifts/gifts',
        'stickers',
        'orders',
        'orders/order-overview',
        'orders/recharge-records',
        'orders/coin-consumption',
        'orders/card-review',
        'frontend',
        'frontend/frontend-terms',
        'frontend/frontend-privacy',
        'frontend/frontend-security',
        'frontend/frontend-help',
        'frontend/frontend-contact',
        'frontend/frontend-user-config',
        'frontend/frontend-card-redeem',
        'frontend/frontend-confession-images',
        'frontend/frontend-chat-backgrounds'
      ],
      createdAt: now,
      updatedAt: now
    }
  ];
}

function ensureDataFiles() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(ADMINS_FILE)) {
    writeFileSync(ADMINS_FILE, JSON.stringify({ admins: [] }, null, 2), 'utf8');
  }
  if (!existsSync(ROLES_FILE)) {
    writeFileSync(ROLES_FILE, JSON.stringify({ roles: defaultRolesSeed() }, null, 2), 'utf8');
  }
}

function loadAdmins(): AdminRecord[] {
  ensureDataFiles();
  try {
    const raw = readFileSync(ADMINS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.admins)) return parsed.admins as AdminRecord[];
  } catch {}
  return [];
}

function saveAdmins(admins: AdminRecord[]) {
  ensureDataFiles();
  writeFileSync(ADMINS_FILE, JSON.stringify({ admins }, null, 2), 'utf8');
}

function loadRoles(): RoleRecord[] {
  ensureDataFiles();
  try {
    const raw = readFileSync(ROLES_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.roles)) return parsed.roles as RoleRecord[];
  } catch {}
  return [];
}

function saveRoles(roles: RoleRecord[]) {
  ensureDataFiles();
  writeFileSync(ROLES_FILE, JSON.stringify({ roles }, null, 2), 'utf8');
}

export function findAdminByUsername(username: string): AdminRecord | null {
  if (!username) return null;
  const admins = loadAdmins();
  return admins.find((a) => a.username.toLowerCase() === username.toLowerCase()) || null;
}

export function ensureDefaultAdmin() {
  const admins = loadAdmins();
  if (admins.some((a) => a.username === 'admin')) return;
  const now = new Date().toISOString();
  const passwordHash = bcrypt.hashSync('Azz16888', 10);
  // 默认加入超级管理员角色 ID = 1
  admins.push({
    username: 'admin',
    email: 'admin@gmail.com',
    nickname: 'admin',
    passwordHash,
    roles: ['1'],
    createdAt: now,
    updatedAt: now
  });
  saveAdmins(admins);
}

// 当 roles.json 存在但被清空或缺少超级管理员组时，自动恢复默认角色，避免无法访问后台
export function ensureDefaultRolesIntegrity() {
  const roles = loadRoles();
  const superRole = roles.find((r) => r.id === 1);
  if (!superRole || !Array.isArray(superRole.permissions) || superRole.permissions.length === 0) {
    saveRoles(defaultRolesSeed());
  }
}

// 确保默认管理员绑定到超级管理员组（ID=1），避免因误改造成无权限
export function ensureSuperAdminBinding() {
  const list = loadAdmins();
  const idx = list.findIndex((a) => a.username === 'admin');
  if (idx < 0) return;
  const admin = list[idx];
  if (!Array.isArray(admin.roles)) admin.roles = [];
  if (!admin.roles.includes('1')) {
    admin.roles = Array.from(new Set([...(admin.roles || []).map(String), '1']));
    admin.updatedAt = new Date().toISOString();
    saveAdmins(list);
  }
}

export function verifyAdminCredentials(input: { username: string; password: string }) {
  const { username, password } = input;
  const record = findAdminByUsername(username);
  if (!record) return null;
  const matched = bcrypt.compareSync(password, record.passwordHash);
  return matched ? record : null;
}

export function listAdmins(): AdminRecord[] {
  return loadAdmins();
}

export function listRoles(): RoleRecord[] {
  return loadRoles();
}

export function createRole(payload: { parentId?: number; name: string; status?: string; permissions?: string[] }) {
  const roles = loadRoles();
  const nextId = roles.length ? Math.max(...roles.map((r) => r.id)) + 1 : 1;
  const now = new Date().toISOString();
  const record: RoleRecord = {
    id: nextId,
    parentId: Number(payload.parentId || 0),
    name: String(payload.name || '').trim() || `角色${nextId}`,
    status: payload.status === 'hidden' ? 'hidden' : 'active',
    permissions: Array.isArray(payload.permissions) ? Array.from(new Set(payload.permissions.map(String))) : [],
    createdAt: now,
    updatedAt: now
  };
  roles.push(record);
  saveRoles(roles);
  return record;
}

export function updateRole(id: number, patch: Partial<Omit<RoleRecord, 'id' | 'createdAt'>>) {
  const roles = loadRoles();
  const idx = roles.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  const now = new Date().toISOString();
  const target = roles[idx];
  if (patch.name !== undefined) target.name = String(patch.name || '').trim() || target.name;
  if (patch.parentId !== undefined) target.parentId = Number(patch.parentId) || 0;
  if (patch.status !== undefined) target.status = patch.status === 'hidden' ? 'hidden' : 'active';
  if (patch.permissions !== undefined && Array.isArray(patch.permissions)) {
    target.permissions = Array.from(new Set(patch.permissions.map(String)));
  }
  target.updatedAt = now;
  saveRoles(roles);
  return target;
}

export function deleteRoles(ids: number[]) {
  const roles = loadRoles();
  const toDelete = new Set(ids.filter((n) => Number.isFinite(n) && n !== 1)); // 保护超级管理员组 ID=1
  const remained = roles.filter((r) => !toDelete.has(r.id));
  saveRoles(remained);
  return { deleted: roles.length - remained.length };
}

export function recoverDefaultRoles(): RoleRecord[] {
  const seed = defaultRolesSeed();
  saveRoles(seed);
  return seed;
}

export function createAdmin(payload: { username: string; email?: string; nickname?: string; password: string; roleIds?: number[] }) {
  const admins = loadAdmins();
  if (admins.find((a) => a.username.toLowerCase() === payload.username.toLowerCase())) {
    throw new Error('USERNAME_EXISTS');
  }
  const now = new Date().toISOString();
  const passwordHash = bcrypt.hashSync(payload.password, 10);
  const record: AdminRecord = {
    username: payload.username,
    email: payload.email || `${payload.username}@example.com`,
    nickname: payload.nickname || payload.username,
    passwordHash,
    roles: Array.isArray(payload.roleIds) ? payload.roleIds.map(String) : [],
    createdAt: now,
    updatedAt: now
  };
  admins.push(record);
  saveAdmins(admins);
  return record;
}

export function updateAdmin(username: string, patch: { email?: string; nickname?: string; password?: string; roleIds?: number[] }) {
  const admins = loadAdmins();
  const idx = admins.findIndex((a) => a.username === username);
  if (idx < 0) return null;
  const now = new Date().toISOString();
  const target = admins[idx];
  if (patch.email !== undefined) target.email = String(patch.email || '').trim() || target.email;
  if (patch.nickname !== undefined) target.nickname = String(patch.nickname || '').trim() || target.nickname;
  if (patch.password !== undefined && patch.password.trim()) target.passwordHash = bcrypt.hashSync(patch.password.trim(), 10);
  if (patch.roleIds) target.roles = patch.roleIds.map(String);
  target.updatedAt = now;
  saveAdmins(admins);
  return target;
}

export function collectAdminPermissions(admin: AdminRecord): string[] {
  const roles = loadRoles();
  const set = new Set<string>();
  for (const roleIdStr of admin.roles) {
    const rid = Number(roleIdStr);
    const role = roles.find((r) => r.id === rid);
    if (!role || role.status === 'hidden') continue;
    for (const p of role.permissions) set.add(p);
  }
  return Array.from(set);
}

// ------------------ 管理员日志与菜单规则简易存储 ------------------
interface AdminLogRecord { id: number; username: string; title: string; url: string; ip: string; browser: string; createdAt: string; }
interface AdminRuleRecord { id: number; title: string; icon: string; rule: string; permCount: number; status: 'active'|'hidden'; menu: boolean; }

const ADMIN_LOG_DIR = join(DATA_DIR, 'logs');
const ADMIN_RULE_FILE = join(DATA_DIR, 'admin_rules.json');

function ensureExtraFiles(){
  ensureDataFiles();
  if(!existsSync(ADMIN_LOG_DIR)) mkdirSync(ADMIN_LOG_DIR, { recursive: true });
  if(!existsSync(ADMIN_RULE_FILE)) writeFileSync(ADMIN_RULE_FILE, JSON.stringify({ rules: [] }, null, 2), 'utf8');
}

function dateKey(date: Date){
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,'0');
  const d = String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}
function logFilePathByDateStr(ymd: string){ return join(ADMIN_LOG_DIR, `admin_logs-${ymd}.json`); }
function readLogsByDateStr(ymd: string): AdminLogRecord[]{
  ensureExtraFiles();
  const file = logFilePathByDateStr(ymd);
  try { const raw = readFileSync(file,'utf8'); const parsed = JSON.parse(raw); if(Array.isArray(parsed?.logs)) return parsed.logs; } catch {}
  return [];
}
function saveLogsByDateStr(ymd: string, list: AdminLogRecord[]){ ensureExtraFiles(); writeFileSync(logFilePathByDateStr(ymd), JSON.stringify({ logs: list }, null, 2),'utf8'); }

function enumerateDateRange(start?: string, end?: string): string[]{
  let from: Date; let to: Date;
  if(start){ const s = new Date(start); from = new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate())); } else { const now=new Date(); from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()-29)); }
  if(end){ const e = new Date(end); to = new Date(Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate())); } else { const now=new Date(); to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())); }
  if (from > to) { const t = from; from = to; to = t; }
  const days: string[] = [];
  const cur = new Date(from);
  while(cur <= to){ days.push(dateKey(new Date(cur))); cur.setUTCDate(cur.getUTCDate()+1); }
  return days;
}

function loadAdminLogs(start?: string, end?: string): AdminLogRecord[]{
  const days = enumerateDateRange(start, end);
  const all: AdminLogRecord[] = [];
  for(const d of days){ const list = readLogsByDateStr(d); if(list.length) all.push(...list); }
  // 按时间倒序（最新在前）
  return all.sort((a,b)=> (a.createdAt > b.createdAt ? -1 : 1));
}

function loadAdminRules(): AdminRuleRecord[]{
  ensureExtraFiles();
  try { const raw = readFileSync(ADMIN_RULE_FILE,'utf8'); const parsed = JSON.parse(raw); if(Array.isArray(parsed?.rules)) return parsed.rules; } catch {}
  return [];
}
function saveAdminRules(list: AdminRuleRecord[]){ ensureExtraFiles(); writeFileSync(ADMIN_RULE_FILE, JSON.stringify({ rules: list }, null, 2),'utf8'); }

export function listAdminLogs(start?: string, end?: string){ return loadAdminLogs(start, end); }
export function appendAdminLog(entry: Omit<AdminLogRecord,'id'|'createdAt'>){
  const now = new Date();
  const ymd = dateKey(now);
  const todayList = readLogsByDateStr(ymd);
  const nextId = todayList.length? Math.max(...todayList.map(l=>l.id))+1 : 1;
  const record: AdminLogRecord = { id: nextId, createdAt: new Date(now.getTime() - now.getTimezoneOffset()*60000).toISOString().slice(0,19).replace('T',' '), ...entry };
  todayList.push(record); saveLogsByDateStr(ymd, todayList); return record;
}
export function deleteAdminLogs(_ids: number[]){ return { deleted: 0 }; }

export function listAdminRules(){ return loadAdminRules(); }
export function createAdminRule(payload: Omit<AdminRuleRecord,'id'|'permCount'> & { permCount?: number }){
  const list = loadAdminRules();
  const nextId = list.length? Math.max(...list.map(r=>r.id))+1 : 1;
  const record: AdminRuleRecord = { id: nextId, permCount: Number(payload.permCount)||0, title: payload.title, icon: payload.icon, rule: payload.rule, status: payload.status==='hidden'?'hidden':'active', menu: Boolean(payload.menu) };
  list.push(record); saveAdminRules(list); return record;
}
export function updateAdminRule(id: number, patch: Partial<AdminRuleRecord>){
  const list = loadAdminRules(); const idx = list.findIndex(r=>r.id===id); if(idx<0) return null; const target=list[idx];
  if(patch.title!==undefined) target.title = String(patch.title||'').trim() || target.title;
  if(patch.icon!==undefined) target.icon = String(patch.icon||'').trim() || target.icon;
  if(patch.rule!==undefined) target.rule = String(patch.rule||'').trim() || target.rule;
  if(patch.permCount!==undefined) target.permCount = Number(patch.permCount)||0;
  if(patch.status!==undefined) target.status = patch.status==='hidden'?'hidden':'active';
  if(patch.menu!==undefined) target.menu = Boolean(patch.menu);
  saveAdminRules(list); return target;
}
export function deleteAdminRules(ids: number[]){ const set = new Set(ids.filter(n=>Number.isFinite(n))); const list = loadAdminRules(); const remained = list.filter(r=>!set.has(r.id)); saveAdminRules(remained); return { deleted: list.length - remained.length }; }
