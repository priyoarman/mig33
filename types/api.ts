import type { UserProfile } from "./user";

export type { UserProfile } from "./user";

export type Id = string;

export interface PostComment {
  _id: Id;
  user: Id | UserProfile;
  username: string;
  body: string;
  mentionUsernames?: string[];
  createdAt?: string;
}

export interface RepostInfo {
  byUserId: Id;
  byName: string;
  byUsername?: string;
}

export interface PostSummary {
  _id: Id;
  feedKey?: Id;
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
  mentionUsernames?: string[];
  repost?: RepostInfo | null;
  repostsCount?: number;
  repostedByMe?: boolean;
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
