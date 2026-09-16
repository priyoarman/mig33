import connectMongoDB from "@/lib/mongodb";
import Post from "@/models/posts";
import User from "@/models/user";
import type { FeedPage } from "@/types/api";

export const DEFAULT_FEED_PAGE_SIZE = 10;
export const MAX_FEED_PAGE_SIZE = 30;

interface GetFeedPageOptions {
  before?: string | null;
  limit?: number;
  currentUserId?: string | null;
}

export async function getFeedPage({
  before,
  limit = DEFAULT_FEED_PAGE_SIZE,
  currentUserId,
}: GetFeedPageOptions = {}): Promise<FeedPage> {
  await connectMongoDB();

  const pageSize = Math.min(MAX_FEED_PAGE_SIZE, Math.max(1, limit));
  const query: Record<string, unknown> = {};
  if (before) {
    const beforeDate = new Date(before);
    if (!Number.isNaN(beforeDate.getTime())) {
      query.createdAt = { $lt: beforeDate };
    }
  }

  // Fetch one extra document to know whether another page exists without a
  // separate count query.
  const rawPosts = await Post.find(query)
    .sort({ createdAt: -1 })
    .limit(pageSize + 1)
    .lean({ virtuals: true });

  const hasMore = rawPosts.length > pageSize;
  const pagePosts = rawPosts.slice(0, pageSize);

  const authorIds = Array.from(
    new Set(pagePosts.map((post) => post.authorId)),
  ).filter(Boolean);
  const users = authorIds.length
    ? await User.find({ _id: { $in: authorIds } }).lean()
    : [];
  const userById = new Map(users.map((user) => [user._id.toString(), user]));

  const posts = pagePosts.map((doc) => {
    const likesArray = Array.isArray(doc.likes) ? doc.likes : [];
    const author = userById.get(String(doc.authorId));

    return {
      _id: doc._id.toString(),
      body: doc.body,
      images: doc.images || [],
      authorId: doc.authorId?.toString?.() ?? doc.authorId,
      authorName: doc.authorName,
      authorUsername: doc.authorUsername,
      authorImage: author?.profileImage || null,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
      likesCount: doc.likesCount ?? likesArray.length,
      likedByMe: currentUserId
        ? likesArray.map(String).includes(currentUserId)
        : false,
      commentsCount: doc.commentsCount ?? doc.comments?.length ?? 0,
    };
  });

  const nextCursor = hasMore ? posts[posts.length - 1].createdAt : null;

  return { posts, hasMore, nextCursor };
}
