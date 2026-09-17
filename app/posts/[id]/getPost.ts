import mongoose, { Types } from "mongoose";
import Post from "@/models/posts";
import User from "@/models/user";
import connectMongoDB from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import type { CommentListItem, Id } from "@/types";

type PopulatedCommentUser = {
  _id: Types.ObjectId;
  name?: string;
  username?: string;
  email?: string;
  profileImage?: string | null;
};

type PopulatedComment = {
  _id: Types.ObjectId;
  user: PopulatedCommentUser | null;
  username?: string;
  email?: string;
  body: string;
  createdAt: Date;
};

// .populate() and the `virtuals: true` lean option reshape this at runtime
// in ways the IPost model type doesn't reflect, so the query result is
// cast to this shape instead.
type PopulatedPost = {
  _id: Types.ObjectId;
  body?: string;
  images?: string[];
  authorId: string;
  authorName: string;
  authorUsername?: string;
  likes?: Types.ObjectId[];
  comments?: PopulatedComment[];
  createdAt: Date;
  updatedAt: Date;
  likesCount: number;
  commentsCount: number;
};

export type PostDetail = {
  _id: Id;
  body?: string;
  images: string[];
  authorId: string;
  authorName: string;
  authorUsername?: string;
  authorImage?: string | null;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  likedByMe: boolean;
  commentsCount: number;
  comments: CommentListItem[];
};

export async function getPostWithComments(id: string): Promise<PostDetail | null> {
  if (!mongoose.isValidObjectId(id)) return null;

  await connectMongoDB();
  const session = await getServerSession(authOptions);
  const doc = (await Post.findById(id)
    .lean({ virtuals: true })
    .populate({
      path: "comments.user",
      select: "name username email profileImage",
    })) as unknown as PopulatedPost | null;

  if (!doc) return null;

  const likedByMe = session
    ? (doc.likes || []).map(String).includes(session.user.id)
    : false;

  const commentsArray = Array.isArray(doc.comments) ? doc.comments : [];

  // Fetch author data to get profile image
  const author = await User.findById(doc.authorId).lean();

  const mappedComments: CommentListItem[] = commentsArray.map((c) => {
    const user = c.user ?? null;
    return {
      id: c._id.toString(),
      userId: user?._id ? user._id.toString() : null,
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
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    likesCount: doc.likesCount,
    likedByMe,
    commentsCount: doc.commentsCount,
    comments: mappedComments,
  };
}
