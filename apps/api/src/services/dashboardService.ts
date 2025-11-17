import { db } from '../store';

interface DashboardActivityItem {
  title: string;
  detail: string;
  meta: string;
}

interface DashboardTrendPoint {
  label: string;
  value: number;
}

export interface DashboardSummary {
  metrics: {
    members: number;
    messages: number;
    gifts: number;
    vip: number;
  };
  meta: {
    reviewPending: number;
    lastUpdated: string;
    pendingBreakdown: Record<string, number>;
  };
  quickStats: {
    todayRegister: number;
    todayLogin: number;
    threeIncrease: number;
    sevenIncrease: number;
    sevenActive: number;
    monthActive: number;
  };
  summary: {
    categories: number;
    datasets: number;
    datasetSize: string;
    attachments: number;
    attachmentsSize: string;
    images: number;
    imagesSize: string;
  };
  trend: DashboardTrendPoint[];
  activity: DashboardActivityItem[];
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  let idx = 0;
  let value = bytes;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${units[idx]}`;
}

function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
}

function formatDayLabel(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${month}-${day}`;
}

function readCreatedAt(entity: Record<string, unknown>): number | null {
  const value = Number((entity as any).createdAt);
  return Number.isFinite(value) ? value : null;
}

export function getDashboardSummary(): DashboardSummary {
  const users = db.getUsers();
  const messages = db.getMessages();
  const reviews = db.getReviews();
  const gifts = db.getGifts();
  const visits = db.getVisits();
  const likes = db.getLikes();
  const confessions = db.getConfessions();
  const sweetGallery = db.getSweetGallery();
  const giftCatalog = db.getGiftCatalog();
  const reads = db.getReads();

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTodayMs = startOfToday.getTime();

  const pendingReviews = reviews.filter((item) => item.status === 'pending');
  const pendingBreakdown = pendingReviews.reduce<Record<string, number>>((acc, item) => {
    acc[item.type] = (acc[item.type] ?? 0) + 1;
    return acc;
  }, {});

  const newUsersToday = users.filter((user) => {
    const createdAt = readCreatedAt(user as any);
    return createdAt != null && createdAt >= startOfTodayMs;
  }).length;

  const newUsersThreeDays = users.filter((user) => {
    const createdAt = readCreatedAt(user as any);
    return createdAt != null && createdAt >= now - 3 * dayMs;
  }).length;

  const newUsersSevenDays = users.filter((user) => {
    const createdAt = readCreatedAt(user as any);
    return createdAt != null && createdAt >= now - 7 * dayMs;
  }).length;

  const monthActiveUsers = new Set(
    messages
      .filter((msg) => typeof msg.createdAt === 'number' && msg.createdAt >= now - 30 * dayMs)
      .map((msg) => msg.fromUserId)
  );

  const messagesSevenDays = messages.filter(
    (msg) => typeof msg.createdAt === 'number' && msg.createdAt >= now - 7 * dayMs
  );

  const activeUsersSevenDays = new Set(messagesSevenDays.map((msg) => msg.fromUserId));

  const activeConversationPairs = new Set(
    messagesSevenDays.map((msg) => {
      const a = msg.fromUserId || 'unknown';
      const b = msg.toUserId || 'unknown';
      return [a, b].sort().join('::');
    })
  );

  const visitsToday = visits.filter(
    (visit) => typeof visit.createdAt === 'number' && visit.createdAt >= startOfTodayMs
  );

  const datasetSources = [
    users,
    messages,
    reviews,
    gifts,
    visits,
    likes,
    confessions,
    sweetGallery,
    giftCatalog,
    reads
  ];

  const approxDatasetSize = datasetSources.reduce((total, dataset) => {
    try {
      return total + Buffer.byteLength(JSON.stringify(dataset ?? []), 'utf-8');
    } catch {
      return total;
    }
  }, 0);

  const attachmentReviews = reviews.filter(
    (review) => review.type === 'avatar' || review.type === 'identity'
  );
  const estimatedAttachmentBytes = attachmentReviews.length * 512 * 1024;
  const totalImages = sweetGallery.length + confessions.length;
  const estimatedImagesBytes = totalImages * 256 * 1024;

  const trend: DashboardTrendPoint[] = Array.from({ length: 7 }).map((_, index) => {
    const dayStart = startOfTodayMs - (6 - index) * dayMs;
    const dayEnd = dayStart + dayMs;
    const count = messages.filter(
      (msg) => typeof msg.createdAt === 'number' && msg.createdAt >= dayStart && msg.createdAt < dayEnd
    ).length;
    return {
      label: formatDayLabel(new Date(dayStart)),
      value: count
    };
  });

  const activity: DashboardActivityItem[] = [];
  if (pendingReviews.length > 0) {
    const topType = Object.entries(pendingBreakdown).sort((a, b) => b[1] - a[1])[0];
    activity.push({
      title: '审核提醒',
      detail: `当前共有 ${pendingReviews.length} 条信息等待审核，建议优先处理 ${
        topType ? `${topType[1]} 条 ${topType[0] === 'avatar' ? '头像' : topType[0] === 'identity' ? '身份' : '内容'}` : '重点项目'
      }。`,
      meta: '审核 · 待处理'
    });
  } else {
    activity.push({
      title: '审核队列已清空',
      detail: '所有待审核项目均已处理，继续保持数据更新节奏。',
      meta: '审核 · 正常'
    });
  }

  if (activeConversationPairs.size > 0) {
    activity.push({
      title: '活跃会话',
      detail: `近 7 日共有 ${activeConversationPairs.size} 对会话保持活跃，可继续通过活动刺激互动。`,
      meta: '运营 · 互动'
    });
  }

  const confessionPending = pendingReviews.filter((item) => item.type === 'confession').length;
  if (confessionPending > 0) {
    activity.push({
      title: '表白墙待上线',
      detail: `表白墙仍有 ${confessionPending} 条投稿等待审核，建议择优发布维持内容热度。`,
      meta: '内容 · 待发布'
    });
  } else if (confessions.length > 0) {
    activity.push({
      title: '表白墙内容更新',
      detail: `近期共发布 ${confessions.length} 条表白，建议挑选优质内容进行首页推荐。`,
      meta: '内容 · 已发布'
    });
  }

  return {
    metrics: {
      members: users.length,
      messages: messages.length,
      gifts: gifts.length,
      vip: users.filter((user) => user.membershipLevel && user.membershipLevel !== 'none').length
    },
    meta: {
      reviewPending: pendingReviews.length,
      lastUpdated: formatTimestamp(new Date()),
      pendingBreakdown
    },
    quickStats: {
      todayRegister: newUsersToday,
      todayLogin: visitsToday.length,
      threeIncrease: newUsersThreeDays,
      sevenIncrease: newUsersSevenDays,
      sevenActive: activeUsersSevenDays.size,
      monthActive: monthActiveUsers.size
    },
    summary: {
      categories: new Set(reviews.map((review) => review.type)).size || giftCatalog.length,
      datasets: datasetSources.length,
      datasetSize: formatBytes(approxDatasetSize),
      attachments: attachmentReviews.length,
      attachmentsSize: formatBytes(estimatedAttachmentBytes),
      images: totalImages,
      imagesSize: formatBytes(estimatedImagesBytes)
    },
    trend,
    activity
  };
}
