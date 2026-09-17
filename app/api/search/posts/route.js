import connectMongoDB from "@/lib/mongodb";
import Post from "@/models/posts";
import User from "@/models/user";
import { escapeRegExp } from "@/lib/search";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    await connectMongoDB();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const page = Math.max(1, parseInt(searchParams.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit")) || 10));

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    const skip = (page - 1) * limit;

    // Create regex patterns for search (escaped to avoid ReDoS / invalid patterns from user input)
    const safeQuery = escapeRegExp(query.trim());
    const searchRegex = new RegExp(safeQuery, "i");
    const hashtagRegex = new RegExp(`#${safeQuery}`, "i");

    // Search in post body and hashtags
    const posts = await Post.find({
      $or: [
        { body: searchRegex },
        { body: hashtagRegex },
      ],
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // authorId is stored as a plain string (not a Mongo ref), so look up
    // authors separately and attach their avatar, same as the main feed.
    const authorIds = Array.from(new Set(posts.map((post) => String(post.authorId))));
    const authors = authorIds.length
      ? await User.find({ _id: { $in: authorIds } })
          .select("username profileImage")
          .lean()
      : [];
    const authorById = new Map(authors.map((author) => [author._id.toString(), author]));

    const postsWithAuthor = posts.map((post) => ({
      ...post,
      authorImage: authorById.get(String(post.authorId))?.profileImage || null,
    }));

    // Get total count for pagination
    const total = await Post.countDocuments({
      $or: [
        { body: searchRegex },
        { body: hashtagRegex },
      ],
    });

    return NextResponse.json({
      posts: postsWithAuthor,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Search posts error:", error);
    return NextResponse.json(
      { error: "Failed to search posts" },
      { status: 500 }
    );
  }
}
