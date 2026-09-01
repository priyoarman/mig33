import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongoDB from "@/lib/mongodb";
import User from "@/models/user";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { createAndEmitNotification } from "@/lib/realtime";

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    if (!id || id === session.user.id) {
      return NextResponse.json({ error: "Invalid user" }, { status: 400 });
    }

    await connectMongoDB();

    const [currentUser, targetUser] = await Promise.all([
      User.findById(session.user.id),
      User.findById(id),
    ]);

    if (!currentUser || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentUserId = currentUser._id.toString();
    const targetUserId = targetUser._id.toString();

    const isFollowing = currentUser.following.some(
      (uid) => uid.toString() === targetUserId,
    );

    if (isFollowing) {
      currentUser.following.pull(targetUserId);
      targetUser.followers.pull(currentUserId);
    } else {
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);
    }

    await Promise.all([currentUser.save(), targetUser.save()]);

    if (!isFollowing) {
      await createAndEmitNotification(targetUserId, {
        type: "follow",
        message: "started following you.",
        actorId: currentUserId,
        actor: {
          name: currentUser.name,
          username: currentUser.username,
        },
      });
    }

    return NextResponse.json({
      following: !isFollowing,
      followersCount: targetUser.followers.length,
    });
  } catch (error) {
    console.error("Follow toggle failed:", error);
    return NextResponse.json(
      { error: "Failed to update follow status" },
      { status: 500 },
    );
  }
}
