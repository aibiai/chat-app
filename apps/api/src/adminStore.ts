import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import bcrypt from 'bcryptjs';

export interface AdminRecord {
  username: string;
  email: string;
  nickname: string;
  passwordHash: string;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = join(process.cwd(), 'data', 'admin');
const DATA_FILE = join(DATA_DIR, 'admins.json');

function ensureDataFile() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!existsSync(DATA_FILE)) {
    writeFileSync(DATA_FILE, JSON.stringify({ admins: [] }, null, 2), 'utf8');
  }
}

function loadAll(): AdminRecord[] {
  ensureDataFile();
  try {
    const raw = readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.admins)) {
      return parsed.admins as AdminRecord[];
    }
  } catch {
    // fallthrough
  }
  return [];
}

function persist(admins: AdminRecord[]) {
  ensureDataFile();
  writeFileSync(DATA_FILE, JSON.stringify({ admins }, null, 2), 'utf8');
}

export function findAdminByUsername(username: string): AdminRecord | null {
  if (!username) return null;
  const admins = loadAll();
  return admins.find((a) => a.username.toLowerCase() === username.toLowerCase()) || null;
}

export function ensureDefaultAdmin() {
  const admins = loadAll();
  const hasDefault = admins.some((a) => a.username === 'admin');
  if (hasDefault) return;

  const now = new Date().toISOString();
  const passwordHash = bcrypt.hashSync('Azz16888', 10);
  admins.push({
    username: 'admin',
    email: 'admin@gmail.com',
    nickname: 'admin',
    passwordHash,
    roles: ['root'],
    createdAt: now,
    updatedAt: now
  });
  persist(admins);
}

export function verifyAdminCredentials(input: {
  username: string;
  email: string;
  nickname: string;
  password: string;
}) {
  const { username, email, nickname, password } = input;
  const record = findAdminByUsername(username);
  if (!record) return null;
  if (
    record.email.toLowerCase() !== (email || '').toLowerCase() ||
    record.nickname !== nickname
  ) {
    return null;
  }
  const matched = bcrypt.compareSync(password, record.passwordHash);
  return matched ? record : null;
}

export function listAdmins(): AdminRecord[] {
  return loadAll();
}
