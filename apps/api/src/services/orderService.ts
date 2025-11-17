import { db } from '../store';
import type { OrderRecord, OrderType } from '../types';

export interface OrderListOptions {
  type?: OrderType | 'all';
  status?: OrderRecord['status'] | 'all';
  keyword?: string;
  page?: number;
  pageSize?: number;
  start?: number; // timestamp (ms) inclusive
  end?: number;   // timestamp (ms) inclusive
}

export interface OrderListResult {
  items: OrderRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export function generateOrderNo(timestamp = Date.now()): string {
  const date = new Date(timestamp);
  const parts = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
    String(date.getHours()).padStart(2, '0'),
    String(date.getMinutes()).padStart(2, '0'),
    String(date.getSeconds()).padStart(2, '0')
  ];
  const random = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, '0');
  return `${parts.join('')}${random}`;
}

function normalizeStatus(status?: string): OrderRecord['status'] {
  if (status === 'success' || status === 'failed' || status === 'pending') return status;
  return 'success';
}

export function appendOrder(record: OrderRecord): OrderRecord {
  const normalized: OrderRecord = {
    ...record,
    status: normalizeStatus(record.status),
    note: record.note?.toString().trim() || undefined
  };

  const list = db.getOrders();
  list.unshift(normalized);
  db.saveOrders(list);
  return normalized;
}

export function listOrders(options: OrderListOptions = {}): OrderListResult {
  const { type, status, keyword, page = 1, pageSize = 20, start: startTime, end: endTime } = options;
  const orders = db.getOrders();

  let filtered = orders.slice();
  if (type && type !== 'all') {
    filtered = filtered.filter((order) => order.type === type);
  }
  if (status && status !== 'all') {
    filtered = filtered.filter((order) => order.status === status);
  }
  if (Number.isFinite(startTime)) {
    filtered = filtered.filter(o => o.createdAt >= Number(startTime));
  }
  if (Number.isFinite(endTime)) {
    filtered = filtered.filter(o => o.createdAt <= Number(endTime));
  }

  const trimmedKeyword = keyword?.trim().toLowerCase();
  if (trimmedKeyword) {
    filtered = filtered.filter((order) => {
      return (
        order.orderNo.toLowerCase().includes(trimmedKeyword) ||
        order.email.toLowerCase().includes(trimmedKeyword) ||
        (order.account || '').toLowerCase().includes(trimmedKeyword) ||
        (order.owner || '').toLowerCase().includes(trimmedKeyword)
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

export function deleteOrders(ids: string[]): { deleted: string[]; notFound: string[] } {
  const uniqueIds = Array.from(
    new Set(
      (ids || [])
        .map((id) => (typeof id === 'string' ? id.trim() : String(id || '')).trim())
        .filter((id) => id.length > 0)
    )
  );

  if (!uniqueIds.length) return { deleted: [], notFound: [] };

  const idSet = new Set(uniqueIds);
  const orders = db.getOrders();
  const matched = orders.filter((order) => idSet.has(order.id));
  if (!matched.length) return { deleted: [], notFound: uniqueIds };

  const remaining = orders.filter((order) => !idSet.has(order.id));
  db.saveOrders(remaining);

  const deletedIds = matched.map((order) => order.id);
  const deletedSet = new Set(deletedIds);
  const notFound = uniqueIds.filter((id) => !deletedSet.has(id));

  return { deleted: deletedIds, notFound };
}
