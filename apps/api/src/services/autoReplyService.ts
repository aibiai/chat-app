import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export interface AutoReplyRule {
  minutes: number; // 触发延时（分钟）
  text: string;    // 自动发送内容
  enabled?: boolean; // 单条规则开关（默认启用）
}

export interface AutoReplyConfig {
  enabled: boolean;
  rules: AutoReplyRule[];
  updatedAt: number;
}

export interface SentRecord {
  peerId: string;
  baseMsgId: string; // 基准的用户消息ID
  minutes: number;   // 触发规则分钟数（幂等键的一部分）
  sentAt: number;
}

const DATA_DIR = join(process.cwd(), 'data');
const CONFIG_FILE = join(DATA_DIR, 'auto_reply_config.json');
const SENT_FILE = join(DATA_DIR, 'auto_reply_sent.json');

function ensureFiles() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(CONFIG_FILE)) writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig(), null, 2), 'utf-8');
  if (!existsSync(SENT_FILE)) writeFileSync(SENT_FILE, '[]', 'utf-8');
}

function defaultConfig(): AutoReplyConfig {
  return {
    enabled: false,
    rules: [
      { minutes: 5, text: '先生您好，当前会员咨询人数较多，请耐心等待', enabled: true },
      { minutes: 20, text: '先生您好，当前人工客服正忙，请您留言您咨询问题，人工客服会第一时间回复您，请知悉', enabled: true },
    ],
    updatedAt: Date.now(),
  };
}

export function getAutoReplyConfig(): AutoReplyConfig {
  ensureFiles();
  try {
    const raw = readFileSync(CONFIG_FILE, 'utf-8');
    const json = JSON.parse(raw) as AutoReplyConfig;
    // 基本兜底与校验
    const enabled = !!json.enabled;
    const rules = Array.isArray(json.rules)
      ? json.rules
          .map((r) => ({ minutes: Math.max(1, Math.floor(Number((r as any).minutes || 0))), text: String((r as any).text || '').trim(), enabled: (r as any).enabled !== false }))
          .filter((r) => r.text)
          .sort((a, b) => a.minutes - b.minutes)
      : [];
    return { enabled, rules, updatedAt: Number(json.updatedAt || Date.now()) };
  } catch {
    return defaultConfig();
  }
}

export function saveAutoReplyConfig(patch: Partial<Pick<AutoReplyConfig, 'enabled' | 'rules'>>): AutoReplyConfig {
  const prev = getAutoReplyConfig();
  const enabled = typeof patch.enabled === 'boolean' ? patch.enabled : prev.enabled;
  const rules = Array.isArray(patch.rules)
    ? patch.rules
        .map((r) => ({ minutes: Math.max(1, Math.floor(Number((r as any).minutes || 0))), text: String((r as any).text || '').trim(), enabled: (r as any).enabled !== false }))
        .filter((r) => r.text)
        .sort((a, b) => a.minutes - b.minutes)
    : prev.rules;
  const next: AutoReplyConfig = { enabled, rules, updatedAt: Date.now() };
  ensureFiles();
  writeFileSync(CONFIG_FILE, JSON.stringify(next, null, 2), 'utf-8');
  return next;
}

export function listSentRecords(): SentRecord[] {
  ensureFiles();
  try {
    const raw = readFileSync(SENT_FILE, 'utf-8');
    const arr = JSON.parse(raw);
    return Array.isArray(arr)
      ? arr
          .map((it) => ({
            peerId: String((it || {}).peerId || ''),
            baseMsgId: String((it || {}).baseMsgId || ''),
            minutes: Math.max(1, Math.floor(Number((it || {}).minutes || 0))),
            sentAt: Number((it || {}).sentAt || 0),
          }))
          .filter((r) => r.peerId && r.baseMsgId && r.minutes > 0 && r.sentAt > 0)
      : [];
  } catch {
    return [];
  }
}

export function upsertSentRecord(rec: SentRecord) {
  const list = listSentRecords();
  const idx = list.findIndex((r) => r.peerId === rec.peerId && r.baseMsgId === rec.baseMsgId && r.minutes === rec.minutes);
  if (idx >= 0) list[idx] = rec; else list.push(rec);
  // 可选清理：只保留最近 10 万条，避免无限增长
  const max = 100000;
  const trimmed = list.length > max ? list.slice(list.length - max) : list;
  ensureFiles();
  writeFileSync(SENT_FILE, JSON.stringify(trimmed, null, 2), 'utf-8');
}
