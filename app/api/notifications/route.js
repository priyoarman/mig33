import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongoDB from "@/lib/mongodb";
import Notification from "@/models/notifications";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await connectMongoDB();
  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ recipientId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("actorId", "name username")
      .lean(),
    Notification.countDocuments({
      recipientId: session.user.id,
      read: false,
    }),
  ]);

  return NextResponse.json({
    unreadCount,
    notifications: notifications.map((notification) => ({
      id: notification._id.toString(),
      type: notification.type,
      message: notification.message,
      actor: notification.actorId
        ? {
            name: notification.actorId.name,
            username: notification.actorId.username,
          }
        : { name: "Someone" },
      postId: notification.postId?.toString() || null,
      createdAt: notification.createdAt.toISOString(),
    })),
  });
}

export async function PATCH() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await connectMongoDB();
  await Notification.updateMany(
    { recipientId: session.user.id, read: false },
    { $set: { read: true } },
  );

  return NextResponse.json({ ok: true });
}
