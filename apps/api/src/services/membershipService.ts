import { nanoid } from 'nanoid';
import { db } from '../store';
import type { OrderRecord, User } from '../types';
import { appendOrder, generateOrderNo } from './orderService';
import { appendCoinConsumption } from './coinConsumptionService';
import { emitToAdmins } from '../socketHub';

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

function sanitizeUser(user: User): Record<string, unknown> {
  const { passwordHash, resetToken, resetExpires, ...rest } = (user as any) || {};
  return rest as Record<string, unknown>;
}

export interface MembershipUpgradeInput {
  payerId: string;
  tier: 'purple' | 'crown';
  months: number;
  amount: number;
  method: string;
  status?: OrderRecord['status'];
  note?: string;
  giftNickname?: string;
}

export interface MembershipUpgradeResult {
  order: OrderRecord;
  payer: Record<string, unknown>;
  target: Record<string, unknown>;
}

export function processMembershipUpgrade(input: MembershipUpgradeInput): MembershipUpgradeResult {
  const months = Math.max(1, Math.floor(Number(input.months) || 0));
  if (!Number.isFinite(months) || months <= 0) {
    const err = new Error('Invalid months');
    (err as any).code = 'INVALID_MONTHS';
    throw err;
  }

  if (input.tier !== 'purple' && input.tier !== 'crown') {
    const err = new Error('Invalid tier');
    (err as any).code = 'INVALID_TIER';
    throw err;
  }

  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    const err = new Error('Invalid amount');
    (err as any).code = 'INVALID_AMOUNT';
    throw err;
  }

  const users = db.getUsers();
  const payerIdx = users.findIndex((u) => u.id === input.payerId);
  if (payerIdx === -1) {
    const err = new Error('Payer not found');
    (err as any).code = 'USER_NOT_FOUND';
    throw err;
  }

  const payer = users[payerIdx];

  let targetIdx = payerIdx;
  let giftNickname: string | undefined;
  if (input.giftNickname) {
    const normalized = input.giftNickname.trim().toLowerCase();
    const foundIdx = users.findIndex((u) => (u.nickname || '').trim().toLowerCase() === normalized);
    if (foundIdx === -1) {
      const err = new Error('Target not found');
      (err as any).code = 'TARGET_NOT_FOUND';
      throw err;
    }
    targetIdx = foundIdx;
    giftNickname = users[targetIdx].nickname;
  }

  const status = input.status === 'failed' || input.status === 'pending' ? input.status : 'success';
  const note = input.note?.toString().trim() || undefined;

  const target = users[targetIdx];
  const now = Date.now();
  // 若为余额支付且订单为成功，先准备余额快照并校验是否足够
  let balanceBefore: number | undefined;
  let balanceAfter: number | undefined;
  if (input.method === 'balance' && status === 'success') {
    balanceBefore = Number((payer as any).balance || 0);
    if (balanceBefore < amount) {
      const err = new Error('Insufficient balance');
      (err as any).code = 'INSUFFICIENT_BALANCE';
      throw err;
    }
    balanceAfter = balanceBefore - amount;
  }
  if (status === 'success') {
    const base = Math.max(now, (target as any).membershipUntil || 0);
    (target as any).membershipLevel = input.tier;
    (target as any).membershipUntil = base + months * MONTH_MS;
    // 若使用余额，落地扣费
    if (balanceAfter != null) {
      (payer as any).balance = balanceAfter;
    }
    // 保存用户数据（会员更新 + 余额变动）
    db.saveUsers(users);
    try {
      const until = (target as any).membershipUntil as number | undefined;
      const levelNum = input.tier === 'crown' ? 2 : input.tier === 'purple' ? 1 : 0;
      const pad = (n: number) => String(n).padStart(2, '0');
      const format = (ts?: number) => {
        if (!ts || !Number.isFinite(ts)) return '—';
        const d = new Date(ts);
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      };
      const payload: any = {
        id: target.id,
        level: levelNum,
        crystalExpire: input.tier === 'purple' ? format(until) : '—',
        emperorExpire: input.tier === 'crown' ? format(until) : '—'
      };
      emitToAdmins('admin:member-updated', payload);
    } catch {}
  }

  const order: OrderRecord = {
    id: nanoid(),
    orderNo: generateOrderNo(now),
    userId: payer.id,
    email: payer.email,
    account: target.nickname || target.id,
    owner: payer.nickname || payer.id,
    amount,
    paidAmount: status === 'success' ? amount : 0,
    type: 'upgrade',
    method: input.method,
    status,
    note,
    createdAt: now,
    paidAt: status === 'success' ? now : undefined,
    metadata: {
      tier: input.tier,
      months,
      giftNickname: giftNickname || null,
      targetUserId: target.id,
      ...(input.method === 'balance' && status === 'success' && balanceBefore != null && balanceAfter != null
        ? { balanceBefore, balanceAfter }
        : {})
    }
  };

  appendOrder(order);

  // 余额支付成功，追加一条金币消费记录
  if (input.method === 'balance' && order.status === 'success') {
    try {
      const payerLabel = payer.nickname || payer.email || payer.id;
      const targetLabel = target.nickname || target.email || target.id;
      appendCoinConsumption({
        userId: payer.id,
        account: payerLabel,
        owner: payerLabel,
        target: targetLabel,
        item: input.tier === 'crown' ? 'VIP皇冠升级' : 'VIP紫晶升级',
        amount: amount,
        status: 'success',
        createdAt: now,
        metadata: {
          action: 'membership_upgrade',
          tier: input.tier,
          months,
          targetUserId: target.id,
          orderNo: order.orderNo
        }
      });
    } catch {}
  }

  return {
    order,
    payer: sanitizeUser(payer),
    target: sanitizeUser(target)
  };
}
