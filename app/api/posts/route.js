import connectMongoDB from "@/lib/mongodb";
import Post from "@/models/posts";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import cloudinary from "@/lib/cloudinary";
import { getFeedPage, getFollowingIds } from "@/lib/posts";
import {
  recordNewHashtags,
  resolveMentions,
  notifyNewMentions,
} from "@/lib/mentionsAndTags";

const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    file.arrayBuffer().then((buffer) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "redilink_posts",
          resource_type: "auto",
        },
        (error, result) => {
          if (error) return reject(error);
          return resolve(result);
        },
      );
      stream.end(Buffer.from(buffer));
    });
  });
};

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const before = searchParams.get("before");
    const authorId = searchParams.get("authorId");
    const hashtag = searchParams.get("hashtag");
    const following = searchParams.get("following");
    const limitParam = parseInt(searchParams.get("limit"), 10);

    // Artificial delay so cursor-based pagination ("load more") is visibly
    // distinguishable from the initial (server-rendered) page in the UI.
    if (before) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    let authorIds;
    if (following) {
      if (!session?.user?.id) {
        return NextResponse.json({ posts: [], hasMore: false, nextCursor: null });
      }
      authorIds = await getFollowingIds(session.user.id);
    }

    const { posts, hasMore, nextCursor } = await getFeedPage({
      before,
      limit: Number.isNaN(limitParam) ? undefined : limitParam,
      currentUserId: session?.user?.id,
      authorId: authorId || undefined,
      authorIds,
      hashtag: hashtag || undefined,
    });

    return NextResponse.json({ posts, hasMore, nextCursor });
  } catch (error) {
    console.error("Get posts error:", error);
    return NextResponse.json(
      { error: "Failed to load posts" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    await connectMongoDB();
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "You must be signed in to create a post." },
        { status: 401 },
      );
    }

    const data = await request.formData();
    const body = data.get("body");
    const file = data.get("image");
    const gifUrl = data.get("gifUrl");

    if (!body && !file && !gifUrl) {
      return NextResponse.json(
        { error: "Post cannot be empty" },
        { status: 400 },
      );
    }

    let imageUrls = [];

    // Upload image if it exists
    if (file) {
      try {
        const uploadResult = await uploadToCloudinary(file);
        imageUrls.push(uploadResult.secure_url); // Get the secure URL
      } catch (error) {
        console.error("Cloudinary upload error:", error);
        return NextResponse.json(
          { error: "Failed to upload image." },
          { status: 500 },
        );
      }
    }

    // If a GIF URL from Tenor was provided, use it directly
    if (gifUrl) {
      imageUrls.push(gifUrl);
    }

    const mentionedUsers = await resolveMentions(body);

    const post = await Post.create({
      body,
      images: imageUrls,
      authorId: session.user.id,
      authorName: session.user.name,
      authorUsername: session.user.username,
      mentions: mentionedUsers.map((user) => user.id),
    });

    await recordNewHashtags(body);
    await notifyNewMentions({
      mentionedUsers,
      authorId: session.user.id,
      actor: {
        name: session.user.name,
        username: session.user.username,
        profileImage: session.user.image || null,
      },
      postId: post._id.toString(),
      postBody: body,
      context: "post",
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
