export interface UserPublic {
  id: string;
  nickname: string;
  gender: 'male' | 'female' | 'other';
}

export interface User extends UserPublic {
  email: string;
  passwordHash: string;
  resetToken?: string;
  resetExpires?: number;
  // social metrics
  popularity?: number; // 人气值，默认 0
  // wallet
  balance?: number; // 账户余额（金币），默认 0
  // membership
  membershipLevel?: 'purple' | 'crown' | 'none'; // 会员等级（紫晶/皇冠/无）
  membershipUntil?: number; // 到期时间戳（ms）
  // profile fields (optional for onboarding)
  birthday?: string; // ISO date string
  region?: string;
  bio?: string;
  interests?: string[];
  avatarUrl?: string;
  height?: number; // cm
  weight?: number; // kg
  weightRange?: [number, number]; // kg range
  zodiac?: string; // e.g., aries, taurus
  education?: string; // e.g., bachelor, master
  maritalStatus?: 'single' | 'married';
  realName?: string; // for identity verification
  identityVerified?: boolean;
  // settings
  privateProfile?: boolean; // 开启后他人无法查看相册和个人资料
  // a transient draft of profile edits awaiting review; used for immediate UX reflection
  profileDraft?: Partial<Pick<User, 'height' | 'weight' | 'weightRange' | 'nickname' | 'birthday' | 'zodiac' | 'education' | 'maritalStatus'>>;
}

export interface Message {
  id: string;
  fromUserId: string;
  toUserId: string; // peer user id
  content: string;
  createdAt: number;
}

// Gifts
export interface GiftCatalogItem {
  id: string;
  name: string;
  price: number; // currency units or coins for demo
  img: string; // image/emoji url
}

export interface GiftRecord {
  id: string;
  fromUserId: string;
  toUserId: string;
  giftId: string;
  giftName: string;
  giftImg: string;
  price: number;
  createdAt: number;
}

// Likes
export interface LikeRecord {
  id: string;
  fromUserId: string; // who liked
  toUserId: string;   // who is liked
  createdAt: number;
}

// Visits
export interface VisitRecord {
  id: string;
  fromUserId: string; // 访问者
  toUserId: string;   // 被访问的用户
  createdAt: number;
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected'

export interface ReviewRequestBase {
  id: string;
  userId: string;
  type: 'avatar' | 'profile' | 'identity' | 'confession';
  status: ReviewStatus;
  createdAt: number;
  reviewedAt?: number;
  reason?: string; // for rejection
}

export interface AvatarReviewRequest extends ReviewRequestBase {
  type: 'avatar';
  filePath: string;
}

export interface ProfileReviewRequest extends ReviewRequestBase {
  type: 'profile';
  payload: Partial<Pick<User, 'height' | 'weight' | 'nickname' | 'birthday' | 'zodiac' | 'education' | 'maritalStatus'>> & {
    weightRange?: [number, number];
  };
}

export interface IdentityReviewRequest extends ReviewRequestBase {
  type: 'identity';
  idFrontPath: string;
  idBackPath: string;
  selfiePath: string;
}

// Confession (表白墙)
export interface ConfessionReviewRequest extends ReviewRequestBase {
  type: 'confession';
  img: string;   // 已上传到 /static/confess/... 的相对 URL
  text: string;  // 爱情宣言文本
}

export type ReviewRequest = AvatarReviewRequest | ProfileReviewRequest | IdentityReviewRequest | ConfessionReviewRequest;

export interface ConfessionPost {
  id: string;
  userId: string;
  img: string;
  text: string;
  createdAt: number;
  approvedAt?: number;
}
