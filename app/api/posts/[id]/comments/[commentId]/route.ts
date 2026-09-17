import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import Post from "@/models/posts";
import connectMongoDB from "@/lib/mongodb";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import type { Types } from "mongoose";
import type { IComment } from "@/types";

// Every comment subdocument gets an auto _id at save time, but the plain
// IComment type doesn't declare it.
type CommentWithId = IComment & { _id: Types.ObjectId };

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectMongoDB();
    const { id, commentId } = await params;

    const post = await Post.findById(id);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Find the comment
    const comments = post.comments as unknown as CommentWithId[];
    const commentIndex = comments.findIndex(
      (c) => c._id.toString() === commentId
    );
    if (commentIndex === -1) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Check if user is the comment owner
    if (post.comments[commentIndex].user.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "Not authorized to delete this comment" },
        { status: 403 }
      );
    }

    // Remove the comment
    post.comments.splice(commentIndex, 1);
    await post.save();

    return NextResponse.json({ success: true, commentsCount: post.comments.length });
  } catch (error) {
    console.error("Delete comment error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
