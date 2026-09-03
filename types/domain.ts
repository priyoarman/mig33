export type Id = string;

export interface UserProfile {
  _id?: Id;
  id?: Id;
  name: string;
  username: string;
  bio?: string;
  website?: string;
  profileImage?: string | null;
  coverImage?: string | null;
}

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
  likesCount: number;
  commentsCount: number;
  likedByMe?: boolean;
  comments?: PostComment[];
  createdAt?: string;
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
