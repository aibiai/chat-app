import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Message, User, ReviewRequest, GiftRecord, LikeRecord, VisitRecord, GiftCatalogItem, ConfessionPost } from './types';

const DATA_DIR = join(process.cwd(), 'data');
const USERS_FILE = join(DATA_DIR, 'users.json');
const MSGS_FILE = join(DATA_DIR, 'messages.json');
const REVIEWS_FILE = join(DATA_DIR, 'reviews.json');
const GIFTS_FILE = join(DATA_DIR, 'gifts.json'); // 送礼记录
const GIFTS_CATALOG_FILE = join(DATA_DIR, 'gifts_catalog.json'); // 礼物目录
const READS_FILE = join(DATA_DIR, 'reads.json');
const LIKES_FILE = join(DATA_DIR, 'likes.json');
const VISITS_FILE = join(DATA_DIR, 'visits.json');
const CONFESS_FILE = join(DATA_DIR, 'confession.json');
const SWEET_FILE = join(DATA_DIR, 'sweet_gallery.json'); // 甜蜜时刻图片清单

function ensureFiles() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(USERS_FILE)) writeFileSync(USERS_FILE, '[]');
  if (!existsSync(MSGS_FILE)) writeFileSync(MSGS_FILE, '[]');
  if (!existsSync(REVIEWS_FILE)) writeFileSync(REVIEWS_FILE, '[]');
  if (!existsSync(GIFTS_FILE)) writeFileSync(GIFTS_FILE, '[]');
  if (!existsSync(GIFTS_CATALOG_FILE)) writeFileSync(GIFTS_CATALOG_FILE, '[]');
  if (!existsSync(READS_FILE)) writeFileSync(READS_FILE, '[]');
  if (!existsSync(LIKES_FILE)) writeFileSync(LIKES_FILE, '[]');
  if (!existsSync(VISITS_FILE)) writeFileSync(VISITS_FILE, '[]');
  if (!existsSync(CONFESS_FILE)) writeFileSync(CONFESS_FILE, '[]');
  if (!existsSync(SWEET_FILE)) writeFileSync(SWEET_FILE, '[]');
}

ensureFiles();

export const db = {
  getUsers(): User[] {
    return JSON.parse(readFileSync(USERS_FILE, 'utf-8')) as User[];
  },
  getGiftCatalog(): GiftCatalogItem[] {
    return JSON.parse(readFileSync(GIFTS_CATALOG_FILE, 'utf-8')) as GiftCatalogItem[];
  },
  saveGiftCatalog(list: GiftCatalogItem[]) {
    writeFileSync(GIFTS_CATALOG_FILE, JSON.stringify(list, null, 2));
  },
  saveUsers(users: User[]) {
    writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  },
  getMessages(): Message[] {
    return JSON.parse(readFileSync(MSGS_FILE, 'utf-8')) as Message[];
  },
  saveMessages(msgs: Message[]) {
    writeFileSync(MSGS_FILE, JSON.stringify(msgs, null, 2));
  },
  getReviews(): ReviewRequest[] {
    return JSON.parse(readFileSync(REVIEWS_FILE, 'utf-8')) as ReviewRequest[];
  },
  saveReviews(list: ReviewRequest[]) {
    writeFileSync(REVIEWS_FILE, JSON.stringify(list, null, 2));
  },
  getGifts(): GiftRecord[] {
    return JSON.parse(readFileSync(GIFTS_FILE, 'utf-8')) as GiftRecord[];
  },
  saveGifts(list: GiftRecord[]) {
    writeFileSync(GIFTS_FILE, JSON.stringify(list, null, 2));
  },
  getReads(): { userId: string; peerId: string; lastReadAt: number }[] {
    return JSON.parse(readFileSync(READS_FILE, 'utf-8')) as { userId: string; peerId: string; lastReadAt: number }[];
  },
  saveReads(list: { userId: string; peerId: string; lastReadAt: number }[]) {
    writeFileSync(READS_FILE, JSON.stringify(list, null, 2));
  },
  getLikes(): LikeRecord[] {
    return JSON.parse(readFileSync(LIKES_FILE, 'utf-8')) as LikeRecord[];
  },
  saveLikes(list: LikeRecord[]) {
    writeFileSync(LIKES_FILE, JSON.stringify(list, null, 2));
  },
  getVisits(): VisitRecord[] {
    return JSON.parse(readFileSync(VISITS_FILE, 'utf-8')) as VisitRecord[];
  },
  saveVisits(list: VisitRecord[]) {
    writeFileSync(VISITS_FILE, JSON.stringify(list, null, 2));
  },
  getConfessions(): ConfessionPost[] {
    return JSON.parse(readFileSync(CONFESS_FILE, 'utf-8')) as ConfessionPost[];
  },
  saveConfessions(list: ConfessionPost[]) {
    writeFileSync(CONFESS_FILE, JSON.stringify(list, null, 2));
  },
  // Sweet gallery
  getSweetGallery(): string[] {
    return JSON.parse(readFileSync(SWEET_FILE, 'utf-8')) as string[];
  },
  saveSweetGallery(list: string[]) {
    writeFileSync(SWEET_FILE, JSON.stringify(list, null, 2));
  },
};
