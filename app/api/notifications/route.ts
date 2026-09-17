import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongoDB from "@/lib/mongodb";
import Notification from "@/models/notifications";
// Registers the "Post" model that Notification.populate("postId", ...) below
// resolves by ref name; this route never references Post directly, so
// without this import the populate throws MissingSchemaError whenever this
// route runs before some other route that happens to import models/posts.
import "@/models/posts";
import { snippet } from "@/lib/text";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type { Types } from "mongoose";
import type { INotification, UserProfile } from "@/types";

// .populate() reshapes these fields at runtime but mongoose's static types
// don't reflect that, so the lean query result is cast to this shape instead.
type PopulatedNotification = Omit<INotification, "actorId" | "postId"> & {
  _id: Types.ObjectId;
  actorId:
    | (Pick<UserProfile, "name" | "username" | "profileImage"> & {
        _id: Types.ObjectId;
      })
    | null;
  postId: { _id: Types.ObjectId; body?: string } | null;
};

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
      .populate("actorId", "name username profileImage")
      .populate("postId", "body")
      .lean() as unknown as Promise<PopulatedNotification[]>,
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
            profileImage: notification.actorId.profileImage || null,
          }
        : { name: "Someone" },
      postId: notification.postId?._id?.toString() || null,
      postSnippet: notification.postId?.body
        ? snippet(notification.postId.body)
        : null,
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
