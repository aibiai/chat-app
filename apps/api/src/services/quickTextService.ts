import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export interface QuickTextConfig {
  userId: string;
  enabled: boolean; // 控制是否显示“快捷内容文本框”
  phrases: string[]; // 快捷短语列表
  updatedAt: number;
}

const DATA_DIR = join(process.cwd(), 'data');
const QUICK_FILE = join(DATA_DIR, 'quick_texts.json');

function ensureFile() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(QUICK_FILE)) writeFileSync(QUICK_FILE, '[]', 'utf-8');
}

function loadAll(): QuickTextConfig[] {
  ensureFile();
  try {
    return JSON.parse(readFileSync(QUICK_FILE, 'utf-8')) as QuickTextConfig[];
  } catch {
    return [];
  }
}

function persist(list: QuickTextConfig[]) {
  ensureFile();
  writeFileSync(QUICK_FILE, JSON.stringify(list, null, 2), 'utf-8');
}

export function getQuickByUser(userId: string): QuickTextConfig {
  const all = loadAll();
  const found = all.find((it) => it.userId === userId);
  if (found) return found;
  return { userId, enabled: false, phrases: [], updatedAt: Date.now() };
}

export function upsertQuickByUser(userId: string, patch: Partial<Omit<QuickTextConfig, 'userId' | 'updatedAt'>>): QuickTextConfig {
  const all = loadAll();
  const idx = all.findIndex((it) => it.userId === userId);
  const base = idx >= 0 ? all[idx] : { userId, enabled: false, phrases: [], updatedAt: Date.now() } as QuickTextConfig;
  const next: QuickTextConfig = {
    ...base,
    ...patch,
    // 保障字段合法
    enabled: typeof patch.enabled === 'boolean' ? patch.enabled : base.enabled,
    phrases: Array.isArray(patch.phrases) ? patch.phrases.filter((s) => typeof s === 'string').map((s) => s.trim()).filter(Boolean) : base.phrases,
    updatedAt: Date.now(),
  };
  if (idx >= 0) all[idx] = next; else all.push(next);
  persist(all);
  return next;
}
