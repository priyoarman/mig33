import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongoDB from "@/lib/mongodb";
import Message from "@/models/messages";
import User from "@/models/user";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;
    const otherUserId = new URL(request.url).searchParams.get("userId");

    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();
    if (!otherUserId) {
      const latestMessages = await Message.aggregate([
        {
          $match: {
            $or: [{ senderId: currentUserId }, { recipientId: currentUserId }],
          },
        },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: {
              $cond: [
                { $eq: ["$senderId", currentUserId] },
                "$recipientId",
                "$senderId",
              ],
            },
            message: { $first: "$$ROOT" },
          },
        },
        { $sort: { "message.createdAt": -1 } },
      ]);

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
            latestMessage: {
              ...message,
              _id: message._id.toString(),
              senderId: message.senderId.toString(),
              recipientId: message.recipientId.toString(),
            },
          };
        })
        .filter(Boolean);

      return NextResponse.json({ conversations });
    }

    const otherUser = await User.findById(otherUserId).select(
      "name username profileImage",
    );
    if (!otherUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, recipientId: otherUserId },
        { senderId: otherUserId, recipientId: currentUserId },
      ],
    })
      .sort({ createdAt: 1 })
      .limit(200)
      .lean();

    return NextResponse.json({
      user: { ...otherUser.toObject(), _id: otherUser._id.toString() },
      messages: messages.map((message) => ({
        ...message,
        _id: message._id.toString(),
        senderId: message.senderId.toString(),
        recipientId: message.recipientId.toString(),
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

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    const senderId = session?.user?.id;
    const { recipientId, content: rawContent } = await request.json();
    const content = rawContent?.trim();

    if (
      !senderId ||
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

    const message = await Message.create({ senderId, recipientId, content });
    return NextResponse.json({
      message: {
        _id: message._id.toString(),
        senderId: senderId.toString(),
        recipientId: recipientId.toString(),
        content: message.content,
        createdAt: message.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { error: "Message could not be sent" },
      { status: 500 },
    );
  }
}
