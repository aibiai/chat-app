export type Gender = 'male' | 'female' | 'other';

export interface UserPublic {
  id: string;
  nickname: string;
  gender: Gender;
}

export interface Message {
  id: string;
  fromUserId: string;
  toUserId: string;
  content: string;
  createdAt: number;
}
