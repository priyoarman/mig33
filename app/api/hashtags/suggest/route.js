import connectMongoDB from "@/lib/mongodb";
import Hashtag from "@/models/hashtag";
import { escapeRegExp } from "@/lib/search";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    await connectMongoDB();

    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") || "").trim();
    const limit = Math.min(
      20,
      Math.max(1, parseInt(searchParams.get("limit")) || 6),
    );

    const filter = query
      ? { tag: new RegExp(`^${escapeRegExp(query.toLowerCase())}`, "i") }
      : {};

    const hashtags = await Hashtag.find(filter)
      .sort({ count: -1 })
      .limit(limit)
      .select("tag count")
      .lean();

    return NextResponse.json({
      hashtags: hashtags.map((tag) => ({ tag: tag.tag, count: tag.count })),
    });
  } catch (error) {
    console.error("Hashtag suggest error:", error);
    return NextResponse.json(
      { error: "Failed to load hashtags" },
      { status: 500 },
    );
  }
}
