import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync, copyFileSync } from 'fs';
import { join } from 'path';
import { Message, User, ReviewRequest, GiftRecord, LikeRecord, VisitRecord, GiftCatalogItem, ConfessionPost } from './types';

const DATA_DIR = join(process.cwd(), 'data');
const USERS_FILE = join(DATA_DIR, 'users.json');
const MSGS_FILE = join(DATA_DIR, 'messages.json');
const REVIEWS_FILE = join(DATA_DIR, 'reviews.json');
const ORDERS_FILE = join(DATA_DIR, 'orders.json');
const COINS_FILE = join(DATA_DIR, 'coin_consumption.json');
const GIFTS_FILE = join(DATA_DIR, 'gifts.json'); // 送礼记录
const GIFTS_CATALOG_FILE = join(DATA_DIR, 'gifts_catalog.json'); // 礼物目录
const READS_FILE = join(DATA_DIR, 'reads.json');
const LIKES_FILE = join(DATA_DIR, 'likes.json');
const VISITS_FILE = join(DATA_DIR, 'visits.json');
const CONFESS_FILE = join(DATA_DIR, 'confession.json');
const CARD_REDEEM_FILE = join(DATA_DIR, 'card_redeem.json');
const SWEET_FILE = join(DATA_DIR, 'sweet_gallery.json'); // 甜蜜时刻图片清单

function ensureFiles() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(USERS_FILE)) writeFileSync(USERS_FILE, '[]');
  if (!existsSync(MSGS_FILE)) writeFileSync(MSGS_FILE, '[]');
  if (!existsSync(REVIEWS_FILE)) writeFileSync(REVIEWS_FILE, '[]');
  if (!existsSync(ORDERS_FILE)) writeFileSync(ORDERS_FILE, '[]');
  if (!existsSync(COINS_FILE)) writeFileSync(COINS_FILE, '[]');
  if (!existsSync(GIFTS_FILE)) writeFileSync(GIFTS_FILE, '[]');
  if (!existsSync(GIFTS_CATALOG_FILE)) writeFileSync(GIFTS_CATALOG_FILE, '[]');
  if (!existsSync(READS_FILE)) writeFileSync(READS_FILE, '[]');
  if (!existsSync(LIKES_FILE)) writeFileSync(LIKES_FILE, '[]');
  if (!existsSync(VISITS_FILE)) writeFileSync(VISITS_FILE, '[]');
  if (!existsSync(CONFESS_FILE)) writeFileSync(CONFESS_FILE, '[]');
  if (!existsSync(CARD_REDEEM_FILE)) writeFileSync(CARD_REDEEM_FILE, '[]');
  if (!existsSync(SWEET_FILE)) writeFileSync(SWEET_FILE, '[]');
}

ensureFiles();

// 读写容错：当 JSON 文件损坏时，自动备份并重置为默认值，避免接口 500
function safeReadJson<T>(filePath: string, fallback: T): T {
  try {
    const raw = readFileSync(filePath, 'utf-8');
    try {
      return JSON.parse(raw) as T;
    } catch (e) {
      // 文件存在但 JSON 解析失败：备份并重置
      try {
        const bak = `${filePath}.${Date.now()}.bak`;
        try { renameSync(filePath, bak); }
        catch { try { copyFileSync(filePath, bak); } catch { /* ignore */ } }
      } catch { /* ignore */ }
      writeFileSync(filePath, typeof fallback === 'string' ? String(fallback) : JSON.stringify(fallback, null, 2));
      return fallback;
    }
  } catch {
    // 文件缺失（理论上 ensureFiles 已创建），兜底返回默认
    return fallback;
  }
}

export const db = {
  getUsers(): User[] {
    return safeReadJson<User[]>(USERS_FILE, []);
  },
  getGiftCatalog(): GiftCatalogItem[] {
    return safeReadJson<GiftCatalogItem[]>(GIFTS_CATALOG_FILE, []);
  },
  saveGiftCatalog(list: GiftCatalogItem[]) {
    writeFileSync(GIFTS_CATALOG_FILE, JSON.stringify(list, null, 2));
  },
  saveUsers(users: User[]) {
    writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  },
  getMessages(): Message[] {
    return safeReadJson<Message[]>(MSGS_FILE, []);
  },
  saveMessages(msgs: Message[]) {
    writeFileSync(MSGS_FILE, JSON.stringify(msgs, null, 2));
  },
  getReviews(): ReviewRequest[] {
    return safeReadJson<ReviewRequest[]>(REVIEWS_FILE, []);
  },
  saveReviews(list: ReviewRequest[]) {
    writeFileSync(REVIEWS_FILE, JSON.stringify(list, null, 2));
  },
  getOrders(): import('./types').OrderRecord[] {
    return safeReadJson<import('./types').OrderRecord[]>(ORDERS_FILE, []);
  },
  saveOrders(list: import('./types').OrderRecord[]) {
    writeFileSync(ORDERS_FILE, JSON.stringify(list, null, 2));
  },
  getCoinConsumptions(): import('./types').CoinConsumptionRecord[] {
    return safeReadJson<import('./types').CoinConsumptionRecord[]>(COINS_FILE, []);
  },
  saveCoinConsumptions(list: import('./types').CoinConsumptionRecord[]) {
    writeFileSync(COINS_FILE, JSON.stringify(list, null, 2));
  },
  getCardRedeems(): import('./types').CardRedeemRecord[] {
    return safeReadJson<import('./types').CardRedeemRecord[]>(CARD_REDEEM_FILE, []);
  },
  saveCardRedeems(list: import('./types').CardRedeemRecord[]) {
    writeFileSync(CARD_REDEEM_FILE, JSON.stringify(list, null, 2));
  },
  getGifts(): GiftRecord[] {
    return safeReadJson<GiftRecord[]>(GIFTS_FILE, []);
  },
  saveGifts(list: GiftRecord[]) {
    writeFileSync(GIFTS_FILE, JSON.stringify(list, null, 2));
  },
  getReads(): { userId: string; peerId: string; lastReadAt: number }[] {
    return safeReadJson<{ userId: string; peerId: string; lastReadAt: number }[]>(READS_FILE, []);
  },
  saveReads(list: { userId: string; peerId: string; lastReadAt: number }[]) {
    writeFileSync(READS_FILE, JSON.stringify(list, null, 2));
  },
  getLikes(): LikeRecord[] {
    return safeReadJson<LikeRecord[]>(LIKES_FILE, []);
  },
  saveLikes(list: LikeRecord[]) {
    writeFileSync(LIKES_FILE, JSON.stringify(list, null, 2));
  },
  getVisits(): VisitRecord[] {
    return safeReadJson<VisitRecord[]>(VISITS_FILE, []);
  },
  saveVisits(list: VisitRecord[]) {
    writeFileSync(VISITS_FILE, JSON.stringify(list, null, 2));
  },
  getConfessions(): ConfessionPost[] {
    return safeReadJson<ConfessionPost[]>(CONFESS_FILE, []);
  },
  saveConfessions(list: ConfessionPost[]) {
    writeFileSync(CONFESS_FILE, JSON.stringify(list, null, 2));
  },
  // Sweet gallery
  getSweetGallery(): string[] {
    return safeReadJson<string[]>(SWEET_FILE, []);
  },
  saveSweetGallery(list: string[]) {
    writeFileSync(SWEET_FILE, JSON.stringify(list, null, 2));
  },
};
