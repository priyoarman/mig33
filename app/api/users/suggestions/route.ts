import connectMongoDB from "@/lib/mongodb";
import User from "@/models/user";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await connectMongoDB();

    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;

    const { searchParams } = new URL(request.url);
    const excludeIds = (searchParams.get("exclude") || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") ?? "", 10) || 3, 1),
      20,
    );

    const currentUser = currentUserId
      ? await User.findById(currentUserId).select("following").lean()
      : null;
    const currentUserFollowing = new Set(
      Array.isArray(currentUser?.following)
        ? currentUser.following.map((id) => id.toString())
        : [],
    );

    const excludedIds = new Set([
      ...(currentUserId ? [currentUserId] : []),
      ...currentUserFollowing,
      ...excludeIds,
    ]);

    const query = excludedIds.size
      ? {
          _id: {
            $nin: Array.from(excludedIds),
          },
        }
      : {};

    const users = await User.find(query)
      .select("_id name username profileImage followers following")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const suggestionList = users.map((user) => {
      const isFollowing = currentUserId
        ? currentUserFollowing.has(user._id.toString())
        : false;

      return {
        _id: user._id.toString(),
        name: user.name,
        username: user.username,
        profileImage: user.profileImage,
        isFollowing,
        followersCount: Array.isArray(user.followers)
          ? user.followers.length
          : 0,
      };
    });

    return NextResponse.json({ users: suggestionList });
  } catch (error) {
    console.error("Failed to load user suggestions:", error);
    return NextResponse.json(
      { error: "Failed to load suggestions" },
      { status: 500 },
    );
  }
}
