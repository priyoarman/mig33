import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import Post from "@/models/posts";
import User from "@/models/user";
import connectMongoDB from "@/lib/mongodb";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createAndEmitNotification } from "@/lib/realtime";

export async function GET(request, { params }) {
  await connectMongoDB();
  const { id } = await params;
  const post = await Post.findById(id)
    .select("comments")
    .populate("comments.user", "name username email profileImage")
    .lean();

  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const mappedComments = (post.comments || []).map((comment) => {
    const user =
      comment.user && typeof comment.user === "object" ? comment.user : null;

    return {
      id: comment._id.toString(),
      userId: user?._id
        ? user._id.toString()
        : comment.user?.toString?.() || null,
      name: user?.name || comment.name || "Unknown",
      username: user?.username || comment.username || "user",
      email: user?.email || comment.email || "Unknown",
      profileImage: user?.profileImage || null,
      body: comment.body,
      createdAt: comment.createdAt
        ? new Date(comment.createdAt).toISOString()
        : new Date().toISOString(),
    };
  });

  return NextResponse.json(mappedComments);
}

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { comment } = await request.json();
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

    post.comments.push({
      user: session.user.id,
      username: session.user.username || session.user.email,
      email: session.user.email,
      body: comment.trim(),
    });
    await post.save();

    const latest = post.comments[post.comments.length - 1].toObject();

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
        },
        postId: post._id.toString(),
      });
    }

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
        createdAt: latest.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Comment POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
