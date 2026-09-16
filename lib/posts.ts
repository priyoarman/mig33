import mongoose from "mongoose";
import connectMongoDB from "@/lib/mongodb";
import Post from "@/models/posts";
import User from "@/models/user";
import type { FeedPage, PostSummary } from "@/types/api";

export const DEFAULT_FEED_PAGE_SIZE = 10;
export const MAX_FEED_PAGE_SIZE = 30;

interface GetFeedPageOptions {
  before?: string | null;
  limit?: number;
  currentUserId?: string | null;
  authorId?: string | null;
}

export async function getFeedPage({
  before,
  limit = DEFAULT_FEED_PAGE_SIZE,
  currentUserId,
  authorId,
}: GetFeedPageOptions = {}): Promise<FeedPage> {
  await connectMongoDB();

  const pageSize = Math.min(MAX_FEED_PAGE_SIZE, Math.max(1, limit));
  const query: Record<string, unknown> = {};
  if (authorId) {
    // Matches both the author's own posts and any reposts they've made
    // (a repost shell's `authorId` is the reposter), so a profile page
    // showing "authorId's posts" naturally includes their reposts too.
    query.authorId = authorId;
  }
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
  // The cursor must track the raw fetched document's own createdAt (what the
  // query above filters on) rather than whatever ends up in the serialized
  // "content" time below, since a repost row displays the ORIGINAL post's
  // time but must still page using the repost's own createdAt.
  const nextCursor = hasMore
    ? pagePosts[pagePosts.length - 1].createdAt.toISOString()
    : null;

  // Resolve repost shells to the post they repost. A shell has its own
  // `authorId` (the reposter) but no content of its own.
  const repostShells = pagePosts.filter((post) => post.repostOf);
  const originalIds = Array.from(
    new Set(repostShells.map((post) => String(post.repostOf))),
  );
  const originals = originalIds.length
    ? await Post.find({ _id: { $in: originalIds } }).lean({ virtuals: true })
    : [];
  const originalById = new Map(
    originals.map((post) => [post._id.toString(), post]),
  );

  // Each page row's "content" is either the post itself, or (for a repost
  // shell) the original post it points to. Rows whose original has since
  // been deleted are dropped.
  const rows = pagePosts
    .map((post) => {
      if (!post.repostOf) return { shell: null, content: post };
      const content = originalById.get(String(post.repostOf));
      return content ? { shell: post, content } : null;
    })
    .filter(
      (row): row is { shell: (typeof pagePosts)[number] | null; content: (typeof pagePosts)[number] } =>
        row !== null,
    );

  const contentIds = Array.from(
    new Set(rows.map((row) => row.content._id.toString())),
  );

  const userIds = new Set<string>();
  rows.forEach((row) => {
    userIds.add(String(row.content.authorId));
    if (row.shell) userIds.add(String(row.shell.authorId));
    (row.content.mentions || []).forEach((id) => userIds.add(String(id)));
  });
  const users = userIds.size
    ? await User.find({ _id: { $in: Array.from(userIds) } })
        .select("name username profileImage")
        .lean()
    : [];
  const userById = new Map(users.map((user) => [user._id.toString(), user]));

  const [repostCounts, repostedByMeIds] = await Promise.all([
    contentIds.length
      ? Post.aggregate<{ _id: string; count: number }>([
          {
            $match: {
              repostOf: {
                $in: contentIds.map((id) => new mongoose.Types.ObjectId(id)),
              },
            },
          },
          { $group: { _id: "$repostOf", count: { $sum: 1 } } },
        ])
      : Promise.resolve([]),
    currentUserId && contentIds.length
      ? Post.find({
          repostOf: { $in: contentIds },
          authorId: currentUserId,
        })
          .select("repostOf")
          .lean()
      : Promise.resolve([]),
  ]);
  const repostCountById = new Map(
    repostCounts.map((row) => [String(row._id), row.count]),
  );
  const repostedByMeSet = new Set(
    repostedByMeIds.map((row) => String(row.repostOf)),
  );

  const posts: PostSummary[] = rows.map(({ shell, content }) => {
    const contentId = content._id.toString();
    const likesArray = Array.isArray(content.likes) ? content.likes : [];
    const author = userById.get(String(content.authorId));
    const reposter = shell ? userById.get(String(shell.authorId)) : undefined;
    const mentionUsernames = (content.mentions || [])
      .map((id) => userById.get(String(id))?.username)
      .filter((username): username is string => Boolean(username));

    return {
      _id: contentId,
      feedKey: shell ? shell._id.toString() : contentId,
      body: content.body,
      images: content.images || [],
      authorId: String(content.authorId),
      authorName: content.authorName,
      authorUsername: content.authorUsername,
      authorImage: author?.profileImage || null,
      createdAt: content.createdAt.toISOString(),
      updatedAt: content.updatedAt.toISOString(),
      likesCount: content.likesCount ?? likesArray.length,
      likedByMe: currentUserId
        ? likesArray.map(String).includes(currentUserId)
        : false,
      commentsCount: content.commentsCount ?? content.comments?.length ?? 0,
      mentionUsernames,
      repost: shell
        ? {
            byUserId: String(shell.authorId),
            byName: reposter?.name || shell.authorName,
            byUsername: reposter?.username || shell.authorUsername,
          }
        : null,
      repostsCount: repostCountById.get(contentId) || 0,
      repostedByMe: repostedByMeSet.has(contentId),
    };
  });

  return { posts, hasMore, nextCursor };
}
