import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongoDB from "@/lib/mongodb";
import Message from "@/models/messages";
import User from "@/models/user";
import mongoose from "mongoose";
import { NextResponse, type NextRequest } from "next/server";
import { emitToUser } from "@/lib/realtime";
import { sendPushNotificationToUser } from "@/lib/webpush";
import type { IMessage } from "@/types";
import type { FilterQuery } from "mongoose";

const DEFAULT_PAGE_SIZE = 30;

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;
    const { searchParams } = new URL(request.url);
    const otherUserId = searchParams.get("userId");

    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserObjectId = new mongoose.Types.ObjectId(currentUserId);

    await connectMongoDB();
    if (!otherUserId) {
      const latestMessages = await Message.aggregate([
        {
          $match: {
            $or: [
              { senderId: currentUserObjectId },
              { recipientId: currentUserObjectId },
            ],
          },
        },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: {
              $cond: [
                { $eq: ["$senderId", currentUserObjectId] },
                "$recipientId",
                "$senderId",
              ],
            },
            message: { $first: "$$ROOT" },
          },
        },
        { $sort: { "message.createdAt": -1 } },
      ]);

      const unreadByConversation = await Message.aggregate([
        {
          $match: {
            recipientId: currentUserObjectId,
            read: false,
          },
        },
        { $group: { _id: "$senderId", count: { $sum: 1 } } },
      ]);
      const unreadMap = new Map(
        unreadByConversation.map(({ _id, count }) => [_id.toString(), count]),
      );

      const users = await User.find({
        _id: { $in: latestMessages.map(({ _id }) => _id) },
      })
        .select("name username profileImage")
        .lean();
      const usersById = new Map(
        users.map((user) => [user._id.toString(), user]),
      );
      const conversations = latestMessages
        .map(({ _id, message }) => {
          const userId = _id.toString();
          const user = usersById.get(userId);
          if (!user) return null;
          return {
            user: { ...user, _id: user._id.toString() },
            unreadCount: unreadMap.get(userId) || 0,
            latestMessage: {
              ...message,
              _id: message._id.toString(),
              senderId: message.senderId.toString(),
              recipientId: message.recipientId.toString(),
            },
          };
        })
        .filter(Boolean);

      const unreadTotal = unreadByConversation.reduce(
        (sum, { count }) => sum + count,
        0,
      );

      return NextResponse.json({ conversations, unreadTotal });
    }

    if (!mongoose.isValidObjectId(otherUserId)) {
      return NextResponse.json({ error: "Invalid user" }, { status: 400 });
    }

    const otherUser = await User.findById(otherUserId).select(
      "name username profileImage",
    );
    if (!otherUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const otherUserObjectId = new mongoose.Types.ObjectId(otherUserId);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "") || DEFAULT_PAGE_SIZE),
    );
    const before = searchParams.get("before");
    const conversationMatch: FilterQuery<IMessage> = {
      $or: [
        { senderId: currentUserObjectId, recipientId: otherUserObjectId },
        { senderId: otherUserObjectId, recipientId: currentUserObjectId },
      ],
    };
    if (before) {
      const beforeDate = new Date(before);
      if (!Number.isNaN(beforeDate.getTime())) {
        conversationMatch.createdAt = { $lt: beforeDate };
      }
    }

    const page = await Message.find(conversationMatch)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = page.length > limit;
    const messages = page.slice(0, limit).reverse();

    return NextResponse.json({
      user: { ...otherUser.toObject(), _id: otherUser._id.toString() },
      hasMore,
      messages: messages.map((message) => ({
        ...message,
        _id: message._id.toString(),
        senderId: message.senderId.toString(),
        recipientId: message.recipientId.toString(),
        read: !!message.read,
      })),
    });
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json(
      { error: "Failed to load messages" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const senderId = session?.user?.id;
    const { recipientId, content: rawContent, clientId } = (await request.json()) as {
      recipientId?: string;
      content?: string;
      clientId?: string;
    };
    const content = rawContent?.trim();

    if (
      !senderId ||
      !recipientId ||
      !mongoose.isValidObjectId(recipientId) ||
      !content ||
      content.length > 2000
    ) {
      return NextResponse.json(
        { error: "A valid recipient and message are required" },
        { status: 400 },
      );
    }

    await connectMongoDB();
    const recipient = await User.exists({ _id: recipientId });
    if (!recipient) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const message = await Message.create({
      senderId,
      recipientId,
      content,
      clientId: typeof clientId === "string" ? clientId.slice(0, 100) : undefined,
    });
    const serialized = {
      _id: message._id.toString(),
      senderId: senderId.toString(),
      recipientId: recipientId.toString(),
      content: message.content,
      clientId: message.clientId,
      read: false,
      createdAt: message.createdAt.toISOString(),
    };

    // The socket server handles its own real-time messages; this REST path is
    // only used when the sender's socket is unavailable, so push the
    // recipient a live update here too.
    emitToUser(recipientId, "message", serialized);

    const sender = await User.findById(senderId).select("name").lean();
    sendPushNotificationToUser(recipientId, {
      title: sender?.name || "New message",
      body: `Message: ${content}`,
      url: `/messages?userId=${senderId}`,
    }).catch((error) => {
      console.error("Failed to send push notification:", error);
    });

    return NextResponse.json({ message: serialized });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { error: "Message could not be sent" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;
    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId: otherUserId } = (await request.json()) as {
      userId?: string;
    };
    if (!mongoose.isValidObjectId(otherUserId)) {
      return NextResponse.json({ error: "Invalid user" }, { status: 400 });
    }

    await connectMongoDB();
    const now = new Date();
    const result = await Message.updateMany(
      {
        senderId: otherUserId,
        recipientId: currentUserId,
        read: false,
      },
      { $set: { read: true, readAt: now } },
    );

    if (result.modifiedCount > 0) {
      emitToUser(otherUserId, "messages_read", {
        byUserId: currentUserId,
        readAt: now.toISOString(),
      });
    }

    return NextResponse.json({ markedCount: result.modifiedCount });
  } catch (error) {
    console.error("Mark messages read error:", error);
    return NextResponse.json(
      { error: "Failed to mark messages as read" },
      { status: 500 },
    );
  }
}
