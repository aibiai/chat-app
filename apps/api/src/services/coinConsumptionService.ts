import { nanoid } from 'nanoid';
import { db } from '../store';
import type { CoinConsumptionRecord } from '../types';
import { generateOrderNo } from './orderService';

export interface CoinConsumptionListOptions {
  keyword?: string;
  status?: CoinConsumptionRecord['status'] | 'all';
  page?: number;
  pageSize?: number;
  start?: number; // timestamp (ms) inclusive
  end?: number;   // timestamp (ms) inclusive
}

export interface CoinConsumptionListResult {
  items: CoinConsumptionRecord[];
  total: number;
  page: number;
  pageSize: number;
}

function normalizeStatus(status?: string): CoinConsumptionRecord['status'] {
  if (status === 'success' || status === 'failed' || status === 'pending') return status;
  return 'success';
}

export function appendCoinConsumption(
  partial: Omit<CoinConsumptionRecord, 'id' | 'orderNo'>
): CoinConsumptionRecord {
  const now = Date.now();
  const record: CoinConsumptionRecord = {
    id: nanoid(),
    orderNo: generateOrderNo(now),
    userId: partial.userId,
    account: partial.account,
    owner: partial.owner,
    target: partial.target || undefined,
    item: partial.item,
    amount: partial.amount,
    status: normalizeStatus(partial.status),
    note: partial.note ? String(partial.note).trim() || undefined : undefined,
    createdAt: partial.createdAt || now,
    metadata: partial.metadata
  };

  const list = db.getCoinConsumptions();
  list.unshift(record);
  db.saveCoinConsumptions(list);
  return record;
}

export function listCoinConsumptions(
  options: CoinConsumptionListOptions = {}
): CoinConsumptionListResult {
  const { keyword, status, page = 1, pageSize = 20, start: startTime, end: endTime } = options;
  const records = db.getCoinConsumptions();

  let filtered = records.slice();
  if (status && status !== 'all') {
    filtered = filtered.filter((record) => record.status === status);
  }
  if (Number.isFinite(startTime)) {
    filtered = filtered.filter((r) => r.createdAt >= Number(startTime));
  }
  if (Number.isFinite(endTime)) {
    filtered = filtered.filter((r) => r.createdAt <= Number(endTime));
  }

  const trimmed = keyword?.trim().toLowerCase();
  if (trimmed) {
    filtered = filtered.filter((record) => {
      const orderNo = record.orderNo?.toLowerCase() || '';
      const account = record.account?.toLowerCase() || '';
      const owner = record.owner?.toLowerCase() || '';
      const target = record.target?.toLowerCase() || '';
      return (
        orderNo.includes(trimmed) ||
        account.includes(trimmed) ||
        owner.includes(trimmed) ||
        target.includes(trimmed)
      );
    });
  }

  filtered.sort((a, b) => b.createdAt - a.createdAt);

  const size = Math.max(1, Math.min(200, Number(pageSize) || 20));
  const currentPage = Math.max(1, Number(page) || 1);
  const sliceStart = (currentPage - 1) * size;
  const items = filtered.slice(sliceStart, sliceStart + size);

  return {
    items,
    total: filtered.length,
    page: currentPage,
    pageSize: size
  };
}

export function deleteCoinConsumptions(ids: string[]): { deleted: string[]; notFound: string[] } {
  const uniqueIds = Array.from(
    new Set(
      (ids || [])
        .map((id) => (typeof id === 'string' ? id.trim() : String(id || '')).trim())
        .filter((id) => id.length > 0)
    )
  );

  if (!uniqueIds.length) return { deleted: [], notFound: [] };

  const idSet = new Set(uniqueIds);
  const records = db.getCoinConsumptions();
  const matched = records.filter((record) => idSet.has(record.id));
  if (!matched.length) return { deleted: [], notFound: uniqueIds };

  const remaining = records.filter((record) => !idSet.has(record.id));
  db.saveCoinConsumptions(remaining);

  const deletedIds = matched.map((record) => record.id);
  const deletedSet = new Set(deletedIds);
  const notFound = uniqueIds.filter((id) => !deletedSet.has(id));

  return { deleted: deletedIds, notFound };
}
