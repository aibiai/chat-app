import { Router, Request, Response } from 'express';
import { nanoid } from 'nanoid';
import { verifyToken } from '../auth';
import { db } from '../store';
import { appendOrder, generateOrderNo } from '../services/orderService';
import { processMembershipUpgrade } from '../services/membershipService';
import type { OrderRecord } from '../types';

export const ordersRouter = Router();

function authMiddleware(req: Request, res: Response, next: Function) {
  const header = String(req.headers.authorization || '').trim();
  const token = header.startsWith('Bearer ') ? header.slice(7) : header;
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'UNAUTHORIZED' });
  (req as any).uid = (payload as any).uid;
  next();
}

function normalizeStatus(raw: unknown, fallback: OrderRecord['status'] = 'success'): OrderRecord['status'] {
  const value = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (value === 'success' || value === 'failed' || value === 'pending') return value;
  return fallback;
}

function normalizeNote(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return trimmed ? trimmed : undefined;
}

ordersRouter.post('/recharge', authMiddleware, (req: Request, res: Response) => {
  const requestedStatus = normalizeStatus(req.body?.status, 'success');
  const note = normalizeNote(req.body?.note);
  const method = String(req.body?.method || 'online').trim() || 'online';
  const rawAmount = req.body?.amount ?? req.body?.value ?? req.body?.coins ?? req.body?.usd;
  const amount = Number(rawAmount);

  const users = db.getUsers();
  const idx = users.findIndex((u) => u.id === (req as any).uid);
  if (idx === -1) {
    return res.status(404).json({ error: 'USER_NOT_FOUND' });
  }

  const user = users[idx];
  const now = Date.now();
  const baseOrder: OrderRecord = {
    id: nanoid(),
    orderNo: generateOrderNo(now),
    userId: user.id,
    email: user.email,
    account: user.nickname || user.id,
    owner: user.nickname || user.id,
    amount: Number.isFinite(amount) ? amount : 0,
    paidAmount: 0,
    type: 'recharge' as const,
    method,
    status: requestedStatus,
    note,
    createdAt: now,
    metadata: {}
  };

  if (!Number.isFinite(amount) || amount <= 0) {
    const failedOrder = appendOrder({
      ...baseOrder,
      amount: Number.isFinite(amount) ? amount : 0,
      paidAmount: 0,
      status: 'failed',
      note: note || 'INVALID_AMOUNT',
      metadata: { reason: 'INVALID_AMOUNT' }
    });
    return res.status(400).json({ error: 'INVALID_AMOUNT', order: failedOrder });
  }

  let balanceAfter = Number((user as any).balance || 0);
  const metadata: Record<string, unknown> = {};
  let status: OrderRecord['status'] = requestedStatus;

  if (status === 'success') {
    const balanceBefore = balanceAfter;
    balanceAfter = balanceBefore + amount;
    (user as any).balance = balanceAfter;
    db.saveUsers(users);
    metadata.balanceBefore = balanceBefore;
    metadata.balanceAfter = balanceAfter;
  } else {
    metadata.balanceSnapshot = balanceAfter;
  }

  const order = appendOrder({
    ...baseOrder,
    amount,
    paidAmount: status === 'success' ? amount : 0,
    status,
    note,
    paidAt: status === 'success' ? now : undefined,
    metadata: Object.keys(metadata).length ? metadata : undefined
  });

  return res.json({
    ok: status === 'success',
    balance: balanceAfter,
    order
  });
});

ordersRouter.post('/upgrade', authMiddleware, (req: Request, res: Response) => {
  const tierRaw = String(req.body?.tier || '').toLowerCase();
  const tier = tierRaw === 'crown' ? 'crown' : tierRaw === 'purple' ? 'purple' : null;
  if (!tier) {
    return res.status(400).json({ error: 'INVALID_TIER' });
  }

  const requestedStatus = normalizeStatus(req.body?.status, 'success');
  const note = normalizeNote(req.body?.note);
  let monthsSource = req.body?.months ?? req.body?.duration;
  if (monthsSource == null && req.body?.days != null) {
    const days = Number(req.body.days);
    monthsSource = Number.isFinite(days) && days > 0 ? days / 30 : undefined;
  }
  const months = Number(monthsSource);
  const amount = Number(req.body?.amount ?? req.body?.usd);
  const method = String(req.body?.method || 'online').trim() || 'online';
  const giftNickname = typeof req.body?.giftNickname === 'string' ? req.body.giftNickname.trim() : '';

  try {
    const result = processMembershipUpgrade({
      payerId: (req as any).uid,
      tier,
      months,
      amount,
      method,
      status: requestedStatus,
      note,
      giftNickname: giftNickname || undefined
    });

    return res.json({
      ok: result.order.status === 'success',
      order: result.order,
      payer: result.payer,
      target: result.target
    });
  } catch (error) {
    const code = (error as any)?.code;
    const users = db.getUsers();
    const payer = users.find((u) => u.id === (req as any).uid);
    if (payer) {
      const now = Date.now();
      const failureOrder: OrderRecord = {
        id: nanoid(),
        orderNo: generateOrderNo(now),
        userId: payer.id,
        email: payer.email,
        account: giftNickname || payer.nickname || payer.id,
        owner: payer.nickname || payer.id,
        amount: Number.isFinite(amount) ? Math.max(0, amount) : 0,
        paidAmount: 0,
        type: 'upgrade',
        method,
        status: 'failed',
        note: note || code || 'UPGRADE_FAILED',
        createdAt: now,
        metadata: {
          errorCode: code || 'UNKNOWN',
          monthsRequested: Number.isFinite(months) ? months : null,
          giftNickname: giftNickname || null
        }
      };
      appendOrder(failureOrder);
    }

    if (code === 'USER_NOT_FOUND' || code === 'TARGET_NOT_FOUND') {
      return res.status(404).json({ error: code });
    }
    if (code === 'INVALID_MONTHS' || code === 'INVALID_TIER' || code === 'INVALID_AMOUNT' || code === 'INSUFFICIENT_BALANCE') {
      return res.status(400).json({ error: code });
    }
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});
