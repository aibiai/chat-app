import { db } from '../store';
import { nanoid } from 'nanoid';
import { appendAdminLog } from '../adminStore';
import { getAutoReplyConfig, listSentRecords, upsertSentRecord } from './autoReplyService';

const ADMIN_IDS = ['admin', 'support'];
const DEFAULT_ADMIN_SENDER = 'support';
const isAdminId = (id: string) => ADMIN_IDS.includes(String(id));

function now() { return Date.now(); }

function latestAdminMessageForPeer(peerId: string) {
  const all = db.getMessages();
  const csMsgs = all.filter(m => isAdminId(m.fromUserId) && m.toUserId === peerId);
  if (!csMsgs.length) return null;
  csMsgs.sort((a, b) => b.createdAt - a.createdAt);
  return csMsgs[0];
}

function existsUserReplyAfter(peerId: string, timestamp: number) {
  const all = db.getMessages();
  return all.some(m => !isAdminId(m.fromUserId) && m.fromUserId === peerId && isAdminId(m.toUserId) && Number(m.createdAt || 0) > Number(timestamp || 0));
}

function alreadySent(baseMsgId: string, minutes: number, peerId: string) {
  const list = listSentRecords();
  return list.some(r => r.baseMsgId === baseMsgId && r.minutes === minutes && r.peerId === peerId);
}

async function sendAutoReply(peerId: string, text: string, baseMsgId: string, minutes: number) {
  const msgs = db.getMessages();
  const msg = { id: nanoid(), fromUserId: DEFAULT_ADMIN_SENDER, toUserId: peerId, content: text, createdAt: now() };
  msgs.push(msg);
  db.saveMessages(msgs);
  try {
    appendAdminLog({ username: 'system', title: `自动回复:${peerId} @${minutes}min`, url: '/admin/api/auto-reply/dispatch', ip: '', browser: 'scheduler' });
  } catch {}
  upsertSentRecord({ peerId, baseMsgId, minutes, sentAt: msg.createdAt });
}

function scanOnce() {
  const cfg = getAutoReplyConfig();
  if (!cfg.enabled) return;
  const rules = (cfg.rules || []).filter(r => r && r.minutes > 0 && r.text && (r as any).enabled !== false);
  if (!rules.length) return;

  // 找出所有与客服发生过对话的用户ID（peer）
  const all = db.getMessages();
  const peers = new Set<string>();
  for (const m of all) {
    if (isAdminId(m.fromUserId)) peers.add(m.toUserId);
    if (isAdminId(m.toUserId)) peers.add(m.fromUserId);
  }
  const nowMs = now();
  for (const peerId of peers) {
    if (isAdminId(peerId)) continue; // 排除 admin/self
  const base = latestAdminMessageForPeer(peerId);
    if (!base) continue;
  // 如果用户在该客服消息之后已经回复，则不触发
  if (existsUserReplyAfter(peerId, base.createdAt)) continue;
    for (const r of rules) {
      const due = base.createdAt + r.minutes * 60_000;
      if (nowMs >= due && !alreadySent(base.id, r.minutes, peerId)) {
        sendAutoReply(peerId, r.text, base.id, r.minutes);
      }
    }
  }
}

let timer: any = 0;
export function initAutoReplyScheduler() {
  if (timer) return;
  // 首次延迟执行，避免进程启动瞬间压力
  setTimeout(scanOnce, 3000);
  timer = setInterval(scanOnce, 15_000);
}
