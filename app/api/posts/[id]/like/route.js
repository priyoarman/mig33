import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongoDB from "@/lib/mongodb";
import Post from "@/models/posts";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import User from "@/models/user";
import { createAndEmitNotification } from "@/lib/realtime";
import { snippet } from "@/lib/text";

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  await connectMongoDB();

  const userId = session.user.id;
  const userIdObj = new mongoose.Types.ObjectId(userId);

  // Toggling likes with a read-then-write (find, mutate, save) is racy: two
  // concurrent requests can both observe "not liked yet" and both apply the
  // like, doubling the notification and the likes array. These two atomic,
  // conditional findOneAndUpdate calls make the toggle race-free: at most
  // one of the two branches can match per request, and Mongo serializes
  // concurrent writes to the same document.
  let post = await Post.findOneAndUpdate(
    { _id: id, likes: userIdObj },
    { $pull: { likes: userIdObj } },
    { new: true },
  );
  let liked = false;
  let becameLiked = false;

  if (!post) {
    post = await Post.findOneAndUpdate(
      { _id: id, likes: { $ne: userIdObj } },
      { $addToSet: { likes: userIdObj } },
      { new: true },
    );
    liked = true;
    becameLiked = !!post;
    if (!post) {
      // Someone else concurrently added the like between our two attempts;
      // read back the current state instead of double-applying it.
      post = await Post.findById(id);
    }
  }

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const postAuthorId = post.authorId?.toString();
  if (becameLiked && postAuthorId && postAuthorId !== userId.toString()) {
    const actor = await User.findById(userId)
      .select("name username profileImage")
      .lean();
    await createAndEmitNotification(postAuthorId, {
      type: "like",
      message: "liked your post.",
      actorId: userId,
      actor: {
        name: actor?.name || "Someone",
        username: actor?.username,
        profileImage: actor?.profileImage || null,
      },
      postId: post._id.toString(),
      postSnippet: snippet(post.body),
    });
  }

  return NextResponse.json({
    liked,
    likesCount: post.likes.length,
  });
}
