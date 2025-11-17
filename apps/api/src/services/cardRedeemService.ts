import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { nanoid } from 'nanoid';
import { db } from '../store';
import type { CardRedeemRecord, CardRedeemStatus } from '../types';

export interface CardRedeemListOptions {
  status?: CardRedeemStatus | 'all';
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface CardRedeemListResult {
  items: CardRedeemRecord[];
  total: number;
  page: number;
  pageSize: number;
}

const CARD_REDEEM_DIR = join(process.cwd(), 'data', 'static', 'card-redeem');
if (!existsSync(CARD_REDEEM_DIR)) mkdirSync(CARD_REDEEM_DIR, { recursive: true });

function normalizeStatus(status?: string): CardRedeemStatus {
  if (status === 'approved' || status === 'rejected') return status;
  return 'pending';
}

export function createCardRedeemRecord(input: {
  userId: string;
  username: string;
  email: string;
  gender?: string;
  balance: number;
  imageUrl: string; // 兼容字段
  images?: string[]; // 新增多图
  note?: string;
  uploadedAt?: number;
}): CardRedeemRecord {
  const list = db.getCardRedeems();
  const record: CardRedeemRecord = {
    id: nanoid(),
    userId: input.userId,
    username: input.username,
    email: input.email,
    gender: input.gender as any,
    balance: Number.isFinite(input.balance) ? Number(input.balance) : 0,
    imageUrl: input.imageUrl,
    images: Array.isArray(input.images) ? input.images.filter(Boolean).slice(0, 4) : undefined,
    uploadedAt: input.uploadedAt || Date.now(),
    status: 'pending',
    note: input.note
  };
  list.unshift(record);
  db.saveCardRedeems(list);
  return record;
}

export function listCardRedeems(options: CardRedeemListOptions = {}): CardRedeemListResult {
  const { status, keyword, page = 1, pageSize = 20 } = options;
  const list = db.getCardRedeems();

  let filtered = list.slice();
  if (status && status !== 'all') {
    filtered = filtered.filter((item) => item.status === status);
  }

  const trimmedKeyword = keyword?.trim().toLowerCase();
  if (trimmedKeyword) {
    filtered = filtered.filter((item) => {
      return (
        item.username.toLowerCase().includes(trimmedKeyword) ||
        (item.email || '').toLowerCase().includes(trimmedKeyword)
      );
    });
  }

  filtered.sort((a, b) => b.uploadedAt - a.uploadedAt);

  const size = Math.max(1, Math.min(200, Number(pageSize) || 20));
  const currentPage = Math.max(1, Number(page) || 1);
  const start = (currentPage - 1) * size;
  const items = filtered.slice(start, start + size);

  return {
    items,
    total: filtered.length,
    page: currentPage,
    pageSize: size
  };
}

export function updateCardRedeemStatus(
  id: string,
  status: CardRedeemStatus,
  reviewerId?: string,
  note?: string
): CardRedeemRecord | null {
  const list = db.getCardRedeems();
  const index = list.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const record = list[index];
  record.status = status;
  record.reviewedAt = Date.now();
  record.reviewerId = reviewerId;
  if (note !== undefined) record.note = note;

  db.saveCardRedeems(list);
  return record;
}

export function deleteCardRedeems(ids: string[]): { deleted: string[]; notFound: string[] } {
  const uniqueIds = Array.from(
    new Set(
      (ids || [])
        .map((id) => (typeof id === 'string' ? id.trim() : String(id || '')).trim())
        .filter((id) => id.length > 0)
    )
  );

  if (!uniqueIds.length) return { deleted: [], notFound: [] };

  const idSet = new Set(uniqueIds);
  const list = db.getCardRedeems();
  const matched = list.filter((item) => idSet.has(item.id));
  if (!matched.length) return { deleted: [], notFound: uniqueIds };

  const remaining = list.filter((item) => !idSet.has(item.id));
  db.saveCardRedeems(remaining);

  const deletedIds = matched.map((item) => item.id);
  const deletedSet = new Set(deletedIds);
  const notFound = uniqueIds.filter((id) => !deletedSet.has(id));

  return { deleted: deletedIds, notFound };
}

export function saveRedeemImage(payload: { dataUrl: string; name?: string }): string {
  const { dataUrl, name } = payload;
  const matches = /^data:(.+);base64,(.+)$/.exec(dataUrl);
  const buffer = Buffer.from(matches ? matches[2] : dataUrl, 'base64');
  const extensionFromMime =
    matches && matches[1] ? matches[1].split('/').pop() || 'png' : (name?.split('.').pop() || 'png');
  const ext = extensionFromMime.toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
  const filename = `${Date.now()}-${nanoid(8)}.${ext}`;
  writeFileSync(join(CARD_REDEEM_DIR, filename), buffer);
  return `/static/card-redeem/${filename}`;
}
