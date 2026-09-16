import Post from "@/models/posts";
import User from "@/models/user";
import connectMongoDB from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import CommentsSection from "@/app/components/CommentsSection";
import PostCard from "@/app/components/PostCard";

export default async function CommentsPage({ params }) {
  await connectMongoDB();
  const session = await getServerSession(authOptions);
  const { id } = await params;
  const doc = await Post.findById(id).lean({ virtuals: true }).populate({
    path: "comments.user",
    select: "name",
  });

  if (!doc) {
    return <p className="p-4">Post not found.</p>;
  }

  const likedByMe = session
    ? (doc.likes || []).map(String).includes(session.user.id)
    : false;

  const commentsArray = Array.isArray(doc.comments) ? doc.comments : [];

  // Fetch author data to get profile image
  const author = await User.findById(doc.authorId).lean();

  // Fetch user data for all commenters to get their names and usernames
  const userIds = commentsArray
    .map((c) => c.user)
    .filter(Boolean);
  const users = userIds.length
    ? await User.find({ _id: { $in: userIds } }).lean()
    : [];
  const userById = {};
  users.forEach((u) => {
    userById[u._id.toString()] = u;
  });

  const mappedComments = commentsArray.map((c) => {
    const user = userById[c.user?.toString()];
    return {
      id: c._id.toString(),
      userId: c.user?.toString(),
      name: user?.name || "Unknown",
      username: user?.username || c.username || "user",
      email: c.email || user?.email || "Unknown",
      profileImage: user?.profileImage || null,
      body: c.body,
      createdAt: c.createdAt.toISOString(),
    };
  });

  const post = {
    _id: doc._id.toString(),
    body: doc.body,
    images: doc.images || [],
    authorId: doc.authorId,
    authorName: author?.name || doc.authorName,
    authorUsername: author?.username || doc.authorUsername,
    authorImage: author?.profileImage || null,
    authorEmail: doc.authorEmail,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    likesCount: doc.likesCount,
    likedByMe,
    commentsCount: doc.commentsCount,
    comments: mappedComments,
  };

  return (
    <div className="sticky z-10 container flex flex-col border-r-1 border-gray-200 py-2 md:w-2/4">
      <p className="flex px-4 py-4 font-bold text-gray-700">Comments</p>
      <PostCard post={post} />
      <CommentsSection postId={post._id} initialComments={post.comments} />
    </div>
  );
}
