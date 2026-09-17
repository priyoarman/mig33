import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import Post from "@/models/posts";
import User from "@/models/user";
import connectMongoDB from "@/lib/mongodb";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createAndEmitNotification } from "@/lib/realtime";
import { snippet } from "@/lib/text";
import { resolveMentions, notifyNewMentions } from "@/lib/mentionsAndTags";
import { Types } from "mongoose";
import type { IComment } from "@/types";

type RouteContext = { params: Promise<{ id: string }> };

type PopulatedCommentUser = {
  _id: Types.ObjectId;
  name?: string;
  username?: string;
  email?: string;
  profileImage?: string | null;
};

type PopulatedComment = Omit<IComment, "user" | "mentions"> & {
  _id: Types.ObjectId;
  user: PopulatedCommentUser | null;
  mentions?: ({ username?: string } | null)[];
  // Legacy denormalized field from before comments referenced `user`;
  // some older documents still have it directly on the comment.
  name?: string;
};

// Mongoose upgrades pushed subdocuments to real Document instances (with
// _id, timestamps, and toObject()) at save time, but the plain IComment
// type doesn't reflect that; this describes the post-save shape instead.
type SavedComment = Omit<IComment, "createdAt" | "updatedAt"> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

type CommentSubdocument = IComment & {
  toObject(): SavedComment;
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  await connectMongoDB();
  const { id } = await params;
  const post = (await Post.findById(id)
    .select("comments")
    .populate("comments.user", "name username email profileImage")
    .populate("comments.mentions", "username")
    .lean()) as unknown as { comments?: PopulatedComment[] } | null;

  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const mappedComments = (post.comments || []).map((comment) => {
    const user = comment.user ?? null;

    return {
      id: comment._id.toString(),
      userId: user?._id ? user._id.toString() : null,
      name: user?.name || comment.name || "Unknown",
      username: user?.username || comment.username || "user",
      email: user?.email || comment.email || "Unknown",
      profileImage: user?.profileImage || null,
      body: comment.body,
      mentionUsernames: (comment.mentions || [])
        .map((mention) => mention?.username)
        .filter(Boolean),
      createdAt: comment.createdAt
        ? new Date(comment.createdAt).toISOString()
        : new Date().toISOString(),
    };
  });

  return NextResponse.json(mappedComments);
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { comment } = (await request.json()) as { comment?: string };
    if (!comment?.trim()) {
      return NextResponse.json(
        { error: "Comment cannot be empty" },
        { status: 400 },
      );
    }

    await connectMongoDB();
    const { id } = await params;
    const post = await Post.findById(id);
    if (!post)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const commentBody = comment.trim();
    const mentionedUsers = await resolveMentions(commentBody);

    post.comments.push({
      user: new Types.ObjectId(session.user.id),
      username: session.user.username || session.user.email || "user",
      email: session.user.email ?? undefined,
      body: commentBody,
      mentions: mentionedUsers.map((mentionedUser) => mentionedUser.id),
    });
    await post.save();

    const latestSubdoc = post.comments[
      post.comments.length - 1
    ] as unknown as CommentSubdocument;
    const latest = latestSubdoc.toObject();

    // Fetch user to get profile image
    const user = await User.findById(session.user.id).lean();

    const postAuthorId = post.authorId?.toString();
    if (postAuthorId && postAuthorId !== session.user.id.toString()) {
      await createAndEmitNotification(postAuthorId, {
        type: "comment",
        message: "commented on your post.",
        actorId: session.user.id,
        actor: {
          name: session.user.name || "Someone",
          username: session.user.username,
          profileImage: user?.profileImage || null,
        },
        postId: post._id.toString(),
        postSnippet: snippet(post.body),
      });
    }

    await notifyNewMentions({
      mentionedUsers,
      authorId: session.user.id,
      actor: {
        name: session.user.name || "Someone",
        username: session.user.username,
        profileImage: user?.profileImage || null,
      },
      postId: post._id.toString(),
      postBody: commentBody,
      context: "comment",
    });

    return NextResponse.json({
      commentsCount: post.comments.length,
      latestComment: {
        _id: latest._id.toString(),
        user: latest.user.toString(),
        name: session.user.name || "Unknown",
        username: latest.username,
        email: latest.email,
        profileImage: user?.profileImage || null,
        body: latest.body,
        mentionUsernames: mentionedUsers.map((mentionedUser) => mentionedUser.username),
        createdAt: latest.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Comment POST error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
