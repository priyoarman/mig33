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

// The flattened shape actually returned by getPostWithComments() and the
// /api/posts/[id]/comments endpoints (distinct from PostComment above,
// which models the raw embedded-document shape).
export interface CommentListItem {
  id: Id;
  userId?: string | null;
  name: string;
  username: string;
  email?: string;
  profileImage?: string | null;
  body: string;
  mentionUsernames?: string[];
  createdAt: string;
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
  joinedAt?: Date | string | null;
}

export interface FollowResponse {
  following: boolean;
  followersCount?: number;
}

// The shape returned by /api/search/users, as consumed by full search
// result listings (ExplorePage, the /search page) — distinct from the
// smaller pick SearchBar's dropdown needs.
export type SearchUserResult = Pick<
  UserProfile,
  "_id" | "username" | "name" | "profileImage" | "bio"
> & {
  followers?: unknown[];
};
