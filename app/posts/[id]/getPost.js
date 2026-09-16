import mongoose from "mongoose";
import Post from "@/models/posts";
import User from "@/models/user";
import connectMongoDB from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function getPostWithComments(id) {
  if (!mongoose.isValidObjectId(id)) return null;

  await connectMongoDB();
  const session = await getServerSession(authOptions);
  const doc = await Post.findById(id).lean({ virtuals: true }).populate({
    path: "comments.user",
    select: "name username email profileImage",
  });

  if (!doc) return null;

  const likedByMe = session
    ? (doc.likes || []).map(String).includes(session.user.id)
    : false;

  const commentsArray = Array.isArray(doc.comments) ? doc.comments : [];

  // Fetch author data to get profile image
  const author = await User.findById(doc.authorId).lean();

  const mappedComments = commentsArray.map((c) => {
    const user = c.user && typeof c.user === "object" ? c.user : null;
    return {
      id: c._id.toString(),
      userId: user?._id ? user._id.toString() : c.user?.toString(),
      name: user?.name || "Unknown",
      username: user?.username || c.username || "user",
      email: c.email || user?.email || "Unknown",
      profileImage: user?.profileImage || null,
      body: c.body,
      createdAt: c.createdAt.toISOString(),
    };
  });

  return {
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
}
