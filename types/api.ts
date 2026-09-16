import type { UserProfile } from "./user";

export type { UserProfile } from "./user";

export type Id = string;

export interface PostComment {
  _id: Id;
  user: Id | UserProfile;
  username: string;
  body: string;
  createdAt?: string;
}

export interface PostSummary {
  _id: Id;
  body?: string;
  images?: string[];
  authorId: Id;
  authorName: string;
  authorUsername?: string;
  authorImage?: string | null;
  likesCount: number;
  commentsCount: number;
  likedByMe?: boolean;
  comments?: PostComment[];
  createdAt?: string;
  updatedAt?: string;
}

export interface FeedPage {
  posts: PostSummary[];
  hasMore: boolean;
  nextCursor: string | null;
}

export interface ProfileStats {
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
}

export interface FollowResponse {
  following: boolean;
  followersCount?: number;
}
