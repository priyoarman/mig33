import connectMongoDB from "@/lib/mongodb";
import Post from "@/models/posts";
import User from "@/models/user";
import PostsListClient from "./PostsListClient";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";

export default async function PostsList() {
  await connectMongoDB();
  const session = await getServerSession(authOptions);
  const rawPosts = await Post.find()
    .sort({ createdAt: -1 })
    .lean({ virtuals: true });

  const authorIds = Array.from(new Set(rawPosts.map((p) => p.authorId))).filter(
    Boolean,
  );
  const users = authorIds.length
    ? await User.find({ _id: { $in: authorIds } }).lean()
    : [];
  const userById = {};
  users.forEach((u) => {
    userById[u._id.toString()] = u;
  });

  const posts = rawPosts.map((doc) => {
    const likesArray = Array.isArray(doc.likes) ? doc.likes : [];
    const author = userById[doc.authorId];

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
      likedByMe: session
        ? likesArray.map(String).includes(session.user.id)
        : false,
      commentsCount: doc.commentsCount ?? doc.comments?.length ?? 0,
    };
  });

  return (
    <div className="bg-panel z-20 py-2 pb-16 sm:pb-0">
      <PostsListClient posts={posts} />
    </div>
  );
}
