import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongoDB from "@/lib/mongodb";
import User from "@/models/user";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();
    const user = await User.findById(session.user.id).select(
      "name username bio website profileImage coverImage createdAt",
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        name: user.name,
        username: user.username,
        bio: user.bio || "",
        website: user.website || "",
        profileImage: user.profileImage || "",
        coverImage: user.coverImage || "",
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 },
    );
  }
}
