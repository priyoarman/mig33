import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongoDB from "@/lib/mongodb";
import Post from "@/models/posts";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { createAndEmitNotification } from "@/lib/realtime";
import { snippet } from "@/lib/text";

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  await connectMongoDB();

  const target = await Post.findById(id);
  if (!target) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Always repost the root original, even if the target clicked is itself a
  // repost shell, so reposts never chain.
  const original = target.repostOf
    ? await Post.findById(target.repostOf)
    : target;
  if (!original) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const userId = session.user.id;
  const originalId = original._id.toString();

  const existingRepost = await Post.findOne({
    repostOf: originalId,
    authorId: userId,
  });

  let reposted;
  if (existingRepost) {
    await Post.deleteOne({ _id: existingRepost._id });
    reposted = false;
  } else {
    await Post.create({
      repostOf: originalId,
      authorId: userId,
      authorName: session.user.name,
      authorUsername: session.user.username,
    });
    reposted = true;

    const originalAuthorId = original.authorId?.toString();
    if (originalAuthorId && originalAuthorId !== userId.toString()) {
      await createAndEmitNotification(originalAuthorId, {
        type: "repost",
        message: "reposted your post.",
        actorId: userId,
        actor: {
          name: session.user.name || "Someone",
          username: session.user.username,
          profileImage: session.user.image || null,
        },
        postId: originalId,
        postSnippet: snippet(original.body),
      });
    }
  }

  const repostsCount = await Post.countDocuments({ repostOf: originalId });

  return NextResponse.json({ reposted, repostsCount });
}
