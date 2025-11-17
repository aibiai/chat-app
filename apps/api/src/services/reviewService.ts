import { db } from '../store';
import type {
  ReviewRequest,
  ReviewStatus,
  AvatarReviewRequest,
  ProfileReviewRequest,
  IdentityReviewRequest,
  ConfessionReviewRequest,
  User,
  ConfessionPost
} from '../types';
import { assignUserHeartImage } from './heartWallService';

export interface ReviewListOptions {
  type?: ReviewRequest['type'] | 'all';
  status?: ReviewStatus | 'all';
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminReviewItem {
  id: string;
  userId: string;
  type: ReviewRequest['type'];
  status: ReviewStatus;
  createdAt: number;
  reviewedAt?: number;
  reason?: string;
  payload: Record<string, unknown>;
  user?: {
    id: string;
    nickname: string;
    email: string;
    gender?: User['gender'];
    avatarUrl?: string;
    membershipLevel?: User['membershipLevel'];
  };
}

interface ReviewListResult {
  items: AdminReviewItem[];
  total: number;
  page: number;
  pageSize: number;
}

function mapReview(review: ReviewRequest, users: User[]): AdminReviewItem {
  const user = users.find((u) => u.id === review.userId);
  const base: AdminReviewItem = {
    id: review.id,
    userId: review.userId,
    type: review.type,
    status: review.status,
    createdAt: review.createdAt,
    reviewedAt: review.reviewedAt,
    reason: review.reason,
    payload: {},
    user: user
      ? {
          id: user.id,
          nickname: user.nickname,
          email: user.email,
          gender: user.gender,
          avatarUrl: user.avatarUrl,
          membershipLevel: user.membershipLevel
        }
      : undefined
  };

  if (review.type === 'avatar') {
    base.payload = { filePath: (review as AvatarReviewRequest).filePath };
  } else if (review.type === 'profile') {
    base.payload = { ...(review as ProfileReviewRequest).payload };
  } else if (review.type === 'identity') {
    const { idFrontPath, idBackPath, selfiePath, realName } = review as IdentityReviewRequest & {
      realName?: string;
    };
    base.payload = { idFrontPath, idBackPath, selfiePath, realName };
  } else if (review.type === 'confession') {
    const { img, text } = review as ConfessionReviewRequest;
    base.payload = { img, text };
  }

  return base;
}

export function listReviews(options: ReviewListOptions = {}): ReviewListResult {
  const { type, status, keyword, page = 1, pageSize = 20 } = options;
  const list = db.getReviews();
  const users = db.getUsers();

  let filtered = list.slice();
  if (type && type !== 'all') filtered = filtered.filter((item) => item.type === type);
  if (status && status !== 'all') filtered = filtered.filter((item) => item.status === status);
  if (keyword) {
    const lower = keyword.trim().toLowerCase();
    if (lower) {
      filtered = filtered.filter((item) => {
        const user = users.find((u) => u.id === item.userId);
        if (!user) return false;
        return (
          (user.nickname || '').toLowerCase().includes(lower) ||
          (user.email || '').toLowerCase().includes(lower) ||
          (item.id || '').toLowerCase().includes(lower)
        );
      });
    }
  }

  filtered.sort((a, b) => b.createdAt - a.createdAt);

  const total = filtered.length;
  const size = Math.max(1, Math.min(200, pageSize || 20));
  const currentPage = Math.max(1, page || 1);
  const start = (currentPage - 1) * size;
  const paged = filtered.slice(start, start + size);

  return {
    items: paged.map((item) => mapReview(item, users)),
    total,
    page: currentPage,
    pageSize: size
  };
}

export function approveReview(id: string): AdminReviewItem | null {
  const reviews = db.getReviews();
  const idx = reviews.findIndex((r) => r.id === id);
  if (idx === -1) return null;

  const review = reviews[idx];
  review.status = 'approved';
  review.reviewedAt = Date.now();

  const users = db.getUsers();
  const userIdx = users.findIndex((u) => u.id === review.userId);
  if (userIdx !== -1) {
    const user = users[userIdx];
    if (review.type === 'avatar') {
      (user as User).avatarUrl = (review as AvatarReviewRequest).filePath;
    } else if (review.type === 'profile') {
      const payload = (review as ProfileReviewRequest).payload || {};
      Object.assign(user as any, payload);
      if ((user as any).profileDraft) delete (user as any).profileDraft;
    } else if (review.type === 'identity') {
      (user as any).identityVerified = true;
      if ((review as IdentityReviewRequest & { realName?: string }).realName) {
        (user as any).realName = (review as IdentityReviewRequest & { realName?: string }).realName;
      }
    }
    db.saveUsers(users);
  }

  if (review.type === 'confession') {
    const confession = review as ConfessionReviewRequest;
    const posts = db.getConfessions();
    const exists = posts.some((p) => p.id === confession.id);
    if (!exists) {
      const post: ConfessionPost = {
        id: confession.id,
        userId: confession.userId,
        img: confession.img,
        text: confession.text,
        createdAt: confession.createdAt,
        approvedAt: Date.now()
      };
      posts.unshift(post);
      db.saveConfessions(posts);
      // 同步写入心形墙（与 /api/confession/:id/approve 保持一致）
      try { assignUserHeartImage(post.img); } catch {}
    }
  }

  db.saveReviews(reviews);
  const usersLatest = db.getUsers();
  return mapReview(review, usersLatest);
}

export function rejectReview(id: string, reason?: string): AdminReviewItem | null {
  const reviews = db.getReviews();
  const idx = reviews.findIndex((r) => r.id === id);
  if (idx === -1) return null;

  const review = reviews[idx];
  review.status = 'rejected';
  review.reviewedAt = Date.now();
  review.reason = reason || 'Rejected';

  db.saveReviews(reviews);
  const users = db.getUsers();
  return mapReview(review, users);
}

export function deleteReviews(ids: string[]): { deleted: string[]; notFound: string[] } {
  const uniqueIds = Array.from(
    new Set(
      (ids || [])
        .map((id) => (typeof id === 'string' ? id.trim() : String(id || '')).trim())
        .filter((id) => id.length > 0)
    )
  );
  if (!uniqueIds.length) {
    return { deleted: [], notFound: [] };
  }

  const idSet = new Set(uniqueIds);
  const reviews = db.getReviews();
  const toDelete = reviews.filter((review) => idSet.has(review.id));
  if (!toDelete.length) {
    return { deleted: [], notFound: uniqueIds };
  }

  const remaining = reviews.filter((review) => !idSet.has(review.id));
  db.saveReviews(remaining);

  const confessionIds = toDelete
    .filter((review) => review.type === 'confession')
    .map((review) => review.id);
  if (confessionIds.length) {
    const confessions = db.getConfessions();
    const filteredConfessions = confessions.filter((post) => !confessionIds.includes(post.id));
    if (filteredConfessions.length !== confessions.length) {
      db.saveConfessions(filteredConfessions);
    }
  }

  const deletedIds = toDelete.map((review) => review.id);
  const deletedSet = new Set(deletedIds);
  const notFound = uniqueIds.filter((id) => !deletedSet.has(id));

  return { deleted: deletedIds, notFound };
}
