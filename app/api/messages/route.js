import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongoDB from "@/lib/mongodb";
import Message from "@/models/messages";
import User from "@/models/user";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;
    const otherUserId = new URL(request.url).searchParams.get("userId");

    if (!currentUserId || !otherUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();
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
